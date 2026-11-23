import 'dotenv/config';
import {GoogleGenAI, ThinkingLevel, Type} from '@google/genai';
import express from 'express';
import fs from 'fs';
import http from 'http';
import nodemailer from 'nodemailer';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RECIPIENT_EMAIL = 'yemipresh2010@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GEMINI_TEXT_MODEL = 'gemini-4-hydrogen';

type DeliveryStatus = 'sent' | 'pending_activation' | 'inbox_only';
type DeliveryChannel = 'gmail_smtp' | 'formsubmit' | 'inbox';

interface DeliveryResult {
  status: DeliveryStatus;
  channel: DeliveryChannel;
  recipientEmail: string;
  detail: string;
}

interface ContactSubmission {
  referenceId: string;
  name: string;
  email: string;
  service: string;
  message: string;
  recipientEmail: string;
  deliveryStatus: DeliveryStatus;
  deliveryChannel: DeliveryChannel;
  receivedAt: string;
}

interface CallBookingSubmission {
  referenceId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  channel: 'Phone Call' | 'WhatsApp Call';
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  studioLine: string;
  recipientEmail: string;
  deliveryStatus: DeliveryStatus;
  deliveryChannel: DeliveryChannel;
  receivedAt: string;
}

const submissions: ContactSubmission[] = [];
const callBookings: CallBookingSubmission[] = [];
const ALLOWED_CALL_CHANNELS = new Set(['Phone Call', 'WhatsApp Call']);
const ALLOWED_SERVICES = new Set([
  'Website Design',
  'Graphic Design',
  'AI Automation',
  'Multi-Service Project',
]);

const ALLOWED_SUGGESTION_TOPICS = new Set([
  'Project Idea',
  'Service Question',
  'Website Feedback',
  'AI Automation Idea',
]);

const ALLOWED_IMAGE_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const uploadsDir = path.resolve(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {recursive: true});
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error(
      'Gemini AI key is not set yet. Please add GEMINI_API_KEY in the AI Studio Settings > Secrets panel.'
    ) as Error & {statusCode?: number};
    err.statusCode = 503;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 20000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): {status: number; message: string} {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const custom = err as {statusCode?: number; message?: string};
    return {
      status: custom.statusCode || 500,
      message: custom.message || 'AI request failed.',
    };
  }

  let raw = err instanceof Error ? err.message : String(err);
  let parsedStatus = 500;
  try {
    const jsonErr = JSON.parse(raw) as {error?: {code?: number; message?: string; status?: string}};
    if (jsonErr?.error?.message) {
      raw = jsonErr.error.message;
      if (typeof jsonErr.error.code === 'number') {
        parsedStatus = jsonErr.error.code;
      }
    }
  } catch {
    // raw is plain text
  }

  if (/403|PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(raw)) {
    return {
      status: 403,
      message:
        'Gemini API key was rejected. Please verify GEMINI_API_KEY in the AI Studio Settings > Secrets panel.',
    };
  }
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return {
      status: 429,
      message:
        'AI request rate limit reached. Please wait a moment and try again, or check your Gemini quota in Settings > Secrets.',
    };
  }
  if (parsedStatus === 503 || /503|UNAVAILABLE|high demand/i.test(raw)) {
    return {
      status: 503,
      message: 'The AI service is temporarily busy due to high demand. Please try again in a moment.',
    };
  }
  if (parsedStatus === 504 || /504|DEADLINE_EXCEEDED|Deadline expired|aborted|timeout/i.test(raw)) {
    return {
      status: 504,
      message: 'The AI service took too long to respond. Please try again in a moment.',
    };
  }
  if (/404|NOT_FOUND/i.test(raw)) {
    return {
      status: 502,
      message: 'The configured AI model is temporarily unavailable. Please try again shortly.',
    };
  }
  return {
    status: parsedStatus >= 400 && parsedStatus < 600 ? parsedStatus : 500,
    message: raw || 'Failed to generate AI response. Please try again.',
  };
}

