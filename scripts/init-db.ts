import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI!;

async function init() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  // 设为管理员
  await db.collection('users').updateOne(
    { email: 'admin@myblog.com' },
    { $set: { role: 'admin' } }
  );
  console.log('✅ 用户已设为管理员');

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
  console.log('✅ 5 个分类已创建');

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
  console.log('✅ 10 个标签已创建');

  await mongoose.disconnect();
  console.log('\n🎉 初始化完成！快去发文章吧！');
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ 失败:', err.message);
  process.exit(1);
});
