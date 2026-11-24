import {useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageCircle,
  PhoneCall,
  Sparkles,
  X,
} from 'lucide-react';
import {useStudio} from '../context/StudioContext';
import {
  formatWhatsAppUrl,
  type InquiryItem,
  type SuggestionTopic,
} from '../data/studioData';

const TOPICS: SuggestionTopic[] = [
  'Project Idea',
  'Service Question',
  'Website Feedback',
  'AI Automation Idea',
];

interface AiSuggestionResult {
  senderName: string;
  senderEmail: string;
  topic: SuggestionTopic;
  suggestion: string;
  reply: string;
  recommendedService: InquiryItem['service'];
  actionIdeas: string[];
}

interface SuggestionBoxWidgetProps {
  open: boolean;
  onClose: () => void;
}

export function SuggestionBoxWidget({open, onClose}: SuggestionBoxWidgetProps) {
  const {siteSettings, submitSuggestionToFirestore} = useStudio();

  const [topic, setTopic] = useState<SuggestionTopic>('Project Idea');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiSuggestionResult | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (suggestion.trim().length < 5) {
      setError('Please enter at least 5 characters for your idea, question, or suggestion.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          senderName: senderName.trim() || 'Studio Visitor',
          senderEmail: senderEmail.trim(),
          topic,
          suggestion: suggestion.trim(),
          contactEmail: siteSettings.contactEmail,
          whatsappNumber: siteSettings.whatsappNumber,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Could not generate an AI reply right now. Please try again.');
        return;
      }

      const aiResult: AiSuggestionResult = {
        senderName: payload.senderName || senderName.trim() || 'Studio Visitor',
        senderEmail: payload.senderEmail || senderEmail.trim(),
        topic: payload.topic || topic,
        suggestion: payload.suggestion || suggestion.trim(),
        reply: payload.reply,
        recommendedService: payload.recommendedService || 'Multi-Service Project',
        actionIdeas: Array.isArray(payload.actionIdeas) ? payload.actionIdeas : [],
      };

      try {
        await submitSuggestionToFirestore({
          senderName: aiResult.senderName,
          senderEmail: aiResult.senderEmail,
          topic: aiResult.topic,
          suggestion: aiResult.suggestion,
          aiReply: aiResult.reply,
          recommendedService: aiResult.recommendedService,
        });
      } catch {
        // AI response already succeeded; keep user reply visible even if background log fails
      }

      setResult(aiResult);
      setSuggestion('');
    } catch {
      setError('Network error while contacting the AI Suggestion Assistant.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 lg:right-10 z-50">
      <section
        aria-label="IdeaCircuit AI Suggestion Box"
        className="w-[min(410px,calc(100vw-2rem))] max-h-[calc(100vh-6rem)] flex flex-col bg-white rounded-3xl border border-black/15 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#111111] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#B9F53A] text-[#111111] flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold text-white truncate">
                AI Suggestion Box &amp; Instant Reply
              </h2>
              <p className="text-[11px] text-neutral-300 truncate">
                Share feedback or ask anything — get an instant studio reply
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Suggestion Box"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            {result ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#B9F53A]/30 border border-[#111111]/15">
                  <CheckCircle2 className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs text-[#111111] space-y-0.5">
                    <p className="font-semibold">Suggestion saved &amp; AI reply generated</p>
                    <p className="text-[#52524E]">
                      Recommended track:{' '}
                      <span className="font-semibold text-[#111111]">
                        {result.recommendedService}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-[#EDEDEB]/80 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#52524E]">
                    IdeaCircuit AI Reply
                  </p>
                  <p className="text-sm text-[#111111] leading-relaxed whitespace-pre-wrap">
                    {result.reply}
                  </p>
                </div>

                {result.actionIdeas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#111111]">
                      Suggested Next Steps
                    </p>
                    <ul className="space-y-1.5">
                      {result.actionIdeas.map((idea, index) => (
                        <li
                          key={index}
                          className="text-xs text-[#52524E] flex items-start gap-2 bg-[#EDEDEB]/50 rounded-xl px-3 py-2"
                        >
                          <span className="font-mono font-bold text-[#111111] tabular-nums">
                            {index + 1}.
                          </span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-2">
                  <Link
                    to={`/contact?service=${encodeURIComponent(result.recommendedService)}`}
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#B9F53A] hover:bg-[#A8E828] text-[#111111] text-xs font-semibold px-4 py-2.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    <span>Start {result.recommendedService}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    to={`/book-call?service=${encodeURIComponent(result.recommendedService)}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-[#E3E3DF] border border-black/15 text-[#111111] text-xs font-semibold px-4 py-2.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Book a Call</span>
                  </Link>
                  <a
                    href={formatWhatsAppUrl(
                      siteSettings.whatsappNumber,
                      `Hello IdeaCircuit, regarding my ${result.topic.toLowerCase()}: ${result.suggestion}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-[#111111] hover:bg-[#2A2A27] text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="w-full text-center text-xs font-semibold text-[#52524E] hover:text-[#111111] pt-1 cursor-pointer"
                >
                  Send another suggestion or question
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900"
                  >
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[#111111]">Topic</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TOPICS.map((item) => {
                      const active = topic === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTopic(item)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-[#EDEDEB]/70 text-[#111111] border-black/10 hover:bg-[#E3E3DF]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label htmlFor="sb-name" className="block text-[11px] font-semibold text-[#52524E]">
                      Your Name (Optional)
                    </label>
                    <input
                      id="sb-name"
                      type="text"
                      maxLength={100}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Alex"
                      className="w-full px-3 py-2 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-xs text-[#111111] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="sb-email" className="block text-[11px] font-semibold text-[#52524E]">
                      Email for Follow-Up (Optional)
                    </label>
                    <input
                      id="sb-email"
                      type="email"
                      maxLength={160}
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-xs text-[#111111] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="sb-text" className="block text-xs font-semibold text-[#111111]">
                    Your Suggestion, Idea, or Question
                  </label>
                  <textarea
                    id="sb-text"
                    rows={3}
                    required
                    maxLength={2000}
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Ask how we can design your website, suggest a new feature, or share an automation idea..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#EDEDEB]/70 border border-black/15 text-xs text-[#111111] placeholder:text-[#52524E]/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#111111] resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#B9F53A] hover:bg-[#A8E828] disabled:opacity-60 text-[#111111] text-xs font-semibold px-5 py-3 rounded-full transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Generating AI Reply...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Submit &amp; Get Instant AI Reply</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
      </section>
    </div>
  );
}
