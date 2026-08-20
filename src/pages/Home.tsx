import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Sidebar } from '../components/Sidebar';
import { Pagination } from '../components/Pagination';
import { articleApi, categoryApi, tagApi, noteApi } from '../api';
import { Article, Category, Tag, Note } from '../types';
import { Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import Waves from '../components/Waves';
import SpecularButton from '../components/SpecularButton';
import BorderGlow from '../components/BorderGlow';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

gsap.registerPlugin(ScrollTrigger);

export const Home = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const heroRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const articlesGridRef = useRef<HTMLDivElement>(null);
  const notesGridRef = useRef<HTMLDivElement>(null);
  const articlesSectionRef = useRef<HTMLElement>(null);
  const notesSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Hero 动画
  useEffect(() => {
    if (isLoading || !heroRef.current || !heroContentRef.current) return;

    const ctx = gsap.context(() => {
      // Hero 内容入场 timeline
      const tl = gsap.timeline({ delay: 0.2 });

      // Badge 入场
      tl.from('.hero-badge', {
        y: 30,
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });

      // 标题逐字入场
      const titleEl = heroContentRef.current?.querySelector('.hero-title');
      if (titleEl) {
        const text = titleEl.textContent || '';
        titleEl.innerHTML = '';
        text.split('').forEach((char) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? ' ' : char;
          span.style.display = 'inline-block';
          titleEl.appendChild(span);
        });
        tl.from(titleEl.children, {
          y: 60,
          opacity: 0,
          rotateX: -90,
          stagger: 0.02,
          duration: 0.5,
          ease: 'back.out(1.7)',
        }, '-=0.3');
      }

      // 描述文字入场
      tl.from('.hero-desc', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.2');

      // 按钮组入场
      tl.from('.hero-buttons > *', {
        y: 20,
        opacity: 0,
        scale: 0.9,
        stagger: 0.1,
        duration: 0.5,
        ease: 'back.out(1.7)',
      }, '-=0.3');

      // Hero 视差滚动
      gsap.to(heroContentRef.current, {
        y: -80,
        opacity: 0.3,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Waves 视差
      const wavesEl = heroRef.current?.querySelector('.waves-container');
      if (wavesEl) {
        gsap.to(wavesEl, {
          y: -50,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, [isLoading]);

  // 文章卡片 ScrollTrigger stagger
  useEffect(() => {
    if (isLoading || !articlesGridRef.current) return;

    const cards = articlesGridRef.current.querySelectorAll('.article-card-item');
    if (!cards.length) return;

    gsap.set(cards, { y: 60, opacity: 0, scale: 0.95 });

    const trigger = ScrollTrigger.create({
      trigger: articlesGridRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(cards, {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: 'power2.out',
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [isLoading, articles]);

  // 笔记卡片 ScrollTrigger stagger
  useEffect(() => {
    if (isLoading || !notesGridRef.current) return;

    const cards = notesGridRef.current.querySelectorAll('.note-card-item');
    if (!cards.length) return;

    gsap.set(cards, { y: 50, opacity: 0 });

    const trigger = ScrollTrigger.create({
      trigger: notesGridRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(cards, {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out',
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [isLoading, notes]);

  // 区块标题入场
  useEffect(() => {
    if (isLoading) return;

    const headings = document.querySelectorAll('.section-heading');
    headings.forEach((heading) => {
      gsap.set(heading, { x: -30, opacity: 0 });
      ScrollTrigger.create({
        trigger: heading,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(heading, {
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
          });
        },
        once: true,
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [isLoading]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [articlesRes, notesRes, popularRes, categoriesRes, tagsRes] = await Promise.all([
        articleApi.getArticles({ page: currentPage, limit: 6 }),
        noteApi.getNotes({ limit: 6, status: 'published' }),
        articleApi.getPopularArticles(5),
        categoryApi.getCategories(),
        tagApi.getTags(),
      ]);

      if (articlesRes.success && articlesRes.data) {
        setArticles(articlesRes.data.articles);
        setTotalPages(articlesRes.data.pagination.pages);
      }
      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data.notes);
      }
      if (popularRes.success && popularRes.data) {
        setPopularArticles(popularRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (tagsRes.success && tagsRes.data) {
        setTags(tagsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section
        ref={heroRef}
        className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-accent-600 text-white py-20 md:py-32 overflow-hidden"
      >
        <div className="waves-container absolute inset-0">
          <Waves
            lineColor="rgba(255, 255, 255, 0.15)"
            waveSpeedX={0.02}
            waveSpeedY={0.01}
            waveAmpX={40}
            waveAmpY={20}
            xGap={12}
            yGap={36}
            friction={0.93}
            tension={0.005}
            maxCursorMove={100}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10" ref={heroContentRef}>
          <div className="max-w-3xl">
            <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm font-medium">欢迎来到 MyBlog</span>
            </div>
            <h1 className="hero-title font-display text-4xl md:text-6xl font-bold mb-6">
              探索技术与生活的精彩世界
            </h1>
            <p className="hero-desc text-lg md:text-xl text-white/80 mb-8">
              在这里，你将发现最新的技术文章、编程心得和生活感悟。
              让我们一起学习、成长、分享。
            </p>
            <div className="hero-buttons flex flex-wrap items-center gap-4">
              <SpecularButton
                onClick={() => navigate('/articles/category/all')}
                size="md"
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#1e3a5f"
                intensity={1.2}
                shineSize={8}
                shineFade={35}
                thickness={1.2}
              >
                浏览文章
              </SpecularButton>
              <SpecularButton
                onClick={() => navigate('/admin/articles/new')}
                size="md"
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#f97316"
                intensity={1.2}
                shineSize={8}
                shineFade={35}
                thickness={1.2}
              >
                开始写作
              </SpecularButton>
              <SpecularButton
                onClick={() => navigate('/admin/notes/new')}
                size="md"
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#f97316"
                intensity={1.2}
                shineSize={8}
                shineFade={35}
                thickness={1.2}
              >
                开始写笔记
              </SpecularButton>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <section ref={articlesSectionRef}>
              <h2 className="section-heading font-display text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-accent-500 rounded-full" />
                最新文章
              </h2>
              <div ref={articlesGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.length > 0 ? (
                  articles.map((article) => (
                    <div key={article.id} className="article-card-item">
                      <ArticleCard article={article} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl">
                    <p className="text-gray-500">暂无文章</p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-12" ref={notesSectionRef}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-heading font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <span className="w-1 h-8 bg-purple-500 rounded-full" />
                  最新笔记
                </h2>
                <Link
                  to="/notes"
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors"
                >
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div ref={notesGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="note-card-item">
                      <BorderGlow
                        glowColor="280 70"
                        backgroundColor="#ffffff"
                        borderRadius={16}
                        glowRadius={30}
                        glowIntensity={0.8}
                        coneSpread={20}
                        colors={['#a78bfa', '#c084fc', '#818cf8']}
                      >
                        <Link
                          to={`/notes/${note.id}`}
                          className="block p-6 bg-transparent rounded-xl"
                        >
                          <h3 className="font-display text-lg font-bold text-gray-900 mb-2 line-clamp-1 hover:text-accent-600 transition-colors">
                            {note.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {note.excerpt || note.content.substring(0, 150)}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {note.publishedAt && (
                              <span className="text-xs text-gray-400">
                                {new Date(note.publishedAt).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>
                        </Link>
                      </BorderGlow>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">暂无笔记</p>
                  </div>
                )}
              </div>
            </section>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          <aside className="lg:col-span-4">
            <Sidebar
              popularArticles={popularArticles}
              categories={categories}
              tags={tags}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};
