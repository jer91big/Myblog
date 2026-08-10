import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, MapPin, ArrowLeft } from 'lucide-react';
import { analyticsApi } from '../../api';

interface Visitor {
  ip: string;
  location: string;
  firstSeenAt: string;
}

export const Analytics = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  const fetchList = async (resolve = false) => {
    if (resolve) setIsResolving(true);
    else setIsLoading(true);
    try {
      const response = await analyticsApi.getTodayVisitorList(resolve);
      if (response.success && response.data) {
        setVisitors(response.data.visitors);
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setIsLoading(false);
      setIsResolving(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">今日上线人数</h1>
          <p className="text-gray-500 mt-1">共 {visitors.length} 位访客（按独立 IP 统计）</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回仪表盘
          </Link>
          <button
            onClick={() => fetchList(true)}
            disabled={isResolving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-accent-500 border border-accent-500 rounded-lg hover:bg-accent-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isResolving ? 'animate-spin' : ''}`} />
            {isResolving ? '解析属地中...' : '重新解析属地'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full" />
          </div>
        ) : visitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">#</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      IP 地址
                    </span>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      IP 属地
                    </span>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">首次访问时间</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor, index) => (
                  <tr key={visitor.ip} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-800">{visitor.ip}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-full">
                        <MapPin className="w-3.5 h-3.5" />
                        {visitor.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatTime(visitor.firstSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>今天还没有访客记录</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        注：属地通过 ip-api.com 免费服务解析（仅公网 IP），结果保存在数据库中避免重复请求。首次解析需要几秒，可点击"重新解析属地"刷新。
      </p>
    </div>
  );
};
