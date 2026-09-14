import { useState, useEffect } from 'react';
import ElectricBorder from './ElectricBorder';
import StarBorder from './StarBorder';
import './AnnouncementModal.css';

const STORAGE_KEY = 'announcement-dismissed-v4';

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
    <div className="announcement-modal fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative">
        <ElectricBorder color="#f97316" borderRadius={24} speed={0.8}>
          <div className="announcement-modal-content bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 max-w-md w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-4rem)]">
            <h2 id="announcement-title" className="font-display text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              🎉 欢迎来到 MyBlog
            </h2>

            <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              这个网站由 <span className="font-semibold text-accent-500">AI 制作</span>，
              是一个功能完整的小型博客，<span className="font-medium text-gray-900 dark:text-white">主要面向 PC 端</span>，
              建议使用电脑浏览器访问以获得最佳体验。
            </p>

            <p className="mt-3 text-sm font-medium text-accent-500 dark:text-accent-400">
              ✨ 最新更新：笔记文件夹 + 阅读体验升级
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span>📁</span><span>笔记支持文件夹分类与筛选</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📤</span><span>笔记可分享（复制链接 / 微博 / Twitter / QQ）</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📑</span><span>目录支持折叠，长文导航更清爽</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⏱️</span><span>笔记显示预估阅读时间</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🎨</span><span>全站 GSAP 滚动动画与视差效果</span>
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
                className="w-5 h-5 accent-orange-500"
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
