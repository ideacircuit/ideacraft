import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, PhoneCall} from 'lucide-react';
import {
  PROCESS_STEPS,
  SERVICES,
  type PortfolioProject,
} from '../data/studioData';
import {useStudio} from '../context/StudioContext';
import {StudioImage} from '../components/StudioImage';
import {ProjectModal} from '../components/ProjectModal';

const MARQUEE_ITEMS = [
  'Website Design',
  'Visual Identity',
  'Intelligent Automation',
  'Brand Campaigns',
  'Digital Strategy',
  'Workflow Systems',
];

const WHY_CHOOSE_PILLARS = [
  {
    number: '01',
    title: 'Design Anchored in Business Clarity',
    description:
      'Every headline, page hierarchy, and visual system is structured so customers immediately understand what you offer and why it matters.',
  },
  {
    number: '02',
    title: 'Web, Brand & Automation Together',
    description:
      'Instead of coordinating separate freelancers who work in silos, your website, visual identity, and backend workflows are designed as one connected system.',
  },
  {
    number: '03',
    title: 'Practical, Approachable Automation',
    description:
      'We build reliable workflows that reduce manual busywork without burying your team in complex jargon or fragile setups.',
  },
  {
    number: '04',
    title: 'Direct, Thoughtful Collaboration',
    description:
      'From initial framing to final delivery, you work closely with a focused studio that values clear communication and dependable follow-through.',
  },
];

