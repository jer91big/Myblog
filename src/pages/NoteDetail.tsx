import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag, Download, Share2, Copy, Check, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArticleToc } from '../components/ArticleToc';
import { CodeBlock } from '../components/CodeBlock';
import { ReadingProgress } from '../components/ReadingProgress';
import { noteApi } from '../api';
import { Note } from '../types';
import { useArticleReading } from '../hooks/useArticleReading';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

export const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { headings, activeId } = useArticleReading(contentRef);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchNote();
  }, [id]);

  // 关闭分享菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // 标题和元信息入场动画
  useEffect(() => {
    if (isLoading || !note || !headerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      tl.from('.note-back-link', {
        x: -20, opacity: 0, duration: 0.4, ease: 'power2.out',
      });

      tl.from('.note-tags > *', {
        y: 15, opacity: 0, scale: 0.8, stagger: 0.05,
        duration: 0.4, ease: 'back.out(1.7)',
      }, '-=0.2');

      tl.from('.note-title', {
        y: 30, opacity: 0, duration: 0.6, ease: 'power3.out',
      }, '-=0.2');

      tl.from('.note-meta', {
        y: 15, opacity: 0, duration: 0.4, ease: 'power2.out',
      }, '-=0.2');
    }, headerRef);

    return () => ctx.revert();
  }, [isLoading, note]);

  // 内容段落滚动入场
  useEffect(() => {
    if (isLoading || !note || !contentRef.current) return;

    const elements = contentRef.current.querySelectorAll('.article-content > div > *');
    if (!elements.length) return;

    const animatable = Array.from(elements).filter((el) => {
      const tag = el.tagName.toLowerCase();
      return ['p', 'ul', 'ol', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'pre', 'table'].includes(tag);
    });

    if (!animatable.length) return;

    gsap.set(animatable, { y: 25, opacity: 0 });

    animatable.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        onEnter: () => {
          gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
          });
        },
        once: true,
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [isLoading, note]);

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

  // 复制链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // 分享到社交平台
  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(note?.title || '');
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      weibo: `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`,
    };
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
    setShowShareMenu(false);
  };

  // 下载笔记为 .md 文件
  const handleDownload = () => {
    if (!note) return;
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

  // 计算阅读时间
  const getReadingTime = (content: string) => {
    const text = content.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n+/g, ' ');
    const charCount = text.length;
    const minutes = Math.max(1, Math.ceil(charCount / 400));
    return `约 ${minutes} 分钟阅读`;
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
          <div className="min-w-0 lg:col-span-8" ref={headerRef}>
            <Link
              to="/notes"
              className="note-back-link inline-flex items-center gap-2 text-gray-600 hover:text-accent-500 transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              返回笔记列表
            </Link>

            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-5 sm:p-6 md:p-10">
                {note.tags.length > 0 && (
                  <div className="note-tags flex flex-wrap gap-2 mb-4">
                    {note.tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="note-title font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-6 break-words">
                  {note.title}
                </h1>

                <div className="note-meta flex flex-wrap items-center gap-3 sm:gap-4 mb-8 text-sm text-gray-500">
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
                  <span className="text-gray-400">
                    {getReadingTime(note.content)}
                  </span>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    {/* 分享按钮 */}
                    <div className="relative" ref={shareMenuRef}>
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="min-h-11 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-gray-600 border border-gray-200 hover:border-accent-500 hover:text-accent-500 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">分享</span>
                      </button>

                      {showShareMenu && (
                        <div className="share-menu absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                          <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            {linkCopied ? (
                              <><Check className="w-4 h-4 text-green-500" /> 链接已复制</>
                            ) : (
                              <><Copy className="w-4 h-4 text-gray-400" /> 复制链接</>
                            )}
                          </button>
                          <button
                            onClick={() => handleShare('twitter')}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <span className="w-4 h-4 text-center text-[#1DA1F2] font-bold">𝕏</span>
                            分享到 Twitter
                          </button>
                          <button
                            onClick={() => handleShare('weibo')}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <span className="w-4 h-4 text-center text-[#E6162D] font-bold">微</span>
                            分享到微博
                          </button>
                          <button
                            onClick={() => handleShare('qq')}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <span className="w-4 h-4 text-center text-[#12B7F5] font-bold">Q</span>
                            分享到 QQ
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 下载按钮 */}
                    <button
                      onClick={handleDownload}
                      className="note-download-button min-h-11 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-accent-500 border border-accent-500 hover:text-white hover:bg-accent-500 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">下载 .md</span>
                    </button>
                  </div>
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
