import { useState, useEffect } from 'react';
import ElectricBorder from './ElectricBorder';
import StarBorder from './StarBorder';
import './AnnouncementModal.css';

const STORAGE_KEY = 'announcement-dismissed';

// 公告弹窗：AI 制作的欢迎公告（勾选"今天不再弹出"后当天不再显示）
export const AnnouncementModal = () => {
  const [show, setShow] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    if (localStorage.getItem(STORAGE_KEY) !== today) {
      // 延迟 1.2 秒弹出，避免打断首屏加载
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    if (dontShowToday) {
      localStorage.setItem(STORAGE_KEY, new Date().toLocaleDateString('en-CA'));
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative">
        <ElectricBorder color="#f97316" borderRadius={24} speed={0.8}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-[calc(100vw-4rem)]">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              🎉 欢迎来到 MyBlog
            </h2>

            <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              这个网站由 <span className="font-semibold text-accent-500">AI 制作</span>，
              是一个功能完整的小型博客，包含：
            </p>

            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span>📝</span> 发表 Markdown 文章与笔记
              </li>
              <li className="flex items-center gap-2">
                <span>🎵</span> 网易云音乐歌单在线播放
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span> 自由评论，即时可见
              </li>
              <li className="flex items-center gap-2">
                <span>🌙</span> 夜间模式一键切换
              </li>
              <li className="flex items-center gap-2">
                <span>📊</span> 后台访客统计与数据分析
              </li>
            </ul>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              —— by <span className="font-semibold text-gray-700 dark:text-gray-200">ZeRo0</span>
            </p>

            {/* 勾选框 */}
            <label className="mt-5 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">今天不再弹出</span>
            </label>

            {/* 确认按钮（StarBorder） */}
            <div className="mt-5">
              <StarBorder
                as="button"
                color="#f97316"
                speed="6s"
                className="announcement-star w-full"
                onClick={handleClose}
              >
                <span className="block w-full px-6 py-2.5 text-center font-medium transition-colors">
                  确认，开始浏览
                </span>
              </StarBorder>
            </div>
          </div>
        </ElectricBorder>
      </div>
    </div>
  );
};
