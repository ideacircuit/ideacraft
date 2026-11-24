import {useEffect, useRef, useState} from 'react';
import {Link, NavLink, Outlet, useLocation} from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  PhoneCall,
  X,
} from 'lucide-react';
import {useStudio} from '../context/StudioContext';
import {formatPhoneHref, formatWhatsAppUrl} from '../data/studioData';
import {SuggestionBoxWidget} from './SuggestionBoxWidget';

const SERVICE_SUBLINKS = [
  {label: 'Website Design', to: '/services#website-design'},
  {label: 'Graphic Design', to: '/services#graphic-design'},
  {label: 'AI Automation', to: '/services#ai-automation'},
];

const ROUTE_TITLES: Record<string, {title: string; description: string}> = {
  '/': {
    title: 'IdeaCircuit — Creative Digital Studio | Website Design, Graphic Design & AI Automation',
    description:
      'At IdeaCircuit, we transform ideas into meaningful digital experiences through thoughtful website design, compelling visual communication, and intelligent automation.',
  },
  '/about': {
    title: 'About IdeaCircuit — Philosophy, Approach & Studio Values',
    description:
      'Learn about IdeaCircuit: our philosophy combining design clarity, visual craft, and practical AI automation for modern businesses.',
  },
  '/services': {
    title: 'Services — Website Design, Graphic Design & AI Automation | IdeaCircuit',
    description:
      'Explore IdeaCircuit capabilities across Website Design, Graphic Design, and AI Automation workflows.',
  },
  '/portfolio': {
    title: 'Portfolio — Selected Studio Concepts & Explorations | IdeaCircuit',
    description:
      'Browse curated Website Design, Graphic Design, and AI Automation concepts by IdeaCircuit.',
  },
  '/contact': {
    title: 'Contact IdeaCircuit — Start a Project Discussion',
    description:
      'Get in touch with IdeaCircuit to discuss website design, graphic design, or AI automation for your business.',
  },
  '/book-call': {
    title: 'Book a Call — Phone or WhatsApp Consultation | IdeaCircuit',
    description:
      'Schedule a Phone Call or WhatsApp Call with IdeaCircuit on 08136290176 to discuss website design, graphic design, or AI automation.',
  },
};

