import { Request, Response, NextFunction } from 'express';
import { Visit } from '../models/Visit.js';

// 今日日期（Asia/Shanghai 时区，YYYY-MM-DD）
const todayStr = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return parts; // 形如 2026-08-10
};

// 记录访问 IP（同一天同一 IP 去重），失败不影响主流程
export const trackVisit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await Visit.updateOne(
      { ip, date: todayStr() },
      { $setOnInsert: { ip, date: todayStr(), firstSeenAt: new Date() } },
      { upsert: true }
    );
  } catch (error) {
    // 记录失败不阻塞请求
    console.error('Track visit error:', error);
  }
  next();
};
