import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut, PenLine, LayoutDashboard, X, Home, FolderOpen, Tag, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import FuzzyText from '../components/FuzzyText';
import Dock from '../components/Dock';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const showOpaque = isScrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showOpaque
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <FuzzyText
              fontSize={24}
              fontWeight={700}
              fontFamily="'Playfair Display', Georgia, serif"
              color={showOpaque ? '#1e293b' : '#ffffff'}
              baseIntensity={0.15}
              hoverIntensity={0.4}
              fuzzRange={20}
              enableHover
            >
              MyBlog
            </FuzzyText>
          </Link>

          <nav className="hidden md:flex items-center">
            <Dock
              items={[
                { icon: <Home className="w-6 h-6" style={{ color: showOpaque ? '#374151' : '#fff' }} />, label: '首页', onClick: () => navigate('/'), className: location.pathname === '/' ? 'dock-item-active' : '' },
                { icon: <FolderOpen className="w-6 h-6" style={{ color: showOpaque ? '#374151' : '#fff' }} />, label: '分类', onClick: () => navigate('/articles/category/all'), className: location.pathname.includes('/articles/category') ? 'dock-item-active' : '' },
                { icon: <Tag className="w-6 h-6" style={{ color: showOpaque ? '#374151' : '#fff' }} />, label: '标签', onClick: () => navigate('/articles/tag/all'), className: location.pathname.includes('/articles/tag') ? 'dock-item-active' : '' },
                { icon: <BookOpen className="w-6 h-6" style={{ color: showOpaque ? '#374151' : '#fff' }} />, label: '笔记', onClick: () => navigate('/notes'), className: location.pathname.includes('/notes') ? 'dock-item-active' : '' },
              ]}
              panelHeight={48}
              baseItemSize={40}
              magnification={56}
              distance={120}
            />
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 px-4 py-2 pl-10 rounded-full border border-gray-200 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>管理</span>
                  </Link>
                )}
                <Link
                  to="/admin/articles/new"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  <span>写文章</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出</span>
                </button>
                <Link to="/profile">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    showOpaque
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-primary-600 to-accent-500 text-white hover:shadow-lg transition-all"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${showOpaque ? 'text-gray-700' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${showOpaque ? 'text-gray-700' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                to="/articles/category/all"
                className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                分类
              </Link>
              <Link
                to="/articles/tag/all"
                className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                标签
              </Link>
              <Link
                to="/notes"
                className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                笔记
              </Link>
            </nav>

            <form onSubmit={handleSearch} className="relative mt-4">
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full border border-gray-200 focus:border-accent-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>

            {isAuthenticated ? (
              <div className="mt-4 flex flex-col gap-2">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    管理后台
                  </Link>
                )}
                <Link
                  to="/admin/articles/new"
                  className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PenLine className="w-4 h-4" />
                  写文章
                </Link>
                <Link
                  to="/profile"
                  className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  个人中心
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 font-medium text-center rounded-lg bg-gradient-to-r from-primary-600 to-accent-500 text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
