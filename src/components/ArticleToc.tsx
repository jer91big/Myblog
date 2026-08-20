import { List } from 'lucide-react';
import { ArticleHeading } from '../hooks/useArticleReading';

interface ArticleTocProps {
  headings: ArticleHeading[];
  activeId: string;
}

export const ArticleToc = ({ headings, activeId }: ArticleTocProps) => {
  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav className="article-toc" aria-label="文章目录">
      <div className="flex items-center gap-2 mb-3 font-display text-lg font-bold">
        <List className="w-5 h-5 text-accent-500" />
        文章目录
      </div>
      <div className="article-toc-list">
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
