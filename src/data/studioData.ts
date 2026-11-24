export type ServiceCategory = 'Website Design' | 'Graphic Design' | 'AI Automation';

export interface PortfolioProject {
  id: string;
  title: string;
  category: ServiceCategory;
  projectType: 'Studio Concept' | 'Design Exploration' | 'Client Project';
  year: string;
  image: string;
  imageAlt: string;
  shortDescription: string;
  overview: string;
  creativeApproach: string;
  deliverables: string[];
  outcomeFocus: string;
  liveUrl?: string;
  featured?: boolean;
  fromCms?: boolean;
}

export interface TestimonialItem {
  id: string;
  clientName: string;
  role: string;
  company: string;
  serviceCategory: ServiceCategory | 'Multi-Service Project';
  quote: string;
  avatarUrl: string;
  featured: boolean;
}

export interface InquiryItem {
  id: string;
  referenceId: string;
  name: string;
  email: string;
  service: 'Website Design' | 'Graphic Design' | 'AI Automation' | 'Multi-Service Project';
  message: string;
  recipientEmail: string;
  deliveryStatus: 'sent' | 'pending_activation' | 'inbox_only';
  deliveryChannel: 'gmail_smtp' | 'formsubmit' | 'inbox';
  receivedAt: string;
  fromFirestore?: boolean;
}

export type SuggestionTopic =
  | 'Project Idea'
  | 'Service Question'
  | 'Website Feedback'
  | 'AI Automation Idea';

export interface SuggestionItem {
  id: string;
  senderName: string;
  senderEmail: string;
  topic: SuggestionTopic;
  suggestion: string;
  aiReply: string;
  recommendedService: 'Website Design' | 'Graphic Design' | 'AI Automation' | 'Multi-Service Project';
  status: 'new' | 'reviewed';
  createdAt: string;
}

export type CallChannel = 'Phone Call' | 'WhatsApp Call';

export interface CallBookingItem {
  id: string;
  referenceId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  channel: CallChannel;
  service: 'Website Design' | 'Graphic Design' | 'AI Automation' | 'Multi-Service Project';
  preferredDate: string;
  preferredTime: string;
  notes: string;
  studioLine: string;
  deliveryStatus: 'sent' | 'pending_activation' | 'inbox_only';
  status: 'pending' | 'confirmed' | 'completed';
  createdAt: string;
  fromFirestore?: boolean;
}

export interface SiteSettingsData {
  heroLabel: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroDisplayMode: 'collage' | 'screenshot';
  heroScreenshotUrl: string;
  heroWebImage: string;
  heroGraphicImage: string;
  heroAutomationImage: string;
  introHeadline: string;
  introLead: string;
  introBody: string;
  aboutHeadline: string;
  aboutSubtitle: string;
  ctaHeadline: string;
  ctaSubtitle: string;
  footerTagline: string;
  contactEmail: string;
  whatsappNumber: string;
  phoneNumber: string;
}

export interface ServiceDetail {
  id: string;
  slug: 'website-design' | 'graphic-design' | 'ai-automation';
  number: string;
  name: ServiceCategory;
  tagline: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  secondaryImage?: string;
  secondaryImageAlt?: string;
  deliverables: string[];
  benefits: {
    title: string;
    detail: string;
  }[];
  showcaseHighlights: string[];
}

export interface AutomationScenario {
  id: string;
  title: string;
  trigger: string;
  intelligentStep: string;
  businessOutcome: string;
  toolsConnected: string;
}

