import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { searchApi, articleApi, categoryApi, tagApi } from '../api';
import { Article, Category, Tag } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Sidebar } from '../components/Sidebar';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [type, setType] = useState<'title' | 'content' | 'tag'>('title');
  const [results, setResults] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    if (query) {
      performSearch();
    }
    fetchSidebarData();
  }, [query, type]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim(), type });
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await searchApi.searchArticles(query, type);
      if (response.success && response.data) {
        setResults(response.data.articles);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSidebarData = async () => {
    try {
      const [popularRes, categoriesRes, tagsRes] = await Promise.all([
        articleApi.getPopularArticles(5),
        categoryApi.getCategories(),
        tagApi.getTags(),
      ]);

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
      console.error('Failed to fetch sidebar data:', error);
    }
  };

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
          <h1 className="font-display text-2xl font-bold">搜索结果</h1>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="搜索文章..."
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-3 bg-accent-500 text-white font-medium rounded-lg hover:bg-accent-600 transition-colors"
            >
              搜索
            </button>
            <div className="flex gap-2">
              {(['title', 'content', 'tag'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-3 font-medium rounded-lg transition-colors ${
                    type === t
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'title' ? '标题' : t === 'content' ? '内容' : '标签'}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="mb-6">
              <p className="text-gray-600">
                找到 <span className="font-semibold text-accent-500">{results.length}</span> 篇相关文章
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full" />
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  没有找到相关文章
                </h3>
                <p className="text-gray-400">
                  试试其他关键词或搜索类型
                </p>
              </div>
            )}
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
