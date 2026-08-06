import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ClickSpark from '@/components/ClickSpark';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Profile } from '@/pages/Profile';
import { ArticleDetail } from '@/pages/ArticleDetail';
import { Search } from '@/pages/Search';
import { CategoryList } from '@/pages/CategoryList';
import { TagList } from '@/pages/TagList';
import { Notes } from '@/pages/Notes';
import { NoteDetail } from '@/pages/NoteDetail';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ArticleManagement } from '@/pages/admin/ArticleManagement';
import { ArticleEditor } from '@/pages/admin/ArticleEditor';
import { NoteManagement } from '@/pages/admin/NoteManagement';
import { NoteEditor } from '@/pages/admin/NoteEditor';
import { CategoryManagement } from '@/pages/admin/CategoryManagement';
import { TagManagement } from '@/pages/admin/TagManagement';
import { CommentManagement } from '@/pages/admin/CommentManagement';
import { UserManagement } from '@/pages/admin/UserManagement';
import { SystemSettings } from '@/pages/admin/SystemSettings';
import { useAuthStore } from '@/store/authStore';

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

const AuthProtected = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, fetchCurrentUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

// 管理员专属路由：非管理员显示无权限提示
const AdminProtected = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, fetchCurrentUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-gray-900 mb-2">无权访问</p>
          <p className="text-gray-500 mb-6">后台管理界面仅管理员可用</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <MusicPlayer />
      <ClickSpark
        sparkColor="#f97316"
        sparkSize={8}
        sparkRadius={12}
        sparkCount={6}
        duration={500}
      >
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/articles/:id"
          element={
            <PublicLayout>
              <ArticleDetail />
            </PublicLayout>
          }
        />
        <Route
          path="/articles/category/:slug"
          element={
            <PublicLayout>
              <CategoryList />
            </PublicLayout>
          }
        />
        <Route
          path="/articles/tag/:slug"
          element={
            <PublicLayout>
              <TagList />
            </PublicLayout>
          }
        />
        <Route
          path="/search"
          element={
            <PublicLayout>
              <Search />
            </PublicLayout>
          }
        />
        <Route
          path="/notes"
          element={
            <PublicLayout>
              <Notes />
            </PublicLayout>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <PublicLayout>
              <NoteDetail />
            </PublicLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <AuthProtected>
              <PublicLayout>
                <Profile />
              </PublicLayout>
            </AuthProtected>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminProtected>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/articles"
          element={
            <AdminProtected>
              <AdminLayout>
                <ArticleManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/articles/new"
          element={
            <AdminProtected>
              <AdminLayout>
                <ArticleEditor />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/articles/:id/edit"
          element={
            <AdminProtected>
              <AdminLayout>
                <ArticleEditor />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/notes"
          element={
            <AdminProtected>
              <AdminLayout>
                <NoteManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/notes/new"
          element={
            <AdminProtected>
              <AdminLayout>
                <NoteEditor />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/notes/:id/edit"
          element={
            <AdminProtected>
              <AdminLayout>
                <NoteEditor />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminProtected>
              <AdminLayout>
                <CategoryManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <AdminProtected>
              <AdminLayout>
                <TagManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/comments"
          element={
            <AdminProtected>
              <AdminLayout>
                <CommentManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtected>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AdminProtected>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtected>
              <AdminLayout>
                <SystemSettings />
              </AdminLayout>
            </AdminProtected>
          }
        />
      </Routes>
      </ClickSpark>
    </Router>
  );
}
