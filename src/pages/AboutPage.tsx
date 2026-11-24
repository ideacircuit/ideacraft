import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import {STUDIO_IMAGES} from '../data/studioData';
import {useStudio} from '../context/StudioContext';
import {StudioImage} from '../components/StudioImage';

const APPROACH_MODES = [
  {
    id: 'creativity',
    label: 'Creativity',
    headline: 'Visual decisions that earn attention through restraint and meaning.',
    summary:
      'Good creative work does not shout for attention with visual noise. We choose typography, imagery, pacing, and colour with intention so your audience remembers your message and trusts what they see.',
    points: [
      'Distinctive typographic hierarchy instead of generic template layouts',
      'Art-directed photography and graphic composition tailored to your market',
      'Consistent visual systems that scale smoothly across web and print',
    ],
  },
  {
    id: 'technology',
    label: 'Technology',
    headline: 'Modern web engineering and automation that stay dependable in daily use.',
    summary:
      'Technology should quietly serve the business rather than intimidate the people running it. We build responsive websites and streamlined AI workflows that feel calm, transparent, and straightforward to maintain.',
    points: [
      'Clean, accessible interfaces engineered for desktop, tablet, and mobile',
      'AI-assisted workflows focused on real time savings rather than novelty',
      'Clear documentation and human-in-the-loop oversight on every process',
    ],
  },
  {
    id: 'problem-solving',
    label: 'Problem-Solving',
    headline: 'Looking past symptoms to connect brand clarity with operational flow.',
    summary:
      'Often a website challenge is also a messaging problem, or a marketing bottleneck is really an intake workflow gap. Because we work across design and automation, we solve the whole picture rather than patching one corner.',
    points: [
      'Structured discovery focused on real customer journeys and team friction',
      'Honest scoping so effort goes where it creates measurable clarity',
      'Practical iteration shaped around feedback and real-world testing',
    ],
  },
];

const CORE_VALUES = [
  {
    number: '01',
    title: 'Clarity Over Noise',
    description:
      'We strip away filler language, crowded layouts, and unnecessary steps so both customers and teams can focus on what matters.',
  },
  {
    number: '02',
    title: 'Intentional Craft',
    description:
      'From margin proportions on a landing page to label spacing on packaging, careful details signal care and build lasting credibility.',
  },
  {
    number: '03',
    title: 'Honest Execution',
    description:
      'We communicate clearly about scope, timelines, and capabilities—never overpromising or hiding behind inflated claims.',
  },
  {
    number: '04',
    title: 'Purposeful Technology',
    description:
      'Every tool, layout pattern, and automation step earns its place by making work simpler, clearer, or more resilient.',
  },
];

export function AboutPage() {
  const {siteSettings} = useStudio();
  const [activeMode, setActiveMode] = useState(APPROACH_MODES[0].id);
  const currentMode =
    APPROACH_MODES.find((m) => m.id === activeMode) ?? APPROACH_MODES[0];

  return (
    <>
      {/* 1. Introductory Hero */}
      <section className="py-12 sm:py-16 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10 lg:space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-8 space-y-5">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-[#52524E]">
                About IdeaCircuit
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#111111] leading-[1.05] text-balance"
                style={{fontSize: 'clamp(2.25rem, 4vw, 3.8rem)'}}
              >
                {siteSettings.aboutHeadline}
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-base text-[#52524E] leading-relaxed">
                {siteSettings.aboutSubtitle}
              </p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-black/10 bg-[#E3E3DF] aspect-[16/9] max-h-[560px] w-full">
            <StudioImage
              src={STUDIO_IMAGES.aboutStudio}
              alt="Daylit creative digital studio table featuring the IdeaCircuit founder reviewing colour swatches and sketching layouts"
              loading="eager"
              fallbackTitle="IdeaCircuit Studio Workspace"
              className="w-full h-full object-cover object-center"
              containerClassName="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* 2. Purpose & Studio Philosophy */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                Studio Philosophy
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
                Why creative communication and intelligent systems belong together.
              </h2>
            </div>

            <div className="lg:col-span-7 space-y-5 text-base sm:text-lg text-[#52524E] leading-relaxed">
              <p className="text-[#111111] font-medium">
                Too often, businesses are forced to split their vision across disconnected specialists: one team designs graphics, another builds a website, and someone else tries to stitch together internal tools afterward.
              </p>
              <p>
                IdeaCircuit was formed around a simpler idea—when visual craft, digital experience, and workflow automation are shaped by the same thoughtful conversation, everything works better together. Your brand looks cohesive on the outside, and your daily processes feel lighter on the inside.
              </p>
              <p>
                We care equally about how an experience feels to a first-time visitor and how reliably it supports the people behind the scenes. No exaggerated claims, no trendy filler—just clear thinking translated into work that lasts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Approach: Creativity, Technology & Problem-Solving */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#111111] text-white">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-[#B9F53A]">
                Our Approach
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                How we bring creativity, technology, and problem-solving into alignment.
              </h2>
            </div>

            {/* Interactive Mode Tabs */}
            <div
              className="inline-flex flex-wrap gap-1.5 p-1.5 bg-[#1C1C1A] border border-white/10 rounded-full self-start"
              role="tablist"
              aria-label="IdeaCircuit Approach Pillars"
            >
              {APPROACH_MODES.map((mode) => {
                const isActive = mode.id === activeMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveMode(mode.id)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#B9F53A] text-[#111111]'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1A1A19] border border-white/10 rounded-3xl p-7 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-medium text-[#B9F53A]">
                {currentMode.label} Perspective
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                {currentMode.headline}
              </h3>
              <p className="text-base text-neutral-300 leading-relaxed">
                {currentMode.summary}
              </p>
            </div>
            <div className="lg:col-span-5 lg:border-l lg:border-white/10 lg:pl-8 space-y-4">
              <p className="text-xs font-medium text-neutral-400">
                What this looks like in practice
              </p>
              <ul className="space-y-3">
                {currentMode.points.map((point) => (
                  <li key={point} className="text-sm text-neutral-200 leading-relaxed flex gap-3">
                    <span className="text-[#B9F53A] font-semibold shrink-0" aria-hidden="true">
                      —
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Values */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-medium tracking-wide text-[#52524E]">
              Core Values
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
              Principles that guide every brief we take on.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CORE_VALUES.map((val) => (
              <div
                key={val.number}
                className="bg-white rounded-2xl border border-black/10 p-7 sm:p-8 space-y-3"
              >
                <span className="font-mono text-xs font-medium text-[#52524E] tabular-nums">
                  {val.number}
                </span>
                <h3 className="font-display text-2xl font-bold tracking-tight text-[#111111]">
                  {val.title}
                </h3>
                <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Work With IdeaCircuit CTA */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-white rounded-3xl border border-black/10 p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                Collaborate With Us
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111111] text-balance">
                Ready to shape a clearer digital presence or smarter workflow?
              </h2>
              <p className="text-base text-[#52524E] leading-relaxed max-w-xl">
                Explore our services in detail or share what your business is working toward. We would love to hear what you are building.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:justify-end gap-3.5">
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2 bg-[#EDEDEB] hover:bg-[#E3E3DF] text-[#111111] text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full transition-colors whitespace-nowrap"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm sm:text-base font-semibold px-6 py-3.5 rounded-full transition-colors whitespace-nowrap"
              >
                <span>Work With Us</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
