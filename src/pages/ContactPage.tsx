import {useEffect, useState, type FormEvent} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
} from 'lucide-react';
import {useStudio} from '../context/StudioContext';
import {
  formatPhoneHref,
  formatWhatsAppUrl,
  type CallBookingItem,
  type CallChannel,
  type InquiryItem,
} from '../data/studioData';

const SERVICE_OPTIONS = [
  'Website Design',
  'Graphic Design',
  'AI Automation',
  'Multi-Service Project',
] as const;

const CALL_TIME_SLOTS = [
  '09:00 AM – 10:00 AM',
  '10:30 AM – 11:30 AM',
  '12:00 PM – 01:00 PM',
  '02:00 PM – 03:00 PM',
  '04:00 PM – 05:00 PM',
] as const;

type ContactMode = 'inquiry' | 'call';

interface ContactPageProps {
  initialMode?: ContactMode;
}

interface FormState {
  name: string;
  email: string;
  service: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  service?: string;
  message?: string;
}

interface CallFormState {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  channel: CallChannel;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

interface CallFieldErrors {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  channel?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
}

interface SubmissionReceipt {
  referenceId: string;
  receivedAt: string;
  summary: {
    name: string;
    email: string;
    service: string;
    message: string;
  };
  delivery: {
    status: InquiryItem['deliveryStatus'];
    channel: InquiryItem['deliveryChannel'];
    recipientEmail: string;
    detail: string;
  };
}

interface CallBookingReceipt {
  referenceId: string;
  receivedAt: string;
  booking: {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    channel: CallChannel;
    service: string;
    preferredDate: string;
    preferredTime: string;
    notes: string;
    studioLine: string;
  };
  delivery: {
    status: CallBookingItem['deliveryStatus'];
    recipientEmail: string;
    detail: string;
  };
}

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ContactPage({initialMode}: ContactPageProps) {
  const {siteSettings, submitInquiryToFirestore, submitCallBookingToFirestore} = useStudio();
  const [searchParams] = useSearchParams();
  const initialServiceParam = searchParams.get('service') ?? '';
  const modeParam = searchParams.get('mode');

  const resolvedInitialMode: ContactMode =
    initialMode ?? (modeParam === 'call' ? 'call' : 'inquiry');

  const matchedService = SERVICE_OPTIONS.find(
    (option) => option.toLowerCase() === initialServiceParam.toLowerCase()
  );

  const [mode, setMode] = useState<ContactMode>(resolvedInitialMode);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    } else if (modeParam === 'call') {
      setMode('call');
    } else if (modeParam === 'inquiry') {
      setMode('inquiry');
    }
  }, [initialMode, modeParam]);

  // Inquiry form state
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    service: matchedService ?? 'Website Design',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  // Book a Call form state
  const todayDate = getTodayDateString();
  const [callForm, setCallForm] = useState<CallFormState>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    channel: 'WhatsApp Call',
    service: matchedService ?? 'Website Design',
    preferredDate: todayDate,
    preferredTime: CALL_TIME_SLOTS[1],
    notes: '',
  });
  const [callErrors, setCallErrors] = useState<CallFieldErrors>({});
  const [callSubmitError, setCallSubmitError] = useState<string | null>(null);
  const [isBookingCall, setIsBookingCall] = useState(false);
  const [callReceipt, setCallReceipt] = useState<CallBookingReceipt | null>(null);

  useEffect(() => {
    if (matchedService) {
      setForm((prev) => ({...prev, service: matchedService}));
      setCallForm((prev) => ({...prev, service: matchedService}));
    }
  }, [matchedService]);

  const studioPhone = siteSettings.phoneNumber || siteSettings.whatsappNumber || '08136290176';
  const studioWhatsapp = siteSettings.whatsappNumber || '08136290176';

  const validateClient = (values: FormState): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (values.name.trim().length < 2) {
      nextErrors.name = 'Please enter your name (at least 2 characters).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!SERVICE_OPTIONS.includes(values.service as (typeof SERVICE_OPTIONS)[number])) {
      nextErrors.service = 'Please choose a service area.';
    }
    if (values.message.trim().length < 15) {
      nextErrors.message = 'Please share a brief overview (at least 15 characters).';
    }
    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const clientErrors = validateClient(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const targetEmail = siteSettings.contactEmail || 'yemipresh2010@gmail.com';
      const trimmedName = form.name.trim();
      const trimmedEmail = form.email.trim();
      const trimmedMessage = form.message.trim();
      const selectedService = form.service as InquiryItem['service'];

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          service: selectedService,
          message: trimmedMessage,
          recipientEmail: targetEmail,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) {
          setErrors(payload.fieldErrors);
        }
        setSubmitError(
          payload.error || 'We could not process your inquiry. Please check the form and try again.'
        );
        return;
      }

      const delivery = payload.delivery ?? {
        status: 'inbox_only',
        channel: 'inbox',
        recipientEmail: targetEmail,
        detail: 'Saved to Studio Admin Inquiries Inbox.',
      };

      try {
        await submitInquiryToFirestore({
          referenceId: payload.referenceId,
          name: trimmedName,
          email: trimmedEmail,
          service: selectedService,
          message: trimmedMessage,
          recipientEmail: delivery.recipientEmail || targetEmail,
          deliveryStatus: delivery.status,
          deliveryChannel: delivery.channel,
        });
      } catch {
        // Server delivery already succeeded; keep confirmation visible
      }

      setReceipt({
        referenceId: payload.referenceId,
        receivedAt: payload.receivedAt,
        summary: {
          name: trimmedName,
          email: trimmedEmail,
          service: selectedService,
          message: trimmedMessage,
        },
        delivery,
      });
      setForm({
        name: '',
        email: '',
        service: 'Website Design',
        message: '',
      });
    } catch {
      setSubmitError(
        'Connection error while submitting your inquiry. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCallBooking = (values: CallFormState): CallFieldErrors => {
    const nextErrors: CallFieldErrors = {};
    if (values.clientName.trim().length < 2) {
      nextErrors.clientName = 'Please enter your name (at least 2 characters).';
    }
    if (values.clientPhone.replace(/\D/g, '').length < 7) {
      nextErrors.clientPhone = 'Please enter a valid phone or WhatsApp number.';
    }
    if (values.clientEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.clientEmail.trim())) {
        nextErrors.clientEmail = 'Please enter a valid email address or leave it blank.';
      }
    }
    if (!values.preferredDate.trim()) {
      nextErrors.preferredDate = 'Please select your preferred call date.';
    }
    if (!values.preferredTime.trim()) {
      nextErrors.preferredTime = 'Please choose a preferred time window.';
    }
    return nextErrors;
  };

  const handleBookCallSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCallSubmitError(null);

    const validation = validateCallBooking(callForm);
    if (Object.keys(validation).length > 0) {
      setCallErrors(validation);
      return;
    }

    setCallErrors({});
    setIsBookingCall(true);

    try {
      const targetEmail = siteSettings.contactEmail || 'yemipresh2010@gmail.com';
      const studioLine =
        callForm.channel === 'WhatsApp Call' ? studioWhatsapp : studioPhone;

      const response = await fetch('/api/book-call', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          clientName: callForm.clientName.trim(),
          clientPhone: callForm.clientPhone.trim(),
          clientEmail: callForm.clientEmail.trim(),
          channel: callForm.channel,
          service: callForm.service,
          preferredDate: callForm.preferredDate,
          preferredTime: callForm.preferredTime,
          notes: callForm.notes.trim(),
          studioLine,
          recipientEmail: targetEmail,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) {
          setCallErrors(payload.fieldErrors);
        }
        setCallSubmitError(
          payload.error || 'Could not schedule your call right now. Please try again.'
        );
        return;
      }

      const delivery = payload.delivery ?? {
        status: 'inbox_only',
        recipientEmail: targetEmail,
        detail: 'Saved to Studio Admin Booked Calls.',
      };

      try {
        await submitCallBookingToFirestore({
          referenceId: payload.referenceId,
          clientName: callForm.clientName.trim(),
          clientPhone: callForm.clientPhone.trim(),
          clientEmail: callForm.clientEmail.trim(),
          channel: callForm.channel,
          service: callForm.service as CallBookingItem['service'],
          preferredDate: callForm.preferredDate,
          preferredTime: callForm.preferredTime,
          notes: callForm.notes.trim(),
          studioLine,
          deliveryStatus: delivery.status,
        });
      } catch {
        // Server booking confirmation already succeeded
      }

      setCallReceipt({
        referenceId: payload.referenceId,
        receivedAt: payload.receivedAt,
        booking: {
          clientName: callForm.clientName.trim(),
          clientPhone: callForm.clientPhone.trim(),
          clientEmail: callForm.clientEmail.trim(),
          channel: callForm.channel,
          service: callForm.service,
          preferredDate: callForm.preferredDate,
          preferredTime: callForm.preferredTime,
          notes: callForm.notes.trim(),
          studioLine,
        },
        delivery,
      });

      setCallForm((prev) => ({
        ...prev,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        notes: '',
      }));
    } catch {
      setCallSubmitError(
        'Connection error while booking your call. Please try again or reach us directly on 08136290176.'
      );
    } finally {
      setIsBookingCall(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: Engaging Headline & Direct Contact (Phone, WhatsApp & Gmail) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-[#52524E]">
                Contact IdeaCircuit
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#111111] leading-[1.05] text-balance"
                style={{fontSize: 'clamp(2.2rem, 4vw, 3.6rem)'}}
              >
                Tell us what you are building next.
              </h1>
              <p className="text-base sm:text-lg text-[#52524E] leading-relaxed">
                Send a detailed project brief, or book a Phone Call or WhatsApp Call directly with our studio on{' '}
                <span className="font-mono font-semibold text-[#111111]">{studioPhone}</span>.
              </p>
            </div>

            {/* Direct Contact Channels: Phone, WhatsApp & Gmail */}
            <div className="bg-white rounded-2xl border border-black/10 p-6 sm:p-7 space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#111111]">
                  Direct Call, WhatsApp &amp; Gmail
                </h2>
                <p className="text-xs text-[#52524E]">
                  Call directly by phone, message or call on WhatsApp, or email anytime.
                </p>
              </div>

              <div className="space-y-3">
                {/* Direct Phone Call */}
                <a
                  href={formatPhoneHref(studioPhone)}
                  className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-[#111111] hover:bg-[#232320] text-white transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-300">Direct Phone Call</p>
                      <p className="font-mono text-sm font-bold text-white truncate">
                        {studioPhone}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-[#B9F53A] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>

                {/* Direct WhatsApp Call / Chat */}
                <a
                  href={formatWhatsAppUrl(
                    studioWhatsapp,
                    'Hello IdeaCircuit, I would like to book or start a WhatsApp call.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-[#B9F53A]/35 hover:bg-[#B9F53A]/60 border border-[#111111]/15 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#111111] text-[#B9F53A] flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#52524E]">
                        WhatsApp Chat &amp; Call
                      </p>
                      <p className="font-mono text-sm font-bold text-[#111111] truncate">
                        {studioWhatsapp}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-[#111111] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>

                {/* Direct Gmail */}
                <a
                  href={`mailto:${siteSettings.contactEmail}?subject=${encodeURIComponent(
                    'New Project Inquiry — IdeaCircuit'
                  )}`}
                  className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-[#EDEDEB]/70 hover:bg-[#E3E3DF] border border-black/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-black/10 text-[#111111] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#52524E]">Send a Gmail Message</p>
                      <p className="text-sm font-semibold text-[#111111] truncate">
                        {siteSettings.contactEmail}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-[#111111] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/10 p-6 sm:p-7 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#111111]">
                What happens after you submit
              </h2>
              <ol className="space-y-4 text-sm text-[#52524E]">
                <li className="flex gap-3">
                  <span className="font-mono text-xs font-semibold text-[#111111] bg-[#EDEDEB] w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 tabular-nums">
                    1
                  </span>
                  <span>
                    Your inquiry or call reservation is logged with a unique reference code and sent straight to our studio Gmail.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs font-semibold text-[#111111] bg-[#EDEDEB] w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </span>
                  <span>
                    For booked calls, you can jump right into a Phone Call or WhatsApp Call on{' '}
                    <span className="font-mono font-semibold text-[#111111]">{studioPhone}</span> or wait for us at your chosen slot.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs font-semibold text-[#111111] bg-[#EDEDEB] w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </span>
                  <span>
                    We align on scope, creative direction, and clear next steps tailored to your goals.
                  </span>
                </li>
              </ol>
            </div>

            <div className="pt-2 space-y-2 text-sm text-[#52524E]">
              <p className="font-medium text-[#111111]">Studio Disciplines</p>
              <p>Website Design · Graphic Design · AI Automation</p>
              <div className="pt-2">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111] hover:underline"
                >
                  <span>Review service capabilities first</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Mode Switcher + Project Inquiry OR Book a Call */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-black/10 p-6 sm:p-10 shadow-sm space-y-6">
              {/* Interactive Mode Toggle */}
              <div
                role="tablist"
                aria-label="Contact options"
                className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#EDEDEB]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'inquiry'}
                  onClick={() => setMode('inquiry')}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'inquiry'
                      ? 'bg-white text-[#111111] shadow-xs'
                      : 'text-[#52524E] hover:text-[#111111]'
                  }`}
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>Send Project Inquiry</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'call'}
                  onClick={() => setMode('call')}
                  className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'call'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#52524E] hover:text-[#111111]'
                  }`}
                >
                  <PhoneCall
                    className={`w-4 h-4 ${mode === 'call' ? 'text-[#B9F53A]' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Book a Call</span>
                </button>
              </div>

              {mode === 'call' ? (
                callReceipt ? (
                  <div className="space-y-6 py-2" role="status" aria-live="polite">
                    <div className="w-12 h-12 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-mono text-xs font-medium text-[#52524E] tabular-nums">
                        Booking Reference {callReceipt.referenceId}
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111]">
                        {callReceipt.booking.channel} Reserved for {callReceipt.booking.clientName}.
                      </h2>
                      <p className="text-base text-[#52524E] leading-relaxed">
                        Your <strong className="text-[#111111]">{callReceipt.booking.channel}</strong>{' '}
                        about <strong className="text-[#111111]">{callReceipt.booking.service}</strong>{' '}
                        is scheduled for{' '}
                        <strong className="text-[#111111]">
                          {callReceipt.booking.preferredDate} ({callReceipt.booking.preferredTime})
                        </strong>
                        . Our studio line is{' '}
                        <strong className="font-mono text-[#111111]">
                          {callReceipt.booking.studioLine}
                        </strong>
                        .
                      </p>
                    </div>

                    <div className="bg-[#EDEDEB] rounded-2xl p-5 text-xs text-[#52524E] space-y-1.5">
                      <p>
                        <span className="font-semibold text-[#111111]">Call Channel:</span>{' '}
                        {callReceipt.booking.channel} ({callReceipt.booking.studioLine})
                      </p>
                      <p>
                        <span className="font-semibold text-[#111111]">Your Number:</span>{' '}
                        <span className="font-mono">{callReceipt.booking.clientPhone}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-[#111111]">Date &amp; Time:</span>{' '}
                        {callReceipt.booking.preferredDate} · {callReceipt.booking.preferredTime}
                      </p>
                      <p>
                        <span className="font-semibold text-[#111111]">Topic:</span>{' '}
                        {callReceipt.booking.service}
                      </p>
                      <p>
                        <span className="font-semibold text-[#111111]">Notification Status:</span>{' '}
                        {callReceipt.delivery.status === 'sent'
                          ? `Emailed to ${callReceipt.delivery.recipientEmail} & saved to Studio Admin`
                          : 'Saved to Studio Admin Booked Calls'}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                      {callReceipt.booking.channel === 'WhatsApp Call' ? (
                        <a
                          href={formatWhatsAppUrl(
                            studioWhatsapp,
                            `Hello IdeaCircuit, I just booked a WhatsApp Call (${callReceipt.referenceId}) for ${callReceipt.booking.preferredDate} at ${callReceipt.booking.preferredTime} regarding ${callReceipt.booking.service}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden="true" />
                          <span>Confirm on WhatsApp ({studioWhatsapp})</span>
                        </a>
                      ) : (
                        <a
                          href={formatPhoneHref(studioPhone)}
                          className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                        >
                          <Phone className="w-4 h-4" aria-hidden="true" />
                          <span>Call Studio Now ({studioPhone})</span>
                        </a>
                      )}
                      <a
                        href={
                          callReceipt.booking.channel === 'WhatsApp Call'
                            ? formatPhoneHref(studioPhone)
                            : formatWhatsAppUrl(
                                studioWhatsapp,
                                `Hello IdeaCircuit, booking ref ${callReceipt.referenceId} (${callReceipt.booking.preferredDate} · ${callReceipt.booking.preferredTime}).`
                              )
                        }
                        target={callReceipt.booking.channel === 'WhatsApp Call' ? undefined : '_blank'}
                        rel={
                          callReceipt.booking.channel === 'WhatsApp Call'
                            ? undefined
                            : 'noopener noreferrer'
                        }
                        className="inline-flex items-center justify-center gap-2 bg-white border border-black/15 hover:bg-[#EDEDEB] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                      >
                        {callReceipt.booking.channel === 'WhatsApp Call' ? (
                          <>
                            <Phone className="w-4 h-4" aria-hidden="true" />
                            <span>Call Phone ({studioPhone})</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-4 h-4" aria-hidden="true" />
                            <span>Message WhatsApp</span>
                          </>
                        )}
                      </a>
                      <button
                        type="button"
                        onClick={() => setCallReceipt(null)}
                        className="inline-flex items-center justify-center bg-[#111111] hover:bg-[#2A2A27] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                      >
                        Book Another Call
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookCallSubmit} noValidate className="space-y-6">
                    <div className="space-y-1">
                      <h2 className="font-display text-2xl font-bold text-[#111111]">
                        Book a Phone or WhatsApp Call
                      </h2>
                      <p className="text-sm text-[#52524E]">
                        Choose how you would like to speak with us on{' '}
                        <span className="font-mono font-semibold text-[#111111]">
                          {studioPhone}
                        </span>{' '}
                        and pick a convenient date and time.
                      </p>
                    </div>

                    {callSubmitError && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm"
                      >
                        <AlertCircle
                          className="w-5 h-5 text-red-700 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{callSubmitError}</span>
                      </div>
                    )}

                    {/* Call Channel Picker */}
                    <div className="space-y-2">
                      <span className="block text-sm font-semibold text-[#111111]">
                        Choose Call Type
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCallForm((prev) => ({...prev, channel: 'Phone Call'}))
                          }
                          aria-pressed={callForm.channel === 'Phone Call'}
                          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                            callForm.channel === 'Phone Call'
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-[#EDEDEB]/60 text-[#111111] border-black/15 hover:bg-[#E3E3DF]'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              callForm.channel === 'Phone Call'
                                ? 'bg-[#B9F53A] text-[#111111]'
                                : 'bg-white text-[#111111]'
                            }`}
                          >
                            <Phone className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm font-bold">Phone Call</p>
                            <p
                              className={`text-xs font-mono mt-0.5 ${
                                callForm.channel === 'Phone Call'
                                  ? 'text-neutral-300'
                                  : 'text-[#52524E]'
                              }`}
                            >
                              {studioPhone}
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setCallForm((prev) => ({...prev, channel: 'WhatsApp Call'}))
                          }
                          aria-pressed={callForm.channel === 'WhatsApp Call'}
                          className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                            callForm.channel === 'WhatsApp Call'
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-[#EDEDEB]/60 text-[#111111] border-black/15 hover:bg-[#E3E3DF]'
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              callForm.channel === 'WhatsApp Call'
                                ? 'bg-[#B9F53A] text-[#111111]'
                                : 'bg-white text-[#111111]'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm font-bold">WhatsApp Call</p>
                            <p
                              className={`text-xs font-mono mt-0.5 ${
                                callForm.channel === 'WhatsApp Call'
                                  ? 'text-neutral-300'
                                  : 'text-[#52524E]'
                              }`}
                            >
                              {studioWhatsapp}
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Client Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="call-client-name"
                          className="block text-sm font-semibold text-[#111111]"
                        >
                          Your Name
                        </label>
                        <input
                          id="call-client-name"
                          type="text"
                          required
                          value={callForm.clientName}
                          onChange={(e) => {
                            setCallForm((p) => ({...p, clientName: e.target.value}));
                            if (callErrors.clientName) {
                              setCallErrors((p) => ({...p, clientName: undefined}));
                            }
                          }}
                          placeholder="Your full name"
                          className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] ${
                            callErrors.clientName ? 'border-red-600' : 'border-black/15'
                          }`}
                        />
                        {callErrors.clientName && (
                          <p className="text-xs font-medium text-red-700">
                            {callErrors.clientName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="call-client-phone"
                          className="block text-sm font-semibold text-[#111111]"
                        >
                          Your Phone / WhatsApp Number
                        </label>
                        <input
                          id="call-client-phone"
                          type="tel"
                          required
                          value={callForm.clientPhone}
                          onChange={(e) => {
                            setCallForm((p) => ({...p, clientPhone: e.target.value}));
                            if (callErrors.clientPhone) {
                              setCallErrors((p) => ({...p, clientPhone: undefined}));
                            }
                          }}
                          placeholder="e.g. 08012345678"
                          className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm font-mono text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] ${
                            callErrors.clientPhone ? 'border-red-600' : 'border-black/15'
                          }`}
                        />
                        {callErrors.clientPhone && (
                          <p className="text-xs font-medium text-red-700">
                            {callErrors.clientPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preferred Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="call-date"
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]"
                        >
                          <Calendar className="w-4 h-4 text-[#52524E]" aria-hidden="true" />
                          <span>Preferred Date</span>
                        </label>
                        <input
                          id="call-date"
                          type="date"
                          min={todayDate}
                          required
                          value={callForm.preferredDate}
                          onChange={(e) => {
                            setCallForm((p) => ({...p, preferredDate: e.target.value}));
                            if (callErrors.preferredDate) {
                              setCallErrors((p) => ({...p, preferredDate: undefined}));
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] ${
                            callErrors.preferredDate ? 'border-red-600' : 'border-black/15'
                          }`}
                        />
                        {callErrors.preferredDate && (
                          <p className="text-xs font-medium text-red-700">
                            {callErrors.preferredDate}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="call-time"
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]"
                        >
                          <Clock className="w-4 h-4 text-[#52524E]" aria-hidden="true" />
                          <span>Preferred Time Window</span>
                        </label>
                        <select
                          id="call-time"
                          value={callForm.preferredTime}
                          onChange={(e) =>
                            setCallForm((p) => ({...p, preferredTime: e.target.value}))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-sm text-[#111111] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        >
                          {CALL_TIME_SLOTS.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Service Topic & Optional Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="call-service"
                          className="block text-sm font-semibold text-[#111111]"
                        >
                          Topic / Service
                        </label>
                        <select
                          id="call-service"
                          value={callForm.service}
                          onChange={(e) =>
                            setCallForm((p) => ({...p, service: e.target.value}))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-sm text-[#111111] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        >
                          {SERVICE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="call-client-email"
                          className="block text-sm font-semibold text-[#111111]"
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          id="call-client-email"
                          type="email"
                          value={callForm.clientEmail}
                          onChange={(e) => {
                            setCallForm((p) => ({...p, clientEmail: e.target.value}));
                            if (callErrors.clientEmail) {
                              setCallErrors((p) => ({...p, clientEmail: undefined}));
                            }
                          }}
                          placeholder="you@company.com"
                          className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] ${
                            callErrors.clientEmail ? 'border-red-600' : 'border-black/15'
                          }`}
                        />
                        {callErrors.clientEmail && (
                          <p className="text-xs font-medium text-red-700">
                            {callErrors.clientEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Brief Call Notes */}
                    <div className="space-y-2">
                      <label
                        htmlFor="call-notes"
                        className="block text-sm font-semibold text-[#111111]"
                      >
                        What would you like to discuss? (Optional)
                      </label>
                      <textarea
                        id="call-notes"
                        rows={3}
                        maxLength={2000}
                        value={callForm.notes}
                        onChange={(e) =>
                          setCallForm((p) => ({...p, notes: e.target.value}))
                        }
                        placeholder="Share a quick summary of your website, design, or AI automation goals..."
                        className="w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] resize-y"
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button
                        type="submit"
                        disabled={isBookingCall}
                        className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] disabled:opacity-60 text-[#111111] text-base font-semibold px-7 py-3.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {isBookingCall ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            <span>Booking Call...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm {callForm.channel}</span>
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </>
                        )}
                      </button>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <a
                          href={formatPhoneHref(studioPhone)}
                          className="text-[#111111] hover:underline inline-flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Call {studioPhone} now</span>
                        </a>
                        <span className="text-[#52524E]" aria-hidden="true">
                          ·
                        </span>
                        <a
                          href={formatWhatsAppUrl(studioWhatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#111111] hover:underline inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </form>
                )
              ) : receipt ? (
                <div className="space-y-6 py-4" role="status" aria-live="polite">
                  <div className="w-12 h-12 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-xs font-medium text-[#52524E] tabular-nums">
                      Reference {receipt.referenceId}
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111111]">
                      Thank you, {receipt.summary.name}. Your inquiry has been received.
                    </h2>
                    <p className="text-base text-[#52524E] leading-relaxed">
                      {receipt.delivery.status === 'sent' ? (
                        <>
                          Your <strong className="text-[#111111]">{receipt.summary.service}</strong> inquiry has been delivered to{' '}
                          <strong className="text-[#111111]">{receipt.delivery.recipientEmail}</strong> and logged for{' '}
                          <strong className="text-[#111111]">{receipt.summary.email}</strong>.
                        </>
                      ) : receipt.delivery.status === 'pending_activation' ? (
                        <>
                          Your <strong className="text-[#111111]">{receipt.summary.service}</strong> inquiry has been saved, and an automatic activation email was sent to{' '}
                          <strong className="text-[#111111]">{receipt.delivery.recipientEmail}</strong>. Confirm that link once to receive all future form submissions straight in Gmail.
                        </>
                      ) : (
                        <>
                          We have logged your <strong className="text-[#111111]">{receipt.summary.service}</strong> inquiry for{' '}
                          <strong className="text-[#111111]">{receipt.summary.email}</strong> and routed it to the studio inbox.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="bg-[#EDEDEB] rounded-2xl p-5 text-xs text-[#52524E] space-y-1.5">
                    <p>
                      <span className="font-semibold text-[#111111]">Service Selected:</span>{' '}
                      {receipt.summary.service}
                    </p>
                    <p>
                      <span className="font-semibold text-[#111111]">Studio Inbox:</span>{' '}
                      {receipt.delivery.recipientEmail}
                    </p>
                    <p>
                      <span className="font-semibold text-[#111111]">Email Routing Status:</span>{' '}
                      {receipt.delivery.status === 'sent'
                        ? 'Delivered to Gmail'
                        : receipt.delivery.status === 'pending_activation'
                          ? 'Awaiting one-time inbox activation'
                          : 'Saved to Admin Inquiries Inbox'}
                    </p>
                    <p>
                      <span className="font-semibold text-[#111111]">Received At:</span>{' '}
                      {new Date(receipt.receivedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-3">
                    <a
                      href={formatWhatsAppUrl(
                        studioWhatsapp,
                        `Hello IdeaCircuit, I just submitted inquiry ${receipt.referenceId} regarding ${receipt.summary.service}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Continue on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setMode('call')}
                      className="inline-flex items-center justify-center gap-2 bg-white border border-black/15 hover:bg-[#EDEDEB] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" aria-hidden="true" />
                      <span>Book a Call Too</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="inline-flex items-center justify-center bg-[#111111] hover:bg-[#2A2A27] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl font-bold text-[#111111]">
                      Project Inquiry Form
                    </h2>
                    <p className="text-sm text-[#52524E]">
                      All fields are required so we can understand your request properly.
                    </p>
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm"
                    >
                      <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="contact-name" className="block text-sm font-semibold text-[#111111]">
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={form.name}
                        onChange={(e) => {
                          setForm((prev) => ({...prev, name: e.target.value}));
                          if (errors.name) setErrors((prev) => ({...prev, name: undefined}));
                        }}
                        placeholder="Alex Morgan"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                        className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] transition-colors ${
                          errors.name ? 'border-red-600' : 'border-black/15'
                        }`}
                      />
                      {errors.name && (
                        <p id="contact-name-error" className="text-xs font-medium text-red-700">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-email" className="block text-sm font-semibold text-[#111111]">
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(e) => {
                          setForm((prev) => ({...prev, email: e.target.value}));
                          if (errors.email) setErrors((prev) => ({...prev, email: undefined}));
                        }}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                        className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] transition-colors ${
                          errors.email ? 'border-red-600' : 'border-black/15'
                        }`}
                      />
                      {errors.email && (
                        <p id="contact-email-error" className="text-xs font-medium text-red-700">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contact-service" className="block text-sm font-semibold text-[#111111]">
                      Service Needed
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SERVICE_OPTIONS.map((option) => {
                        const isSelected = form.service === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({...prev, service: option}));
                              if (errors.service) setErrors((prev) => ({...prev, service: undefined}));
                            }}
                            aria-pressed={isSelected}
                            className={`px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-[#111111] text-white border-[#111111]'
                                : 'bg-[#EDEDEB]/60 text-[#111111] border-black/15 hover:bg-[#E3E3DF]'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {errors.service && (
                      <p className="text-xs font-medium text-red-700">{errors.service}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="contact-message" className="block text-sm font-semibold text-[#111111]">
                        Project Details
                      </label>
                      <span className="text-xs text-[#52524E] font-mono tabular-nums">
                        {form.message.trim().length} chars
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => {
                        setForm((prev) => ({...prev, message: e.target.value}));
                        if (errors.message) setErrors((prev) => ({...prev, message: undefined}));
                      }}
                      placeholder="Share a brief overview of your business, what you would like to create or automate, and any helpful timeline context..."
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      className={`w-full px-4 py-3 rounded-xl bg-[#EDEDEB]/70 border text-sm text-[#111111] placeholder:text-[#52524E]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] transition-colors resize-y ${
                        errors.message ? 'border-red-600' : 'border-black/15'
                      }`}
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="text-xs font-medium text-red-700">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] disabled:opacity-60 text-[#111111] text-base font-semibold px-7 py-3.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Project Inquiry</span>
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                    <p className="text-xs text-[#52524E]">
                      Or{' '}
                      <button
                        type="button"
                        onClick={() => setMode('call')}
                        className="font-semibold text-[#111111] underline underline-offset-4 hover:text-[#52524E] cursor-pointer"
                      >
                        book a Phone / WhatsApp call
                      </button>{' '}
                      on <span className="font-mono font-semibold">{studioPhone}</span>.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
