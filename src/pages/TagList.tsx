import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { articleApi, categoryApi, tagApi } from '../api';
import { Article, Category, Tag as TagType } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Sidebar } from '../components/Sidebar';
import { Pagination } from '../components/Pagination';

export const TagList = () => {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [currentTag, setCurrentTag] = useState<TagType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [slug, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [articlesRes, popularRes, categoriesRes, tagsRes] = await Promise.all([
        articleApi.getArticles({ page: currentPage, limit: 6, tag: slug === 'all' ? undefined : slug }),
        articleApi.getPopularArticles(5),
        categoryApi.getCategories(),
        tagApi.getTags(),
      ]);

      if (articlesRes.success && articlesRes.data) {
        setArticles(articlesRes.data.articles);
        setTotalPages(articlesRes.data.pagination.pages);
      }
      if (popularRes.success && popularRes.data) {
        setPopularArticles(popularRes.data);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (tagsRes.success && tagsRes.data) {
        setTags(tagsRes.data);
        if (slug !== 'all') {
          const tag = tagsRes.data.find((t) => t.slug === slug);
          setCurrentTag(tag || null);
        }
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
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-accent-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            {slug === 'all' ? '所有标签' : currentTag?.name || '标签'}
          </h1>
        </div>

        {slug === 'all' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="font-display text-lg font-bold mb-4">选择标签</h2>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/articles/tag/${tag.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  {tag.name}
                  <span className="text-sm text-gray-500">({tag.articleCount})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {slug !== 'all' && currentTag && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <p className="text-purple-700">
                  当前标签：<span className="font-semibold">#{currentTag.name}</span>
                  ，共 <span className="font-semibold">{currentTag.articleCount}</span> 篇文章
                </p>
              </div>
            )}

            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  该标签下暂无文章
                </h3>
              </div>
            )}

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
