import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: React.ReactNode;
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ children, code, language, className = '' }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

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
    <div className="code-block-wrapper">
      <div className="code-block-toolbar">
        <span className="code-block-language">{language || 'CODE'}</span>
        <button type="button" onClick={handleCopy} className="code-copy-button" aria-label="复制代码">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  );
};
