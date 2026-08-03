import { Request, Response } from 'express';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 获取网易云歌单详情（含歌曲列表）
export const getPlaylist = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ success: false, message: 'Missing playlist id' });
      return;
    }

    const response = await fetch(
      `https://music.163.com/api/v6/playlist/detail?id=${id}`,
      {
        headers: {
          'User-Agent': UA,
          Referer: 'https://music.163.com/',
        },
      }
    );

    if (!response.ok) {
      res.status(502).json({ success: false, message: 'NetEase API request failed' });
      return;
    }

    const data = await response.json();
    const playlist = data?.playlist;

    if (!playlist) {
      res.status(404).json({ success: false, message: 'Playlist not found or private' });
      return;
    }

    const toHttps = (u: string) => (u.startsWith('http://') ? `https://${u.slice(7)}` : u);

    const tracks = playlist.tracks.slice(0, 50).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: (track.ar || []).map((a: any) => a.name).join(' / ') || '未知歌手',
      cover: track.al?.picUrl ? toHttps(track.al.picUrl) : '',
      duration: track.dt,
    }));

    res.json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        cover: playlist.coverImgUrl ? toHttps(playlist.coverImgUrl) : '',
        trackCount: playlist.trackCount,
        tracks,
      },
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取歌曲真实播放地址（带 Cookie），返回 null 表示不可用
async function getRealSongUrl(id: string): Promise<string | null> {
  const cookie = process.env.NETEASE_COOKIE || '';

  try {
    const response = await fetch(
      `https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`,
      {
        headers: {
          'User-Agent': UA,
          Referer: 'https://music.163.com/',
          ...(cookie ? { Cookie: cookie } : {}),
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const song = data?.data?.[0];
      if (song?.url) {
        return song.url.startsWith('http://') ? `https://${song.url.slice(7)}` : song.url;
      }
    }
  } catch (e) {
    console.error('enhance/player/url failed:', e);
  }

  // 回退：官方外链（版权受限歌曲会失败）
  return `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
}

// 音频流代理：浏览器请求本接口，服务端从网易云拉取音频并转发
// 解决 JSON 不能直接播放 + 网易云防盗链问题
export const proxySong = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).end();
      return;
    }

    const url = await getRealSongUrl(id);
    if (!url) {
      res.status(404).json({ success: false, message: 'Song not available' });
      return;
    }

    const cookie = process.env.NETEASE_COOKIE || '';

    // 转发请求（支持 Range，允许拖动进度条）
    const headers: Record<string, string> = {
      'User-Agent': UA,
      Referer: 'https://music.163.com/',
      ...(cookie ? { Cookie: cookie } : {}),
    };
    if (req.headers.range) {
      headers.Range = req.headers.range as string;
    }

    const audioRes = await fetch(url, { headers });

    if (!audioRes.ok) {
      res.status(502).end();
      return;
    }

    // 转发音频响应头
    const contentType = audioRes.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    if (audioRes.headers.get('content-range')) {
      res.setHeader('Content-Range', audioRes.headers.get('content-range')!);
    }
    res.status(audioRes.status);

    // 流式转发音频数据
    const reader = audioRes.body?.getReader();
    if (!reader) {
      res.end();
      return;
    }
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error('Proxy song error:', error);
    res.status(500).end();
  }
};