async function generateWithGeminiFallback(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>
) {
  const attempts = [
    {model: GEMINI_TEXT_MODEL, thinkingLevel: ThinkingLevel.LOW},
    {model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL},
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    try {
      return await ai.models.generateContent({
        model: attempt.model,
        contents,
        config: {
          thinkingConfig: {thinkingLevel: attempt.thinkingLevel},
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = /503|504|DEADLINE_EXCEEDED|Deadline expired|UNAVAILABLE|high demand|429|timeout|abort/i.test(
        msg
      );
      if (!isTransient || i === attempts.length - 1) {
        throw err;
      }
    }
  }
  throw lastError;
}

function resolveGmailAuth(): {gmailUser: string; gmailPass: string | undefined} {
  const rawUser = process.env.GMAIL_USER?.trim() ?? '';
  const gmailUser = EMAIL_REGEX.test(rawUser) ? rawUser : DEFAULT_RECIPIENT_EMAIL;
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  return {gmailUser, gmailPass};
}

async function forwardInquiryToGmail(
  inquiry: {
    referenceId: string;
    name: string;
    email: string;
    service: string;
    message: string;
    receivedAt: string;
  },
  recipientEmail: string
): Promise<DeliveryResult> {
  const {gmailUser, gmailPass} = resolveGmailAuth();

  // 1. Primary: Direct Gmail SMTP via Nodemailer when GMAIL_APP_PASSWORD is configured
  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const subject = `[IdeaCircuit Inquiry] ${inquiry.service} — ${inquiry.name} (${inquiry.referenceId})`;
      const textBody = [
        `New Project Inquiry via IdeaCircuit Website`,
        `==================================================`,
        `Reference ID : ${inquiry.referenceId}`,
        `Client Name  : ${inquiry.name}`,
        `Client Email : ${inquiry.email}`,
        `Service Area : ${inquiry.service}`,
        `Submitted At : ${new Date(inquiry.receivedAt).toUTCString()}`,
        ``,
        `Project Details:`,
        inquiry.message,
      ].join('\n');

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#EDEDEB; padding:24px; color:#111111;">
          <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border-radius:16px; border:1px solid rgba(0,0,0,0.1); overflow:hidden;">
            <div style="background:#111111; color:#FFFFFF; padding:20px 24px;">
              <p style="margin:0; font-size:12px; color:#B9F53A; font-weight:600; letter-spacing:0.04em;">IDEACIRCUIT PROJECT INQUIRY</p>
              <h1 style="margin:6px 0 0; font-size:20px; font-weight:700;">${escapeHtml(inquiry.service)}</h1>
            </div>
            <div style="padding:24px; font-size:14px; line-height:1.6;">
              <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <tr>
                  <td style="padding:8px 0; color:#52524E; width:130px;">Reference ID</td>
                  <td style="padding:8px 0; font-weight:700; font-family:monospace;">${escapeHtml(inquiry.referenceId)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#52524E;">Client Name</td>
                  <td style="padding:8px 0; font-weight:600;">${escapeHtml(inquiry.name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#52524E;">Client Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${escapeHtml(inquiry.email)}" style="color:#111111; font-weight:600;">${escapeHtml(inquiry.email)}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#52524E;">Service Needed</td>
                  <td style="padding:8px 0; font-weight:600;">${escapeHtml(inquiry.service)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; color:#52524E;">Submitted At</td>
                  <td style="padding:8px 0;">${escapeHtml(new Date(inquiry.receivedAt).toUTCString())}</td>
                </tr>
              </table>
              <div style="background:#EDEDEB; border-radius:12px; padding:16px;">
                <p style="margin:0 0 8px; font-size:12px; font-weight:700; text-transform:uppercase; color:#52524E;">Project Details</p>
                <p style="margin:0; white-space:pre-wrap; color:#111111;">${escapeHtml(inquiry.message)}</p>
              </div>
              <div style="margin-top:20px;">
                <a href="mailto:${escapeHtml(inquiry.email)}?subject=${encodeURIComponent(`Re: Your IdeaCircuit ${inquiry.service} Inquiry (${inquiry.referenceId})`)}" style="display:inline-block; background:#B9F53A; color:#111111; text-decoration:none; font-weight:600; font-size:13px; padding:10px 18px; border-radius:999px;">Reply to ${escapeHtml(inquiry.name)}</a>
              </div>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"IdeaCircuit Contact Form" <${gmailUser}>`,
        to: recipientEmail,
        replyTo: `"${inquiry.name.replace(/"/g, '')}" <${inquiry.email}>`,
        subject,
        text: textBody,
        html: htmlBody,
      });

      return {
        status: 'sent',
        channel: 'gmail_smtp',
        recipientEmail,
        detail: `Inquiry delivered directly to ${recipientEmail}.`,
      };
    } catch (smtpError) {
      console.error('Gmail SMTP delivery failed, attempting HTTP forward fallback:', smtpError);
    }
  }

  // 2. Automatic Zero-Config Fallback: FormSubmit AJAX webhook forwarding to recipientEmail
  try {
    const appOrigin = process.env.APP_URL?.trim() || 'https://ideacircuit.studio';
    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: appOrigin,
          Referer: `${appOrigin}/contact`,
        },
        body: JSON.stringify({
          _subject: `New IdeaCircuit Inquiry: ${inquiry.service} — ${inquiry.name} (${inquiry.referenceId})`,
          _replyto: inquiry.email,
          _template: 'table',
          _captcha: 'false',
          'Reference ID': inquiry.referenceId,
          'Client Name': inquiry.name,
          'Client Email': inquiry.email,
          'Service Needed': inquiry.service,
          'Submitted At': new Date(inquiry.receivedAt).toUTCString(),
          'Project Details': inquiry.message,
        }),
      }
    );

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean | string;
      message?: string;
    };
    const msgText = String(payload.message ?? '');
    const isSuccess = payload.success === true || payload.success === 'true';

    if (response.ok && isSuccess) {
      return {
        status: 'sent',
        channel: 'formsubmit',
        recipientEmail,
        detail: `Inquiry forwarded directly to ${recipientEmail}.`,
      };
    }

    if (/activate|confirm/i.test(msgText)) {
      return {
        status: 'pending_activation',
        channel: 'formsubmit',
        recipientEmail,
        detail: `One-time FormSubmit confirmation sent to ${recipientEmail}. Open that email and click "Activate Form" so future inquiries arrive automatically.`,
      };
    }

    console.warn('FormSubmit response did not confirm delivery:', response.status, payload);
  } catch (forwardErr) {
    console.error('FormSubmit forwarding error:', forwardErr);
  }

  return {
    status: 'inbox_only',
    channel: 'inbox',
    recipientEmail,
    detail: 'Saved to Studio Admin Inquiries Inbox.',
  };
}

