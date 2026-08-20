import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, path: '/admin', label: '仪表盘' },
  { icon: FileText, path: '/admin/articles', label: '文章管理' },
  { icon: BookOpen, path: '/admin/notes', label: '笔记管理' },
  { icon: FolderOpen, path: '/admin/categories', label: '分类管理' },
  { icon: Tag, path: '/admin/tags', label: '标签管理' },
  { icon: MessageSquare, path: '/admin/comments', label: '评论管理' },
  { icon: Users, path: '/admin/users', label: '用户管理' },
  { icon: Eye, path: '/admin/analytics', label: '访问统计' },
  { icon: Settings, path: '/admin/settings', label: '系统设置' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  // 普通用户进入编辑页时，不显示后台管理侧边栏（管理界面仅管理员可见）
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {isAdmin && isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="关闭后台菜单"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {isAdmin && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 max-w-[85vw] flex-col bg-white shadow-lg transition-transform duration-300 lg:max-w-none ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!isSidebarOpen}
        >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="font-display text-xl font-bold text-gray-900">管理后台</span>
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </aside>
      )}

      <div
        className={`min-w-0 transition-[margin] duration-300 ${
          isAdmin && isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            {isAdmin ? (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="min-w-11 min-h-11 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            ) : (
            <span className="font-display text-xl font-bold text-gray-900">创作中心</span>
            )}

            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
              <Link
                to="/"
                className="flex min-h-11 min-w-11 items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors sm:px-3"
                title="返回首页"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </Link>
              <span className="hidden text-gray-600 sm:inline">欢迎, {user?.username}</span>
              <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
