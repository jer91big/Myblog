import { useEffect, useState } from 'react';

interface ReadingProgressProps {
  contentRef: React.RefObject<HTMLElement>;
}

export const ReadingProgress = ({ contentRef }: ReadingProgressProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const content = contentRef.current;
        if (!content) {
          setProgress(0);
          return;
        }

        const rect = content.getBoundingClientRect();
        const total = content.offsetHeight - window.innerHeight * 0.35;
        const current = window.innerHeight * 0.35 - rect.top;
        const nextProgress = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
        setProgress(nextProgress);
      });
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [contentRef]);

  if (progress <= 0) return null;

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
};
