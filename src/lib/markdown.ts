import { defaultUrlTransform } from 'react-markdown';

// react-markdown 默认会拦掉 data: 协议，日记的 base64 图片需要放行；
// 其余地址仍走默认白名单，避免把 javascript: 之类的注入重新打开
export const dataImageUrlTransform = (url: string): string =>
  url.startsWith('data:image/') ? url : defaultUrlTransform(url);
