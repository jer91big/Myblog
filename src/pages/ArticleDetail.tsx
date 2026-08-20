import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, Heart, Calendar, User, Share2, ArrowLeft, ArrowRight, Tag, FolderOpen } from 'lucide-react';
import { BackToTop } from '../components/BackToTop';
import { CommentSection } from '../components/CommentSection';
import { ArticleToc } from '../components/ArticleToc';
import { ReadingProgress } from '../components/ReadingProgress';
import { articleApi, commentApi } from '../api';
import { Article, Comment } from '../types';
import { useAuthStore } from '../store/authStore';
import { useArticleReading } from '../hooks/useArticleReading';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

export const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [navigation, setNavigation] = useState<{
    previous: { id: string; title: string; publishedAt: string } | null;
    next: { id: string; title: string; publishedAt: string } | null;
  }>({ previous: null, next: null });
  const { isAuthenticated } = useAuthStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { headings, activeId } = useArticleReading(contentRef);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    setNavigation({ previous: null, next: null });
    fetchArticle();
    fetchComments();
    fetchNavigation();
    incrementViews();
  }, [id]);

  // 文章头部入场动画
  useEffect(() => {
    if (isLoading || !article || !headerRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      // 特色图片视差
      const img = headerRef.current?.querySelector('.article-hero-img');
      if (img) {
        gsap.set(img, { scale: 1.15 });
        tl.to(img, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0);
      }

      // 分类 + 日期
      tl.from('.article-meta', {
        y: 20, opacity: 0, duration: 0.5, ease: 'power2.out',
      }, 0.3);

      // 标题
      tl.from('.article-title', {
        y: 40, opacity: 0, duration: 0.7, ease: 'power3.out',
      }, 0.4);

      // 作者信息
      tl.from('.article-author', {
        y: 20, opacity: 0, duration: 0.5, ease: 'power2.out',
      }, 0.6);

      // 标签
      tl.from('.article-tags > *', {
        y: 15, opacity: 0, scale: 0.8, stagger: 0.05,
        duration: 0.4, ease: 'back.out(1.7)',
      }, 0.7);
    }, headerRef);

    return () => ctx.revert();
  }, [isLoading, article]);

  // 文章内容段落滚动入场
  useEffect(() => {
    if (isLoading || !article || !contentRef.current) return;

    const paragraphs = contentRef.current.querySelectorAll('.article-content > div > *');
    if (!paragraphs.length) return;

    // 只对段落、列表、引用做动画，代码块和图片跳过
    const animatableEls = Array.from(paragraphs).filter((el) => {
      const tag = el.tagName.toLowerCase();
      return ['p', 'ul', 'ol', 'blockquote', 'h1', 'h2', 'h3', 'h4'].includes(tag);
    });

    if (!animatableEls.length) return;

    gsap.set(animatableEls, { y: 25, opacity: 0 });

    animatableEls.forEach((el) => {
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
  }, [isLoading, article]);

  // 底部导航卡片入场
  useEffect(() => {
    if (isLoading || !article) return;

    const navCards = document.querySelectorAll('.article-navigation-card');
    if (!navCards.length) return;

    gsap.set(navCards, { y: 30, opacity: 0 });
    ScrollTrigger.create({
      trigger: navCards[0],
      start: 'top 90%',
      onEnter: () => {
        gsap.to(navCards, {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out',
        });
      },
      once: true,
    });
  }, [isLoading, article, navigation]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await articleApi.getArticleById(id!);
      if (response.success && response.data) {
        setArticle(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentApi.getComments(id!);
      if (response.success && response.data) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchNavigation = async () => {
    try {
      const response = await articleApi.getArticleNavigation(id!);
      if (response.success && response.data) {
        setNavigation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch article navigation:', error);
    }
  };

  const incrementViews = async () => {
    try {
      await articleApi.incrementViews(id!);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  useEffect(() => {
    if (!article || !contentRef.current) return;

    const codeBlocks = Array.from(contentRef.current.querySelectorAll('pre'));
    const cleanups = codeBlocks.map((pre) => {
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return () => {};

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentElement?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const toolbar = document.createElement('div');
      toolbar.className = 'code-block-toolbar';
      const language = pre.querySelector('code')?.className.match(/language-([\w-]+)/)?.[1] || 'CODE';
      toolbar.innerHTML = `<span class="code-block-language">${language}</span><button type="button" class="code-copy-button" aria-label="复制代码">复制</button>`;
      wrapper.insertBefore(toolbar, pre);

      const button = toolbar.querySelector('button');
      const handleCopy = async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent || '');
          if (button) {
            button.textContent = '已复制';
            gsap.from(button, { scale: 1.2, duration: 0.3, ease: 'back.out(2)' });
          }
          window.setTimeout(() => {
            if (button) button.textContent = '复制';
          }, 1600);
        } catch {
          if (button) button.textContent = '复制失败';
        }
      };
      button?.addEventListener('click', handleCopy);

      return () => {
        button?.removeEventListener('click', handleCopy);
        if (wrapper.parentElement) {
          wrapper.parentElement.insertBefore(pre, wrapper);
          wrapper.remove();
        }
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [article]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    try {
      const response = await articleApi.toggleLike(id!);
      if (response.success && response.data) {
        setArticle((prev) =>
          prev
            ? { ...prev, likes: response.data.likes }
            : null
        );
        setLiked(response.data.liked);

        // 点赞弹性动画
        if (response.data.liked) {
          const heartBtn = document.querySelector('.like-button');
          if (heartBtn) {
            gsap.fromTo(heartBtn, { scale: 1 }, {
              scale: 1.3,
              duration: 0.15,
              yoyo: true,
              repeat: 1,
              ease: 'power2.out',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
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

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">文章不存在</p>
          <Link to="/" className="text-accent-500 hover:underline mt-4 block">
            返回首页
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
          <article className="min-w-0 lg:col-span-8" ref={headerRef}>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {article.featuredImage && (
                <div className="relative h-52 sm:h-64 md:h-96 overflow-hidden">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="article-hero-img w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <div className="p-5 sm:p-6 md:p-10">
                <div className="article-meta flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                  <Link
                    to={`/articles/category/${article.category.slug}`}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {article.category.name}
                  </Link>
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>

                <h1 className="article-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 break-words">
                  {article.title}
                </h1>

                <div className="article-author flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                  <div className="flex items-center gap-3 min-w-0">
                    {article.author.avatarUrl ? (
                      <img
                        src={article.author.avatarUrl}
                        alt={article.author.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium text-lg">
                        {article.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{article.author.username}</p>
                      <p className="text-sm text-gray-500">作者</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 sm:gap-6 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      {article.views}
                    </span>
                    <button
                      onClick={handleLike}
                      className={`like-button flex items-center gap-1 transition-colors ${
                        liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      {article.likes}
                    </button>
                  </div>
                </div>

                <div className="article-tags flex flex-wrap gap-2 mb-8">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/articles/tag/${tag.slug}`}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.name}
                    </Link>
                  ))}
                </div>

                <div ref={contentRef} className="article-content">
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </div>

                <div className="article-detail-actions flex flex-wrap items-center justify-between gap-3 mt-10 pt-8 border-t border-gray-100">
                  <button className="min-h-11 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-accent-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                    分享文章
                  </button>
                  <Link
                    to="/"
                    className="min-h-11 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-accent-500 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    返回首页
                  </Link>
                </div>
              </div>
            </div>

            <div className="article-navigation grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {navigation.previous ? (
                <Link to={`/articles/${navigation.previous.id}`} className="article-navigation-card article-navigation-previous">
                  <span className="article-navigation-label"><ArrowLeft className="w-4 h-4" /> 上一篇</span>
                  <span className="article-navigation-title">{navigation.previous.title}</span>
                </Link>
              ) : (
                <div className="article-navigation-card is-disabled">
                  <span className="article-navigation-label"><ArrowLeft className="w-4 h-4" /> 上一篇</span>
                  <span className="article-navigation-title">已经是最早的文章了</span>
                </div>
              )}
              {navigation.next ? (
                <Link to={`/articles/${navigation.next.id}`} className="article-navigation-card article-navigation-next">
                  <span className="article-navigation-label">下一篇 <ArrowRight className="w-4 h-4" /></span>
                  <span className="article-navigation-title">{navigation.next.title}</span>
                </Link>
              ) : (
                <div className="article-navigation-card article-navigation-next is-disabled">
                  <span className="article-navigation-label">下一篇 <ArrowRight className="w-4 h-4" /></span>
                  <span className="article-navigation-title">已经是最新的文章了</span>
                </div>
              )}
            </div>

            <CommentSection
              articleId={article.id}
              comments={comments}
              onCommentsUpdate={fetchComments}
            />
          </article>

          <aside className="min-w-0 lg:col-span-4 space-y-6">
            <ArticleToc headings={headings} activeId={activeId} />
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h3 className="font-display text-lg font-bold mb-4">相关文章</h3>
              <div className="space-y-4">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/articles/tag/${tag.slug}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:translate-x-1 transition-all duration-200"
                  >
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-sm text-gray-500">#{tag.articleCount}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <BackToTop />
    </div>
  );
};
