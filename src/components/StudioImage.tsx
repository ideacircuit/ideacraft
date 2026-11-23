import {useState} from 'react';
import {Layers} from 'lucide-react';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export function StudioImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  fallbackTitle,
  loading = 'lazy',
}: StudioImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#E3E3DF] text-[#111111] p-6 text-center ${containerClassName}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-10 h-10 rounded-full bg-[#111111] text-[#B9F53A] flex items-center justify-center mb-3">
          <Layers className="w-5 h-5" aria-hidden="true" />
        </div>
        <span className="font-display font-semibold text-sm tracking-tight">
          {fallbackTitle || 'IdeaCircuit Visual Showcase'}
        </span>
        <span className="text-xs text-[#52524E] mt-1 max-w-xs">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
