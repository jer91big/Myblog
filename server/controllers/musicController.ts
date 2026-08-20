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
    console.log(`[music] playlist ${playlist.id}: trackIds=${trackIds.length}, initialTracks=${fullTracks.length}`);

    if (trackIds.length > fullTracks.length) {
      try {
        // 批量查询歌曲详情（c 参数格式：[{"id":xxx}]）
        const c = JSON.stringify(trackIds.slice(0, 500).map((id) => ({ id })));
        const detailRes = await fetch(
          `https://music.163.com/api/v3/song/detail?c=${encodeURIComponent(c)}`,
          {
            headers: {
              'User-Agent': UA,
              Referer: 'https://music.163.com/',
            },
          }
        );
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          console.log(`[music] song/detail: status=${detailRes.status}, songs=${detailData?.songs?.length || 0}`);
          if (detailData?.songs?.length) {
            fullTracks = detailData.songs;
          }
        } else {
          console.log(`[music] song/detail failed: status=${detailRes.status}`);
        }
      } catch (e) {
        console.error('Get full playlist detail failed:', e);
      }
    }
    console.log(`[music] final tracks: ${fullTracks.length}`);

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

