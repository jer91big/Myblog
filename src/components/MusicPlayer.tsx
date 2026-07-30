import { useState, useRef } from 'react';
import { Music, X } from 'lucide-react';
import './MusicPlayer.css';

export const MusicPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
              <div className="heading">
                🎵 音乐播放器
              </div>
            </div>
          </div>

          {/* 网易云歌单 */}
          <div className="music-embed">
            <iframe
              title="网易云音乐"
              frameBorder="no"
              marginWidth={0}
              marginHeight={0}
              src="https://music.163.com/outchain/player?type=0&id=17927582985&auto=1&height=430"
              style={{ width: '100%', height: '430px' }}
            />
          </div>

          {/* 底部动画条 */}
          <div className="music-equalizer">
            <div className="equalizer-bar">
              <span className="bar bar1" />
              <span className="bar bar2" />
              <span className="bar bar3" />
              <span className="bar bar4" />
              <span className="bar bar5" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
