// 临时脚本：patch DNS 绕过污染，连接 Atlas
import mongoose from 'mongoose';
import dns from 'node:dns';

// —— patch DNS（运营商污染了这些域名）——
const SHARDS: Record<string, string> = {
  'ac-7zqxvud-shard-00-00.std437k.mongodb.net': '159.143.223.135',
  'ac-7zqxvud-shard-00-01.std437k.mongodb.net': '159.143.223.170',
  'ac-7zqxvud-shard-00-02.std437k.mongodb.net': '159.143.223.154',
};

// 1. SRV 记录（mongodb+srv:// 用）— driver 用的是 dns.promises 异步版
const origResolveSrv = dns.promises.resolveSrv;
(dns.promises as any).resolveSrv = async (hostname: string) => {
  if (hostname === '_mongodb._tcp.cluster0.std437k.mongodb.net') {
    return Object.keys(SHARDS).map((name) => ({ name, port: 27017, priority: 0, weight: 0 }));
  }
  return origResolveSrv(hostname);
};

// 2. A 记录（连分片主机用）
const origResolve4 = dns.promises.resolve4;
(dns.promises as any).resolve4 = async (hostname: string) => {
  if (SHARDS[hostname]) {
    return [SHARDS[hostname]];
  }
  return origResolve4(hostname);
};

// 2.5 TXT 记录（driver 查 authSource 用）
const origResolveTxt = dns.promises.resolveTxt;
(dns.promises as any).resolveTxt = async (hostname: string) => {
  if (hostname === 'cluster0.std437k.mongodb.net') {
    return [['authSource=admin']];
  }
  return origResolveTxt(hostname);
};

// 3. lookup（TCP 连接用）
const origLookup = dns.lookup;
(dns as any).lookup = (hostname: string, options: any, callback?: any) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (SHARDS[hostname]) {
    callback(null, SHARDS[hostname], 4);
    return {};
  }
  return origLookup(hostname, options, callback);
};

// —— 标准连接串连接 ——
const uri =
  'mongodb+srv://zrl2975664614_db_user:zrl200605@cluster0.std437k.mongodb.net/?retryWrites=true&w=majority';

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  console.log('✅ 连接成功!');
  const dbs = await mongoose.connection.db.admin().listDatabases();
  for (const db of dbs.databases as any[]) {
    const conn = mongoose.connection.getClient().db(db.name);
    const collections = await conn.listCollections().toArray();
    const hasUsers = collections.some((c: any) => c.name === 'users');
    console.log(`- ${db.name} ${hasUsers ? '← 含 users 集合' : ''}`);
  }
} catch (e: any) {
  console.error('连接失败 message:', e?.message);
  console.error('错误代码:', e?.code);
  console.error('原因:', JSON.stringify(e?.cause || e?.reason || e?.err || null, null, 2));
}
await mongoose.disconnect();
