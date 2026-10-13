import { Diary } from '../types';

export const formatDiaryDate = (date: string): string =>
  new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// 标题留空时用日期当标题
export const diaryDisplayTitle = (diary: Pick<Diary, 'title' | 'date'>): string =>
  diary.title.trim() || formatDiaryDate(diary.date);

// 用本地时区取值，toISOString 在 UTC 以西会串到前一天
export const localDateInputValue = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 后端存的是当日 UTC 正午，转回 <input type="date"> 需要的 YYYY-MM-DD
export const toDateInputValue = (date: string): string => localDateInputValue(new Date(date));
