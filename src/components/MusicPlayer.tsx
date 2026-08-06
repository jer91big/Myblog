import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';
import './MusicPlayer.css';

// 网易云歌单 ID
const PLAYLIST_ID = '17927582985';

interface Track {
  id: number;
  name: string;
  artist: string;
  cover: string;
}

export const MusicPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<APlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 打开面板且播放器未初始化时，加载歌单并创建播放器实例
  // （关闭面板只隐藏 UI，不销毁实例，音乐继续播放）
  useEffect(() => {
    if (!isOpen || playerRef.current) return;
    if (!containerRef.current) return;

    const init = async () => {
      setLoading(true);
      setError('');
      try {
        // 30 秒超时，避免一直转圈
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(`/api/music/playlist?id=${PLAYLIST_ID}`, {
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          setError(`歌单加载失败（${res.status}），请稍后重试`);
          return;
        }

        const data = await res.json();
        if (!data.success || !data.data) {
          setError('歌单加载失败，请稍后重试');
          return;
        }

        const { tracks, name } = data.data;
        if (tracks.length === 0) {
          setError('歌单为空');
          return;
        }

        setPlaylistName(name);

        const audio = tracks.map((track: Track) => ({
          name: track.name,
          artist: track.artist,
          // 浏览器（国内）直接请求网易云官方外链，能播放无版权歌曲
          url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
          cover: track.cover || undefined,
          theme: '#10b981',
        }));

        const player = new APlayer({
          container: containerRef.current,
          audio,
          mini: false,
          autoplay: false,
          theme: '#10b981',
          loop: 'all',
          order: 'list',
          preload: 'metadata',
          volume: 0.7,
          mutex: true,
          listFolded: false,
          listMaxHeight: '250px',
        });
        playerRef.current = player;

        // 播放失败（版权受限/链接失效）时自动切到下一首
        player.on('error', () => {
          const current = player.list.index;
          if (current < player.list.audios.length - 1) {
            player.list.switch(current + 1);
          } else {
            player.list.switch(0);
          }
        });
      } catch (e: any) {
        console.error('Failed to load playlist:', e);
        const msg =
          e?.name === 'AbortError'
            ? '请求超时（30秒），请重试'
            : e instanceof SyntaxError
            ? '服务器返回了异常响应'
            : `网络错误：${e?.message || '未知原因'}`;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      playerRef.current?.pause();
    };
  }, []);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        className={`music-fab ${isOpen ? 'music-fab-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? '关闭播放器' : '打开音乐'}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          /* 网易云音乐 logo */
          <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#C20C0C" />
            <path
              fill="#fff"
              d="M21.4 6.4c-1.8 0-3.4.7-4.5 2-1.1 1.3-1.7 2.8-1.7 4.5v7.2c0 .6-.2 1.3-.7 1.8-.6.6-1.3.9-2 .9-1.6 0-2.8-1.3-2.8-2.8 0-1.6 1.3-2.8 2.8-2.8.3 0 .7.1 1 .2v-4.7c-.9-.3-1.7-.5-2.6-.5-2.8 0-5 2.2-5 5s2.2 5 5 5c1.5 0 2.8-.6 3.7-1.7.9-1 1.4-2.3 1.4-3.6v-7.2c0-1 .4-1.9 1.2-2.6.8-.8 1.8-1.2 2.8-1.2h.3V6.4h-.4z"
            />
          </svg>
        )}
      </button>

      {/* 弹出面板（常驻渲染，关闭时仅隐藏，音乐继续播放） */}
      <div
        className={`music-panel ${isOpen ? 'music-panel-open' : ''}`}
        ref={panelRef}
        aria-hidden={!isOpen}
      >
        <div className="music-panel-header">
          <div className="currentplaying">
            <div className="spotify">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-500">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <div className="heading">
              {playlistName ? `🎵 ${playlistName}` : '🎵 我的音乐'}
            </div>
          </div>
          <p className="music-playlist-tip">
            由于版权原因部分歌曲无法播放，请到
            <a
              href="https://music.163.com/#/playlist?id=17927582985"
              target="_blank"
              rel="noreferrer"
            >
              歌单
            </a>
            收听
          </p>
        </div>

        <div className="music-aplayer">
          {/* APlayer 容器始终渲染，避免 ref 变 null */}
          <div ref={containerRef} />
          {loading && (
            <div className="music-loading">
              <div className="music-spinner" />
              <p>正在加载歌单...</p>
            </div>
          )}
          {error && (
            <div className="music-error">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
