// 临时脚本：OP_MSG 协议握手诊断
import net from 'node:net';

const HOST = '159.143.223.135';
const PORT = 27017;

// BSON: { isMaster: 1, $db: "admin" }
function bsonHello(): Buffer {
  const parts = [
    Buffer.from('\x01isMaster\x00\x01\x00\x00\x00', 'binary'), // isMaster: int32 1
    Buffer.from('\x02$db\x00\x06\x00\x00\x00admin\x00', 'binary'), // $db: "admin"
    Buffer.from('\x00', 'binary'), // terminator
  ];
  const body = Buffer.concat(parts);
  const len = 4 + body.length;
  const buf = Buffer.alloc(len);
  buf.writeInt32LE(len, 0);
  body.copy(buf, 4);
  return buf;
}

// OP_MSG (2013)
function opMsg(bson: Buffer): Buffer {
  const flagBits = Buffer.alloc(4);
  const section = Buffer.concat([Buffer.from('\x00', 'binary'), bson]); // 0x00 = body section
  const headerSize = 4 + 4 + 4 + 4 + 4;
  const total = headerSize + section.length;
  const buf = Buffer.alloc(total);
  let off = 0;
  buf.writeInt32LE(total, off); off += 4;   // messageLength
  buf.writeInt32LE(1, off); off += 4;       // requestID
  buf.writeInt32LE(0, off); off += 4;       // responseTo
  buf.writeInt32LE(2013, off); off += 4;    // opCode OP_MSG
  flagBits.copy(buf, off); off += 4;        // flagBits
  section.copy(buf, off);
  return buf;
}

const socket = net.connect(PORT, HOST, () => {
  console.log('✅ TCP 已连接，发送 OP_MSG 握手...');
  socket.write(opMsg(bsonHello()));
});

socket.on('data', (chunk: Buffer) => {
  const text = chunk.toString('utf8', 20);
  console.log('服务端响应(截断):', JSON.stringify(text.slice(0, 400)));
  socket.end();
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('TCP 错误:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('超时未收到响应');
  process.exit(1);
}, 15000);
