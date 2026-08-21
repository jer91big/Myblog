import { useState, useRef, useEffect } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import { ArticleHeading } from '../hooks/useArticleReading';
import { gsap } from '../hooks/useGsap';

interface ArticleTocProps {
  headings: ArticleHeading[];
  activeId: string;
}

export const ArticleToc = ({ headings, activeId }: ArticleTocProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const tocRef = useRef<HTMLElement>(null);

  // 入场动画
  useEffect(() => {
    if (!tocRef.current || !headings.length) return;

    gsap.from(tocRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: tocRef.current,
        start: 'top 90%',
        once: true,
      },
    });
  }, [headings]);

  // 折叠动画
  useEffect(() => {
    if (!listRef.current) return;

    if (collapsed) {
      gsap.to(listRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          if (listRef.current) listRef.current.style.display = 'none';
        },
      });
    } else {
      if (listRef.current) listRef.current.style.display = 'flex';
      gsap.fromTo(listRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.inOut' }
      );
    }
  }, [collapsed]);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav ref={tocRef} className="article-toc" aria-label="文章目录">
      <button
        type="button"
        className="article-toc-toggle flex items-center justify-between w-full gap-2 mb-3"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <List className="w-5 h-5 text-accent-500" />
          目录
          <span className="text-sm font-normal text-gray-400">({headings.length})</span>
        </div>
        <span className="toc-toggle-icon text-gray-400 transition-transform duration-200">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>
      <div ref={listRef} className="article-toc-list">
        {headings.map((heading) => (
          <button
            type="button"
            key={heading.id}
            onClick={() => handleClick(heading.id)}
            className={`article-toc-item article-toc-level-${heading.level} ${activeId === heading.id ? 'is-active' : ''}`}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </nav>
  );
};
