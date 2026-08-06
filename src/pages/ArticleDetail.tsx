import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, Heart, Calendar, User, Share2, ArrowLeft, Tag, FolderOpen } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { articleApi, commentApi } from '../api';
import { Article, Comment } from '../types';
import { useAuthStore } from '../store/authStore';

export const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    fetchArticle();
    fetchComments();
    incrementViews();
  }, [id]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await articleApi.getArticleById(id!);
      if (response.success && response.data) {
        setArticle(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      // 自由发言：不过滤审核状态，所有评论直接展示
      const response = await commentApi.getComments(id!);
      if (response.success && response.data) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const incrementViews = async () => {
    try {
      await articleApi.incrementViews(id!);
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    try {
      const response = await articleApi.toggleLike(id!);
      if (response.success && response.data) {
        setArticle((prev) =>
          prev
            ? { ...prev, likes: response.data.likes }
            : null
        );
        setLiked(response.data.liked);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">文章不存在</p>
          <Link to="/" className="text-accent-500 hover:underline mt-4 block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <article className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {article.featuredImage && (
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <div className="p-6 md:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <Link
                    to={`/articles/category/${article.category.slug}`}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                    {article.category.name}
                  </Link>
                  <span className="flex items-center gap-1 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>

                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  {article.title}
                </h1>

                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    {article.author.avatarUrl ? (
                      <img
                        src={article.author.avatarUrl}
                        alt={article.author.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium text-lg">
                        {article.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{article.author.username}</p>
                      <p className="text-sm text-gray-500">作者</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-4 h-4" />
                      {article.views}
                    </span>
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-1 transition-colors ${
                        liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      {article.likes}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/articles/tag/${tag.slug}`}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.name}
                    </Link>
                  ))}
                </div>

                <div className="article-content">
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                </div>

                <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-100">
                  <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-accent-500 transition-colors">
                    <Share2 className="w-5 h-5" />
                    分享文章
                  </button>
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-accent-500 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    返回首页
                  </Link>
                </div>
              </div>
            </div>

            <CommentSection
              articleId={article.id}
              comments={comments}
              onCommentsUpdate={fetchComments}
            />
          </article>

          <aside className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h3 className="font-display text-lg font-bold mb-4">相关文章</h3>
              <div className="space-y-4">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/articles/tag/${tag.slug}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-sm text-gray-500">#{tag.articleCount}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
