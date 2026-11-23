import {useEffect} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, Check, X} from 'lucide-react';
import type {PortfolioProject} from '../data/studioData';
import {StudioImage} from './StudioImage';

interface ProjectModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
}

export function ProjectModal({project, onClose}: ProjectModalProps) {
  useEffect(() => {
    if (!project) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FFFFFF] text-[#111111] rounded-2xl border border-black/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-black/10">
          <div className="flex items-center gap-2 text-xs font-medium text-[#52524E]">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span>{project.projectType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{project.year}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project preview"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-[#EDEDEB] hover:bg-[#111111] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Media Preview */}
        <div className="bg-[#EDEDEB] aspect-[16/10] w-full overflow-hidden">
          <StudioImage
            src={project.image}
            alt={project.imageAlt}
            fallbackTitle={project.title}
            loading="eager"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
          />
        </div>

        {/* Details */}
        <div className="p-6 sm:p-8 lg:p-10 space-y-8">
          <div className="space-y-3">
            <h2
              id="project-modal-title"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] text-balance"
            >
              {project.title}
            </h2>
            <p className="text-base text-[#52524E] leading-relaxed">{project.overview}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-black/10">
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-[#111111]">
                Creative Approach
              </h3>
              <p className="text-sm text-[#52524E] leading-relaxed">{project.creativeApproach}</p>
              <p className="text-sm font-medium text-[#111111] pt-2">{project.outcomeFocus}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-sm font-semibold text-[#111111]">
                Key Deliverables Included
              </h3>
              <ul className="space-y-2">
                {project.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#111111]">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#B9F53A] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#111111]" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#52524E]">
              IdeaCircuit Portfolio · {project.category} ({project.year})
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#2A2A27] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Visit Live Website</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              <Link
                to={`/contact?service=${encodeURIComponent(project.category)}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-sm font-semibold px-6 py-3 rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <span>Discuss a Similar Project</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
