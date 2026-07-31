import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';
import './MusicPlayer.css';

// 在这里配置你的音乐列表
const MUSIC_LIST = [
  {
    name: '示例歌曲',
    artist: '未知艺术家',
    url: 'https://music.163.com/song/media/outer/url?id=1901371647.mp3',
    cover: '',
    lrc: '',
    theme: '#10b981',
  },
  // 添加更多歌曲示例：
  // {
  //   name: '歌名',
  //   artist: '歌手',
  //   url: 'https://example.com/song.mp3',
  //   cover: 'https://example.com/cover.jpg',
  // },
];

export const MusicPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<APlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化 APlayer
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    if (!playerRef.current) {
      playerRef.current = new APlayer({
        container: containerRef.current,
        audio: MUSIC_LIST,
        mini: false,
        autoplay: false,
        theme: '#10b981',
        loop: 'all',
        order: 'list',
        preload: 'auto',
        volume: 0.7,
        mutex: true,
        listFolded: false,
        listMaxHeight: '250px',
      });
    }

    return () => {
      // 面板关闭时暂停
      playerRef.current?.pause();
    };
  }, [isOpen]);

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
          <div className="loader">
            <div className="load" />
            <div className="load" />
            <div className="load" />
            <div className="play" />
          </div>
        )}
      </button>

      {/* 弹出面板 */}
      {isOpen && (
        <div className="music-panel" ref={panelRef}>
          <div className="music-panel-header">
            <div className="currentplaying">
              <div className="spotify">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-500">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
              <div className="heading">🎵 我的音乐</div>
            </div>
          </div>

          {/* APlayer 容器 */}
          <div className="music-aplayer" ref={containerRef} />
        </div>
      )}
    </>
  );
};
