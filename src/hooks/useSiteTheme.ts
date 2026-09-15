import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// useTheme 的各实例 state 相互独立，documentElement 上的 class 才是站点主题的共同事实来源
const readTheme = (): Theme => {
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('light')) return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/** 观察站点主题（documentElement 的 dark/light class），与顶部切换开关实时同步 */
export function useSiteTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}