export const STUDIO_IMAGES = {
  heroWebShowcase: '/src/assets/images/web_design_desktop_hero_1794920870905.jpg',
  webEcommerce: '/src/assets/images/web_design_storefront_ui_1794920871948.jpg',
  heroBrandMerch: '/src/assets/images/graphic_design_brand_identity_1794920871769.jpg',
  skincareCampaign: '/src/assets/images/graphic_design_social_campaigns_1794920871780.jpg',
  editorialPackaging: '/src/assets/images/graphic_design_packaging_print_1794920873938.jpg',
  aiAutomation: '/src/assets/images/ai_automation_workflow_ui_1794920873625.jpg',
  aiAutomationOps: '/src/assets/images/ai_automation_ops_console_1794920873733.jpg',
  aboutStudio: '/src/assets/images/about_studio_portrait_1795441801708.jpg',
  formeHeroScreenshot: '/src/assets/images/forme_hero_screenshot.jpg',
  sereinHeroScreenshot: '/src/assets/images/serein_hero_screenshot.jpg',
} as const;

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  heroLabel: 'IdeaCircuit · Website Design, Graphic Design & AI Automation',
  heroHeadline: 'Where Creative Thinking Meets Digital Possibilities.',
  heroSubtitle:
    'At IdeaCircuit, we transform ideas into meaningful digital experiences through thoughtful website design, compelling visual communication and intelligent automation.',
  heroPrimaryCta: 'Explore Our Work',
  heroSecondaryCta: "Let's Talk",
  heroDisplayMode: 'collage',
  heroScreenshotUrl: '',
  heroWebImage: STUDIO_IMAGES.heroWebShowcase,
  heroGraphicImage: STUDIO_IMAGES.heroBrandMerch,
  heroAutomationImage: STUDIO_IMAGES.aiAutomation,
  introHeadline: 'A multidisciplinary studio built for how modern businesses actually grow.',
  introLead:
    'Great digital presence rarely lives in one box. A persuasive website needs cohesive visual design to stay memorable—and intelligent automation behind the scenes so your team can respond faster.',
  introBody:
    'IdeaCircuit brings Website Design, Graphic Design, and AI Automation into one deliberate practice. We combine creative direction with structured problem-solving so businesses look credible, communicate clearly, and operate smoothly.',
  aboutHeadline: 'Thoughtful design and practical automation, shaped around real businesses.',
  aboutSubtitle:
    'IdeaCircuit is a creative digital studio uniting Website Design, Graphic Design, and AI Automation to help businesses present their work clearly and run more smoothly.',
  ctaHeadline: 'Have a website, brand campaign, or workflow challenge in mind?',
  ctaSubtitle:
    'Tell us what you are building or trying to simplify. We will respond with thoughtful next steps tailored to your goals.',
  footerTagline:
    'A creative digital studio combining Website Design, Graphic Design, and AI Automation to build clear, memorable experiences for modern businesses.',
  contactEmail: 'yemipresh2010@gmail.com',
  whatsappNumber: '08136290176',
  phoneNumber: '08136290176',
};

export const FORME_PORTFOLIO_PROJECT: PortfolioProject = {
  id: 'forme-everyday-redefined',
  title: 'FORME — Everyday, Redefined.',
  category: 'Website Design',
  projectType: 'Client Project',
  year: '2026',
  image: STUDIO_IMAGES.formeHeroScreenshot,
  imageAlt:
    'Hero section screenshot of FORME — Everyday, Redefined contemporary fashion e-commerce website',
  shortDescription:
    'Contemporary fashion e-commerce storefront designed with editorial split-screen hero storytelling, refined typography, and NGN pricing support.',
  overview:
    'Designed and built as an editorial contemporary essentials storefront for FORME, pairing split-screen hero composition, clean collection navigation, and accessible shopping journeys across desktop and mobile.',
  creativeApproach:
    'We combined calm architectural lookbook photography with crisp monochrome UI controls and generous whitespace so every garment and collection callout stands out clearly.',
  deliverables: [
    'Responsive E-Commerce Storefront',
    'Split-Screen Hero Design',
    'Collection & Product Architecture',
    'Live Production Deployment',
  ],
  outcomeFocus:
    'Live contemporary essentials storefront deployed at ideacircuit-gamma.vercel.app.',
  liveUrl: 'https://ideacircuit-gamma.vercel.app/',
  featured: true,
  fromCms: true,
};

export const SEREIN_PORTFOLIO_PROJECT: PortfolioProject = {
  id: 'serein-skin-co',
  title: 'SEREIN SKIN CO. — Thoughtful Skincare.',
  category: 'Website Design',
  projectType: 'Client Project',
  year: '2026',
  image: STUDIO_IMAGES.sereinHeroScreenshot,
  imageAlt:
    'Hero section screenshot of SEREIN SKIN CO. botanical skincare e-commerce website',
  shortDescription:
    'Botanical skincare e-commerce storefront crafted with editorial serif typography, calm ritual storytelling, and NGN shopping workflows.',
  overview:
    'Designed and built as an intentional skincare e-commerce storefront for SEREIN SKIN CO., pairing editorial serif display typography with clear collection navigation, ingredient transparency, and effortless shopping journeys.',
  creativeApproach:
    'We combined serene botanical off-white surfaces and deep forest-green calls to action with warm natural lifestyle photography and scannable daily ritual highlights.',
  deliverables: [
    'Responsive E-Commerce Storefront',
    'Editorial Hero & Ritual Storytelling',
    'Ingredient & Collection Architecture',
    'Live Production Deployment',
  ],
  outcomeFocus:
    'Live botanical skincare storefront deployed at serein-sandy.vercel.app.',
  liveUrl: 'https://serein-sandy.vercel.app/',
  featured: true,
  fromCms: true,
};

