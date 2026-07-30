import { useState, useEffect } from 'react';
import { Check, Trash2, Clock, User, Filter } from 'lucide-react';
import { commentApi } from '../../api';
import { Comment } from '../../types';

export const CommentManagement = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchComments();
  }, [currentPage, filterApproved]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await commentApi.getComments(
        '',
        filterApproved === 'all' ? undefined : filterApproved === 'approved'
      );
      if (response.success && response.data) {
        setComments(response.data.comments);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await commentApi.approveComment(id);
      fetchComments();
    } catch (error) {
      console.error('Failed to approve comment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await commentApi.deleteComment(id);
      fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">评论管理</h1>
          <p className="text-gray-500 mt-1">管理文章评论</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value as typeof filterApproved)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
          >
            <option value="all">全部评论</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">评论内容</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">作者</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">时间</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
                </td>
              </tr>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-gray-600 line-clamp-2">{comment.content}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {comment.author.avatarUrl ? (
                        <img
                          src={comment.author.avatarUrl}
                          alt={comment.author.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
                          {comment.author.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-700">{comment.author.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        comment.approved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {comment.approved ? '已通过' : '待审核'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(comment.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {!comment.approved && (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-gray-500">暂无评论</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              显示第 {currentPage} 页，共 {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-gray-600 font-medium">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
