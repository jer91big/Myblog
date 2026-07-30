import { useState } from 'react';
import { Send, Reply, ThumbsUp, Clock, User } from 'lucide-react';
import { Comment, User as UserType } from '../types';
import { commentApi } from '../api';
import { useAuthStore } from '../store/authStore';

interface CommentSectionProps {
  articleId: string;
  comments: Comment[];
  onCommentsUpdate: () => void;
}

export const CommentSection = ({ articleId, comments, onCommentsUpdate }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { isAuthenticated, user } = useAuthStore();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    const response = await commentApi.createComment(articleId, newComment.trim());
    if (response.success) {
      setNewComment('');
      onCommentsUpdate();
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated) return;

    const response = await commentApi.createComment(articleId, replyContent.trim(), parentId);
    if (response.success) {
      setReplyContent('');
      setReplyingTo(null);
      onCommentsUpdate();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComments = (commentsList: Comment[], level = 0) => {
    return commentsList.map((comment) => (
      <div
        key={comment.id}
        className={`animate-fade-in ${level > 0 ? 'ml-6 md:ml-8 border-l-2 border-gray-200 pl-4' : ''}`}
      >
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-start gap-3">
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                {comment.author.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{comment.author.username}</span>
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{comment.content}</p>
              <div className="flex items-center gap-4 mt-3">
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>点赞</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    <span>回复</span>
                  </button>
                )}
              </div>
              {replyingTo === comment.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <textarea
                    placeholder="写下你的回复..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      className="px-4 py-2 text-sm font-medium bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
                    >
                      回复
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {comment.children && comment.children.length > 0 && (
          <div>{renderComments(comment.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="mt-10">
      <h3 className="font-display text-xl font-bold mb-6">评论 ({comments.length})</h3>

      {!isAuthenticated ? (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">登录后才能发表评论</p>
          <div className="flex gap-2 justify-center">
            <a href="/login" className="px-4 py-2 text-sm font-medium text-primary-600 hover:underline">
              登录
            </a>
            <span className="text-gray-400">或</span>
            <a href="/register" className="px-4 py-2 text-sm font-medium text-accent-500 hover:underline">
              注册
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitComment} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <textarea
            placeholder="分享你的想法..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
            rows={4}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-accent-500 text-white font-medium rounded-lg hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              发表评论
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500">暂无评论，快来发表第一条评论吧！</p>
        </div>
      ) : (
        <div>{renderComments(comments)}</div>
      )}
    </div>
  );
};
