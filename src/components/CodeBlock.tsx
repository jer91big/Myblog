import { useState } from 'react';
import { Check, Copy, Moon, Sun } from 'lucide-react';
import { useSiteTheme } from '../hooks/useSiteTheme';

interface CodeBlockProps {
  children: React.ReactNode;
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ children, code, language, className = '' }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  // null = 跟随站点主题；手动切换后写入覆盖类，直到再次手动切换
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const siteTheme = useSiteTheme();
  const theme = override ?? siteTheme;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={
        override ? `code-block-wrapper code-theme-${override}` : 'code-block-wrapper'
      }
    >
      <div className="code-block-toolbar">
        <span className="code-block-language">{language || 'CODE'}</span>
        <div className="code-block-actions">
          <button
            type="button"
            onClick={() => setOverride(theme === 'dark' ? 'light' : 'dark')}
            className="code-copy-button"
            aria-label={theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'}
            title={theme === 'dark' ? '切换为亮色主题' : '切换为暗色主题'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button type="button" onClick={handleCopy} className="code-copy-button" aria-label="复制代码">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  );
};
