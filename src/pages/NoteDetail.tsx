import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArticleToc } from '../components/ArticleToc';
import { CodeBlock } from '../components/CodeBlock';
import { ReadingProgress } from '../components/ReadingProgress';
import { noteApi } from '../api';
import { Note } from '../types';
import { useArticleReading } from '../hooks/useArticleReading';

export const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const { headings, activeId } = useArticleReading(contentRef);

  useEffect(() => {
    if (!id) return;
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    setIsLoading(true);
    try {
      const response = await noteApi.getNoteById(id!);
      if (response.success && response.data) {
        setNote(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 下载笔记为 .md 文件（内容为 Markdown 原文）
  const handleDownload = () => {
    if (!note) return;
    // 清理 Windows 文件名非法字符
    const safeTitle = note.title.replace(/[\\/:*?"<>|]/g, '_');
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">笔记不存在</p>
          <Link to="/notes" className="text-accent-500 hover:underline mt-4 block">
            返回笔记列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReadingProgress contentRef={contentRef} />
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="min-w-0 lg:col-span-8">
            <Link
            to="/notes"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            返回笔记列表
          </Link>

          <article className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 sm:p-6 md:p-10">
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6 break-words">
                {note.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(note.publishedAt)}
                </span>
                {note.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {note.author.username}
                  </span>
                )}
                <button
                  onClick={handleDownload}
                  className="note-download-button sm:ml-auto min-h-11 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-accent-500 border border-accent-500 hover:text-white hover:bg-accent-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载 .md
                </button>
              </div>

              <div ref={contentRef} className="article-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,
                    code: ({ className, children, ...props }: any) => {
                      const language = className?.match(/language-([\w-]+)/)?.[1];
                      return (
                        <code className={className || 'bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono'} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }: any) => {
                      const codeElement = Array.isArray(children) ? children[0] : children;
                      const className = codeElement?.props?.className || '';
                      const language = className.match(/language-([\w-]+)/)?.[1];
                      const code = String(codeElement?.props?.children ?? '').replace(/\n$/, '');
                      return <CodeBlock code={code} language={language}>{codeElement?.props?.children}</CodeBlock>;
                    },
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
          </div>
          <aside className="min-w-0 lg:col-span-4">
            <ArticleToc headings={headings} activeId={activeId} />
          </aside>
        </div>
      </main>
    </div>
  );
};
