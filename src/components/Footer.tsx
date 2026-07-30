import { Link } from 'react-router-dom';
import { Github, Twitter, Mail, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="font-display text-xl font-bold">MyBlog</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              这是一个基于 React + Express + MongoDB 构建的现代化个人博客网站。
              分享技术心得、生活感悟和编程经验。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/jer91big"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-accent-500 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-accent-400 transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/category/all"
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                >
                  分类
                </Link>
              </li>
              <li>
                <Link
                  to="/articles/tag/all"
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                >
                  标签
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                >
                  关于我
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">订阅</h3>
            <p className="text-gray-400 mb-4">订阅获取最新文章推送</p>
            <form className="flex">
              <input
                type="email"
                placeholder="输入邮箱"
                className="flex-1 px-4 py-2 rounded-l-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-accent-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-accent-500 hover:bg-accent-600 rounded-r-lg transition-colors"
              >
                订阅
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} MyBlog. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500" /> by MyBlog Team
          </p>
        </div>
      </div>
    </footer>
  );
};
