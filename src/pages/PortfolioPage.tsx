import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {
  type PortfolioProject,
  type ServiceCategory,
} from '../data/studioData';
import {useStudio} from '../context/StudioContext';
import {StudioImage} from '../components/StudioImage';
import {ProjectModal} from '../components/ProjectModal';

type FilterOption = 'All Projects' | ServiceCategory;

const FILTER_OPTIONS: FilterOption[] = [
  'All Projects',
  'Website Design',
  'Graphic Design',
  'AI Automation',
];

export function PortfolioPage() {
  const {allProjects} = useStudio();
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All Projects');
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All Projects') return allProjects;
    return allProjects.filter((project) => project.category === activeFilter);
  }, [activeFilter, allProjects]);

  const countFor = (option: FilterOption) => {
    if (option === 'All Projects') return allProjects.length;
    return allProjects.filter((p) => p.category === option).length;
  };

  return (
    <>
      {/* Gallery Header & Working Category Filters */}
      <section className="py-12 sm:py-16 lg:py-20 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs sm:text-sm font-medium tracking-wide text-[#52524E]">
                IdeaCircuit Portfolio · Published Work
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#111111] leading-[1.04] text-balance"
                style={{fontSize: 'clamp(2.25rem, 4vw, 3.85rem)'}}
              >
                Selected projects across websites, visual identity, and intelligent workflows.
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm text-[#52524E] leading-relaxed">
                Explore websites, visual identities, and automation systems published directly from our studio.
              </p>
            </div>
          </div>

          {/* Interactive Category Filter Bar */}
          <div
            className="flex flex-wrap items-center gap-2 pt-2"
            role="group"
            aria-label="Filter portfolio projects by service"
          >
            {FILTER_OPTIONS.map((option) => {
              const isSelected = activeFilter === option;
              const count = countFor(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveFilter(option)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#B9F53A] text-[#111111]'
                      : 'bg-white text-[#111111] border border-black/10 hover:bg-[#E3E3DF]'
                  }`}
                >
                  <span>{option}</span>
                  <span className="font-mono text-xs opacity-70 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curated Showcase Gallery */}
      <section className="py-12 sm:py-16 lg:py-20 border-b border-black/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          {allProjects.length === 0 ? (
            <div className="bg-white rounded-3xl border border-black/10 p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
              <p className="text-xs font-medium tracking-wide text-[#52524E]">
                Portfolio Showcase
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
                New studio projects are being published soon.
              </h2>
              <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
                Check back shortly to browse our latest Website Design, Graphic Design, and AI Automation work—or reach out directly to discuss your project.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  <span>Start a Project</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center bg-[#EDEDEB] hover:bg-[#E3E3DF] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  Explore Services
                </Link>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/10 p-12 text-center space-y-3">
              <p className="font-display text-xl font-bold text-[#111111]">
                No projects published in this category yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('All Projects')}
                className="inline-flex items-center justify-center bg-[#B9F53A] text-[#111111] text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer"
              >
                Show All Projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
              {filteredProjects.map((project, index) => {
                // Make the first item in 'All Projects' span full width as a hero showcase
                const isLeadFeature = activeFilter === 'All Projects' && index === 0;

                return (
                  <article
                    key={project.id}
                    className={isLeadFeature ? 'md:col-span-12' : 'md:col-span-6'}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className={`group w-full text-left bg-white rounded-3xl border border-black/10 overflow-hidden transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] ${
                        isLeadFeature
                          ? 'grid grid-cols-1 lg:grid-cols-12 items-stretch'
                          : 'flex flex-col h-full'
                      }`}
                    >
                      <div
                        className={
                          isLeadFeature
                            ? 'lg:col-span-7 bg-[#E3E3DF] aspect-[16/10] lg:aspect-auto lg:min-h-[400px] overflow-hidden'
                            : 'bg-[#E3E3DF] aspect-[16/10] overflow-hidden'
                        }
                      >
                        <StudioImage
                          src={project.image}
                          alt={project.imageAlt}
                          fallbackTitle={project.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          containerClassName="w-full h-full"
                        />
                      </div>

                      <div
                        className={
                          isLeadFeature
                            ? 'lg:col-span-5 p-7 sm:p-9 lg:p-11 flex flex-col justify-between gap-6'
                            : 'p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6'
                        }
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#52524E]">
                            <span>{project.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{project.projectType}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{project.year}</span>
                          </div>
                          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] group-hover:underline decoration-2 underline-offset-4 text-balance">
                            {project.title}
                          </h2>
                          <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
                            {project.shortDescription}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-black/10 flex items-center justify-between gap-4">
                          <span className="text-xs font-medium text-[#52524E]">
                            {project.deliverables.slice(0, 2).join(' · ')}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111111] whitespace-nowrap shrink-0">
                            <span>{project.liveUrl ? 'Inspect & Visit' : 'View Project'}</span>
                            <ArrowUpRight
                              className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Portfolio CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="bg-[#111111] text-white rounded-3xl p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-[#B9F53A]">
                Start Your Own Project
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
                Want to explore how a similar direction could work for your business?
              </h2>
              <p className="text-base text-neutral-300 leading-relaxed">
                Share what you have in mind and we will walk through ideas tailored to your brand, website, or workflow goals.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-base font-semibold px-7 py-4 rounded-full transition-colors whitespace-nowrap shrink-0 self-start lg:self-center"
            >
              <span>Start a Conversation</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
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
