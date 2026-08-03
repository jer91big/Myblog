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

    const tracks = playlist.tracks.slice(0, 50).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: (track.ar || []).map((a: any) => a.name).join(' / ') || '未知歌手',
      cover: track.al?.picUrl || '',
      duration: track.dt,
    }));

    res.json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        cover: playlist.coverImgUrl,
        trackCount: playlist.trackCount,
        tracks,
      },
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 获取歌曲播放地址
// 带 Cookie 请求真实播放地址（可解锁大部分非 VIP 歌曲）
export const getSongUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ success: false, message: 'Missing song id' });
      return;
    }

    const cookie = process.env.NETEASE_COOKIE || '';

    // 尝试获取真实播放地址（带 Cookie）
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
          res.json({ success: true, data: { url: song.url } });
          return;
        }
      }
    } catch (e) {
      console.error('enhance/player/url failed:', e);
    }

    // 回退：官方外链（版权受限歌曲会失败，返回 HTML）
    const fallback = `https://music.163.com/song/media/outer/url?id=${id}.mp3`;
    res.json({
      success: true,
      data: { url: fallback, restricted: true },
    });
  } catch (error) {
    console.error('Get song url error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
