import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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

export default function App() {
  return (
    <Router>
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
            <AuthProtected>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/articles"
          element={
            <AuthProtected>
              <AdminLayout>
                <ArticleManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/articles/new"
          element={
            <AuthProtected>
              <AdminLayout>
                <ArticleEditor />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/articles/:id/edit"
          element={
            <AuthProtected>
              <AdminLayout>
                <ArticleEditor />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/notes"
          element={
            <AuthProtected>
              <AdminLayout>
                <NoteManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/notes/new"
          element={
            <AuthProtected>
              <AdminLayout>
                <NoteEditor />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/notes/:id/edit"
          element={
            <AuthProtected>
              <AdminLayout>
                <NoteEditor />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AuthProtected>
              <AdminLayout>
                <CategoryManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <AuthProtected>
              <AdminLayout>
                <TagManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/comments"
          element={
            <AuthProtected>
              <AdminLayout>
                <CommentManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AuthProtected>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AuthProtected>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AuthProtected>
              <AdminLayout>
                <SystemSettings />
              </AdminLayout>
            </AuthProtected>
          }
        />
      </Routes>
    </Router>
  );
}