export function IdeaCircuitMark({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#111111" />
      <path
        d="M10 16C10 12.6863 12.6863 10 16 10H22V14H16C14.8954 14 14 14.8954 14 16C14 17.1046 14.8954 18 16 18H22V22H16C12.6863 22 10 19.3137 10 16Z"
        fill="#B9F53A"
      />
      <circle cx="21" cy="16" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

export function Layout() {
  const location = useLocation();
  const {siteSettings} = useStudio();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Sync document title, meta description, and handle anchor/scroll restoration
  useEffect(() => {
    const meta = ROUTE_TITLES[location.pathname] ?? ROUTE_TITLES['/'];
    document.title = meta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', meta.description);
    }

    setServicesOpen(false);
    setMobileOpen(false);
    setSuggestionOpen(false);

    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      window.requestAnimationFrame(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      });
    } else {
      window.scrollTo({top: 0, behavior: 'auto'});
    }
  }, [location.pathname, location.hash]);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServicesOpen(false);
        setMobileOpen(false);
        setSuggestionOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const handleDropdownEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setServicesOpen(true);
  };

  const handleDropdownLeave = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setServicesOpen(false);
    }, 140);
  };

  const navLinkClass = ({isActive}: {isActive: boolean}) =>
    `relative py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] ${
      isActive
        ? 'text-[#111111] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-[#111111]'
        : 'text-[#52524E] hover:text-[#111111]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#EDEDEB] text-[#111111]">
      {/* Sticky 3-Zone Header */}
      <header className="sticky top-0 z-40 h-16 bg-[#EDEDEB]/92 backdrop-blur-md border-b border-black/10">
        <div className="max-w-[1360px] mx-auto h-full px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
          >
            <IdeaCircuitMark className="w-7 h-7 shrink-0" />
            <span className="font-display text-base sm:text-xl font-bold tracking-tight text-[#111111]">
              IdeaCircuit
            </span>
          </Link>

          {/* Zone 2: Primary Navigation (5 items in exact order) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-4 lg:gap-7"
          >
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>

            {/* Services Dropdown */}
            <div
              ref={dropdownRef}
              className="relative flex items-center"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <NavLink
                to="/services"
                className={({isActive}) =>
                  `relative py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] ${
                    isActive
                      ? 'text-[#111111] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-[#111111]'
                      : 'text-[#52524E] hover:text-[#111111]'
                  }`
                }
              >
                <span>Services</span>
              </NavLink>
              <button
                type="button"
                aria-label="Toggle Services menu"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((prev) => !prev)}
                className="ml-0.5 p-1 text-[#52524E] hover:text-[#111111] transition-colors focus-visible:outline-2 focus-visible:outline-[#111111] rounded"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    servicesOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {servicesOpen && (
                <div
                  role="menu"
                  aria-label="IdeaCircuit Services"
                  className="absolute left-0 top-full pt-3 w-56 z-50"
                >
                  <div className="bg-white border border-black/10 rounded-xl shadow-lg py-2 overflow-hidden">
                    {SERVICE_SUBLINKS.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        role="menuitem"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#EDEDEB] transition-colors"
                      >
                        <span>{sub.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#52524E]" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/portfolio" className={navLinkClass}>
              Portfolio
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
          </nav>

          {/* Zone 3: AI Suggestion Box Text Button + Primary Action + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSuggestionOpen((prev) => !prev);
              }}
              aria-expanded={suggestionOpen}
              className={`inline-flex items-center justify-center rounded-full border px-3 sm:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${
                suggestionOpen
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white hover:bg-[#111111] text-[#111111] hover:text-white border-black/15'
              }`}
            >
              AI Suggestion Box
            </button>

            <Link
              to="/contact"
              className="hidden md:inline-flex items-center justify-center bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs lg:text-sm font-semibold px-4 lg:px-5 py-2 lg:py-2.5 rounded-full transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
            >
              Start a Project
            </Link>

            <button
              type="button"
              onClick={() => {
                setSuggestionOpen(false);
                setMobileOpen((prev) => !prev);
              }}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden w-11 h-11 inline-flex items-center justify-center rounded-full border border-black/15 bg-white text-[#111111] hover:bg-[#E3E3DF] transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-[#EDEDEB] border-b border-black/10 px-4 py-6 shadow-xl">
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
              <NavLink
                to="/"
                end
                onClick={() => setMobileOpen(false)}
                className={({isActive}) =>
                  `px-3 py-3 text-base font-medium rounded-lg ${
                    isActive ? 'bg-white text-[#111111]' : 'text-[#111111]'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                onClick={() => setMobileOpen(false)}
                className={({isActive}) =>
                  `px-3 py-3 text-base font-medium rounded-lg ${
                    isActive ? 'bg-white text-[#111111]' : 'text-[#111111]'
                  }`
                }
              >
                About
              </NavLink>

              <div>
                <div className="flex items-center justify-between">
                  <NavLink
                    to="/services"
                    onClick={() => setMobileOpen(false)}
                    className={({isActive}) =>
                      `flex-1 px-3 py-3 text-base font-medium rounded-lg ${
                        isActive ? 'bg-white text-[#111111]' : 'text-[#111111]'
                      }`
                    }
                  >
                    Services
                  </NavLink>
                  <button
                    type="button"
                    aria-expanded={mobileServicesOpen}
                    aria-label="Expand Services sub-links"
                    onClick={() => setMobileServicesOpen((prev) => !prev)}
                    className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-[#111111]"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        mobileServicesOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {mobileServicesOpen && (
                  <div className="pl-4 mt-1 flex flex-col gap-1 border-l border-black/15 ml-4">
                    {SERVICE_SUBLINKS.map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2.5 text-sm font-medium text-[#52524E] hover:text-[#111111]"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/portfolio"
                onClick={() => setMobileOpen(false)}
                className={({isActive}) =>
                  `px-3 py-3 text-base font-medium rounded-lg ${
                    isActive ? 'bg-white text-[#111111]' : 'text-[#111111]'
                  }`
                }
              >
                Portfolio
              </NavLink>
              <NavLink
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className={({isActive}) =>
                  `px-3 py-3 text-base font-medium rounded-lg ${
                    isActive ? 'bg-white text-[#111111]' : 'text-[#111111]'
                  }`
                }
              >
                Contact
              </NavLink>

              <div className="pt-4 mt-2 border-t border-black/10 space-y-2.5">
                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center justify-center bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-base font-semibold px-6 py-3.5 rounded-full transition-colors"
                >
                  Start a Project
                </Link>
                <Link
                  to="/book-call"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#E3E3DF] border border-black/15 text-[#111111] text-base font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  <PhoneCall className="w-4 h-4" aria-hidden="true" />
                  <span>Book a Call</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Active Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Studio Footer */}
      <footer className="bg-[#111111] text-white border-t border-white/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <IdeaCircuitMark className="w-7 h-7" />
                <span className="font-display text-xl font-bold tracking-tight text-white">
                  IdeaCircuit
                </span>
              </Link>
              <p className="text-sm text-neutral-300 leading-relaxed max-w-sm">
                {siteSettings.footerTagline}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
                >
                  <span>Discuss a Project</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/book-call"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
                >
                  <PhoneCall className="w-4 h-4 text-[#B9F53A]" aria-hidden="true" />
                  <span>Book a Call</span>
                </Link>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <p className="text-xs font-medium tracking-wide text-neutral-400">Navigation</p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/" className="text-neutral-200 hover:text-[#B9F53A] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    to="/portfolio"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/book-call"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Book a Call
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <p className="text-xs font-medium tracking-wide text-neutral-400">
                Services & Direct Contact
              </p>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/services#website-design"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Website Design
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services#graphic-design"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    Graphic Design
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services#ai-automation"
                    className="text-neutral-200 hover:text-[#B9F53A] transition-colors"
                  >
                    AI Automation
                  </Link>
                </li>
              </ul>

              <div className="pt-3 space-y-2 border-t border-white/10">
                <a
                  href={`mailto:${siteSettings.contactEmail}`}
                  className="flex items-center gap-2 text-xs text-neutral-200 hover:text-[#B9F53A] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B9F53A] shrink-0" aria-hidden="true" />
                  <span>{siteSettings.contactEmail}</span>
                </a>
                <a
                  href={formatPhoneHref(siteSettings.phoneNumber)}
                  className="flex items-center gap-2 text-xs text-neutral-200 hover:text-[#B9F53A] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#B9F53A] shrink-0" aria-hidden="true" />
                  <span className="font-mono">Phone: {siteSettings.phoneNumber}</span>
                </a>
                <a
                  href={formatWhatsAppUrl(
                    siteSettings.whatsappNumber,
                    'Hello IdeaCircuit, I would like to discuss a project.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-neutral-200 hover:text-[#B9F53A] transition-colors"
                >
                  <MessageCircle
                    className="w-3.5 h-3.5 text-[#B9F53A] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-mono">WhatsApp: {siteSettings.whatsappNumber}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400">
            <p>© {new Date().getFullYear()} IdeaCircuit. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <span>Website Design · Graphic Design · AI Automation</span>
              <span aria-hidden="true">·</span>
              <Link
                to="/admin"
                className="text-neutral-300 hover:text-[#B9F53A] transition-colors font-medium"
              >
                Studio Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <SuggestionBoxWidget
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
      />
    </div>
  );
}