export function HomePage() {
  const {siteSettings, allProjects, testimonials} = useStudio();
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Show admin-uploaded featured/recent projects when published from Studio Admin
  const featuredProjects = useMemo(() => {
    const featured = allProjects.filter((p) => p.featured);
    return (featured.length > 0 ? featured : allProjects).slice(0, 3);
  }, [allProjects]);

  const visibleTestimonials = useMemo(() => {
    const featured = testimonials.filter((t) => t.featured);
    return (featured.length > 0 ? featured : testimonials).slice(0, 6);
  }, [testimonials]);

  return (
    <>
      {/* 1. Split-Screen Editorial Hero */}
      <section className="relative overflow-hidden border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Side: Editorial Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-[#52524E]">
                {siteSettings.heroLabel}
              </p>

              <h1
                className="font-display font-bold tracking-tight text-[#111111] leading-[1.03] text-balance"
                style={{fontSize: 'clamp(2.35rem, 4.3vw, 4.1rem)'}}
              >
                {siteSettings.heroHeadline}
              </h1>

              <p className="text-base sm:text-lg text-[#52524E] leading-relaxed max-w-xl">
                {siteSettings.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/portfolio"
                  className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full transition-colors duration-150 whitespace-nowrap"
                >
                  <span>{siteSettings.heroPrimaryCta}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#111111] text-[#111111] hover:text-white border border-black/15 text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full transition-colors duration-150 whitespace-nowrap"
                >
                  <span>{siteSettings.heroSecondaryCta}</span>
                </Link>
              </div>

              <div className="pt-1">
                <Link
                  to="/book-call"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#111111] hover:text-[#52524E] transition-colors"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    Prefer to talk? Book a Phone or WhatsApp Call (
                    <span className="font-mono">{siteSettings.phoneNumber}</span>)
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Right Side: Art-Directed Multi-Discipline Collage OR Custom Hero Screenshot */}
            <div className="lg:col-span-6">
              {siteSettings.heroDisplayMode === 'screenshot' &&
              siteSettings.heroScreenshotUrl ? (
                <div className="bg-white rounded-3xl border border-black/10 p-3 shadow-sm">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#E3E3DF]">
                    <StudioImage
                      src={siteSettings.heroScreenshotUrl}
                      alt="IdeaCircuit featured studio showcase"
                      loading="eager"
                      fallbackTitle="IdeaCircuit Showcase"
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative mx-auto max-w-[580px] lg:max-w-none">
                  {/* Subtle lime organic accent ring echoing studio identity */}
                  <svg
                    viewBox="0 0 180 180"
                    fill="none"
                    aria-hidden="true"
                    className="hidden sm:block absolute -top-6 -left-6 w-32 h-32 text-[#B9F53A] pointer-events-none z-0"
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="76"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray="16 14"
                    />
                  </svg>

                  <div className="relative z-10 grid grid-cols-12 gap-4 sm:gap-5 items-end">
                    {/* Website Design Mockup Card */}
                    <div className="col-span-7 bg-white rounded-2xl border border-black/10 p-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#E3E3DF]">
                        <StudioImage
                          src={siteSettings.heroWebImage}
                          alt="Desktop monitor and smartphone showing a responsive Website Design layout"
                          loading="eager"
                          fallbackTitle="Website Design"
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="pt-2.5 px-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#111111]">Website Design</span>
                        <span className="text-[#52524E]">Desktop & Mobile</span>
                      </div>
                    </div>

                    {/* Graphic Design Editorial Portrait Card */}
                    <div className="col-span-5 bg-white rounded-2xl border border-black/10 p-2.5 shadow-sm transition-transform duration-200 hover:-translate-y-1">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#E3E3DF]">
                        <StudioImage
                          src={siteSettings.heroGraphicImage}
                          alt="Graphic Design brand identity guidelines, colour swatches, and typographic posters"
                          loading="eager"
                          fallbackTitle="Graphic Design"
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="pt-2.5 px-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#111111]">Graphic Design</span>
                        <span className="text-[#52524E]">Brand Systems</span>
                      </div>
                    </div>

                    {/* AI Automation Studio Card spanning bottom */}
                    <div className="col-span-12 bg-[#111111] text-white rounded-2xl border border-black/15 p-3 sm:p-4 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-5 aspect-[16/10] sm:aspect-[4/3] rounded-xl overflow-hidden bg-[#1D1D1B]">
                          <StudioImage
                            src={siteSettings.heroAutomationImage}
                            alt="AI Automation node-based workflow builder interface"
                            loading="eager"
                            fallbackTitle="AI Automation"
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        </div>
                        <div className="sm:col-span-7 space-y-2 pr-2">
                          <p className="text-xs font-medium text-[#B9F53A]">
                            AI Automation · Workflow Architecture
                          </p>
                          <p className="font-display text-lg font-semibold leading-snug text-white">
                            Connected intake, routing, and business operations.
                          </p>
                          <p className="text-xs text-neutral-300 leading-relaxed">
                            Thoughtful workflow systems engineered to save hours without adding complexity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Marquee Strip */}
      <div
        className="bg-[#111111] text-[#EDEDEB] border-b border-white/10 py-3.5 overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              className="flex items-center gap-6 px-3 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap"
            >
              <span>{item}</span>
              <span className="text-[#B9F53A]">—</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Introduction to IdeaCircuit */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                About the Studio
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] mt-2 text-balance">
                {siteSettings.introHeadline}
              </h2>
            </div>

            <div className="lg:col-span-8 space-y-5 lg:pl-8">
              <p className="text-lg sm:text-xl text-[#111111] leading-relaxed font-medium">
                {siteSettings.introLead}
              </p>
              <p className="text-base text-[#52524E] leading-relaxed max-w-2xl">
                {siteSettings.introBody}
              </p>
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] border-b-2 border-[#111111] pb-1 hover:border-[#B9F53A] transition-colors"
                >
                  <span>Read our story and approach</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Service Showcase (Asymmetric Bento Grid) */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                Core Capabilities
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
                Three complementary disciplines under one roof.
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] hover:text-[#52524E] transition-colors whitespace-nowrap"
            >
              <span>Explore all services</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {SERVICES.map((service, index) => {
              const spanClass = index === 0 ? 'lg:col-span-12' : 'lg:col-span-6';
              const isFeaturedRow = index === 0;

              return (
                <article
                  key={service.id}
                  className={`${spanClass} bg-white rounded-2xl border border-black/10 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5`}
                >
                  <div
                    className={
                      isFeaturedRow
                        ? 'grid grid-cols-1 lg:grid-cols-12 items-stretch'
                        : 'flex flex-col h-full'
                    }
                  >
                    <div
                      className={
                        isFeaturedRow
                          ? 'lg:col-span-7 bg-[#E3E3DF] aspect-[16/9] lg:aspect-auto lg:min-h-[380px] overflow-hidden'
                          : 'bg-[#E3E3DF] aspect-[16/9] overflow-hidden'
                      }
                    >
                      <StudioImage
                        src={service.image}
                        alt={service.imageAlt}
                        fallbackTitle={service.name}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                      />
                    </div>

                    <div
                      className={
                        isFeaturedRow
                          ? 'lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6'
                          : 'p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6'
                      }
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
                          <span className="font-mono tabular-nums">{service.number}</span>
                          <span aria-hidden="true">·</span>
                          <span>{service.showcaseHighlights.slice(0, 2).join(' / ')}</span>
                        </div>
                        <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
                          {service.name}
                        </h3>
                        <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
                          {service.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-black/10 flex items-center justify-between gap-4">
                        <Link
                          to={`/services#${service.slug}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#111111] hover:text-[#52524E] transition-colors"
                        >
                          <span>See {service.name} details</span>
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Selected Portfolio Preview (Automatically appears when uploaded in Studio Admin) */}
      {featuredProjects.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-medium tracking-wide text-[#52524E]">
                  Selected Work
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
                  Recent work across web, visual identity, and automation.
                </h2>
              </div>
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#2A2A27] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <span>View Full Portfolio</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="group text-left bg-white rounded-2xl border border-black/10 overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] cursor-pointer"
                >
                  <div className="aspect-[4/3] w-full bg-[#E3E3DF] overflow-hidden">
                    <StudioImage
                      src={project.image}
                      alt={project.imageAlt}
                      fallbackTitle={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
                        <span>{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.projectType}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold tracking-tight text-[#111111] group-hover:underline decoration-2 underline-offset-4">
                        {project.title}
                      </h3>
                      <p className="text-sm text-[#52524E] leading-relaxed">
                        {project.shortDescription}
                      </p>
                    </div>
                    <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
                      <span>Inspect Project</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Why Clients Choose IdeaCircuit */}
      <section className="bg-[#111111] text-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-medium tracking-wide text-[#B9F53A]">
                Why IdeaCircuit
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                Creative direction backed by practical systems thinking.
              </h2>
              <p className="text-base text-neutral-300 leading-relaxed max-w-md">
                We focus on work that feels unmistakably human on the surface and runs dependably underneath—helping businesses save time while raising the bar on how they present themselves.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {WHY_CHOOSE_PILLARS.map((pillar) => (
                <div
                  key={pillar.number}
                  className="bg-[#1A1A19] border border-white/10 rounded-2xl p-6 space-y-3"
                >
                  <span className="font-mono text-xs font-medium text-[#B9F53A] tabular-nums">
                    {pillar.number}
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-tight text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Process Section */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium tracking-wide text-[#52524E]">
              How We Work
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
              A clear, collaborative four-step process from first idea to launch.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl border border-black/10 p-6 flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#EDEDEB] font-mono text-xs font-semibold text-[#111111] tabular-nums">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-[#111111]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#52524E] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Client Testimonials (Automatically appears once uploaded in Admin Dashboard) */}
      {visibleTestimonials.length > 0 && (
        <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                Client Feedback
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
                Words from businesses we have partnered with.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleTestimonials.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-black/10 p-6 sm:p-7 flex flex-col justify-between gap-6"
                >
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-[#52524E]">
                      {item.serviceCategory}
                    </p>
                    <p className="text-sm sm:text-base text-[#111111] leading-relaxed">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                  </div>
                  <div className="pt-4 border-t border-black/10 flex items-center gap-3">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.clientName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-black/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#EDEDEB] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                        {item.clientName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs">
                      <p className="font-semibold text-[#111111]">{item.clientName}</p>
                      <p className="text-[#52524E]">
                        {item.role}, {item.company}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Strong Final CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-[#111111] text-white rounded-3xl p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs font-medium tracking-wide text-[#B9F53A]">
                Start a Conversation
              </p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white text-balance">
                {siteSettings.ctaHeadline}
              </h2>
              <p className="text-base text-neutral-300 leading-relaxed max-w-2xl">
                {siteSettings.ctaSubtitle}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-base font-semibold px-7 py-4 rounded-full transition-colors whitespace-nowrap"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/book-call"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-base font-semibold px-6 py-4 rounded-full transition-colors whitespace-nowrap"
              >
                <PhoneCall className="w-4 h-4 text-[#B9F53A]" aria-hidden="true" />
                <span>Book a Call</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}