export const CAPTURED_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  SEREIN_PORTFOLIO_PROJECT,
  FORME_PORTFOLIO_PROJECT,
];

export function formatWhatsAppUrl(phone: string, prefillText?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const normalized =
    digits.length === 11 && digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
  const base = `https://wa.me/${normalized || '2348136290176'}`;
  if (!prefillText) return base;
  return `${base}?text=${encodeURIComponent(prefillText)}`;
}

export function formatPhoneHref(phone: string): string {
  const clean = (phone || '08136290176').replace(/[^\d+]/g, '');
  return `tel:${clean || '08136290176'}`;
}

export const SERVICES: ServiceDetail[] = [
  {
    id: 'website-design',
    slug: 'website-design',
    number: '01',
    name: 'Website Design',
    tagline: 'Clear, responsive digital storefronts and business websites built to earn trust.',
    summary:
      'We design and build modern business websites, e-commerce concepts, and focused landing pages that make your offer effortless to understand and act on.',
    description:
      'Your website is often the first real conversation a prospective customer has with your business. We structure typography, layout pacing, responsive grids, and interactive flows so visitors immediately grasp what you do and feel confident taking the next step across desktop, tablet, and mobile.',
    image: STUDIO_IMAGES.webEcommerce,
    imageAlt:
      'Three responsive website design browser windows showing a business landing page, e-commerce storefront, and mobile layout',
    secondaryImage: STUDIO_IMAGES.heroWebShowcase,
    secondaryImageAlt:
      'Desktop monitor and smartphone showcasing a modern responsive website design with lime call-to-action buttons',
    deliverables: [
      'Custom Multi-Page Business Websites',
      'E-Commerce Storefront Concepts & Product Architecture',
      'High-Converting Campaign Landing Pages',
      'Responsive Desktop, Tablet & Mobile Layouts',
      'Interactive UI Prototypes & Design Systems',
      'Accessible Front-End Development & Performance Tuning',
    ],
    benefits: [
      {
        title: 'Immediate Credibility',
        detail:
          'Intentional hierarchy and crisp visual polish communicate professionalism within seconds of arrival.',
      },
      {
        title: 'Effortless Navigation Across Devices',
        detail:
          'Every layout adapts purposefully to phones, tablets, and wide monitors rather than simply shrinking desktop blocks.',
      },
      {
        title: 'Structured For Conversion',
        detail:
          'Clear calls to action and scannable storytelling guide visitors naturally toward inquiries or purchases.',
      },
    ],
    showcaseHighlights: [
      'Modern Business Websites',
      'E-Commerce Concepts',
      'Responsive Layouts',
      'Landing Pages',
    ],
  },
  {
    id: 'graphic-design',
    slug: 'graphic-design',
    number: '02',
    name: 'Graphic Design',
    tagline: 'Cohesive visual identities, campaigns, and packaging that people remember.',
    summary:
      'From brand identity foundations and packaging to social media and advertising graphics, we shape visual systems that stand apart in crowded feeds and physical spaces.',
    description:
      'Strong graphic design gives a business a recognizable voice before a single word is read. Whether art-directing multi-format campaign posters and botanical skincare ads, designing retail packaging, or building full brand identity guidelines, we combine typographic discipline with expressive visual storytelling.',
    image: STUDIO_IMAGES.skincareCampaign,
    imageAlt:
      'Commercial graphic design showcase featuring advertising posters, social ad formats, and botanical skincare product packaging',
    secondaryImage: STUDIO_IMAGES.editorialPackaging,
    secondaryImageAlt:
      'Editorial print layout spread, custom packaging box, and graphic brand merchandise on a design workbench',
    deliverables: [
      'Brand Identity & Visual Guidelines',
      'Social Media Campaign Graphics & Templates',
      'Product & Advertising Campaign Art Direction',
      'Packaging & Merchandise Visual Systems',
      'Promotional Print & Digital Collateral',
      'Typographic Direction & Custom Visual Assets',
    ],
    benefits: [
      {
        title: 'Consistent Brand Recognition',
        detail:
          'Unified typography, colour restraint, and art direction ensure every touchpoint feels unmistakably yours.',
      },
      {
        title: 'Campaign-Ready Visuals',
        detail:
          'Designed to perform cleanly across product launches, social channels, print collateral, and web headers.',
      },
      {
        title: 'Distinctive Market Positioning',
        detail:
          'Move beyond generic templates with tactile, deliberate visual craft tailored to your audience.',
      },
    ],
    showcaseHighlights: [
      'Brand Identity',
      'Advertising Campaigns',
      'Social Media Design',
      'Packaging & Merch',
    ],
  },
  {
    id: 'ai-automation',
    slug: 'ai-automation',
    number: '03',
    name: 'AI Automation',
    tagline: 'Calm, practical workflow systems that remove repetitive manual busywork.',
    summary:
      'We connect your everyday tools and design intelligent workflows that route inquiries, organize information, and keep operations moving without constant manual effort.',
    description:
      'Automation should feel like quiet relief, not a complicated engineering manual. We map where your team loses hours to repetitive copying, sorting, follow-ups, and reporting—then build reliable, human-friendly workflows and clear dashboards that fit naturally into how your business already works.',
    image: STUDIO_IMAGES.aiAutomationOps,
    imageAlt:
      'AI business automation end-to-end pipeline connecting lead intake, AI summary, smart routing, and team notifications',
    secondaryImage: STUDIO_IMAGES.aiAutomation,
    secondaryImageAlt:
      'Visual workflow builder interface connecting form triggers, AI lead analysis, CRM sync, and automated follow-up',
    deliverables: [
      'End-to-End Business Workflow Mapping',
      'Lead Intake, Qualification & CRM Routing',
      'AI-Assisted Triage, Summarization & Drafting',
      'Cross-Tool Data Sync & Process Integrations',
      'Clear Operational & Workflow Dashboards',
      'Human-in-the-Loop Review & Handoff Controls',
    ],
    benefits: [
      {
        title: 'Hours Reclaimed Every Week',
        detail:
          'Eliminate repetitive copy-paste tasks across forms, spreadsheets, inboxes, and project boards.',
      },
      {
        title: 'Faster, More Reliable Follow-Through',
        detail:
          'Customer inquiries, onboarding steps, and internal updates happen consistently without slipping through cracks.',
      },
      {
        title: 'Built Around People, Not Hype',
        detail:
          'Plain-language controls and transparent oversight keep your team confidently in charge of every workflow.',
      },
    ],
    showcaseHighlights: [
      'Workflow Dashboards',
      'Process Integrations',
      'Intelligent Routing',
      'AI-Powered Operations',
    ],
  },
];

