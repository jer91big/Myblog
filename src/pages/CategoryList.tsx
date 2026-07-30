import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { articleApi, categoryApi, tagApi } from '../api';
import { Article, Category, Tag } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Sidebar } from '../components/Sidebar';
import { Pagination } from '../components/Pagination';

export const CategoryList = () => {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
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
        articleApi.getArticles({ page: currentPage, limit: 6, category: slug === 'all' ? undefined : slug }),
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
        if (slug !== 'all') {
          const category = categoriesRes.data.find((c) => c.slug === slug);
          setCurrentCategory(category || null);
        }
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
            <FolderOpen className="w-5 h-5 text-primary-600" />
            {slug === 'all' ? '所有分类' : currentCategory?.name || '分类'}
          </h1>
        </div>

        {slug === 'all' && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="font-display text-lg font-bold mb-4">选择分类</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/articles/category/${category.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  {category.name}
                  <span className="text-sm text-gray-500">({category.articleCount})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {slug !== 'all' && currentCategory && (
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-primary-700">
                  当前分类：<span className="font-semibold">{currentCategory.name}</span>
                  ，共 <span className="font-semibold">{currentCategory.articleCount}</span> 篇文章
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
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  该分类下暂无文章
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
