import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Edit2, Save, X, BookOpen, MessageCircle, Award, Camera, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi, articleApi, noteApi } from '../api';
import { User as UserType, Article as ArticleType, Note as NoteType } from '../types';

// 压缩图片并转为 base64
const compressImage = (file: File, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const Profile = () => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    username: '',
    bio: '',
    avatarUrl: '',
  });
  const [myArticles, setMyArticles] = useState<ArticleType[]>([]);
  const [myNotes, setMyNotes] = useState<NoteType[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchMyArticles();
    fetchMyNotes();
  }, [isAuthenticated, navigate, user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await userApi.getUserById(user!.id);
      if (response.success && response.data) {
        setProfile(response.data);
        setEditedProfile({
          username: response.data.username,
          bio: response.data.bio,
          avatarUrl: response.data.avatarUrl,
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchMyArticles = async () => {
    try {
      const response = await userApi.getUserArticles(user!.id);
      if (response.success && response.data) {
        setMyArticles(response.data.articles);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const fetchMyNotes = async () => {
    try {
      const response = await userApi.getUserNotes(user!.id);
      if (response.success && response.data) {
        setMyNotes(response.data.notes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？删除后无法恢复。')) return;
    try {
      const response = await articleApi.deleteArticle(id);
      if (response.success) {
        fetchMyArticles();
        fetchProfile();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('删除失败，请重试');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('确定要删除这篇笔记吗？删除后无法恢复。')) return;
    try {
      const response = await noteApi.deleteNote(id);
      if (response.success) {
        fetchMyNotes();
      } else {
        alert(response.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('删除失败，请重试');
    }
  };

  const handleSave = async () => {
    try {
      const response = await userApi.updateUser(user!.id, editedProfile);
      if (response.success) {
        setIsEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setEditedProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
      // 立即保存头像
      const response = await userApi.updateUser(user!.id, { avatarUrl: dataUrl });
      if (response.success) {
        fetchProfile();
        // 更新全局状态中的头像
        updateUser({ avatarUrl: dataUrl });
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('头像上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-48 bg-gradient-to-br from-primary-600 to-accent-500">
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div className="relative px-6 pb-6">
              <div className="absolute -top-16 left-6 group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative cursor-pointer"
                >
                  {uploading ? (
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full" />
                    </div>
                  ) : profile.avatarUrl ? (
                    <>
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-4xl font-bold">
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start justify-between pt-16">
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.username}
                      onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                      className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-1 focus:border-accent-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="font-display text-2xl font-bold text-gray-900">
                      {profile.username}
                    </h1>
                  )}
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </p>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile({
                          username: profile.username,
                          bio: profile.bio,
                          avatarUrl: profile.avatarUrl,
                        });
                      }}
                      className="flex items-center gap-1 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑资料
                  </button>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  placeholder="介绍一下自己..."
                  className="w-full mt-4 p-4 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none resize-none"
                  rows={4}
                />
              ) : profile.bio ? (
                <p className="mt-4 text-gray-600">{profile.bio}</p>
              ) : (
                <p className="mt-4 text-gray-400">暂无个人简介</p>
              )}

              <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  注册于 {formatDate(profile.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {profile.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
            </div>

            <div className="border-t grid grid-cols-3 divide-x">
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <span className="text-2xl font-bold text-gray-900">{profile.articleCount ?? 0}</span>
                </div>
                <p className="text-sm text-gray-500">文章数</p>
              </div>
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-accent-500" />
                  <span className="text-2xl font-bold text-gray-900">{profile.commentCount ?? 0}</span>
                </div>
                <p className="text-sm text-gray-500">评论数</p>
              </div>
              <div className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">0</span>
                </div>
                <p className="text-sm text-gray-500">获赞数</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="font-display text-xl font-bold mb-4">我的文章</h2>
            {myArticles.length > 0 ? (
              <div className="space-y-4">
                {myArticles.map((article) => (
                  <div
                    key={article.id}
                    className="group p-4 border border-gray-100 rounded-lg hover:border-accent-200 hover:bg-accent-50/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/articles/${article.id}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-accent-600 transition-colors">{article.title}</h3>
                        {article.excerpt && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {article.category && (
                            <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                              {article.category.name}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            article.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {article.status === 'published' ? '已发布' : '草稿'}
                          </span>
                          {article.publishedAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(article.publishedAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/articles/${article.id}/edit`}
                          className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无文章，开始创作吧！</p>
                <Link
                  to="/admin/articles/new"
                  className="inline-block mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                >
                  写文章
                </Link>
              </div>
            )}
          </div>

          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="font-display text-xl font-bold mb-4">我的笔记</h2>
            {myNotes.length > 0 ? (
              <div className="space-y-4">
                {myNotes.map((note) => (
                  <div
                    key={note.id}
                    className="group p-4 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/notes/${note.id}`} className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{note.title}</h3>
                        {note.excerpt && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{note.excerpt}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {note.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            note.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {note.status === 'published' ? '已发布' : '草稿'}
                          </span>
                          {note.publishedAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(note.publishedAt).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/notes/${note.id}/edit`}
                          className="p-2 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无笔记，开始记录吧！</p>
                <Link
                  to="/admin/notes/new"
                  className="inline-block mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                >
                  写笔记
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
