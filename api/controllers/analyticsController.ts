import { Response } from 'express';
import { Visit } from '../models/Visit.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

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
