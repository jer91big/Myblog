import { Request, Response as ExpressResponse } from 'express';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 获取网易云歌单详情（含歌曲列表）
export const getPlaylist = async (req: Request, res: ExpressResponse): Promise<void> => {
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

    // playlist.tracks 接口只返回前 10 首，用 trackIds 批量查询完整歌曲列表
    let fullTracks = playlist.tracks || [];
    const trackIds: number[] = (playlist.trackIds || []).map((t: any) => t.id);

    if (trackIds.length > fullTracks.length) {
      try {
        // 批量查询歌曲详情（一次最多 1000 首）
        const idsStr = trackIds.slice(0, 500).join(',');
        const detailRes = await fetch(
          `https://music.163.com/api/v3/song/detail?ids=[${idsStr}]`,
          {
            headers: {
              'User-Agent': UA,
              Referer: 'https://music.163.com/',
            },
          }
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (detailData?.songs?.length) {
            fullTracks = detailData.songs;
          }
        }
      } catch (e) {
        console.error('Get full playlist detail failed:', e);
      }
    }

    const tracks = fullTracks.slice(0, 100).map((track: any) => ({
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
        trackCount: trackIds.length || playlist.trackCount,
        tracks,
      },
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 尝试从一个 URL 拉取音频流，返回 Response 或 null
async function fetchAudio(url: string, cookie: string): Promise<Response | null> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Referer: 'https://music.163.com/',
    ...(cookie ? { Cookie: cookie } : {}),
  };

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    // 必须是音频，拒绝 HTML 错误页
    if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
      return null;
    }
    return response;
  } catch (e) {
    console.error(`fetchAudio failed: ${url}`, e);
    return null;
  }
}

// 诊断端点：查看每步请求在 Vercel 端的实际响应
export const debugSong = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ success: false, message: 'Missing id' });
      return;
    }
    const cookie = process.env.NETEASE_COOKIE || '';
    const result: any = { id };

    // 1. outer/url
    try {
      const r1 = await fetch(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, {
        headers: { 'User-Agent': UA, Referer: 'https://music.163.com/', ...(cookie ? { Cookie: cookie } : {}) },
        signal: AbortSignal.timeout(10000),
      });
      result.outerUrl = {
        status: r1.status,
        contentType: r1.headers.get('content-type'),
        contentLength: r1.headers.get('content-length'),
        firstBytes: (await r1.text()).slice(0, 80),
      };
    } catch (e: any) {
      result.outerUrl = { error: e.message };
    }

    // 2. enhance/player/url
    try {
      const r2 = await fetch(`https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`, {
        headers: { 'User-Agent': UA, Referer: 'https://music.163.com/', ...(cookie ? { Cookie: cookie } : {}) },
        signal: AbortSignal.timeout(10000),
      });
      const data = await r2.json();
      const song = data?.data?.[0];
      result.enhanceUrl = { status: r2.status, songUrl: song?.url ? song.url.slice(0, 80) : null, code: song?.code };

      // 3. 尝试访问 CDN 直链
      if (song?.url) {
        try {
          const cdn = song.url.startsWith('http://') ? `https://${song.url.slice(7)}` : song.url;
          const r3 = await fetch(cdn, {
            headers: { 'User-Agent': UA, Referer: 'https://music.163.com/', ...(cookie ? { Cookie: cookie } : {}) },
            signal: AbortSignal.timeout(10000),
          });
          result.cdn = {
            status: r3.status,
            contentType: r3.headers.get('content-type'),
            contentLength: r3.headers.get('content-length'),
          };
        } catch (e: any) {
          result.cdn = { error: e.message };
        }
      }
    } catch (e: any) {
      result.enhanceUrl = { error: e.message };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Debug song error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 音频流代理：浏览器请求本接口，服务端从网易云拉取音频并转发
// 优先 music.163.com 主域（Vercel 海外可达），CDN 直链兜底
export const proxySong = async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).end();
      return;
    }

    const cookie = process.env.NETEASE_COOKIE || '';

    let audioRes: Response | null = null;

    // 1. 主域外链（Vercel 可达，部分无版权歌可用）
    audioRes = await fetchAudio(`https://music.163.com/song/media/outer/url?id=${id}.mp3`, cookie);

    // 2. CDN 直链兜底（enhance/player/url 带 Cookie 获取）
    if (!audioRes) {
      try {
        const urlRes = await fetch(
          `https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=320000`,
          {
            headers: {
              'User-Agent': UA,
              Referer: 'https://music.163.com/',
              ...(cookie ? { Cookie: cookie } : {}),
            },
          }
        );
        const data = await urlRes.json();
        const raw = data?.data?.[0]?.url;
        if (raw) {
          const cdnUrl = raw.startsWith('http://') ? `https://${raw.slice(7)}` : raw;
          audioRes = await fetchAudio(cdnUrl, cookie);
        }
      } catch (e) {
        console.error('enhance/player/url failed:', e);
      }
    }

    if (!audioRes) {
      res.status(404).json({ success: false, message: 'Song not available' });
      return;
    }

    // 转发 Range 请求头（支持拖动进度条）
    if (req.headers.range) {
      const headers = audioRes.headers;
      const rangeRes = await fetch(audioRes.url, {
        headers: {
          Range: req.headers.range as string,
          'User-Agent': UA,
          Referer: 'https://music.163.com/',
          ...(cookie ? { Cookie: cookie } : {}),
        },
      });
      if (rangeRes.ok) {
        audioRes = rangeRes;
      }
    }

    // 转发音频响应头
    res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mpeg');
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
