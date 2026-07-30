import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { Sidebar } from '../components/Sidebar';
import { Pagination } from '../components/Pagination';
import { articleApi, categoryApi, tagApi, noteApi } from '../api';
import { Article, Category, Tag, Note } from '../types';
import { Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import Waves from '../components/Waves';

export const Home = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

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
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-accent-600 text-white py-20 md:py-32 overflow-hidden">
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
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm font-medium">欢迎来到 MyBlog</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              探索技术与生活的
              <span className="text-accent-400">精彩世界</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              在这里，你将发现最新的技术文章、编程心得和生活感悟。
              让我们一起学习、成长、分享。
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <a
                href="/articles/category/all"
                className="px-6 py-3 bg-white text-primary-900 font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                浏览文章
              </a>
              <a
                href="/admin/articles/new"
                className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all"
              >
                开始写作
              </a>
              <a
                href="/admin/notes/new"
                className="px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-all"
              >
                开始写笔记
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-accent-500 rounded-full" />
                最新文章
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.length > 0 ? (
                  articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-white rounded-xl">
                    <p className="text-gray-500">暂无文章</p>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <Link
                      key={note.id}
                      to={`/notes/${note.id}`}
                      className="card hover:scale-[1.02] transition-transform duration-300 p-6"
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
