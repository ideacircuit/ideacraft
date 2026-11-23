import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  CAPTURED_PORTFOLIO_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  type CallBookingItem,
  type CallChannel,
  type InquiryItem,
  type PortfolioProject,
  type ServiceCategory,
  type SiteSettingsData,
  type SuggestionItem,
  type SuggestionTopic,
  type TestimonialItem,
} from '../data/studioData';

export interface PortfolioInput {
  title: string;
  category: ServiceCategory;
  projectType: 'Studio Concept' | 'Design Exploration' | 'Client Project';
  year: string;
  imageUrl: string;
  imageAlt: string;
  shortDescription: string;
  overview: string;
  creativeApproach: string;
  deliverables: string[];
  outcomeFocus: string;
  liveUrl?: string;
  featured: boolean;
}

export interface TestimonialInput {
  clientName: string;
  role: string;
  company: string;
  serviceCategory: ServiceCategory | 'Multi-Service Project';
  quote: string;
  avatarUrl: string;
  featured: boolean;
}

export interface InquiryInput {
  referenceId: string;
  name: string;
  email: string;
  service: InquiryItem['service'];
  message: string;
  recipientEmail: string;
  deliveryStatus: InquiryItem['deliveryStatus'];
  deliveryChannel: InquiryItem['deliveryChannel'];
}

export interface SuggestionInput {
  senderName: string;
  senderEmail: string;
  topic: SuggestionTopic;
  suggestion: string;
  aiReply: string;
  recommendedService: SuggestionItem['recommendedService'];
}

export interface CallBookingInput {
  referenceId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  channel: CallChannel;
  service: CallBookingItem['service'];
  preferredDate: string;
  preferredTime: string;
  notes: string;
  studioLine: string;
  deliveryStatus: CallBookingItem['deliveryStatus'];
}