export const AUTOMATION_SCENARIOS: AutomationScenario[] = [
  {
    id: 'lead-triage',
    title: 'Client Inquiry & Lead Routing',
    trigger: 'A prospective client submits a website contact or project brief form.',
    intelligentStep:
      'Submission details are categorized by service type, summarized into a clean brief, and matched to the right onboarding checklist.',
    businessOutcome:
      'Your team opens one organized summary card instead of digging through scattered emails.',
    toolsConnected: 'Web Form · AI Classification · CRM / Project Board · Notification',
  },
  {
    id: 'client-onboarding',
    title: 'Seamless Client Onboarding Flow',
    trigger: 'A project proposal is approved or marked ready to begin.',
    intelligentStep:
      'Welcome materials, shared workspace folders, kickoff agenda drafts, and intake reminders are prepared automatically.',
    businessOutcome:
      'Every new client receives a polished, punctual kickoff experience with zero manual checklist setup.',
    toolsConnected: 'Proposal Status · Document Templates · Shared Drive · Calendar',
  },
  {
    id: 'content-ops',
    title: 'Weekly Operations & Campaign Digest',
    trigger: 'Every Monday morning or whenever campaign milestones update.',
    intelligentStep:
      'Metrics, active deliverables, and pending review items from multiple tools are distilled into one readable executive snapshot.',
    businessOutcome:
      'Decision-makers start the week with complete clarity in two minutes—no manual spreadsheet compilation.',
    toolsConnected: 'Analytics · Task Tracker · AI Digest · Team Dashboard',
  },
];

export const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Discovery & Alignment',
    description:
      'We listen closely to how your business operates, who you serve, and where better design or smoother workflows will create the clearest impact.',
  },
  {
    number: '02',
    title: 'Creative & System Direction',
    description:
      'We define the visual language, page structure, or automation blueprint—sharing concrete concepts early so decisions stay grounded and collaborative.',
  },
  {
    number: '03',
    title: 'Craft, Build & Integration',
    description:
      'Whether designing responsive web interfaces, producing brand visuals, or connecting workflow tools, every detail is built for clarity and reliability.',
  },
  {
    number: '04',
    title: 'Review, Launch & Support',
    description:
      'We test across devices and real scenarios, refine the final details with you, and hand over a clean, maintainable system ready for everyday use.',
  },
];
