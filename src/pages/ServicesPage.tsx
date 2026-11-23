import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ArrowUpRight, Check} from 'lucide-react';
import {AUTOMATION_SCENARIOS, SERVICES, STUDIO_IMAGES} from '../data/studioData';
import {StudioImage} from '../components/StudioImage';

export function ServicesPage() {
  const [activeScenarioId, setActiveScenarioId] = useState(AUTOMATION_SCENARIOS[0].id);
  const activeScenario =
    AUTOMATION_SCENARIOS.find((s) => s.id === activeScenarioId) ?? AUTOMATION_SCENARIOS[0];

  const webService = SERVICES[0];
  const graphicService = SERVICES[1];
  const automationService = SERVICES[2];

  return (
    <>
      {/* Page Intro Header + Quick Jump Anchors */}
      <section className="py-12 sm:py-16 lg:py-20 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#52524E]">
              IdeaCircuit Services
            </p>
            <h1
              className="font-display font-bold tracking-tight text-[#111111] leading-[1.04] text-balance"
              style={{fontSize: 'clamp(2.25rem, 4vw, 3.85rem)'}}
            >
              Three focused services designed to elevate how your business looks and works.
            </h1>
            <p className="text-base sm:text-lg text-[#52524E] leading-relaxed max-w-2xl">
              Whether you need a responsive business website, distinctive visual design, or intelligent automation that gives your team time back, each service can stand alone or work seamlessly together.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {SERVICES.map((svc) => (
              <a
                key={svc.id}
                href={`#${svc.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#111111] text-[#111111] hover:text-white border border-black/10 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <span className="font-mono text-xs opacity-70 tabular-nums">{svc.number}</span>
                <span>{svc.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE 1: WEBSITE DESIGN */}
      <section id="website-design" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
                <span className="font-mono tabular-nums">{webService.number}</span>
                <span aria-hidden="true">·</span>
                <span>Digital Presence & Storefronts</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                {webService.name}
              </h2>
              <p className="text-lg font-medium text-[#111111] leading-snug">
                {webService.tagline}
              </p>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <p className="text-base text-[#52524E] leading-relaxed">
                {webService.description}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#111111] pt-1">
                {webService.showcaseHighlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Website Design Visual Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-black/10 overflow-hidden">
              <div className="aspect-[16/9] w-full bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.webEcommerce}
                  alt={webService.imageAlt}
                  fallbackTitle="Responsive E-Commerce & Business Websites"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="px-6 py-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#52524E]">
                <span className="font-medium text-[#111111]">
                  Multi-device storefront & editorial layout architecture
                </span>
                <span>Desktop · Tablet · Mobile Responsive</span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-2xl border border-black/10 overflow-hidden flex flex-col">
              <div className="aspect-[4/3] lg:flex-1 bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.heroWebShowcase}
                  alt={webService.secondaryImageAlt ?? 'Website design studio mockup'}
                  fallbackTitle="Editorial Landing Page"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="px-6 py-4 border-t border-black/10 text-xs text-[#52524E]">
                <span className="font-medium text-[#111111] block">
                  Landing Pages & Service Portfolios
                </span>
                Focused storytelling designed around customer action
              </div>
            </div>
          </div>

          {/* Deliverables + Client Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-5">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Key Deliverables & Capabilities
              </h3>
              <ul className="space-y-3">
                {webService.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#111111]">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#B9F53A] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#111111]" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {webService.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl border border-black/10 p-6 space-y-2.5"
                >
                  <h4 className="font-display text-base font-bold text-[#111111]">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-[#52524E] leading-relaxed">{benefit.detail}</p>
                </div>
              ))}
              <div className="sm:col-span-3 pt-3 flex flex-wrap items-center justify-between gap-4 bg-[#111111] text-white rounded-2xl p-6">
                <p className="text-sm sm:text-base font-medium">
                  Planning a new business website, storefront, or landing page?
                </p>
                <Link
                  to="/contact?service=Website+Design"
                  className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
                >
                  <span>Start Website Inquiry</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE 2: GRAPHIC DESIGN */}
      <section id="graphic-design" className="scroll-mt-20 py-16 sm:py-20 lg:py-24 bg-white border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
                <span className="font-mono tabular-nums">{graphicService.number}</span>
                <span aria-hidden="true">·</span>
                <span>Visual Identity & Campaigns</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                {graphicService.name}
              </h2>
              <p className="text-lg font-medium text-[#111111] leading-snug">
                {graphicService.tagline}
              </p>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <p className="text-base text-[#52524E] leading-relaxed">
                {graphicService.description}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#111111] pt-1">
                {graphicService.showcaseHighlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Diverse Graphic Design Visual Showcase (Campaigns & Posters + Packaging & Print + Brand Identity) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#EDEDEB] rounded-2xl border border-black/10 overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.skincareCampaign}
                  alt={graphicService.imageAlt}
                  fallbackTitle="Advertising & Social Campaigns"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-5 space-y-1">
                <p className="font-display text-base font-bold text-[#111111]">
                  Advertising & Social Campaigns
                </p>
                <p className="text-xs text-[#52524E]">
                  Multi-format posters, social ad layouts, and product campaigns including botanical skincare.
                </p>
              </div>
            </div>

            <div className="bg-[#EDEDEB] rounded-2xl border border-black/10 overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.editorialPackaging}
                  alt={graphicService.secondaryImageAlt ?? 'Packaging and editorial print graphic design'}
                  fallbackTitle="Packaging & Print Design"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-5 space-y-1">
                <p className="font-display text-base font-bold text-[#111111]">
                  Packaging & Print Editorial
                </p>
                <p className="text-xs text-[#52524E]">
                  Editorial spreads, custom product packaging, and tactile brand collateral.
                </p>
              </div>
            </div>

            <div className="bg-[#EDEDEB] rounded-2xl border border-black/10 overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.heroBrandMerch}
                  alt="Complete graphic design brand guidelines, colour swatches, and print stationery"
                  fallbackTitle="Brand Identity Systems"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-5 space-y-1">
                <p className="font-display text-base font-bold text-[#111111]">
                  Brand Guidelines & Identity
                </p>
                <p className="text-xs text-[#52524E]">
                  Cohesive visual rulebooks, colour palettes, stationery, and typography systems.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-[#EDEDEB] rounded-2xl border border-black/10 p-6 sm:p-8 space-y-5">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Key Deliverables & Capabilities
              </h3>
              <ul className="space-y-3">
                {graphicService.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#111111]">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#B9F53A] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#111111]" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {graphicService.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-[#EDEDEB] rounded-2xl border border-black/10 p-6 space-y-2.5"
                >
                  <h4 className="font-display text-base font-bold text-[#111111]">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-[#52524E] leading-relaxed">{benefit.detail}</p>
                </div>
              ))}
              <div className="sm:col-span-3 pt-3 flex flex-wrap items-center justify-between gap-4 bg-[#111111] text-white rounded-2xl p-6">
                <p className="text-sm sm:text-base font-medium">
                  Looking to refresh your brand visuals, packaging, or social campaign?
                </p>
                <Link
                  to="/contact?service=Graphic+Design"
                  className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
                >
                  <span>Start Graphic Design Inquiry</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE 3: AI AUTOMATION */}
      <section id="ai-automation" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
                <span className="font-mono tabular-nums">{automationService.number}</span>
                <span aria-hidden="true">·</span>
                <span>Workflow Systems & Integrations</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                {automationService.name}
              </h2>
              <p className="text-lg font-medium text-[#111111] leading-snug">
                {automationService.tagline}
              </p>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <p className="text-base text-[#52524E] leading-relaxed">
                {automationService.description}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#111111] pt-1">
                {automationService.showcaseHighlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Automation Visual + Interactive Workflow Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-black/10 overflow-hidden flex flex-col justify-between">
              <div className="aspect-[16/9] w-full bg-[#E3E3DF]">
                <StudioImage
                  src={STUDIO_IMAGES.aiAutomationOps}
                  alt={automationService.imageAlt}
                  fallbackTitle="AI Workflow Orchestration"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full"
                />
              </div>
              <div className="p-6 border-t border-black/10 flex-1 flex flex-col justify-center gap-1.5 text-xs text-[#52524E]">
                <span className="font-display text-base font-bold text-[#111111] block">
                  End-to-End Business Automation Pipeline
                </span>
                <p className="text-sm text-[#52524E] leading-relaxed">
                  Lead intake, AI summarization, smart routing, and team notifications connected in one readable flow so nothing falls through the cracks.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#111111] text-white rounded-2xl border border-black/15 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-[#B9F53A]">
                    Interactive Workflow Preview
                  </p>
                  <h3 className="font-display text-2xl font-bold text-white">
                    See how everyday tasks simplify in plain language
                  </h3>
                </div>

                {/* Scenario Selector */}
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Automation Scenarios">
                  {AUTOMATION_SCENARIOS.map((scenario) => {
                    const isSelected = scenario.id === activeScenarioId;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveScenarioId(scenario.id)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#B9F53A] text-[#111111]'
                            : 'bg-[#1D1D1B] text-neutral-300 hover:text-white border border-white/10'
                        }`}
                      >
                        {scenario.title}
                      </button>
                    );
                  })}
                </div>

                {/* Active Scenario Breakdown */}
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-400">01. Starting Trigger</span>
                    <p className="text-sm text-white leading-relaxed">{activeScenario.trigger}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#B9F53A]">
                      02. Intelligent Workflow Step
                    </span>
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      {activeScenario.intelligentStep}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-400">03. Business Result</span>
                    <p className="text-sm text-white font-medium leading-relaxed">
                      {activeScenario.businessOutcome}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
                <span>Connected Flow: {activeScenario.toolsConnected}</span>
                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-1 text-[#B9F53A] font-semibold hover:underline"
                >
                  <span>View Concept</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-5">
              <h3 className="font-display text-lg font-bold text-[#111111]">
                Key Deliverables & Capabilities
              </h3>
              <ul className="space-y-3">
                {automationService.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#111111]">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#B9F53A] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#111111]" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {automationService.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl border border-black/10 p-6 space-y-2.5"
                >
                  <h4 className="font-display text-base font-bold text-[#111111]">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-[#52524E] leading-relaxed">{benefit.detail}</p>
                </div>
              ))}
              <div className="sm:col-span-3 pt-3 flex flex-wrap items-center justify-between gap-4 bg-[#111111] text-white rounded-2xl p-6">
                <p className="text-sm sm:text-base font-medium">
                  Want to remove repetitive manual work from your weekly operations?
                </p>
                <Link
                  to="/contact?service=AI+Automation"
                  className="inline-flex items-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
                >
                  <span>Start AI Automation Inquiry</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
