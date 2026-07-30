import { Link } from 'react-router-dom';
import { Eye, Heart, Calendar, User } from 'lucide-react';
import { Article } from '../types';
import BorderGlow from './BorderGlow';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export const ArticleCard = ({ article, featured = false }: ArticleCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <BorderGlow
      glowColor="30 90"
      backgroundColor="#ffffff"
      borderRadius={16}
      glowRadius={30}
      glowIntensity={0.8}
      coneSpread={20}
      colors={['#f97316', '#fb923c', '#fbbf24']}
    >
      <article
        className={`bg-white rounded-xl animate-fade-in ${
          featured ? 'col-span-full' : ''
        }`}
      >
      <div className="flex flex-col md:flex-row">
        {article.featuredImage && (
          <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`flex-1 p-6 ${article.featuredImage ? '' : 'md:w-full'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Link
              to={`/articles/category/${article.category.slug}`}
              className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
            >
              {article.category.name}
            </Link>
            <span className="flex items-center gap-1 text-gray-500 text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(article.publishedAt)}
            </span>
          </div>

          <h2 className={`font-display text-xl md:text-2xl font-bold mb-3 ${
            featured ? 'text-2xl md:text-3xl' : ''
          }`}>
            <Link
              to={`/articles/${article.id}`}
              className="text-gray-900 hover:text-accent-600 transition-colors line-clamp-2"
            >
              {article.title}
            </Link>
          </h2>

          <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                to={`/articles/tag/${tag.slug}`}
                className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {article.author.avatarUrl ? (
                <img
                  src={article.author.avatarUrl}
                  alt={article.author.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                  {article.author.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">
                {article.author.username}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {article.likes}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
    </BorderGlow>
  );
};
