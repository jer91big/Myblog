import { Link } from 'react-router-dom';
import { TrendingUp, Tag, FolderOpen, User } from 'lucide-react';
import { Article, Category, Tag as TagType } from '../types';

interface SidebarProps {
  popularArticles: Article[];
  categories: Category[];
  tags: TagType[];
}

export const Sidebar = ({ popularArticles, categories, tags }: SidebarProps) => {
  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          热门文章
        </h3>
        <ul className="space-y-4">
          {popularArticles.slice(0, 5).map((article, index) => (
            <li key={article.id} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <Link
                to={`/articles/${article.id}`}
                className="text-gray-700 hover:text-accent-600 transition-colors line-clamp-2 text-sm"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary-600" />
          文章分类
        </h3>
        <ul className="space-y-2">
          {categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link
                to={`/articles/category/${category.slug}`}
                className="flex items-center justify-between text-gray-700 hover:text-accent-600 transition-colors"
              >
                <span>{category.name}</span>
                <span className="text-sm text-gray-400">({category.articleCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-500" />
          热门标签
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 12).map((tag) => (
            <Link
              key={tag.id}
              to={`/articles/tag/${tag.slug}`}
              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-accent-100 hover:text-accent-600 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl shadow-md p-6 text-white">
        <h3 className="font-display text-lg font-bold mb-2">关于博主</h3>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <User className="w-8 h-8" />
        </div>
        <p className="text-white/80 text-sm mb-4">
          热爱技术，乐于分享。专注于前端开发和全栈技术。
        </p>
        <Link
          to="/profile"
          className="inline-block px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
        >
          了解更多
        </Link>
      </div>
    </aside>
  );
};
