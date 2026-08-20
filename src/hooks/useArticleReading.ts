import { useEffect, useState } from 'react';

export interface ArticleHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

const slugify = (text: string) => {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'heading';
};

export const useArticleReading = (contentRef: React.RefObject<HTMLElement>) => {
  const [headings, setHeadings] = useState<ArticleHeading[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const headingElements = Array.from(content.querySelectorAll('h1, h2, h3')) as HTMLHeadingElement[];
    const usedIds = new Map<string, number>();
    const nextHeadings = headingElements
      .map((heading) => {
        const text = heading.textContent?.trim() || '';
        if (!text) return null;

        const baseId = slugify(text);
        const count = usedIds.get(baseId) || 0;
        usedIds.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
        heading.id = id;
        heading.style.scrollMarginTop = '7rem';

        return {
          id,
          text,
          level: Number(heading.tagName.substring(1)) as 1 | 2 | 3,
        };
      })
      .filter((heading): heading is ArticleHeading => Boolean(heading));

    setHeadings(nextHeadings);
    setActiveId(nextHeadings[0]?.id || '');

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target instanceof HTMLElement) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
    );

    headingElements.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [contentRef]);

  return { headings, activeId };
};
