import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, RefreshCw, MapPin, ArrowLeft, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../../api';

interface Visitor {
  ip: string;
  location: string;
  firstSeenAt: string;
}

interface TrendPoint {
  date: string;
  count: number;
}

// 近 7 天流量折线图（轻量 SVG，无第三方依赖）
const VisitorChart = ({ data }: { data: TrendPoint[] }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const W = 640;
  const H = 240;
  const PAD = { top: 24, right: 16, bottom: 32, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxCount = Math.max(4, ...data.map((d) => d.count));
  const yMax = Math.ceil(maxCount / 4) * 4; // 纵轴按 4 取整

  const x = (i: number) => PAD.left + (data.length === 1 ? chartW / 2 : (i * chartW) / (data.length - 1));
  const y = (v: number) => PAD.top + chartH - (v / yMax) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.count)}`).join(' ');
  const areaPath = `${linePath} L${x(data.length - 1)},${PAD.top + chartH} L${x(0)},${PAD.top + chartH} Z`;
  const gridLines = [0, 1, 2, 3, 4].map((g) => {
    const gy = PAD.top + (chartH / 4) * g;
    return { gy, label: yMax - (yMax / 4) * g };
  });

  const shortDate = (date: string) => {
    const parts = date.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : date;
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * W;
          let closest = 0;
          let minDist = Infinity;
          data.forEach((_, i) => {
            const dist = Math.abs(x(i) - mx);
            if (dist < minDist) {
              minDist = dist;
              closest = i;
            }
          });
          setHoverIndex(closest);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* 网格线 */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={g.gy} y2={g.gy} stroke="#e5e7eb" strokeDasharray="4 4" />
            <text x={PAD.left - 8} y={g.gy + 4} textAnchor="end" fontSize="11" fill="#9ca3af">
              {g.label}
            </text>
          </g>
        ))}

        {/* 面积 + 折线 */}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* 数据点 + 数值 */}
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.count)} r={hoverIndex === i ? 6 : 4} fill="#f97316" stroke="#fff" strokeWidth="2" />
            {hoverIndex === i && (
              <text x={x(i)} y={y(d.count) - 12} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#f97316">
                {d.count}
              </text>
            )}
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={hoverIndex === i ? '#f97316' : '#9ca3af'} fontWeight={hoverIndex === i ? 700 : 400}>
              {shortDate(d.date)}
            </text>
          </g>
        ))}
      </svg>

      {/* 悬停提示卡片 */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg -translate-x-1/2"
          style={{
            left: `${(x(hoverIndex) / W) * 100}%`,
            top: `${(y(data[hoverIndex].count) / H) * 100}%`,
            transform: 'translate(-50%, -110%)',
          }}
        >
          <div className="font-medium">{data[hoverIndex].date}</div>
          <div className="text-gray-300 mt-0.5">上线人数：{data[hoverIndex].count}</div>
        </div>
      )}
    </div>
  );
};

export const Analytics = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  const fetchList = async (resolve = false) => {
    if (resolve) setIsResolving(true);
    else setIsLoading(true);
    try {
      const [listRes, visitorsRes] = await Promise.all([
        analyticsApi.getTodayVisitorList(resolve),
        analyticsApi.getTodayVisitors(),
      ]);
      if (listRes.success && listRes.data) {
        setVisitors(listRes.data.visitors);
      }
      if (visitorsRes.success && visitorsRes.data) {
        setTrend(visitorsRes.data.trend);
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

      {/* 近 7 天流量折线图 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h2 className="font-display text-lg font-bold text-gray-900">近 7 天上线人数趋势</h2>
        </div>
        {trend.length > 0 ? (
          <VisitorChart data={trend} />
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无趋势数据，等有访客后这里会显示折线图
          </div>
        )}
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