interface StudioContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  siteSettings: SiteSettingsData;
  cmsProjects: PortfolioProject[];
  allProjects: PortfolioProject[];
  testimonials: TestimonialItem[];
  inquiries: InquiryItem[];
  suggestions: SuggestionItem[];
  callBookings: CallBookingItem[];
  dataLoading: boolean;
  signInAdmin: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  saveSiteSettings: (settings: SiteSettingsData) => Promise<void>;
  createPortfolioProject: (input: PortfolioInput) => Promise<string>;
  updatePortfolioProject: (id: string, input: PortfolioInput) => Promise<void>;
  deletePortfolioProject: (id: string) => Promise<void>;
  createTestimonial: (input: TestimonialInput) => Promise<string>;
  updateTestimonial: (id: string, input: TestimonialInput) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  submitInquiryToFirestore: (input: InquiryInput) => Promise<string>;
  deleteInquiry: (id: string) => Promise<void>;
  submitSuggestionToFirestore: (input: SuggestionInput) => Promise<string>;
  markSuggestionStatus: (id: string, status: 'new' | 'reviewed') => Promise<void>;
  deleteSuggestion: (id: string) => Promise<void>;
  submitCallBookingToFirestore: (input: CallBookingInput) => Promise<string>;
  updateCallBookingStatus: (id: string, status: CallBookingItem['status']) => Promise<void>;
  deleteCallBooking: (id: string) => Promise<void>;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function clampString(val: string, max: number, fallback = ''): string {
  const trimmed = (val ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

export function StudioProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [siteSettings, setSiteSettings] = useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);
  const [cmsProjects, setCmsProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [dismissedCapturedIds, setDismissedCapturedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    try {
      if (window.localStorage.getItem('ic_forme_dismissed') === '1') {
        initial['forme-everyday-redefined'] = true;
      }
      for (const proj of CAPTURED_PORTFOLIO_PROJECTS) {
        if (window.localStorage.getItem(`ic_dismissed_${proj.id}`) === '1') {
          initial[proj.id] = true;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return initial;
  });
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [callBookings, setCallBookings] = useState<CallBookingItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const syncingCapturedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser || !nextUser.emailVerified) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      if (nextUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        setAuthReady(true);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, 'site_settings', 'main');
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSiteSettings({
            heroLabel:
              typeof data.heroLabel === 'string' && data.heroLabel
                ? data.heroLabel
                : DEFAULT_SITE_SETTINGS.heroLabel,
            heroHeadline:
              typeof data.heroHeadline === 'string' && data.heroHeadline
                ? data.heroHeadline
                : DEFAULT_SITE_SETTINGS.heroHeadline,
            heroSubtitle:
              typeof data.heroSubtitle === 'string' && data.heroSubtitle
                ? data.heroSubtitle
                : DEFAULT_SITE_SETTINGS.heroSubtitle,
            heroPrimaryCta:
              typeof data.heroPrimaryCta === 'string' && data.heroPrimaryCta
                ? data.heroPrimaryCta
                : DEFAULT_SITE_SETTINGS.heroPrimaryCta,
            heroSecondaryCta:
              typeof data.heroSecondaryCta === 'string' && data.heroSecondaryCta
                ? data.heroSecondaryCta
                : DEFAULT_SITE_SETTINGS.heroSecondaryCta,
            heroDisplayMode:
              data.heroDisplayMode === 'screenshot' ? 'screenshot' : 'collage',
            heroScreenshotUrl:
              typeof data.heroScreenshotUrl === 'string' ? data.heroScreenshotUrl : '',
            heroWebImage:
              typeof data.heroWebImage === 'string' && data.heroWebImage
                ? data.heroWebImage
                : DEFAULT_SITE_SETTINGS.heroWebImage,
            heroGraphicImage:
              typeof data.heroGraphicImage === 'string' && data.heroGraphicImage
                ? data.heroGraphicImage
                : DEFAULT_SITE_SETTINGS.heroGraphicImage,
            heroAutomationImage:
              typeof data.heroAutomationImage === 'string' && data.heroAutomationImage
                ? data.heroAutomationImage
                : DEFAULT_SITE_SETTINGS.heroAutomationImage,
            introHeadline:
              typeof data.introHeadline === 'string' && data.introHeadline
                ? data.introHeadline
                : DEFAULT_SITE_SETTINGS.introHeadline,
            introLead:
              typeof data.introLead === 'string' && data.introLead
                ? data.introLead
                : DEFAULT_SITE_SETTINGS.introLead,
            introBody:
              typeof data.introBody === 'string' && data.introBody
                ? data.introBody
                : DEFAULT_SITE_SETTINGS.introBody,
            aboutHeadline:
              typeof data.aboutHeadline === 'string' && data.aboutHeadline
                ? data.aboutHeadline
                : DEFAULT_SITE_SETTINGS.aboutHeadline,
            aboutSubtitle:
              typeof data.aboutSubtitle === 'string' && data.aboutSubtitle
                ? data.aboutSubtitle
                : DEFAULT_SITE_SETTINGS.aboutSubtitle,
            ctaHeadline:
              typeof data.ctaHeadline === 'string' && data.ctaHeadline
                ? data.ctaHeadline
                : DEFAULT_SITE_SETTINGS.ctaHeadline,
            ctaSubtitle:
              typeof data.ctaSubtitle === 'string' && data.ctaSubtitle
                ? data.ctaSubtitle
                : DEFAULT_SITE_SETTINGS.ctaSubtitle,
            footerTagline:
              typeof data.footerTagline === 'string' && data.footerTagline
                ? data.footerTagline
                : DEFAULT_SITE_SETTINGS.footerTagline,
            contactEmail:
              typeof data.contactEmail === 'string' && data.contactEmail
                ? data.contactEmail
                : DEFAULT_SITE_SETTINGS.contactEmail,
            whatsappNumber:
              typeof data.whatsappNumber === 'string' && data.whatsappNumber
                ? data.whatsappNumber
                : DEFAULT_SITE_SETTINGS.whatsappNumber,
            phoneNumber:
              typeof data.phoneNumber === 'string' && data.phoneNumber
                ? data.phoneNumber
                : DEFAULT_SITE_SETTINGS.phoneNumber,
          });
        }
        setDataLoading(false);
      },
      (error) => {
        setDataLoading(false);
        handleFirestoreError(error, OperationType.GET, 'site_settings/main');
      }
    );

    const projectsQuery = query(
      collection(db, 'portfolio_projects'),
      orderBy('createdAt', 'desc')
    );
    const unsubProjects = onSnapshot(
      projectsQuery,
      (snap) => {
        const loaded: PortfolioProject[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title ?? ''),
            category: (data.category as ServiceCategory) ?? 'Website Design',
            projectType:
              (data.projectType as PortfolioProject['projectType']) ?? 'Client Project',
            year: String(data.year ?? '2026'),
            image: String(data.imageUrl ?? ''),
            imageAlt: String(data.imageAlt ?? data.title ?? 'Portfolio visual'),
            shortDescription: String(data.shortDescription ?? ''),
            overview: String(data.overview ?? ''),
            creativeApproach: String(data.creativeApproach ?? ''),
            deliverables: Array.isArray(data.deliverables)
              ? data.deliverables.map((x) => String(x))
              : ['Custom Deliverable'],
            outcomeFocus: String(data.outcomeFocus ?? ''),
            liveUrl: typeof data.liveUrl === 'string' ? data.liveUrl : '',
            featured: Boolean(data.featured),
            fromCms: true,
          };
        });
        setCmsProjects(loaded);
        setProjectsLoaded(true);
      },
      (error) => {
        setProjectsLoaded(true);
        handleFirestoreError(error, OperationType.LIST, 'portfolio_projects');
      }
    );

    const testimonialsQuery = query(
      collection(db, 'testimonials'),
      orderBy('createdAt', 'desc')
    );
    const unsubTestimonials = onSnapshot(
      testimonialsQuery,
      (snap) => {
        const loaded: TestimonialItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            clientName: String(data.clientName ?? ''),
            role: String(data.role ?? ''),
            company: String(data.company ?? ''),
            serviceCategory:
              (data.serviceCategory as TestimonialItem['serviceCategory']) ??
              'Website Design',
            quote: String(data.quote ?? ''),
            avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : '',
            featured: Boolean(data.featured),
          };
        });
        setTestimonials(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'testimonials');
      }
    );

    return () => {
      unsubSettings();
      unsubProjects();
      unsubTestimonials();
    };
  }, []);

  // Subscribe to persistent Firestore inquiries, suggestions & booked calls ONLY when authenticated as a verified admin
  useEffect(() => {
    if (!authReady || !isAdmin) {
      setInquiries([]);
      setSuggestions([]);
      setCallBookings([]);
      return;
    }

    const inquiriesQuery = query(
      collection(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    );
    const unsubInquiries = onSnapshot(
      inquiriesQuery,
      (snap) => {
        const loaded: InquiryItem[] = snap.docs.map((d) => {
          const data = d.data();
          const created =
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString();
          return {
            id: d.id,
            referenceId: String(data.referenceId ?? d.id),
            name: String(data.name ?? ''),
            email: String(data.email ?? ''),
            service: (data.service as InquiryItem['service']) ?? 'Website Design',
            message: String(data.message ?? ''),
            recipientEmail: String(data.recipientEmail ?? DEFAULT_SITE_SETTINGS.contactEmail),
            deliveryStatus:
              (data.deliveryStatus as InquiryItem['deliveryStatus']) ?? 'inbox_only',
            deliveryChannel:
              (data.deliveryChannel as InquiryItem['deliveryChannel']) ?? 'inbox',
            receivedAt: created,
            fromFirestore: true,
          };
        });
        setInquiries(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'inquiries');
      }
    );

    const suggestionsQuery = query(
      collection(db, 'suggestions'),
      orderBy('createdAt', 'desc')
    );
    const unsubSuggestions = onSnapshot(
      suggestionsQuery,
      (snap) => {
        const loaded: SuggestionItem[] = snap.docs.map((d) => {
          const data = d.data();
          const created =
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString();
          return {
            id: d.id,
            senderName: String(data.senderName ?? 'Studio Visitor'),
            senderEmail: String(data.senderEmail ?? ''),
            topic: (data.topic as SuggestionTopic) ?? 'Project Idea',
            suggestion: String(data.suggestion ?? ''),
            aiReply: String(data.aiReply ?? ''),
            recommendedService:
              (data.recommendedService as SuggestionItem['recommendedService']) ??
              'Multi-Service Project',
            status: data.status === 'reviewed' ? 'reviewed' : 'new',
            createdAt: created,
          };
        });
        setSuggestions(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'suggestions');
      }
    );

    const bookingsQuery = query(
      collection(db, 'call_bookings'),
      orderBy('createdAt', 'desc')
    );
    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snap) => {
        const loaded: CallBookingItem[] = snap.docs.map((d) => {
          const data = d.data();
          const created =
            data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString();
          return {
            id: d.id,
            referenceId: String(data.referenceId ?? d.id),
            clientName: String(data.clientName ?? ''),
            clientPhone: String(data.clientPhone ?? ''),
            clientEmail: String(data.clientEmail ?? ''),
            channel: data.channel === 'WhatsApp Call' ? 'WhatsApp Call' : 'Phone Call',
            service: (data.service as CallBookingItem['service']) ?? 'Website Design',
            preferredDate: String(data.preferredDate ?? ''),
            preferredTime: String(data.preferredTime ?? ''),
            notes: String(data.notes ?? ''),
            studioLine: String(data.studioLine ?? DEFAULT_SITE_SETTINGS.phoneNumber),
            deliveryStatus:
              (data.deliveryStatus as CallBookingItem['deliveryStatus']) ?? 'inbox_only',
            status:
              data.status === 'confirmed' || data.status === 'completed'
                ? data.status
                : 'pending',
            createdAt: created,
            fromFirestore: true,
          };
        });
        setCallBookings(loaded);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'call_bookings');
      }
    );

    return () => {
      unsubInquiries();
      unsubSuggestions();
      unsubBookings();
    };
  }, [authReady, isAdmin]);

  // Auto-sync captured hero portfolio projects into Firestore once an admin is authenticated
  useEffect(() => {
    if (!isAdmin || !auth.currentUser || !projectsLoaded) return;
    const uid = auth.currentUser.uid;

    for (const captured of CAPTURED_PORTFOLIO_PROJECTS) {
      if (dismissedCapturedIds[captured.id]) continue;
      const alreadyInFirestore = cmsProjects.some((p) => p.id === captured.id);
      if (alreadyInFirestore || syncingCapturedRef.current.has(captured.id)) continue;

      syncingCapturedRef.current.add(captured.id);
      void setDoc(doc(db, 'portfolio_projects', captured.id), {
        title: captured.title,
        category: captured.category,
        projectType: captured.projectType,
        year: captured.year,
        imageUrl: captured.image,
        imageAlt: captured.imageAlt,
        shortDescription: captured.shortDescription,
        overview: captured.overview,
        creativeApproach: captured.creativeApproach,
        deliverables: captured.deliverables,
        outcomeFocus: captured.outcomeFocus,
        liveUrl: captured.liveUrl ?? '',
        featured: true,
        authorId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        syncingCapturedRef.current.delete(captured.id);
        console.error(`Failed to auto-sync project ${captured.id}:`, err);
      });
    }
  }, [isAdmin, projectsLoaded, cmsProjects, dismissedCapturedIds]);

  const allProjects = useMemo(() => {
    const cmsIds = new Set(cmsProjects.map((p) => p.id));
    const pendingCaptured = CAPTURED_PORTFOLIO_PROJECTS.filter(
      (captured) => !cmsIds.has(captured.id) && !dismissedCapturedIds[captured.id]
    );
    return [...pendingCaptured, ...cmsProjects];
  }, [cmsProjects, dismissedCapturedIds]);

  const signInAdmin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOutAdmin = async () => {
    await signOut(auth);
  };

  const requireAdminUid = (): string => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error('Admin sign-in is required to modify studio content.');
    }
    return auth.currentUser.uid;
  };

  const saveSiteSettings = async (settings: SiteSettingsData) => {
    const uid = requireAdminUid();
    const path = 'site_settings/main';
    const payload = {
      heroLabel: clampString(settings.heroLabel, 120, DEFAULT_SITE_SETTINGS.heroLabel),
      heroHeadline: clampString(
        settings.heroHeadline,
        180,
        DEFAULT_SITE_SETTINGS.heroHeadline
      ),
      heroSubtitle: clampString(
        settings.heroSubtitle,
        500,
        DEFAULT_SITE_SETTINGS.heroSubtitle
      ),
      heroPrimaryCta: clampString(
        settings.heroPrimaryCta,
        40,
        DEFAULT_SITE_SETTINGS.heroPrimaryCta
      ),
      heroSecondaryCta: clampString(
        settings.heroSecondaryCta,
        40,
        DEFAULT_SITE_SETTINGS.heroSecondaryCta
      ),
      heroDisplayMode: settings.heroDisplayMode === 'screenshot' ? 'screenshot' : 'collage',
      heroScreenshotUrl: (settings.heroScreenshotUrl ?? '').trim().slice(0, 2048),
      heroWebImage: clampString(
        settings.heroWebImage,
        2048,
        DEFAULT_SITE_SETTINGS.heroWebImage
      ),
      heroGraphicImage: clampString(
        settings.heroGraphicImage,
        2048,
        DEFAULT_SITE_SETTINGS.heroGraphicImage
      ),
      heroAutomationImage: clampString(
        settings.heroAutomationImage,
        2048,
        DEFAULT_SITE_SETTINGS.heroAutomationImage
      ),
      introHeadline: clampString(
        settings.introHeadline,
        200,
        DEFAULT_SITE_SETTINGS.introHeadline
      ),
      introLead: clampString(settings.introLead, 600, DEFAULT_SITE_SETTINGS.introLead),
      introBody: clampString(settings.introBody, 1000, DEFAULT_SITE_SETTINGS.introBody),
      aboutHeadline: clampString(
        settings.aboutHeadline,
        200,
        DEFAULT_SITE_SETTINGS.aboutHeadline
      ),
      aboutSubtitle: clampString(
        settings.aboutSubtitle,
        600,
        DEFAULT_SITE_SETTINGS.aboutSubtitle
      ),
      ctaHeadline: clampString(
        settings.ctaHeadline,
        200,
        DEFAULT_SITE_SETTINGS.ctaHeadline
      ),
      ctaSubtitle: clampString(
        settings.ctaSubtitle,
        500,
        DEFAULT_SITE_SETTINGS.ctaSubtitle
      ),
      footerTagline: clampString(
        settings.footerTagline,
        400,
        DEFAULT_SITE_SETTINGS.footerTagline
      ),
      contactEmail: clampString(
        settings.contactEmail,
        160,
        DEFAULT_SITE_SETTINGS.contactEmail
      ),
      whatsappNumber: clampString(
        settings.whatsappNumber,
        30,
        DEFAULT_SITE_SETTINGS.whatsappNumber
      ),
      phoneNumber: clampString(
        settings.phoneNumber,
        30,
        DEFAULT_SITE_SETTINGS.phoneNumber
      ),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    };

    try {
      await setDoc(doc(db, 'site_settings', 'main'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const buildPortfolioPayload = (input: PortfolioInput) => {
    const cleanDeliverables = input.deliverables
      .map((d) => d.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 10);

    return {
      title: clampString(input.title, 140),
      category: input.category,
      projectType: input.projectType,
      year: clampString(input.year, 10, '2026'),
      imageUrl: clampString(input.imageUrl, 2048),
      imageAlt: clampString(input.imageAlt || input.title, 240),
      shortDescription: clampString(input.shortDescription, 400),
      overview: clampString(input.overview, 2000),
      creativeApproach: clampString(input.creativeApproach, 1500),
      deliverables: cleanDeliverables.length > 0 ? cleanDeliverables : ['Custom Design'],
      outcomeFocus: clampString(input.outcomeFocus, 400),
      liveUrl: (input.liveUrl ?? '').trim().slice(0, 2048),
      featured: Boolean(input.featured),
    };
  };

  const createPortfolioProject = async (input: PortfolioInput): Promise<string> => {
    const uid = requireAdminUid();
    const path = 'portfolio_projects';
    try {
      const ref = await addDoc(collection(db, path), {
        ...buildPortfolioPayload(input),
        authorId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updatePortfolioProject = async (id: string, input: PortfolioInput) => {
    const uid = requireAdminUid();
    const path = `portfolio_projects/${id}`;
    const existsInFirestore = cmsProjects.some((p) => p.id === id);
    try {
      if (existsInFirestore) {
        await updateDoc(doc(db, 'portfolio_projects', id), {
          ...buildPortfolioPayload(input),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'portfolio_projects', id), {
          ...buildPortfolioPayload(input),
          authorId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deletePortfolioProject = async (id: string) => {
    requireAdminUid();
    if (CAPTURED_PORTFOLIO_PROJECTS.some((p) => p.id === id)) {
      setDismissedCapturedIds((prev) => ({...prev, [id]: true}));
      try {
        window.localStorage.setItem(`ic_dismissed_${id}`, '1');
        if (id === 'forme-everyday-redefined') {
          window.localStorage.setItem('ic_forme_dismissed', '1');
        }
      } catch {
        // Ignore
      }
    }
    const existsInFirestore = cmsProjects.some((p) => p.id === id);
    if (!existsInFirestore) return;

    const path = `portfolio_projects/${id}`;
    try {
      await deleteDoc(doc(db, 'portfolio_projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const buildTestimonialPayload = (input: TestimonialInput) => ({
    clientName: clampString(input.clientName, 100),
    role: clampString(input.role, 100),
    company: clampString(input.company, 120),
    serviceCategory: input.serviceCategory,
    quote: clampString(input.quote, 1000),
    avatarUrl: (input.avatarUrl ?? '').trim().slice(0, 2048),
    featured: Boolean(input.featured),
  });

  const createTestimonial = async (input: TestimonialInput): Promise<string> => {
    const uid = requireAdminUid();
    const path = 'testimonials';
    try {
      const ref = await addDoc(collection(db, path), {
        ...buildTestimonialPayload(input),
        authorId: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateTestimonial = async (id: string, input: TestimonialInput) => {
    requireAdminUid();
    const path = `testimonials/${id}`;
    try {
      await updateDoc(doc(db, 'testimonials', id), {
        ...buildTestimonialPayload(input),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTestimonial = async (id: string) => {
    requireAdminUid();
    const path = `testimonials/${id}`;
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const submitInquiryToFirestore = async (input: InquiryInput): Promise<string> => {
    const cleanRef = clampString(input.referenceId, 32, `IC-${Date.now().toString(36).toUpperCase()}`);
    const inquiryId = `${cleanRef}-${Date.now().toString(36)}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    const path = `inquiries/${inquiryId}`;
    try {
      await setDoc(doc(db, 'inquiries', inquiryId), {
        referenceId: cleanRef,
        name: clampString(input.name, 120),
        email: clampString(input.email, 160),
        service: input.service,
        message: clampString(input.message, 4000),
        recipientEmail: clampString(input.recipientEmail, 160, DEFAULT_SITE_SETTINGS.contactEmail),
        deliveryStatus: input.deliveryStatus,
        deliveryChannel: input.deliveryChannel,
        createdAt: serverTimestamp(),
      });
      return inquiryId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteInquiry = async (id: string) => {
    requireAdminUid();
    const path = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const submitSuggestionToFirestore = async (input: SuggestionInput): Promise<string> => {
    const suggestionId = `SG-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const path = `suggestions/${suggestionId}`;
    try {
      await setDoc(doc(db, 'suggestions', suggestionId), {
        senderName: clampString(input.senderName, 100, 'Studio Visitor'),
        senderEmail: (input.senderEmail ?? '').trim().slice(0, 160),
        topic: input.topic,
        suggestion: clampString(input.suggestion, 2000),
        aiReply: clampString(input.aiReply, 3000),
        recommendedService: input.recommendedService,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      return suggestionId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const markSuggestionStatus = async (id: string, status: 'new' | 'reviewed') => {
    requireAdminUid();
    const path = `suggestions/${id}`;
    try {
      await updateDoc(doc(db, 'suggestions', id), {status});
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteSuggestion = async (id: string) => {
    requireAdminUid();
    const path = `suggestions/${id}`;
    try {
      await deleteDoc(doc(db, 'suggestions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const submitCallBookingToFirestore = async (input: CallBookingInput): Promise<string> => {
    const cleanRef = clampString(
      input.referenceId,
      32,
      `CALL-${Date.now().toString(36).toUpperCase()}`
    );
    const bookingId = `${cleanRef}-${Date.now().toString(36)}`
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 128);
    const path = `call_bookings/${bookingId}`;
    try {
      await setDoc(doc(db, 'call_bookings', bookingId), {
        referenceId: cleanRef,
        clientName: clampString(input.clientName, 120),
        clientPhone: clampString(input.clientPhone, 30),
        clientEmail: (input.clientEmail ?? '').trim().slice(0, 160),
        channel: input.channel,
        service: input.service,
        preferredDate: clampString(input.preferredDate, 20),
        preferredTime: clampString(input.preferredTime, 40),
        notes: (input.notes ?? '').trim().slice(0, 2000),
        studioLine: clampString(input.studioLine, 30, DEFAULT_SITE_SETTINGS.phoneNumber),
        deliveryStatus: input.deliveryStatus,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return bookingId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateCallBookingStatus = async (id: string, status: CallBookingItem['status']) => {
    requireAdminUid();
    const path = `call_bookings/${id}`;
    try {
      await updateDoc(doc(db, 'call_bookings', id), {status});
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteCallBooking = async (id: string) => {
    requireAdminUid();
    const path = `call_bookings/${id}`;
    try {
      await deleteDoc(doc(db, 'call_bookings', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const value: StudioContextValue = {
    user,
    authReady,
    isAdmin,
    siteSettings,
    cmsProjects,
    allProjects,
    testimonials,
    inquiries,
    suggestions,
    callBookings,
    dataLoading,
    signInAdmin,
    signOutAdmin,
    saveSiteSettings,
    createPortfolioProject,
    updatePortfolioProject,
    deletePortfolioProject,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    submitInquiryToFirestore,
    deleteInquiry,
    submitSuggestionToFirestore,
    markSuggestionStatus,
    deleteSuggestion,
    submitCallBookingToFirestore,
    updateCallBookingStatus,
    deleteCallBooking,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return ctx;
}
