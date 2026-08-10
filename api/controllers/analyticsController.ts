import { Response } from 'express';
import { Visit } from '../models/Visit.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// 私网/保留地址直接标记，不请求第三方
const isPrivateIP = (ip: string): boolean => {
  const clean = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (clean === '127.0.0.1' || clean === '::1') return true;
  return (
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    clean.startsWith('172.') ||
    clean === 'localhost' ||
    clean === 'unknown'
  );
};

// 通过 ip-api.com 批量解析 IP 属地（免费版，最多 100 个/次，返回中文）
const resolveLocations = async (ips: string[]): Promise<Map<string, string>> => {
  const result = new Map<string, string>();
  const publicIps = ips.filter((ip) => !isPrivateIP(ip));
  if (publicIps.length === 0) return result;

  for (let i = 0; i < publicIps.length; i += 100) {
    const batch = publicIps.slice(i, i + 100);
    try {
      const res = await fetch(
        'http://ip-api.com/batch?fields=query,country,regionName,city,status&lang=zh-CN',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch.map((ip) => ({ query: ip }))),
        }
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data) {
          if (item?.status === 'success') {
            const parts = [item.country, item.regionName, item.city].filter(Boolean);
            result.set(item.query, parts.join(' '));
          }
        }
      }
    } catch (e) {
      console.error('IP location resolve error:', e);
    }
  }
  return result;
};

const todayStr = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

// 今日上线人数（独立 IP）
export const getTodayVisitors = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = todayStr();
    const count = await Visit.countDocuments({ date: today });

    // 近 7 天趋势（含今天）
    const dates: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d)
      );
    }
    const trendRows = await Visit.aggregate([
      { $match: { date: { $in: dates } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]);
    const trend = dates.map((d) => ({
      date: d,
      count: trendRows.find((r: any) => r._id === d)?.count || 0,
    }));

    res.json({
      success: true,
      data: { today: count, trend },
    });
  } catch (error) {
    console.error('Get today visitors error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 今日上线人列表（IP + 属地，属地按需解析并缓存到数据库）
export const getTodayVisitorList = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = todayStr();
    let visits = await Visit.find({ date: today }).sort({ firstSeenAt: 1 });

    // ?refresh=1：清空缓存重新解析（用于切换语言或修正属地）
    if (req.query.refresh === '1' && visits.length > 0) {
      await Visit.updateMany({ date: today }, { $set: { location: '' } });
      visits = visits.map((v) => ({ ...v, location: '' }) as any);
    }

    // 找出还没有属地的 IP，批量解析
    const missing = [...new Set(visits.filter((v) => !v.location).map((v) => v.ip))];
    if (missing.length > 0) {
      const resolved = await resolveLocations(missing);
      for (const [ip, loc] of resolved) {
        await Visit.updateMany({ ip, date: today, location: '' }, { $set: { location: loc } });
      }
      // 更新内存中的列表
      for (const v of visits) {
        if (!v.location && resolved.has(v.ip)) v.location = resolved.get(v.ip)!;
      }
    }

    res.json({
      success: true,
      data: {
        visitors: visits.map((v) => ({
          ip: v.ip,
          location: v.location || (isPrivateIP(v.ip) ? '内网/本地' : '未知'),
          firstSeenAt: v.firstSeenAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get today visitor list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
