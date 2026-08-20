import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Tag, FolderOpen, User } from 'lucide-react';
import { Article, Category, Tag as TagType } from '../types';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

interface SidebarProps {
  popularArticles: Article[];
  categories: Category[];
  tags: TagType[];
}

export const Sidebar = ({ popularArticles, categories, tags }: SidebarProps) => {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const blocks = sidebarRef.current.querySelectorAll('.sidebar-block');
    gsap.set(blocks, { y: 40, opacity: 0 });

    blocks.forEach((block, i) => {
      ScrollTrigger.create({
        trigger: block,
        start: 'top 90%',
        onEnter: () => {
          gsap.to(block, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            delay: i * 0.08,
            ease: 'power2.out',
          });
        },
        once: true,
      });
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [popularArticles, categories, tags]);

  // 热门文章序号弹性动画
  useEffect(() => {
    if (!sidebarRef.current) return;

    const numbers = sidebarRef.current.querySelectorAll('.article-rank');
    gsap.set(numbers, { scale: 0, opacity: 0 });

    numbers.forEach((num, i) => {
      ScrollTrigger.create({
        trigger: num,
        start: 'top 90%',
        onEnter: () => {
          gsap.to(num, {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            delay: 0.3 + i * 0.1,
            ease: 'back.out(2)',
          });
        },
        once: true,
      });
    });
  }, [popularArticles]);

  return (
    <aside ref={sidebarRef} className="space-y-6">
      <div className="sidebar-block bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          热门文章
        </h3>
        <ul className="space-y-4">
          {popularArticles.slice(0, 5).map((article, index) => (
            <li key={article.id} className="flex gap-3">
              <span className="article-rank flex-shrink-0 w-6 h-6 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center text-sm font-bold">
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

      <div className="sidebar-block bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary-600" />
          文章分类
        </h3>
        <ul className="space-y-2">
          {categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link
                to={`/articles/category/${category.slug}`}
                className="flex items-center justify-between text-gray-700 hover:text-accent-600 transition-colors group"
              >
                <span className="group-hover:translate-x-1 transition-transform duration-200">{category.name}</span>
                <span className="text-sm text-gray-400">({category.articleCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-block bg-white rounded-xl shadow-md p-6">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-purple-500" />
          热门标签
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 12).map((tag) => (
            <Link
              key={tag.id}
              to={`/articles/tag/${tag.slug}`}
              className="sidebar-tag px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-accent-100 hover:text-accent-600 hover:scale-105 transition-all duration-200"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-block bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl shadow-md p-6 text-white overflow-hidden relative">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
        <h3 className="font-display text-lg font-bold mb-2 relative z-10">关于博主</h3>
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 relative z-10">
          <User className="w-8 h-8" />
        </div>
        <p className="text-white/80 text-sm mb-4 relative z-10">
          热爱技术，乐于分享。专注于前端开发和全栈技术。
        </p>
        <Link
          to="/profile"
          className="inline-block px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-200 text-sm relative z-10"
        >
          了解更多
        </Link>
      </div>
    </aside>
  );
};
