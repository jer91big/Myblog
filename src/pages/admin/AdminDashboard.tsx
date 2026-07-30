import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Users, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { articleApi, commentApi, userApi } from '../../api';
import { Comment } from '../../types';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalComments: 0,
    totalUsers: 0,
    pendingComments: 0,
  });
  const [pendingCommentList, setPendingCommentList] = useState<Comment[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [articlesRes, pendingRes, usersRes, allCommentsRes] = await Promise.all([
        articleApi.getArticles({ limit: 1 }),
        commentApi.getPendingComments(),
        userApi.getUsers(1, 1),
        commentApi.getComments(''),
      ]);

      if (articlesRes.success && articlesRes.data) {
        setStats((prev) => ({ ...prev, totalArticles: articlesRes.data.pagination.total }));
      }
      if (pendingRes.success && pendingRes.data) {
        setStats((prev) => ({
          ...prev,
          pendingComments: pendingRes.data.pagination.total,
        }));
        setPendingCommentList(pendingRes.data.comments);
      }
      if (usersRes.success && usersRes.data) {
        setStats((prev) => ({ ...prev, totalUsers: usersRes.data.pagination.total }));
      }
      if (allCommentsRes.success && allCommentsRes.data) {
        setStats((prev) => ({
          ...prev,
          totalComments: allCommentsRes.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const statCards = [
    {
      icon: FileText,
      label: '总文章数',
      value: stats.totalArticles,
      color: 'bg-primary-500',
      trend: { value: 12, up: true },
    },
    {
      icon: MessageSquare,
      label: '总评论数',
      value: stats.totalComments,
      color: 'bg-accent-500',
      trend: { value: 8, up: true },
    },
    {
      icon: Users,
      label: '总用户数',
      value: stats.totalUsers,
      color: 'bg-purple-500',
      trend: { value: 5, up: true },
    },
    {
      icon: TrendingUp,
      label: '待审核评论',
      value: stats.pendingComments,
      color: 'bg-red-500',
      trend: { value: 2, up: false },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来！这是您的博客数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.trend.up ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${card.trend.up ? 'text-green-500' : 'text-red-500'}`}>
                    {card.trend.value}%
                  </span>
                  <span className="text-gray-400 text-sm">较上周</span>
                </div>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="font-display text-lg font-bold mb-4">最近文章</h2>
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无文章</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-display text-lg font-bold mb-4">待审核评论</h2>
          {stats.pendingComments > 0 ? (
            <div className="space-y-4">
              {pendingCommentList.slice(0, 5).map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-medium">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{comment.author.username}</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>暂无待审核评论</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
