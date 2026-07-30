import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './config/database.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.query.secret as string;
  if (secret !== 'init-myblog-2026') {
    return res.status(401).json({ success: false, message: 'Invalid secret' });
  }

  const connected = await connectDB();
  if (!connected) {
    return res.status(500).json({ success: false, message: 'DB connection failed' });
  }

  try {
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db!;

    // 设 admin 用户
    await db.collection('users').updateOne(
      { email: 'admin@myblog.com' },
      { $set: { role: 'admin' } }
    );

    // 创建分类
    const categories = [
      { name: '前端开发', slug: 'frontend' },
      { name: '后端开发', slug: 'backend' },
      { name: '人工智能', slug: 'ai' },
      { name: '生活随笔', slug: 'life' },
      { name: '技术教程', slug: 'tutorial' },
    ];
    for (const cat of categories) {
      await db.collection('categories').updateOne(
        { slug: cat.slug },
        { $setOnInsert: { ...cat, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }

    // 创建标签
    const tags = [
      { name: 'React', slug: 'react' },
      { name: 'Vue', slug: 'vue' },
      { name: 'Node.js', slug: 'nodejs' },
      { name: 'TypeScript', slug: 'typescript' },
      { name: 'Python', slug: 'python' },
      { name: 'JavaScript', slug: 'javascript' },
      { name: 'CSS', slug: 'css' },
      { name: 'MongoDB', slug: 'mongodb' },
      { name: 'Docker', slug: 'docker' },
      { name: 'Git', slug: 'git' },
    ];
    for (const tag of tags) {
      await db.collection('tags').updateOne(
        { slug: tag.slug },
        { $setOnInsert: { ...tag, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }

    res.json({ success: true, message: '初始化完成！管理员、分类、标签已创建' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