async function forwardCallBookingToGmail(
  booking: {
    referenceId: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    channel: 'Phone Call' | 'WhatsApp Call';
    service: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
    studioLine: string;
    receivedAt: string;
  },
  recipientEmail: string
): Promise<DeliveryResult> {
  const {gmailUser, gmailPass} = resolveGmailAuth();
  const digits = booking.clientPhone.replace(/\D/g, '');
  const waPhone = digits.length === 11 && digits.startsWith('0') ? `234${digits.slice(1)}` : digits;

  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const subject = `[IdeaCircuit Call Booking] ${booking.channel} — ${booking.clientName} (${booking.preferredDate} @ ${booking.preferredTime})`;
      const textBody = [
        `New Call Booking via IdeaCircuit Website`,
        `==================================================`,
        `Reference ID   : ${booking.referenceId}`,
        `Call Channel   : ${booking.channel} (Studio Line: ${booking.studioLine})`,
        `Scheduled For  : ${booking.preferredDate} at ${booking.preferredTime}`,
        `Client Name    : ${booking.clientName}`,
        `Client Phone   : ${booking.clientPhone}`,
        `Client Email   : ${booking.clientEmail || 'Not provided'}`,
        `Service Topic  : ${booking.service}`,
        `Notes          : ${booking.notes || 'None provided'}`,
      ].join('\n');

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#EDEDEB; padding:24px; color:#111111;">
          <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border-radius:16px; border:1px solid rgba(0,0,0,0.1); overflow:hidden;">
            <div style="background:#111111; color:#FFFFFF; padding:20px 24px;">
              <p style="margin:0; font-size:12px; color:#B9F53A; font-weight:600; letter-spacing:0.04em;">IDEACIRCUIT CALL BOOKING · ${escapeHtml(booking.channel.toUpperCase())}</p>
              <h1 style="margin:6px 0 0; font-size:20px; font-weight:700;">${escapeHtml(booking.preferredDate)} · ${escapeHtml(booking.preferredTime)}</h1>
            </div>
            <div style="padding:24px; font-size:14px; line-height:1.6;">
              <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <tr><td style="padding:8px 0; color:#52524E; width:140px;">Reference ID</td><td style="padding:8px 0; font-weight:700; font-family:monospace;">${escapeHtml(booking.referenceId)}</td></tr>
                <tr><td style="padding:8px 0; color:#52524E;">Call Type</td><td style="padding:8px 0; font-weight:700;">${escapeHtml(booking.channel)} (${escapeHtml(booking.studioLine)})</td></tr>
                <tr><td style="padding:8px 0; color:#52524E;">Client Name</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(booking.clientName)}</td></tr>
                <tr><td style="padding:8px 0; color:#52524E;">Client Phone</td><td style="padding:8px 0; font-weight:700; font-family:monospace;">${escapeHtml(booking.clientPhone)}</td></tr>
                <tr><td style="padding:8px 0; color:#52524E;">Client Email</td><td style="padding:8px 0;">${escapeHtml(booking.clientEmail || 'Not provided')}</td></tr>
                <tr><td style="padding:8px 0; color:#52524E;">Service Topic</td><td style="padding:8px 0; font-weight:600;">${escapeHtml(booking.service)}</td></tr>
              </table>
              ${booking.notes ? `<div style="background:#EDEDEB; border-radius:12px; padding:16px; margin-bottom:18px;"><p style="margin:0 0 6px; font-size:12px; font-weight:700; text-transform:uppercase; color:#52524E;">Call Notes</p><p style="margin:0; white-space:pre-wrap;">${escapeHtml(booking.notes)}</p></div>` : ''}
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a href="tel:${escapeHtml(booking.clientPhone)}" style="display:inline-block; background:#111111; color:#FFFFFF; text-decoration:none; font-weight:600; font-size:13px; padding:10px 18px; border-radius:999px;">Call ${escapeHtml(booking.clientPhone)}</a>
                ${waPhone ? `<a href="https://wa.me/${escapeHtml(waPhone)}" style="display:inline-block; background:#B9F53A; color:#111111; text-decoration:none; font-weight:600; font-size:13px; padding:10px 18px; border-radius:999px;">Open WhatsApp</a>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"IdeaCircuit Call Booking" <${gmailUser}>`,
        to: recipientEmail,
        ...(booking.clientEmail ? {replyTo: `"${booking.clientName.replace(/"/g, '')}" <${booking.clientEmail}>`} : {}),
        subject,
        text: textBody,
        html: htmlBody,
      });

      return {
        status: 'sent',
        channel: 'gmail_smtp',
        recipientEmail,
        detail: `Call booking delivered directly to ${recipientEmail}.`,
      };
    } catch (smtpError) {
      console.error('Gmail SMTP call booking notification failed:', smtpError);
    }
  }

  return {
    status: 'inbox_only',
    channel: 'inbox',
    recipientEmail,
    detail: 'Saved to Studio Admin Booked Calls.',
  };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({limit: '10mb'}));
  app.use('/uploads', express.static(uploadsDir));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', service: 'ideacircuit-studio'});
  });

  app.get('/api/contact/status', (_req, res) => {
    const {gmailUser, gmailPass} = resolveGmailAuth();
    const smtpConfigured = Boolean(gmailPass);
    res.json({
      ok: true,
      recipientEmail: DEFAULT_RECIPIENT_EMAIL,
      gmailUser,
      smtpConfigured,
      provider: smtpConfigured ? 'gmail_smtp' : 'formsubmit',
    });
  });

  app.get('/api/ai/status', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
      model: GEMINI_TEXT_MODEL,
    });
  });

  // Public AI Suggestion Box & Instant Client Reply endpoint
  app.post('/api/ai/suggest', async (req, res) => {
    const body = req.body ?? {};
    const senderName =
      typeof body.senderName === 'string' && body.senderName.trim()
        ? body.senderName.trim().slice(0, 100)
        : 'Studio Visitor';
    const senderEmail =
      typeof body.senderEmail === 'string' ? body.senderEmail.trim().slice(0, 160) : '';
    const topic =
      typeof body.topic === 'string' && ALLOWED_SUGGESTION_TOPICS.has(body.topic.trim())
        ? body.topic.trim()
        : 'Project Idea';
    const suggestion =
      typeof body.suggestion === 'string' ? body.suggestion.trim().slice(0, 2000) : '';
    const studioEmail =
      typeof body.contactEmail === 'string' && EMAIL_REGEX.test(body.contactEmail.trim())
        ? body.contactEmail.trim()
        : DEFAULT_RECIPIENT_EMAIL;
    const whatsappNumber =
      typeof body.whatsappNumber === 'string' && body.whatsappNumber.trim()
        ? body.whatsappNumber.trim().slice(0, 30)
        : '08136290176';

    if (suggestion.length < 5) {
      res.status(400).json({
        ok: false,
        error: 'Please enter at least 5 characters for your suggestion or question.',
      });
      return;
    }

    if (senderEmail && !EMAIL_REGEX.test(senderEmail)) {
      res.status(400).json({
        ok: false,
        error: 'Please enter a valid email address or leave it blank.',
      });
      return;
    }

    try {
      const ai = getGeminiClient();
      const response = await generateWithGeminiFallback(
        ai,
        `Visitor Name: ${senderName}
Topic: ${topic}
Visitor Input: ${suggestion}`,
        `You are the IdeaCircuit Studio Client Concierge & AI Suggestion Assistant.
IdeaCircuit is a creative digital studio specializing in:
1. Website Design (modern business websites, e-commerce storefronts, responsive landing pages)
2. Graphic Design (brand identity, social media campaigns, packaging & visual collateral)
3. AI Automation (lead routing, intelligent client intake, workflow dashboards, operational automation)
Studio direct contact: Gmail ${studioEmail}, WhatsApp ${whatsappNumber}.

When a visitor submits a suggestion, feedback, or client question:
- Write a warm, clear, thoughtful reply addressing them directly by name if provided (3-4 concise sentences).
- Acknowledge website feedback graciously, or answer project/service questions with practical, grounded guidance without inventing fake prices or fake timelines.
- Recommend the best matching IdeaCircuit service category from: "Website Design", "Graphic Design", "AI Automation", or "Multi-Service Project".
- Provide 2-3 short actionable scope ideas or next steps tailored to their input.`,
        {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Helpful, natural studio response to the visitor suggestion or question.',
            },
            recommendedService: {
              type: Type.STRING,
              description:
                'One of: Website Design, Graphic Design, AI Automation, Multi-Service Project',
            },
            actionIdeas: {
              type: Type.ARRAY,
              items: {type: Type.STRING},
              description: '2 to 3 practical project or next-step suggestions.',
            },
          },
          required: ['reply', 'recommendedService', 'actionIdeas'],
        }
      );

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        reply?: string;
        recommendedService?: string;
        actionIdeas?: string[];
      };

      const recommendedService = ALLOWED_SERVICES.has(String(parsed.recommendedService))
        ? String(parsed.recommendedService)
        : 'Multi-Service Project';
      const reply =
        typeof parsed.reply === 'string' && parsed.reply.trim()
          ? parsed.reply.trim().slice(0, 3000)
          : 'Thank you for sharing your message with IdeaCircuit. Our studio team will review it carefully and follow up with tailored next steps.';
      const actionIdeas = Array.isArray(parsed.actionIdeas)
        ? parsed.actionIdeas
            .map((item) => String(item).trim())
            .filter(Boolean)
            .slice(0, 4)
        : [];

      res.json({
        ok: true,
        senderName,
        senderEmail,
        topic,
        suggestion,
        reply,
        recommendedService,
        actionIdeas,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({
        ok: false,
        error: formatted.message,
      });
    }
  });

  // Admin AI Client Reply Drafter endpoint
  app.post('/api/ai/reply', async (req, res) => {
    const body = req.body ?? {};
    const clientName =
      typeof body.clientName === 'string' && body.clientName.trim()
        ? body.clientName.trim().slice(0, 120)
        : 'Client';
    const service =
      typeof body.service === 'string' && body.service.trim()
        ? body.service.trim().slice(0, 100)
        : 'Digital Project';
    const originalMessage =
      typeof body.originalMessage === 'string' ? body.originalMessage.trim().slice(0, 4000) : '';
    const tone =
      typeof body.tone === 'string' && body.tone.trim()
        ? body.tone.trim().slice(0, 80)
        : 'Warm & Consultative';
    const ownerNotes =
      typeof body.ownerNotes === 'string' ? body.ownerNotes.trim().slice(0, 1000) : '';
    const studioEmail =
      typeof body.studioEmail === 'string' && EMAIL_REGEX.test(body.studioEmail.trim())
        ? body.studioEmail.trim()
        : DEFAULT_RECIPIENT_EMAIL;
    const whatsappNumber =
      typeof body.whatsappNumber === 'string' && body.whatsappNumber.trim()
        ? body.whatsappNumber.trim().slice(0, 30)
        : '08136290176';

    if (originalMessage.length < 5) {
      res.status(400).json({
        ok: false,
        error: 'Client message is required to draft an AI reply.',
      });
      return;
    }

    try {
      const ai = getGeminiClient();
      const response = await generateWithGeminiFallback(
        ai,
        `Client Name: ${clientName}
Requested Service / Topic: ${service}
Desired Tone: ${tone}
Studio Owner Notes to Include: ${ownerNotes || 'None provided'}
Client Message:
${originalMessage}`,
        `You are drafting an email reply on behalf of IdeaCircuit Studio (Website Design, Graphic Design, and AI Automation).
Studio Contact Details: Email ${studioEmail}, WhatsApp ${whatsappNumber}.
Write a ready-to-send email subject line and email body addressed to the client:
- Match the requested tone (${tone}).
- Acknowledge the specific details in the client's message so it feels genuinely attentive.
- Include any specific details from "Studio Owner Notes" accurately (if none are provided, do NOT invent prices or fixed deadlines).
- Propose clear, friendly next steps (such as a brief discovery call, WhatsApp chat, or replying with brand assets/requirements).
- Sign off cleanly as "IdeaCircuit Studio".`,
        {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: 'Polished email subject line for the client reply.',
            },
            replyBody: {
              type: Type.STRING,
              description: 'Complete email reply text ready to review and send to the client.',
            },
          },
          required: ['subject', 'replyBody'],
        }
      );

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        subject?: string;
        replyBody?: string;
      };

      const subject =
        typeof parsed.subject === 'string' && parsed.subject.trim()
          ? parsed.subject.trim().slice(0, 200)
          : `Re: Your ${service} Inquiry — IdeaCircuit`;
      const replyBody =
        typeof parsed.replyBody === 'string' && parsed.replyBody.trim()
          ? parsed.replyBody.trim().slice(0, 5000)
          : '';

      if (!replyBody) {
        res.status(502).json({
          ok: false,
          error: 'AI returned an empty draft. Please try generating again.',
        });
        return;
      }

      res.json({
        ok: true,
        subject,
        replyBody,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({
        ok: false,
        error: formatted.message,
      });
    }
  });

  // Admin Direct Email Reply Sender (via configured Gmail SMTP)
  app.post('/api/admin/send-reply', async (req, res) => {
    const body = req.body ?? {};
    const toEmail = typeof body.toEmail === 'string' ? body.toEmail.trim().slice(0, 160) : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 200) : '';
    const replyBody =
      typeof body.replyBody === 'string' ? body.replyBody.trim().slice(0, 6000) : '';

    if (!EMAIL_REGEX.test(toEmail)) {
      res.status(400).json({ok: false, error: 'A valid client email address is required.'});
      return;
    }
    if (!subject || !replyBody) {
      res.status(400).json({ok: false, error: 'Both subject and reply message are required.'});
      return;
    }

    const {gmailUser, gmailPass} = resolveGmailAuth();

    if (!gmailPass) {
      res.status(400).json({
        ok: false,
        fallbackMailtoAvailable: true,
        error:
          'Direct SMTP sending requires GMAIL_APP_PASSWORD in Settings > Secrets. Use "Open in Gmail" to send immediately from your Gmail account.',
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"IdeaCircuit Studio" <${gmailUser}>`,
        to: toEmail,
        replyTo: gmailUser,
        subject,
        text: replyBody,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111111; line-height:1.65; white-space:pre-wrap;">${escapeHtml(replyBody)}</div>`,
      });

      res.json({
        ok: true,
        message: `Reply sent directly from ${gmailUser} to ${toEmail}.`,
      });
    } catch (err) {
      console.error('Failed to send client reply via Gmail SMTP:', err);
      res.status(500).json({
        ok: false,
        error: 'Could not send via Gmail SMTP. Please verify your GMAIL_APP_PASSWORD or use "Open in Gmail".',
      });
    }
  });

  app.post('/api/upload', (req, res) => {
    const body = req.body ?? {};
    const filename = typeof body.filename === 'string' ? body.filename.trim() : 'upload';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : '';
    const base64Data = typeof body.base64Data === 'string' ? body.base64Data.trim() : '';

    const ext = ALLOWED_IMAGE_MIMES[mimeType];
    if (!ext) {
      res.status(400).json({
        ok: false,
        error: 'Unsupported image format. Please upload a PNG, JPG, WebP, or GIF image.',
      });
      return;
    }

    const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    if (!rawBase64) {
      res.status(400).json({ok: false, error: 'Image payload is empty.'});
      return;
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(rawBase64, 'base64');
    } catch {
      res.status(400).json({ok: false, error: 'Invalid image encoding.'});
      return;
    }

    if (buffer.length === 0 || buffer.length > 6 * 1024 * 1024) {
      res.status(400).json({
        ok: false,
        error: 'Image size must be between 1 byte and 6 MB.',
      });
      return;
    }

    const baseName =
      path
        .basename(filename, path.extname(filename))
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 48) || 'asset';
    const uniqueName = `${Date.now()}-${baseName}.${ext}`;
    const targetPath = path.join(uploadsDir, uniqueName);

    try {
      fs.writeFileSync(targetPath, buffer);
      res.status(201).json({
        ok: true,
        url: `/uploads/${uniqueName}`,
        size: buffer.length,
      });
    } catch (err) {
      console.error('Failed to store uploaded image:', err);
      res.status(500).json({ok: false, error: 'Failed to save uploaded image.'});
    }
  });

  app.get('/api/inquiries', (_req, res) => {
    res.json({
      ok: true,
      inquiries: [...submissions].reverse(),
    });
  });

  app.post('/api/contact', async (req, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 160) : '';
    const service = typeof body.service === 'string' ? body.service.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
    const requestedRecipient =
      typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().slice(0, 160) : '';
    const recipientEmail = EMAIL_REGEX.test(requestedRecipient)
      ? requestedRecipient
      : DEFAULT_RECIPIENT_EMAIL;

    const errors: Record<string, string> = {};

    if (name.length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    }

    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!ALLOWED_SERVICES.has(service)) {
      errors.service = 'Please select a service area.';
    }

    if (message.length < 15) {
      errors.message = 'Please share at least 15 characters about your project.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        ok: false,
        error: 'Please review the highlighted fields and try again.',
        fieldErrors: errors,
      });
      return;
    }

    const referenceId = `IC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const receivedAt = new Date().toISOString();

    const delivery = await forwardInquiryToGmail(
      {
        referenceId,
        name,
        email,
        service,
        message,
        receivedAt,
      },
      recipientEmail
    );

    const record: ContactSubmission = {
      referenceId,
      name,
      email,
      service,
      message,
      recipientEmail: delivery.recipientEmail,
      deliveryStatus: delivery.status,
      deliveryChannel: delivery.channel,
      receivedAt,
    };

    submissions.push(record);
    if (submissions.length > 200) {
      submissions.shift();
    }

    res.status(201).json({
      ok: true,
      referenceId,
      receivedAt,
      summary: {
        name,
        email,
        service,
        message,
      },
      delivery,
    });
  });

  app.get('/api/book-call', (_req, res) => {
    res.json({
      ok: true,
      bookings: [...callBookings].reverse(),
    });
  });

  app.post('/api/book-call', async (req, res) => {
    const body = req.body ?? {};
    const clientName =
      typeof body.clientName === 'string' ? body.clientName.trim().slice(0, 120) : '';
    const clientPhone =
      typeof body.clientPhone === 'string' ? body.clientPhone.trim().slice(0, 30) : '';
    const clientEmail =
      typeof body.clientEmail === 'string' ? body.clientEmail.trim().slice(0, 160) : '';
    const channel = typeof body.channel === 'string' ? body.channel.trim() : '';
    const service = typeof body.service === 'string' ? body.service.trim() : '';
    const preferredDate =
      typeof body.preferredDate === 'string' ? body.preferredDate.trim().slice(0, 20) : '';
    const preferredTime =
      typeof body.preferredTime === 'string' ? body.preferredTime.trim().slice(0, 40) : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : '';
    const studioLine =
      typeof body.studioLine === 'string' && body.studioLine.trim()
        ? body.studioLine.trim().slice(0, 30)
        : '08136290176';
    const requestedRecipient =
      typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().slice(0, 160) : '';
    const recipientEmail = EMAIL_REGEX.test(requestedRecipient)
      ? requestedRecipient
      : DEFAULT_RECIPIENT_EMAIL;

    const errors: Record<string, string> = {};
    if (clientName.length < 2) {
      errors.clientName = 'Please enter your name (at least 2 characters).';
    }
    if (clientPhone.replace(/\D/g, '').length < 7) {
      errors.clientPhone = 'Please enter a valid phone or WhatsApp number.';
    }
    if (clientEmail && !EMAIL_REGEX.test(clientEmail)) {
      errors.clientEmail = 'Please enter a valid email address or leave it blank.';
    }
    if (!ALLOWED_CALL_CHANNELS.has(channel)) {
      errors.channel = 'Please select Phone Call or WhatsApp Call.';
    }
    if (!ALLOWED_SERVICES.has(service)) {
      errors.service = 'Please select a service topic.';
    }
    if (preferredDate.length < 4) {
      errors.preferredDate = 'Please select a preferred date.';
    }
    if (preferredTime.length < 2) {
      errors.preferredTime = 'Please select a preferred time slot.';
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        ok: false,
        error: 'Please review the highlighted booking fields and try again.',
        fieldErrors: errors,
      });
      return;
    }

    const referenceId = `CALL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const receivedAt = new Date().toISOString();
    const typedChannel = channel as 'Phone Call' | 'WhatsApp Call';

    const delivery = await forwardCallBookingToGmail(
      {
        referenceId,
        clientName,
        clientPhone,
        clientEmail,
        channel: typedChannel,
        service,
        preferredDate,
        preferredTime,
        notes,
        studioLine,
        receivedAt,
      },
      recipientEmail
    );

    const record: CallBookingSubmission = {
      referenceId,
      clientName,
      clientPhone,
      clientEmail,
      channel: typedChannel,
      service,
      preferredDate,
      preferredTime,
      notes,
      studioLine,
      recipientEmail: delivery.recipientEmail,
      deliveryStatus: delivery.status,
      deliveryChannel: delivery.channel,
      receivedAt,
    };

    callBookings.push(record);
    if (callBookings.length > 200) {
      callBookings.shift();
    }

    res.status(201).json({
      ok: true,
      referenceId,
      receivedAt,
      booking: record,
      delivery,
    });
  });

  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: {server: httpServer},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`IdeaCircuit server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
