import {useEffect, useState, type ChangeEvent, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Copy,
  Edit3,
  FileText,
  FolderPlus,
  Image as ImageIcon,
  Inbox,
  LayoutTemplate,
  Lightbulb,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {IdeaCircuitMark} from '../components/Layout';
import {StudioImage} from '../components/StudioImage';
import {
  useStudio,
  type PortfolioInput,
  type TestimonialInput,
} from '../context/StudioContext';
import {
  DEFAULT_SITE_SETTINGS,
  formatPhoneHref,
  formatWhatsAppUrl,
  type CallBookingItem,
  type InquiryItem,
  type PortfolioProject,
  type ServiceCategory,
  type SiteSettingsData,
  type TestimonialItem,
} from '../data/studioData';
import {uploadImageFile} from '../lib/firebase';

type AdminTab = 'website' | 'portfolio' | 'testimonials' | 'inquiries' | 'calls' | 'suggestions';

type ReplyTone = 'Warm & Consultative' | 'Concise & Direct' | 'Proposal & Next Steps';

interface AiComposerTarget {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  originalMessage: string;
}

interface InquiryRecord {
  referenceId: string;
  name: string;
  email: string;
  service: string;
  message: string;
  recipientEmail?: string;
  deliveryStatus?: InquiryItem['deliveryStatus'];
  deliveryChannel?: InquiryItem['deliveryChannel'];
  receivedAt: string;
}

interface ServerCallBookingRecord {
  referenceId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  channel: CallBookingItem['channel'];
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
  studioLine?: string;
  deliveryStatus?: CallBookingItem['deliveryStatus'];
  status?: CallBookingItem['status'];
  receivedAt: string;
}

interface MailIntegrationStatus {
  recipientEmail: string;
  gmailUser: string;
  smtpConfigured: boolean;
  provider: 'gmail_smtp' | 'formsubmit';
}

const EMPTY_PORTFOLIO_FORM: PortfolioInput = {
  title: '',
  category: 'Website Design',
  projectType: 'Client Project',
  year: '2026',
  imageUrl: '',
  imageAlt: '',
  shortDescription: '',
  overview: '',
  creativeApproach: '',
  deliverables: ['Responsive Website Design', 'Custom Visual System'],
  outcomeFocus: '',
  liveUrl: '',
  featured: true,
};

const EMPTY_TESTIMONIAL_FORM: TestimonialInput = {
  clientName: '',
  role: '',
  company: '',
  serviceCategory: 'Website Design',
  quote: '',
  avatarUrl: '',
  featured: true,
};

export function AdminPage() {
  const {
    user,
    authReady,
    isAdmin,
    siteSettings,
    allProjects,
    testimonials,
    inquiries: firestoreInquiries,
    suggestions,
    callBookings: firestoreCallBookings,
    signInAdmin,
    signOutAdmin,
    saveSiteSettings,
    createPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    deleteInquiry,
    markSuggestionStatus,
    deleteSuggestion,
    updateCallBookingStatus,
    deleteCallBooking,
  } = useStudio();

  const [activeTab, setActiveTab] = useState<AdminTab>('website');
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Website & Hero Manager state
  const [settingsDraft, setSettingsDraft] = useState<SiteSettingsData>(siteSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Portfolio Manager state
  const [portfolioForm, setPortfolioForm] = useState<PortfolioInput>(EMPTY_PORTFOLIO_FORM);
  const [deliverablesText, setDeliverablesText] = useState(
    EMPTY_PORTFOLIO_FORM.deliverables.join('\n')
  );
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [uploadingPortfolioImg, setUploadingPortfolioImg] = useState(false);
  const [portfolioMsg, setPortfolioMsg] = useState<string | null>(null);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Testimonials Manager state
  const [testimonialForm, setTestimonialForm] =
    useState<TestimonialInput>(EMPTY_TESTIMONIAL_FORM);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [testimonialMsg, setTestimonialMsg] = useState<string | null>(null);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);

  // Inquiries, Call Bookings & AI Reply Composer state
  const [serverInquiries, setServerInquiries] = useState<InquiryRecord[]>([]);
  const [serverBookings, setServerBookings] = useState<ServerCallBookingRecord[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [mailStatus, setMailStatus] = useState<MailIntegrationStatus | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [replyTarget, setReplyTarget] = useState<AiComposerTarget | null>(null);
  const [replyTone, setReplyTone] = useState<ReplyTone>('Warm & Consultative');
  const [ownerNotes, setOwnerNotes] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [generatingReply, setGeneratingReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyNotice, setReplyNotice] = useState<string | null>(null);

  useEffect(() => {
    setSettingsDraft(siteSettings);
  }, [siteSettings]);

  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const [inqRes, bookingsRes, statusRes, aiRes] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/book-call'),
        fetch('/api/contact/status'),
        fetch('/api/ai/status'),
      ]);
      const inqData = await inqRes.json();
      if (inqRes.ok && inqData.ok && Array.isArray(inqData.inquiries)) {
        setServerInquiries(inqData.inquiries);
      }
      const bookingsData = await bookingsRes.json();
      if (bookingsRes.ok && bookingsData.ok && Array.isArray(bookingsData.bookings)) {
        setServerBookings(bookingsData.bookings);
      }
      const statusData = await statusRes.json();
      if (statusRes.ok && statusData.ok) {
        setMailStatus({
          recipientEmail: statusData.recipientEmail,
          gmailUser: statusData.gmailUser,
          smtpConfigured: Boolean(statusData.smtpConfigured),
          provider: statusData.provider === 'gmail_smtp' ? 'gmail_smtp' : 'formsubmit',
        });
      }
      const aiData = await aiRes.json();
      if (aiRes.ok && aiData.ok) {
        setAiConfigured(Boolean(aiData.aiConfigured));
      }
    } catch {
      // Ignore transient network errors
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (
      isAdmin &&
      (activeTab === 'inquiries' || activeTab === 'calls' || activeTab === 'suggestions')
    ) {
      void fetchInquiries();
    }
  }, [isAdmin, activeTab]);

  const openAiComposer = (target: AiComposerTarget) => {
    setReplyTarget(target);
    setOwnerNotes('');
    setDraftSubject(`Re: Your IdeaCircuit ${target.service} Inquiry`);
    setDraftBody('');
    setReplyError(null);
    setReplyNotice(null);
  };

  const handleGenerateAiReply = async () => {
    if (!replyTarget) return;
    setGeneratingReply(true);
    setReplyError(null);
    setReplyNotice(null);
    try {
      const response = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          clientName: replyTarget.clientName,
          clientEmail: replyTarget.clientEmail,
          service: replyTarget.service,
          originalMessage: replyTarget.originalMessage,
          tone: replyTone,
          ownerNotes: ownerNotes.trim(),
          studioEmail: siteSettings.contactEmail,
          whatsappNumber: siteSettings.whatsappNumber,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setReplyError(data.error || 'Failed to generate AI reply.');
        return;
      }
      setDraftSubject(data.subject);
      setDraftBody(data.replyBody);
      setReplyNotice('AI draft ready. Review or edit below before sending.');
    } catch {
      setReplyError('Network error while contacting the AI Reply Assistant.');
    } finally {
      setGeneratingReply(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!draftBody.trim()) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${draftSubject}\n\n${draftBody}`);
      setReplyNotice('Reply copied to clipboard.');
    } catch {
      setReplyError('Could not copy automatically. Please select and copy the text manually.');
    }
  };

  const handleSendViaSmtp = async () => {
    if (!replyTarget || !replyTarget.clientEmail) return;
    setSendingReply(true);
    setReplyError(null);
    setReplyNotice(null);
    try {
      const response = await fetch('/api/admin/send-reply', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          toEmail: replyTarget.clientEmail,
          subject: draftSubject.trim(),
          replyBody: draftBody.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setReplyError(data.error || 'Could not send directly via Gmail SMTP.');
        return;
      }
      setReplyNotice(data.message || `Email reply sent to ${replyTarget.clientEmail}.`);
    } catch {
      setReplyError('Network error while sending reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Merge Firestore persistent inquiries and in-memory server session inquiries without duplicates
  const mergedInquiries: InquiryItem[] = (() => {
    const byRef = new Map<string, InquiryItem>();
    for (const item of firestoreInquiries) {
      byRef.set(item.referenceId, item);
    }
    for (const srv of serverInquiries) {
      if (!byRef.has(srv.referenceId)) {
        byRef.set(srv.referenceId, {
          id: srv.referenceId,
          referenceId: srv.referenceId,
          name: srv.name,
          email: srv.email,
          service: (srv.service as InquiryItem['service']) || 'Website Design',
          message: srv.message,
          recipientEmail: srv.recipientEmail || siteSettings.contactEmail,
          deliveryStatus: srv.deliveryStatus || 'inbox_only',
          deliveryChannel: srv.deliveryChannel || 'inbox',
          receivedAt: srv.receivedAt,
          fromFirestore: false,
        });
      }
    }
    return Array.from(byRef.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  })();

  const mergedBookings: CallBookingItem[] = (() => {
    const byRef = new Map<string, CallBookingItem>();
    for (const item of firestoreCallBookings) {
      byRef.set(item.referenceId, item);
    }
    for (const srv of serverBookings) {
      if (!byRef.has(srv.referenceId)) {
        byRef.set(srv.referenceId, {
          id: srv.referenceId,
          referenceId: srv.referenceId,
          clientName: srv.clientName,
          clientPhone: srv.clientPhone,
          clientEmail: srv.clientEmail || '',
          channel: srv.channel === 'WhatsApp Call' ? 'WhatsApp Call' : 'Phone Call',
          service: (srv.service as CallBookingItem['service']) || 'Website Design',
          preferredDate: srv.preferredDate,
          preferredTime: srv.preferredTime,
          notes: srv.notes || '',
          studioLine: srv.studioLine || siteSettings.phoneNumber,
          deliveryStatus: srv.deliveryStatus || 'inbox_only',
          status: srv.status || 'pending',
          createdAt: srv.receivedAt,
          fromFirestore: false,
        });
      }
    }
    return Array.from(byRef.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  })();

  const handleSignIn = async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInAdmin();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleHeroImageUpload = async (
    field:
      | 'heroScreenshotUrl'
      | 'heroWebImage'
      | 'heroGraphicImage'
      | 'heroAutomationImage',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(field);
    setSettingsError(null);
    try {
      const url = await uploadImageFile(file);
      setSettingsDraft((prev) => ({
        ...prev,
        [field]: url,
        ...(field === 'heroScreenshotUrl' ? {heroDisplayMode: 'screenshot'} : {}),
      }));
      setSettingsSavedMsg('Image uploaded. Click "Save Website Changes" to publish.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSavedMsg(null);

    if (settingsDraft.heroLabel.trim().length < 2) {
      setSettingsError('Hero Intro Label must be at least 2 characters.');
      return;
    }
    if (settingsDraft.heroHeadline.trim().length < 5) {
      setSettingsError('Hero Headline must be at least 5 characters.');
      return;
    }
    if (settingsDraft.heroSubtitle.trim().length < 10) {
      setSettingsError('Hero Supporting Subtitle must be at least 10 characters.');
      return;
    }
    if (settingsDraft.introHeadline.trim().length < 5) {
      setSettingsError('Homepage Studio Intro Headline must be at least 5 characters.');
      return;
    }
    if (settingsDraft.introLead.trim().length < 10 || settingsDraft.introBody.trim().length < 10) {
      setSettingsError('Homepage Intro paragraphs must each be at least 10 characters.');
      return;
    }
    if (settingsDraft.aboutHeadline.trim().length < 5 || settingsDraft.aboutSubtitle.trim().length < 10) {
      setSettingsError('About headline (5+ chars) and subtitle (10+ chars) are required.');
      return;
    }
    if (settingsDraft.ctaHeadline.trim().length < 5 || settingsDraft.footerTagline.trim().length < 10) {
      setSettingsError('CTA headline (5+ chars) and Footer tagline (10+ chars) are required.');
      return;
    }
    if (
      settingsDraft.contactEmail.trim().length < 5 ||
      !settingsDraft.contactEmail.includes('@')
    ) {
      setSettingsError('Please enter a valid contact email address.');
      return;
    }
    if (settingsDraft.whatsappNumber.trim().length < 7) {
      setSettingsError('Please enter a valid WhatsApp phone number (at least 7 digits).');
      return;
    }
    if (settingsDraft.phoneNumber.trim().length < 7) {
      setSettingsError('Please enter a valid Studio Phone Call number (at least 7 digits).');
      return;
    }

    setSavingSettings(true);
    try {
      await saveSiteSettings(settingsDraft);
      setSettingsSavedMsg('Website content and hero configuration published live.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePortfolioImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortfolioImg(true);
    setPortfolioError(null);
    try {
      const url = await uploadImageFile(file);
      setPortfolioForm((prev) => ({
        ...prev,
        imageUrl: url,
        imageAlt: prev.imageAlt || prev.title || file.name.replace(/\.[^.]+$/, ''),
      }));
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingPortfolioImg(false);
      e.target.value = '';
    }
  };

  const handlePortfolioSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPortfolioError(null);
    setPortfolioMsg(null);

    if (portfolioForm.title.trim().length < 2) {
      setPortfolioError('Please enter a project title (at least 2 characters).');
      return;
    }
    if (!portfolioForm.imageUrl.trim()) {
      setPortfolioError('Please upload a project image or paste an image URL.');
      return;
    }
    if (portfolioForm.year.trim().length < 4) {
      setPortfolioError('Please enter a 4-digit year (e.g. 2026).');
      return;
    }
    if (portfolioForm.shortDescription.trim().length < 10) {
      setPortfolioError('Please enter a short description (at least 10 characters).');
      return;
    }
    if (portfolioForm.overview.trim().length < 10) {
      setPortfolioError('Please enter a project overview (at least 10 characters).');
      return;
    }

    const parsedDeliverables = deliverablesText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload: PortfolioInput = {
      ...portfolioForm,
      imageAlt: portfolioForm.imageAlt.trim() || portfolioForm.title.trim(),
      creativeApproach:
        portfolioForm.creativeApproach.trim().length >= 10
          ? portfolioForm.creativeApproach.trim()
          : portfolioForm.overview.trim(),
      outcomeFocus:
        portfolioForm.outcomeFocus.trim().length >= 5
          ? portfolioForm.outcomeFocus.trim()
          : `Designed and delivered for ${portfolioForm.category}.`,
      deliverables:
        parsedDeliverables.length > 0 ? parsedDeliverables : ['Custom Studio Deliverable'],
    };

    setSavingPortfolio(true);
    try {
      if (editingProjectId) {
        await updatePortfolioProject(editingProjectId, payload);
        setPortfolioMsg('Portfolio project updated and synced live.');
      } else {
        await createPortfolioProject(payload);
        setPortfolioMsg('Portfolio project uploaded and now live on the website.');
      }
      setPortfolioForm(EMPTY_PORTFOLIO_FORM);
      setDeliverablesText(EMPTY_PORTFOLIO_FORM.deliverables.join('\n'));
      setEditingProjectId(null);
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : 'Could not save portfolio item.');
    } finally {
      setSavingPortfolio(false);
    }
  };

  const startEditProject = (project: PortfolioProject) => {
    setEditingProjectId(project.id);
    setPortfolioForm({
      title: project.title,
      category: project.category,
      projectType: project.projectType,
      year: project.year,
      imageUrl: project.image,
      imageAlt: project.imageAlt,
      shortDescription: project.shortDescription,
      overview: project.overview,
      creativeApproach: project.creativeApproach,
      deliverables: project.deliverables,
      outcomeFocus: project.outcomeFocus,
      liveUrl: project.liveUrl ?? '',
      featured: Boolean(project.featured),
    });
    setDeliverablesText(project.deliverables.join('\n'));
    setPortfolioMsg(null);
    setPortfolioError(null);
  };

  const handleDeleteProject = async (id: string) => {
    setPortfolioError(null);
    setPortfolioMsg(null);
    try {
      await deletePortfolioProject(id);
      if (editingProjectId === id) {
        setEditingProjectId(null);
        setPortfolioForm(EMPTY_PORTFOLIO_FORM);
      }
      setPortfolioMsg('Portfolio project removed.');
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setTestimonialError(null);
    try {
      const url = await uploadImageFile(file);
      setTestimonialForm((prev) => ({...prev, avatarUrl: url}));
    } catch (err) {
      setTestimonialError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleTestimonialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTestimonialError(null);
    setTestimonialMsg(null);

    if (testimonialForm.clientName.trim().length < 2) {
      setTestimonialError('Please enter the client name (at least 2 characters).');
      return;
    }
    if (testimonialForm.role.trim().length < 2) {
      setTestimonialError('Please enter the client role or title.');
      return;
    }
    if (testimonialForm.company.trim().length < 1) {
      setTestimonialError('Please enter the company or brand name.');
      return;
    }
    if (testimonialForm.quote.trim().length < 10) {
      setTestimonialError('Please enter the testimonial quote (at least 10 characters).');
      return;
    }

    setSavingTestimonial(true);
    try {
      if (editingTestimonialId) {
        await updateTestimonial(editingTestimonialId, testimonialForm);
        setTestimonialMsg('Testimonial updated and synced live.');
      } else {
        await createTestimonial(testimonialForm);
        setTestimonialMsg('Testimonial uploaded and automatically published on the website.');
      }
      setTestimonialForm(EMPTY_TESTIMONIAL_FORM);
      setEditingTestimonialId(null);
    } catch (err) {
      setTestimonialError(err instanceof Error ? err.message : 'Could not save testimonial.');
    } finally {
      setSavingTestimonial(false);
    }
  };

  const startEditTestimonial = (item: TestimonialItem) => {
    setEditingTestimonialId(item.id);
    setTestimonialForm({
      clientName: item.clientName,
      role: item.role,
      company: item.company,
      serviceCategory: item.serviceCategory,
      quote: item.quote,
      avatarUrl: item.avatarUrl,
      featured: item.featured,
    });
    setTestimonialMsg(null);
    setTestimonialError(null);
  };

  const handleDeleteTestimonial = async (id: string) => {
    setTestimonialError(null);
    setTestimonialMsg(null);
    try {
      await deleteTestimonial(id);
      if (editingTestimonialId === id) {
        setEditingTestimonialId(null);
        setTestimonialForm(EMPTY_TESTIMONIAL_FORM);
      }
      setTestimonialMsg('Testimonial removed from the website.');
    } catch (err) {
      setTestimonialError(err instanceof Error ? err.message : 'Failed to delete testimonial.');
    }
  };

  // Auth loading state
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#EDEDEB] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-[#52524E]">
          <Loader2 className="w-5 h-5 animate-spin text-[#111111]" aria-hidden="true" />
          <span>Checking studio authentication...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated or non-admin screen
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#EDEDEB] text-[#111111] flex flex-col justify-between p-6">
        <header className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <IdeaCircuitMark className="w-7 h-7" />
            <span className="font-display text-lg font-bold tracking-tight">IdeaCircuit</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-[#52524E] hover:text-[#111111] transition-colors"
          >
            Back to Website
          </Link>
        </header>

        <main className="max-w-md w-full mx-auto bg-white rounded-3xl border border-black/10 p-8 sm:p-10 space-y-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#52524E]">IdeaCircuit Studio CMS</p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[#111111]">
              Admin Dashboard Sign-In
            </h1>
            <p className="text-sm text-[#52524E] leading-relaxed">
              Sign in with your authorized studio Google account to manage website copy, upload hero screenshots, publish portfolio case studies, and add client testimonials.
            </p>
          </div>

          {user && !isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">Account does not have admin access</p>
                <p>
                  Signed in as <strong>{user.email}</strong>. Please sign out and sign in with the studio administrator account.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            {!user ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3.5 rounded-full transition-colors cursor-pointer"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in with Google</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signOutAdmin()}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#2A2A27] text-white text-sm font-semibold px-6 py-3.5 rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sign Out & Switch Account</span>
              </button>
            )}
          </div>
        </main>

        <footer className="max-w-5xl w-full mx-auto text-center text-xs text-[#52524E]">
          Protected by Firebase Authentication & Firestore Security Rules
        </footer>
      </div>
    );
  }

  const navItems: {id: AdminTab; label: string; icon: typeof LayoutTemplate; count?: number}[] = [
    {id: 'website', label: 'Website & Hero', icon: LayoutTemplate},
    {id: 'portfolio', label: 'Portfolio Upload', icon: FolderPlus, count: allProjects.length},
    {
      id: 'testimonials',
      label: 'Testimonials',
      icon: MessageSquareQuote,
      count: testimonials.length,
    },
    {id: 'inquiries', label: 'Inquiries Inbox', icon: Inbox, count: mergedInquiries.length || undefined},
    {id: 'calls', label: 'Booked Calls', icon: PhoneCall, count: mergedBookings.length || undefined},
    {id: 'suggestions', label: 'Suggestion Box', icon: Lightbulb, count: suggestions.length || undefined},
  ];

  const activeNavLabel = navItems.find((i) => i.id === activeTab)?.label ?? 'Website & Hero';

  return (
    <div className="min-h-screen bg-[#EDEDEB] text-[#111111] flex flex-col lg:flex-row">
      {/* Left Workspace Sidebar */}
      <aside className="lg:w-64 bg-[#111111] text-white shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between lg:block">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <IdeaCircuitMark className="w-7 h-7" />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                IdeaCircuit
              </span>
            </Link>
            <p className="hidden lg:block text-xs text-neutral-400 mt-2">
              Studio Admin Console
            </p>
          </div>

          <nav aria-label="Admin Navigation" className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#B9F53A] text-[#111111] font-semibold'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        isActive ? 'text-[#111111]' : 'text-neutral-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-5 border-t border-white/10 space-y-3">
          <div className="text-xs text-neutral-400 truncate">
            Signed in: <span className="text-white font-medium">{user.email}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              <span>View Live Website</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => void signOutAdmin()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar */}
        <header className="bg-white border-b border-black/10 px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#52524E]">Admin</span>
            <span className="text-[#52524E]" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-[#111111]">{activeNavLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-[#52524E] font-mono tabular-nums">
              {allProjects.length} uploaded projects · {testimonials.length} testimonials
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              <span>Open Live Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="p-5 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-8">
          {/* TAB 1: WEBSITE & HERO MANAGER */}
          {activeTab === 'website' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    Manage Website & Hero Section
                  </h1>
                  <p className="text-sm text-[#52524E]">
                    Preview the live Hero section screenshot, swap hero imagery, and update copy across Home, About, and Footer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsDraft(DEFAULT_SITE_SETTINGS)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52524E] hover:text-[#111111] px-3 py-2 rounded-lg border border-black/15 bg-white cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset Draft to Defaults</span>
                </button>
              </div>

              {/* LIVE HERO SECTION SCREENSHOT / PREVIEW PANEL */}
              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Hero Section Live Visual Preview & Screenshot
                    </h2>
                    <p className="text-xs text-[#52524E]">
                      Shows how the top Hero section of your website currently renders to visitors.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 p-1 bg-[#EDEDEB] rounded-lg">
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsDraft((prev) => ({...prev, heroDisplayMode: 'collage'}))
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        settingsDraft.heroDisplayMode === 'collage'
                          ? 'bg-white text-[#111111] shadow-xs'
                          : 'text-[#52524E] hover:text-[#111111]'
                      }`}
                    >
                      3-Service Collage
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettingsDraft((prev) => ({...prev, heroDisplayMode: 'screenshot'}))
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        settingsDraft.heroDisplayMode === 'screenshot'
                          ? 'bg-white text-[#111111] shadow-xs'
                          : 'text-[#52524E] hover:text-[#111111]'
                      }`}
                    >
                      Hero Screenshot Mode
                    </button>
                  </div>
                </div>

                {/* Live Scaled Hero Frame */}
                <div className="p-6 sm:p-8 bg-[#EDEDEB]">
                  <div className="bg-[#EDEDEB] rounded-2xl border border-black/15 p-5 sm:p-8 shadow-xs">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      <div className="lg:col-span-6 space-y-3">
                        <p className="text-[11px] font-medium text-[#52524E]">
                          {settingsDraft.heroLabel}
                        </p>
                        <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] leading-tight">
                          {settingsDraft.heroHeadline}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#52524E] leading-relaxed">
                          {settingsDraft.heroSubtitle}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="bg-[#B9F53A] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full">
                            {settingsDraft.heroPrimaryCta}
                          </span>
                          <span className="bg-white border border-black/15 text-[#111111] text-xs font-semibold px-4 py-2 rounded-full">
                            {settingsDraft.heroSecondaryCta}
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-6">
                        {settingsDraft.heroDisplayMode === 'screenshot' &&
                        settingsDraft.heroScreenshotUrl ? (
                          <div className="bg-white rounded-2xl border border-black/10 p-2">
                            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#E3E3DF]">
                              <StudioImage
                                src={settingsDraft.heroScreenshotUrl}
                                alt="Uploaded Hero Section Screenshot"
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-12 gap-2.5">
                            <div className="col-span-7 bg-white rounded-xl border border-black/10 p-1.5">
                              <div className="aspect-[4/3] rounded-lg overflow-hidden">
                                <StudioImage
                                  src={settingsDraft.heroWebImage}
                                  alt="Hero Website Design preview"
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full"
                                />
                              </div>
                            </div>
                            <div className="col-span-5 bg-white rounded-xl border border-black/10 p-1.5">
                              <div className="aspect-[3/4] rounded-lg overflow-hidden">
                                <StudioImage
                                  src={settingsDraft.heroGraphicImage}
                                  alt="Hero Graphic Design preview"
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full"
                                />
                              </div>
                            </div>
                            <div className="col-span-12 bg-[#111111] rounded-xl p-2 flex items-center gap-3">
                              <div className="w-24 aspect-[4/3] rounded-lg overflow-hidden shrink-0">
                                <StudioImage
                                  src={settingsDraft.heroAutomationImage}
                                  alt="Hero AI Automation preview"
                                  className="w-full h-full object-cover"
                                  containerClassName="w-full h-full"
                                />
                              </div>
                              <p className="text-[11px] text-neutral-300 leading-snug">
                                <span className="text-[#B9F53A] block font-medium">
                                  AI Automation
                                </span>
                                Connected intake, routing, and business operations.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE PORTFOLIO OVERVIEW PANEL ON DASHBOARD */}
              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Published Portfolio Projects ({allProjects.length})
                    </h2>
                    <p className="text-xs text-[#52524E]">
                      Live hero screenshots and client projects published on your Portfolio and Homepage Selected Work.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    className="inline-flex items-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Manage &amp; Upload Portfolio</span>
                  </button>
                </div>

                {allProjects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#52524E]">
                    No portfolio projects published yet. Click &ldquo;Manage &amp; Upload Portfolio&rdquo; to add one.
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {allProjects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-xl border border-black/10 bg-[#EDEDEB]/45 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          <div className="aspect-[16/10] bg-[#E3E3DF] overflow-hidden">
                            <StudioImage
                              src={project.image}
                              alt={project.imageAlt}
                              fallbackTitle={project.title}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                            />
                          </div>
                          <div className="p-4 space-y-1.5">
                            <p className="text-[11px] font-medium text-[#52524E]">
                              {project.category} · {project.projectType} · {project.year}
                            </p>
                            <h3 className="font-display text-sm font-bold text-[#111111] line-clamp-1">
                              {project.title}
                            </h3>
                            <p className="text-xs text-[#52524E] line-clamp-2 leading-relaxed">
                              {project.shortDescription}
                            </p>
                          </div>
                        </div>
                        <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-black/5">
                          <div className="flex items-center gap-2">
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#B9F53A]/50 hover:bg-[#B9F53A] text-[11px] font-semibold text-[#111111]"
                              >
                                <span>Visit</span>
                                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                startEditProject(project);
                                setActiveTab('portfolio');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-black/15 hover:bg-[#EDEDEB] text-[11px] font-semibold text-[#111111] cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                          </div>
                          {project.featured && (
                            <span className="text-[11px] font-medium text-[#52524E]">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Website & Hero Form */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-8"
              >
                {settingsSavedMsg && (
                  <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-sm font-medium text-[#111111]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{settingsSavedMsg}</span>
                  </div>
                )}
                {settingsError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
                    {settingsError}
                  </div>
                )}

                {/* Hero Copy & Screenshot Upload */}
                <div className="space-y-5">
                  <h3 className="font-display text-lg font-bold border-b border-black/10 pb-2">
                    01. Hero Copy & Hero Screenshot Upload
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Hero Intro Label
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={120}
                        value={settingsDraft.heroLabel}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, heroLabel: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Hero Headline
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={180}
                        value={settingsDraft.heroHeadline}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, heroHeadline: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Hero Supporting Subtitle
                    </label>
                    <textarea
                      rows={2}
                      required
                      maxLength={500}
                      value={settingsDraft.heroSubtitle}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({...p, heroSubtitle: e.target.value}))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Primary CTA Label
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={40}
                        value={settingsDraft.heroPrimaryCta}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, heroPrimaryCta: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Secondary CTA Label
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={40}
                        value={settingsDraft.heroSecondaryCta}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, heroSecondaryCta: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Hero Screenshot Upload Box */}
                  <div className="bg-[#EDEDEB]/70 rounded-2xl border border-black/10 p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111111]">
                          Hero Section Screenshot Image
                        </p>
                        <p className="text-xs text-[#52524E]">
                          Upload a custom screenshot to showcase on the right side of the Hero section (or keep the 3-Service Collage).
                        </p>
                      </div>
                      <label className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#2A2A27] text-white text-xs font-semibold px-4 py-2.5 rounded-full cursor-pointer transition-colors">
                        {uploadingField === 'heroScreenshotUrl' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>Upload Hero Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleHeroImageUpload('heroScreenshotUrl', e)}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste Hero Screenshot URL (optional)"
                      value={settingsDraft.heroScreenshotUrl}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({...p, heroScreenshotUrl: e.target.value}))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  {/* Individual Hero Collage Image Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        field: 'heroWebImage' as const,
                        label: 'Hero: Website Design Card',
                        value: settingsDraft.heroWebImage,
                      },
                      {
                        field: 'heroGraphicImage' as const,
                        label: 'Hero: Graphic Design Card',
                        value: settingsDraft.heroGraphicImage,
                      },
                      {
                        field: 'heroAutomationImage' as const,
                        label: 'Hero: AI Automation Card',
                        value: settingsDraft.heroAutomationImage,
                      },
                    ].map((card) => (
                      <div
                        key={card.field}
                        className="rounded-xl border border-black/10 p-3.5 space-y-2.5 bg-[#EDEDEB]/40"
                      >
                        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-[#E3E3DF]">
                          <StudioImage
                            src={card.value}
                            alt={card.label}
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        </div>
                        <p className="text-xs font-semibold text-[#111111]">{card.label}</p>
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111] bg-white hover:bg-[#E3E3DF] border border-black/15 px-3 py-1.5 rounded-full cursor-pointer">
                          {uploadingField === card.field ? (
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <ImageIcon className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>Replace Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleHeroImageUpload(card.field, e)}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Homepage Intro, About & Footer Copy */}
                <div className="space-y-5 pt-4 border-t border-black/10">
                  <h3 className="font-display text-lg font-bold border-b border-black/10 pb-2">
                    02. Studio Introduction, About & Footer Copy
                  </h3>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Homepage Studio Intro Headline
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={settingsDraft.introHeadline}
                      onChange={(e) =>
                        setSettingsDraft((p) => ({...p, introHeadline: e.target.value}))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Homepage Intro Lead Paragraph
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={600}
                        value={settingsDraft.introLead}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, introLead: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Homepage Intro Supporting Body
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={1000}
                        value={settingsDraft.introBody}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, introBody: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        About Page Headline
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        value={settingsDraft.aboutHeadline}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, aboutHeadline: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        About Page Subtitle
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={600}
                        value={settingsDraft.aboutSubtitle}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, aboutSubtitle: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Final CTA Headline
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={200}
                        value={settingsDraft.ctaHeadline}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, ctaHeadline: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Footer Tagline
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={400}
                        value={settingsDraft.footerTagline}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, footerTagline: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Contact Gmail Address
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={160}
                        placeholder="yemipresh2010@gmail.com"
                        value={settingsDraft.contactEmail}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, contactEmail: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Phone Call Number
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        placeholder="08136290176"
                        value={settingsDraft.phoneNumber}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, phoneNumber: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={30}
                        placeholder="08136290176"
                        value={settingsDraft.whatsappNumber}
                        onChange={(e) =>
                          setSettingsDraft((p) => ({...p, whatsappNumber: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-[#52524E]">
                    Changes publish immediately across the live website upon saving.
                  </p>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors cursor-pointer"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>Save Website Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PORTFOLIO UPLOAD & MANAGER */}
          {activeTab === 'portfolio' && (
            <div className="space-y-8">
              <div className="space-y-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  Upload & Manage Portfolio Projects
                </h1>
                <p className="text-sm text-[#52524E]">
                  Any project uploaded here appears automatically on the Portfolio page and in Featured Explorations on the Homepage.
                </p>
              </div>

              <form
                onSubmit={handlePortfolioSubmit}
                className="bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
                  <h2 className="font-display text-lg font-bold">
                    {editingProjectId ? 'Edit Uploaded Project' : 'Add New Portfolio Project'}
                  </h2>
                  {editingProjectId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProjectId(null);
                        setPortfolioForm(EMPTY_PORTFOLIO_FORM);
                        setDeliverablesText(EMPTY_PORTFOLIO_FORM.deliverables.join('\n'));
                      }}
                      className="text-xs font-semibold text-[#52524E] hover:text-[#111111]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {portfolioMsg && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-sm font-medium text-[#111111]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{portfolioMsg}</span>
                  </div>
                )}
                {portfolioError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
                    {portfolioError}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Image Upload Panel */}
                  <div className="lg:col-span-5 space-y-3">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Project Cover Image
                    </label>
                    <div className="aspect-[16/10] rounded-2xl border border-dashed border-black/25 bg-[#EDEDEB]/60 overflow-hidden flex items-center justify-center">
                      {portfolioForm.imageUrl ? (
                        <StudioImage
                          src={portfolioForm.imageUrl}
                          alt={portfolioForm.imageAlt || 'Uploaded project preview'}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <ImageIcon className="w-8 h-8 mx-auto text-[#52524E]" aria-hidden="true" />
                          <p className="text-xs text-[#52524E]">
                            Upload a PNG, JPG, or WebP screenshot or paste an image URL below
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 bg-[#111111] hover:bg-[#2A2A27] text-white text-xs font-semibold px-4 py-2.5 rounded-full cursor-pointer transition-colors">
                        {uploadingPortfolioImg ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>{uploadingPortfolioImg ? 'Uploading...' : 'Upload Image File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handlePortfolioImageUpload}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste image URL (/uploads/... or https://...)"
                      value={portfolioForm.imageUrl}
                      onChange={(e) =>
                        setPortfolioForm((p) => ({...p, imageUrl: e.target.value}))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                    <input
                      type="text"
                      placeholder="Image alt description (for accessibility)"
                      value={portfolioForm.imageAlt}
                      onChange={(e) =>
                        setPortfolioForm((p) => ({...p, imageAlt: e.target.value}))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  {/* Metadata & Case Study Details */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Project Title
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={140}
                        placeholder="e.g. Luma Wellness — E-Commerce Storefront"
                        value={portfolioForm.title}
                        onChange={(e) =>
                          setPortfolioForm((p) => ({...p, title: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Service Category
                        </label>
                        <select
                          value={portfolioForm.category}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({
                              ...p,
                              category: e.target.value as ServiceCategory,
                            }))
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        >
                          <option value="Website Design">Website Design</option>
                          <option value="Graphic Design">Graphic Design</option>
                          <option value="AI Automation">AI Automation</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Project Label
                        </label>
                        <select
                          value={portfolioForm.projectType}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({
                              ...p,
                              projectType: e.target.value as PortfolioInput['projectType'],
                            }))
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        >
                          <option value="Client Project">Client Project</option>
                          <option value="Studio Concept">Studio Concept</option>
                          <option value="Design Exploration">Design Exploration</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Year
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={portfolioForm.year}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({...p, year: e.target.value}))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Short Card Description
                      </label>
                      <textarea
                        rows={2}
                        required
                        maxLength={400}
                        placeholder="Concise 1–2 sentence summary shown on portfolio cards..."
                        value={portfolioForm.shortDescription}
                        onChange={(e) =>
                          setPortfolioForm((p) => ({...p, shortDescription: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#111111]">
                        Full Project Overview (Modal Details)
                      </label>
                      <textarea
                        rows={3}
                        required
                        maxLength={2000}
                        placeholder="Describe the client goal, project scope, and solution..."
                        value={portfolioForm.overview}
                        onChange={(e) =>
                          setPortfolioForm((p) => ({...p, overview: e.target.value}))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Creative Approach
                        </label>
                        <textarea
                          rows={3}
                          maxLength={1500}
                          placeholder="How did IdeaCircuit approach the visual or technical solution?"
                          value={portfolioForm.creativeApproach}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({
                              ...p,
                              creativeApproach: e.target.value,
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Deliverables (one per line)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Responsive Website&#10;Brand Identity&#10;CRM Integration"
                          value={deliverablesText}
                          onChange={(e) => setDeliverablesText(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Outcome Focus
                        </label>
                        <input
                          type="text"
                          maxLength={400}
                          placeholder="e.g. Delivered a fast, mobile-first storefront ready for launch."
                          value={portfolioForm.outcomeFocus}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({...p, outcomeFocus: e.target.value}))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#111111]">
                          Live Website URL (Optional)
                        </label>
                        <input
                          type="url"
                          maxLength={2048}
                          placeholder="https://example.com"
                          value={portfolioForm.liveUrl ?? ''}
                          onChange={(e) =>
                            setPortfolioForm((p) => ({...p, liveUrl: e.target.value}))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                        />
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#111111] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={portfolioForm.featured}
                        onChange={(e) =>
                          setPortfolioForm((p) => ({...p, featured: e.target.checked}))
                        }
                        className="w-4 h-4 rounded accent-[#111111]"
                      />
                      <span>Feature in Homepage Selected Work</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPortfolio}
                    className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-7 py-3 rounded-full transition-colors cursor-pointer"
                  >
                    {savingPortfolio ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Saving Project...</span>
                      </>
                    ) : (
                      <span>
                        {editingProjectId ? 'Update Portfolio Project' : 'Publish Portfolio Project'}
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Uploaded Portfolio Items List */}
              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
                  <h2 className="font-display text-base font-bold">
                    Uploaded CMS Portfolio Projects ({allProjects.length})
                  </h2>
                  <Link
                    to="/portfolio"
                    className="text-xs font-semibold text-[#111111] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Portfolio Page</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {allProjects.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <FileText className="w-7 h-7 mx-auto text-[#52524E]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111111]">
                      No custom portfolio projects uploaded yet
                    </p>
                    <p className="text-xs text-[#52524E] max-w-md mx-auto">
                      Use the form above to upload your first project. Once published, it will automatically appear on the Portfolio page and in Featured Work on the Homepage for visitors to explore.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/10">
                    {allProjects.map((project) => (
                      <div
                        key={project.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#EDEDEB]/40 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-20 aspect-[16/10] rounded-lg overflow-hidden bg-[#E3E3DF] shrink-0">
                            <StudioImage
                              src={project.image}
                              alt={project.imageAlt}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-sm text-[#111111] truncate">
                              {project.title}
                            </p>
                            <p className="text-xs text-[#52524E]">
                              {project.category} · {project.projectType} · {project.year}
                              {project.featured ? ' · Featured on Home' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B9F53A]/40 hover:bg-[#B9F53A]/70 text-xs font-semibold text-[#111111]"
                            >
                              <span>Visit</span>
                              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditProject(project)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProject(project.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TESTIMONIALS MANAGER */}
          {activeTab === 'testimonials' && (
            <div className="space-y-8">
              <div className="space-y-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  Upload & Manage Testimonials
                </h1>
                <p className="text-sm text-[#52524E]">
                  Publish real client testimonials here. As soon as one is published, the Client Testimonials section appears automatically on your website.
                </p>
              </div>

              <form
                onSubmit={handleTestimonialSubmit}
                className="bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
                  <h2 className="font-display text-lg font-bold">
                    {editingTestimonialId ? 'Edit Testimonial' : 'Add Client Testimonial'}
                  </h2>
                  {editingTestimonialId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonialId(null);
                        setTestimonialForm(EMPTY_TESTIMONIAL_FORM);
                      }}
                      className="text-xs font-semibold text-[#52524E] hover:text-[#111111]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {testimonialMsg && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-sm font-medium text-[#111111]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{testimonialMsg}</span>
                  </div>
                )}
                {testimonialError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
                    {testimonialError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Client Full Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="e.g. Sarah Jenkins"
                      value={testimonialForm.clientName}
                      onChange={(e) =>
                        setTestimonialForm((p) => ({...p, clientName: e.target.value}))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Role / Title
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="e.g. Founder & Creative Director"
                      value={testimonialForm.role}
                      onChange={(e) =>
                        setTestimonialForm((p) => ({...p, role: e.target.value}))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      placeholder="e.g. Botanique Studio"
                      value={testimonialForm.company}
                      onChange={(e) =>
                        setTestimonialForm((p) => ({...p, company: e.target.value}))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#111111]">
                      Service Delivered
                    </label>
                    <select
                      value={testimonialForm.serviceCategory}
                      onChange={(e) =>
                        setTestimonialForm((p) => ({
                          ...p,
                          serviceCategory: e.target.value as TestimonialInput['serviceCategory'],
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    >
                      <option value="Website Design">Website Design</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="AI Automation">AI Automation</option>
                      <option value="Multi-Service Project">Multi-Service Project</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111111]">
                    Client Quote
                  </label>
                  <textarea
                    rows={4}
                    required
                    maxLength={1000}
                    placeholder="Share the client's feedback on the project and outcome..."
                    value={testimonialForm.quote}
                    onChange={(e) =>
                      setTestimonialForm((p) => ({...p, quote: e.target.value}))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDEDEB]/60 border border-black/15 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    {testimonialForm.avatarUrl ? (
                      <img
                        src={testimonialForm.avatarUrl}
                        alt="Client avatar preview"
                        className="w-11 h-11 rounded-full object-cover border border-black/15"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#EDEDEB] border border-black/10 flex items-center justify-center text-xs font-bold text-[#52524E]">
                        {testimonialForm.clientName
                          ? testimonialForm.clientName.slice(0, 2).toUpperCase()
                          : 'IC'}
                      </div>
                    )}
                    <label className="inline-flex items-center gap-1.5 bg-[#EDEDEB] hover:bg-[#E3E3DF] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors">
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>Upload Client Photo (Optional)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm font-medium text-[#111111] cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={testimonialForm.featured}
                      onChange={(e) =>
                        setTestimonialForm((p) => ({...p, featured: e.target.checked}))
                      }
                      className="w-4 h-4 rounded accent-[#111111]"
                    />
                    <span>Show on Homepage</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-black/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingTestimonial}
                    className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-7 py-3 rounded-full transition-colors cursor-pointer"
                  >
                    {savingTestimonial ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <span>
                        {editingTestimonialId ? 'Update Testimonial' : 'Publish Testimonial'}
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Published Testimonials List */}
              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between">
                  <h2 className="font-display text-base font-bold">
                    Published Testimonials ({testimonials.length})
                  </h2>
                </div>

                {testimonials.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <MessageSquareQuote
                      className="w-7 h-7 mx-auto text-[#52524E]"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-[#111111]">
                      No testimonials published yet
                    </p>
                    <p className="text-xs text-[#52524E] max-w-md mx-auto">
                      The testimonials section stays hidden on the public website until you upload your first verified client testimonial above.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/10">
                    {testimonials.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-[#EDEDEB]/40 transition-colors"
                      >
                        <div className="space-y-2 max-w-2xl">
                          <div className="flex items-center gap-2 text-xs text-[#52524E]">
                            <span className="font-semibold text-[#111111]">
                              {item.clientName}
                            </span>
                            <span>·</span>
                            <span>
                              {item.role}, {item.company}
                            </span>
                            <span>·</span>
                            <span>{item.serviceCategory}</span>
                          </div>
                          <p className="text-sm text-[#111111] leading-relaxed">
                            &ldquo;{item.quote}&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditTestimonial(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteTestimonial(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INQUIRIES INBOX */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    Project Inquiries Inbox
                  </h1>
                  <p className="text-sm text-[#52524E]">
                    Every Contact page submission is stored here and forwarded directly to{' '}
                    <span className="font-semibold text-[#111111]">
                      {siteSettings.contactEmail}
                    </span>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchInquiries()}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-[#E3E3DF] border border-black/15 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Refresh Inbox</span>
                </button>
              </div>

              {/* Gmail Delivery Integration Status Card */}
              <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-display text-base font-bold text-[#111111]">
                        Gmail Forwarding Integration Active
                      </h2>
                      <p className="text-xs text-[#52524E]">
                        Destination inbox:{' '}
                        <span className="font-mono font-semibold text-[#111111]">
                          {siteSettings.contactEmail}
                        </span>{' '}
                        · Method:{' '}
                        <span className="font-semibold text-[#111111]">
                          {mailStatus?.smtpConfigured
                            ? 'Direct Gmail SMTP (Nodemailer)'
                            : 'Automatic Web-to-Gmail Relay (FormSubmit)'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('website')}
                    className="text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#52524E] cursor-pointer"
                  >
                    Change Contact Email
                  </button>
                </div>
                <p className="text-xs text-[#52524E] leading-relaxed bg-[#EDEDEB]/70 rounded-xl p-3.5">
                  {mailStatus?.smtpConfigured ? (
                    <>
                      Direct Gmail SMTP is enabled using your configured{' '}
                      <code className="font-mono text-[#111111]">GMAIL_APP_PASSWORD</code> secret. Every inquiry is emailed straight to{' '}
                      <strong className="text-[#111111]">{siteSettings.contactEmail}</strong> with one-click reply to the client.
                    </>
                  ) : (
                    <>
                      Automatic forwarding is enabled for{' '}
                      <strong className="text-[#111111]">{siteSettings.contactEmail}</strong>. On the very first contact form test, check your Gmail inbox (and Spam folder) once to click the{' '}
                      <strong className="text-[#111111]">Activate Form</strong> confirmation link so all future inquiries land directly in your inbox. For direct SMTP sending without third-party relay, you can also set{' '}
                      <code className="font-mono text-[#111111]">GMAIL_APP_PASSWORD</code> in AI Studio Secrets.
                    </>
                  )}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                {loadingInquiries && mergedInquiries.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#52524E]">
                    Loading inquiries...
                  </div>
                ) : mergedInquiries.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Inbox className="w-7 h-7 mx-auto text-[#52524E]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111111]">
                      No inquiries received yet
                    </p>
                    <p className="text-xs text-[#52524E]">
                      Messages submitted via the Contact page will show up here and be forwarded to {siteSettings.contactEmail}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/10">
                    {mergedInquiries.map((inq) => (
                      <div key={inq.id} className="p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52524E]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-semibold text-[#111111]">
                              {inq.referenceId}
                            </span>
                            <span>·</span>
                            <span className="font-semibold text-[#111111]">{inq.name}</span>
                            <span>({inq.email})</span>
                            <span>·</span>
                            <span className="font-medium text-[#111111]">
                              {inq.deliveryStatus === 'sent'
                                ? `Sent to ${inq.recipientEmail}`
                                : inq.deliveryStatus === 'pending_activation'
                                  ? `Activation email sent to ${inq.recipientEmail}`
                                  : 'Saved in Inbox'}
                            </span>
                          </div>
                          <span>
                            {inq.service} · {new Date(inq.receivedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
                          {inq.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              openAiComposer({
                                id: inq.id,
                                clientName: inq.name,
                                clientEmail: inq.email,
                                service: inq.service,
                                originalMessage: inq.message,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B9F53A] hover:bg-[#A8E828] text-xs font-semibold text-[#111111] transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Draft AI Reply</span>
                          </button>
                          <a
                            href={`mailto:${inq.email}?subject=${encodeURIComponent(
                              `Re: Your IdeaCircuit ${inq.service} Inquiry (${inq.referenceId})`
                            )}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDEDEB] hover:bg-[#E3E3DF] text-xs font-semibold text-[#111111] transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Open Email App</span>
                          </a>
                          {inq.fromFirestore && (
                            <button
                              type="button"
                              onClick={() => void deleteInquiry(inq.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {/* Inline AI Client Reply Composer */}
                        {replyTarget?.id === inq.id && (
                          <div className="mt-4 bg-[#EDEDEB]/75 rounded-2xl border border-black/10 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#111111]" aria-hidden="true" />
                                <h3 className="font-display text-sm font-bold text-[#111111]">
                                  AI Client Reply Composer — {inq.name}
                                </h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyTarget(null)}
                                className="text-xs font-semibold text-[#52524E] hover:text-[#111111] cursor-pointer"
                              >
                                Close
                              </button>
                            </div>

                            {aiConfigured === false && (
                              <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                Gemini AI requires <code className="font-mono">GEMINI_API_KEY</code> in AI Studio <strong>Settings &gt; Secrets</strong>. Add your key there to enable instant AI drafting.
                              </p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Reply Tone
                                </label>
                                <select
                                  value={replyTone}
                                  onChange={(e) => setReplyTone(e.target.value as ReplyTone)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                >
                                  <option value="Warm & Consultative">Warm &amp; Consultative</option>
                                  <option value="Concise & Direct">Concise &amp; Direct</option>
                                  <option value="Proposal & Next Steps">Proposal &amp; Next Steps</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Owner Notes / Specific Points to Include (Optional)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={ownerNotes}
                                    onChange={(e) => setOwnerNotes(e.target.value)}
                                    placeholder="e.g. Available for a call tomorrow, ask for brand references..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerateAiReply()}
                                    disabled={generatingReply}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                                  >
                                    {generatingReply ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                        <span>Drafting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-[#B9F53A]" aria-hidden="true" />
                                        <span>Generate Reply</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {replyError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                                {replyError}
                              </div>
                            )}
                            {replyNotice && (
                              <div className="p-3 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-xs font-medium text-[#111111]">
                                {replyNotice}
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Email Subject
                                </label>
                                <input
                                  type="text"
                                  value={draftSubject}
                                  onChange={(e) => setDraftSubject(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Reply Message
                                </label>
                                <textarea
                                  rows={6}
                                  value={draftBody}
                                  onChange={(e) => setDraftBody(e.target.value)}
                                  placeholder="Click 'Generate Reply' to draft an AI reply tailored to this client's inquiry..."
                                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/15 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={`mailto:${inq.email}?subject=${encodeURIComponent(
                                    draftSubject
                                  )}&body=${encodeURIComponent(draftBody)}`}
                                  className="inline-flex items-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Open in Gmail</span>
                                </a>
                                {mailStatus?.smtpConfigured && (
                                  <button
                                    type="button"
                                    disabled={sendingReply || !draftBody.trim()}
                                    onClick={() => void handleSendViaSmtp()}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                  >
                                    {sendingReply ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                    )}
                                    <span>Send Now via Gmail SMTP</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={!draftBody.trim()}
                                  onClick={() => void handleCopyDraft()}
                                  className="inline-flex items-center gap-1.5 bg-white border border-black/15 hover:bg-[#E3E3DF] disabled:opacity-50 text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Copy Draft</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: BOOKED CALLS */}
          {activeTab === 'calls' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    Booked Phone &amp; WhatsApp Calls
                  </h1>
                  <p className="text-sm text-[#52524E]">
                    Client call reservations for Phone (
                    <span className="font-mono font-semibold text-[#111111]">
                      {siteSettings.phoneNumber}
                    </span>
                    ) and WhatsApp (
                    <span className="font-mono font-semibold text-[#111111]">
                      {siteSettings.whatsappNumber}
                    </span>
                    ), synced with alerts to{' '}
                    <span className="font-semibold text-[#111111]">
                      {siteSettings.contactEmail}
                    </span>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/book-call"
                    className="inline-flex items-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Open Booking Form</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void fetchInquiries()}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-[#E3E3DF] border border-black/15 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Refresh Calls</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111111] text-[#B9F53A] flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Active Studio Lines: Phone {siteSettings.phoneNumber} · WhatsApp{' '}
                      {siteSettings.whatsappNumber}
                    </h2>
                    <p className="text-xs text-[#52524E]">
                      Clients can choose either a regular GSM phone call or a WhatsApp voice/video call and select their preferred date &amp; time slot.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('website')}
                  className="text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#52524E] cursor-pointer"
                >
                  Edit Studio Numbers
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                {loadingInquiries && mergedBookings.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#52524E]">
                    Loading booked calls...
                  </div>
                ) : mergedBookings.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <PhoneCall className="w-7 h-7 mx-auto text-[#52524E]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111111]">
                      No calls booked yet
                    </p>
                    <p className="text-xs text-[#52524E] max-w-md mx-auto">
                      When visitors book a Phone Call or WhatsApp Call on the Book a Call page, their schedule and contact number appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/10">
                    {mergedBookings.map((booking) => (
                      <div key={booking.id} className="p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52524E]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-semibold text-[#111111]">
                              {booking.referenceId}
                            </span>
                            <span>·</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                booking.channel === 'WhatsApp Call'
                                  ? 'bg-[#B9F53A] text-[#111111]'
                                  : 'bg-[#111111] text-white'
                              }`}
                            >
                              {booking.channel === 'WhatsApp Call' ? (
                                <MessageCircle className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <Phone className="w-3 h-3" aria-hidden="true" />
                              )}
                              <span>{booking.channel}</span>
                            </span>
                            <span className="font-semibold text-[#111111]">
                              {booking.clientName}
                            </span>
                            <span className="font-mono text-[#111111]">
                              ({booking.clientPhone})
                            </span>
                            {booking.clientEmail && <span>· {booking.clientEmail}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                booking.status === 'completed'
                                  ? 'bg-[#EDEDEB] text-[#52524E]'
                                  : booking.status === 'confirmed'
                                    ? 'bg-[#B9F53A] text-[#111111]'
                                    : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {booking.status}
                            </span>
                            <span>{new Date(booking.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 bg-[#EDEDEB]/70 rounded-xl px-4 py-3 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#111111]">
                            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {booking.preferredDate} · {booking.preferredTime}
                            </span>
                          </span>
                          <span className="text-[#52524E]">
                            Topic: <strong className="text-[#111111]">{booking.service}</strong>
                          </span>
                          <span className="text-[#52524E]">
                            Studio Line:{' '}
                            <strong className="font-mono text-[#111111]">
                              {booking.studioLine}
                            </strong>
                          </span>
                          <span className="text-[#52524E]">
                            Alert:{' '}
                            <strong className="text-[#111111]">
                              {booking.deliveryStatus === 'sent'
                                ? `Emailed to ${siteSettings.contactEmail}`
                                : booking.deliveryStatus === 'pending_activation'
                                  ? 'Activation sent'
                                  : 'Saved in Dashboard'}
                            </strong>
                          </span>
                        </div>

                        {booking.notes && (
                          <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
                            {booking.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={formatPhoneHref(booking.clientPhone)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111111] hover:bg-[#2A2A27] text-xs font-semibold text-white transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#B9F53A]" aria-hidden="true" />
                            <span>Call {booking.clientPhone}</span>
                          </a>
                          <a
                            href={formatWhatsAppUrl(
                              booking.clientPhone,
                              `Hello ${booking.clientName}, confirming your ${booking.channel} with IdeaCircuit for ${booking.preferredDate} (${booking.preferredTime}) regarding ${booking.service}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B9F53A] hover:bg-[#A8E828] text-xs font-semibold text-[#111111] transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>WhatsApp Client</span>
                          </a>

                          {booking.fromFirestore && (
                            <>
                              {booking.status !== 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCallBookingStatus(booking.id, 'confirmed')
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Confirm Call</span>
                                </button>
                              )}
                              {booking.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCallBookingStatus(booking.id, 'completed')
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                                >
                                  <span>Mark Completed</span>
                                </button>
                              )}
                              {booking.status !== 'pending' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateCallBookingStatus(booking.id, 'pending')
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                                >
                                  <span>Reset Pending</span>
                                </button>
                              )}
                            </>
                          )}

                          {booking.clientEmail && (
                            <button
                              type="button"
                              onClick={() =>
                                openAiComposer({
                                  id: booking.id,
                                  clientName: booking.clientName,
                                  clientEmail: booking.clientEmail,
                                  service: booking.service,
                                  originalMessage: `Booked ${booking.channel} for ${booking.preferredDate} (${booking.preferredTime}). Notes: ${booking.notes || 'None provided'}`,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDEDEB] hover:bg-[#E3E3DF] text-xs font-semibold text-[#111111] transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Draft AI Reply</span>
                            </button>
                          )}

                          {booking.fromFirestore && (
                            <button
                              type="button"
                              onClick={() => void deleteCallBooking(booking.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {replyTarget?.id === booking.id && booking.clientEmail && (
                          <div className="mt-4 bg-[#EDEDEB]/75 rounded-2xl border border-black/10 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#111111]" aria-hidden="true" />
                                <h3 className="font-display text-sm font-bold text-[#111111]">
                                  AI Call Confirmation Email — {booking.clientName}
                                </h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyTarget(null)}
                                className="text-xs font-semibold text-[#52524E] hover:text-[#111111] cursor-pointer"
                              >
                                Close
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Reply Tone
                                </label>
                                <select
                                  value={replyTone}
                                  onChange={(e) => setReplyTone(e.target.value as ReplyTone)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                >
                                  <option value="Warm & Consultative">Warm &amp; Consultative</option>
                                  <option value="Concise & Direct">Concise &amp; Direct</option>
                                  <option value="Proposal & Next Steps">Proposal &amp; Next Steps</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Owner Notes (Optional)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={ownerNotes}
                                    onChange={(e) => setOwnerNotes(e.target.value)}
                                    placeholder="Confirm call slot or suggest alternative time..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerateAiReply()}
                                    disabled={generatingReply}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                                  >
                                    {generatingReply ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                        <span>Drafting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-[#B9F53A]" aria-hidden="true" />
                                        <span>Generate Reply</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {replyError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                                {replyError}
                              </div>
                            )}
                            {replyNotice && (
                              <div className="p-3 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-xs font-medium text-[#111111]">
                                {replyNotice}
                              </div>
                            )}

                            <div className="space-y-3">
                              <input
                                type="text"
                                value={draftSubject}
                                onChange={(e) => setDraftSubject(e.target.value)}
                                placeholder="Subject"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                              />
                              <textarea
                                rows={5}
                                value={draftBody}
                                onChange={(e) => setDraftBody(e.target.value)}
                                placeholder="Click 'Generate Reply' to draft an email confirmation..."
                                className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/15 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#111111]"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={`mailto:${booking.clientEmail}?subject=${encodeURIComponent(
                                    draftSubject
                                  )}&body=${encodeURIComponent(draftBody)}`}
                                  className="inline-flex items-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Open in Gmail</span>
                                </a>
                                {mailStatus?.smtpConfigured && (
                                  <button
                                    type="button"
                                    disabled={sendingReply || !draftBody.trim()}
                                    onClick={() => void handleSendViaSmtp()}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Send Now via Gmail SMTP</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={!draftBody.trim()}
                                  onClick={() => void handleCopyDraft()}
                                  className="inline-flex items-center gap-1.5 bg-white border border-black/15 hover:bg-[#E3E3DF] disabled:opacity-50 text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Copy Draft</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AI SUGGESTION BOX */}
          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    AI Suggestion Box &amp; Visitor Replies
                  </h1>
                  <p className="text-sm text-[#52524E]">
                    Ideas, feedback, and client questions submitted through the public AI Suggestion Box along with the instant Gemini AI replies they received.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchInquiries()}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-[#E3E3DF] border border-black/15 text-xs font-semibold px-4 py-2 rounded-full cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Refresh Status</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-black/10 p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Gemini Client Assistant Status
                    </h2>
                    <p className="text-xs text-[#52524E]">
                      {aiConfigured === true
                        ? 'Active — GEMINI_API_KEY is configured and ready to answer suggestions and draft client replies.'
                        : aiConfigured === false
                          ? 'Needs API Key — Add GEMINI_API_KEY in AI Studio Settings > Secrets to activate AI replies.'
                          : 'Checking AI configuration...'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/"
                  className="text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#52524E]"
                >
                  Test Public Suggestion Box
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
                {suggestions.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Lightbulb className="w-7 h-7 mx-auto text-[#52524E]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#111111]">
                      No visitor suggestions yet
                    </p>
                    <p className="text-xs text-[#52524E] max-w-md mx-auto">
                      When visitors use the floating AI Suggestion Box on the website, their suggestions and the AI responses appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/10">
                    {suggestions.map((item) => (
                      <div key={item.id} className="p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52524E]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-[#111111]">
                              {item.senderName}
                            </span>
                            {item.senderEmail && <span>({item.senderEmail})</span>}
                            <span>·</span>
                            <span className="font-medium text-[#111111]">{item.topic}</span>
                            <span>·</span>
                            <span>Recommended: {item.recommendedService}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                item.status === 'reviewed'
                                  ? 'bg-[#EDEDEB] text-[#52524E]'
                                  : 'bg-[#B9F53A] text-[#111111]'
                              }`}
                            >
                              {item.status === 'reviewed' ? 'Reviewed' : 'New'}
                            </span>
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-[#111111] leading-relaxed">
                          &ldquo;{item.suggestion}&rdquo;
                        </p>

                        <div className="bg-[#EDEDEB]/70 rounded-xl p-3.5 text-xs text-[#52524E] space-y-1">
                          <p className="font-semibold text-[#111111]">Instant AI Reply Shown:</p>
                          <p className="leading-relaxed whitespace-pre-wrap">{item.aiReply}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              void markSuggestionStatus(
                                item.id,
                                item.status === 'reviewed' ? 'new' : 'reviewed'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:bg-[#EDEDEB] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {item.status === 'reviewed' ? 'Mark as New' : 'Mark Reviewed'}
                            </span>
                          </button>

                          {item.senderEmail && (
                            <button
                              type="button"
                              onClick={() =>
                                openAiComposer({
                                  id: item.id,
                                  clientName: item.senderName,
                                  clientEmail: item.senderEmail,
                                  service: item.recommendedService,
                                  originalMessage: `${item.topic}: ${item.suggestion}`,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B9F53A] hover:bg-[#A8E828] text-xs font-semibold text-[#111111] transition-colors cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Draft Follow-Up Reply</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => void deleteSuggestion(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>

                        {replyTarget?.id === item.id && item.senderEmail && (
                          <div className="mt-4 bg-[#EDEDEB]/75 rounded-2xl border border-black/10 p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#111111]" aria-hidden="true" />
                                <h3 className="font-display text-sm font-bold text-[#111111]">
                                  AI Follow-Up Reply — {item.senderName}
                                </h3>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReplyTarget(null)}
                                className="text-xs font-semibold text-[#52524E] hover:text-[#111111] cursor-pointer"
                              >
                                Close
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Reply Tone
                                </label>
                                <select
                                  value={replyTone}
                                  onChange={(e) => setReplyTone(e.target.value as ReplyTone)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                >
                                  <option value="Warm & Consultative">Warm &amp; Consultative</option>
                                  <option value="Concise & Direct">Concise &amp; Direct</option>
                                  <option value="Proposal & Next Steps">Proposal &amp; Next Steps</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 space-y-1">
                                <label className="block text-[11px] font-semibold text-[#111111]">
                                  Owner Notes (Optional)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={ownerNotes}
                                    onChange={(e) => setOwnerNotes(e.target.value)}
                                    placeholder="Add custom points to mention..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerateAiReply()}
                                    disabled={generatingReply}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
                                  >
                                    {generatingReply ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                        <span>Drafting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-[#B9F53A]" aria-hidden="true" />
                                        <span>Generate Reply</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {replyError && (
                              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                                {replyError}
                              </div>
                            )}
                            {replyNotice && (
                              <div className="p-3 rounded-xl bg-[#B9F53A]/35 border border-[#111111]/15 text-xs font-medium text-[#111111]">
                                {replyNotice}
                              </div>
                            )}

                            <div className="space-y-3">
                              <input
                                type="text"
                                value={draftSubject}
                                onChange={(e) => setDraftSubject(e.target.value)}
                                placeholder="Subject"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-black/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                              />
                              <textarea
                                rows={5}
                                value={draftBody}
                                onChange={(e) => setDraftBody(e.target.value)}
                                placeholder="Click 'Generate Reply' to draft an email reply..."
                                className="w-full px-3 py-2.5 rounded-xl bg-white border border-black/15 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#111111]"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(
                                    draftSubject
                                  )}&body=${encodeURIComponent(draftBody)}`}
                                  className="inline-flex items-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Open in Gmail</span>
                                </a>
                                {mailStatus?.smtpConfigured && (
                                  <button
                                    type="button"
                                    disabled={sendingReply || !draftBody.trim()}
                                    onClick={() => void handleSendViaSmtp()}
                                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Send Now via Gmail SMTP</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={!draftBody.trim()}
                                  onClick={() => void handleCopyDraft()}
                                  className="inline-flex items-center gap-1.5 bg-white border border-black/15 hover:bg-[#E3E3DF] disabled:opacity-50 text-[#111111] text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Copy Draft</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
