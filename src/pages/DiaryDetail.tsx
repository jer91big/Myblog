import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, PenLine, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lightbox } from '../components/Lightbox';
import { diaryApi } from '../api';
import { Diary } from '../types';
import { dataImageUrlTransform } from '../lib/markdown';
import { diaryDisplayTitle, formatDiaryDate } from '../lib/diary';

export const DiaryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
    fetchDiary();
  }, [id]);

  const fetchDiary = async () => {
    setIsLoading(true);
    try {
      const response = await diaryApi.getDiaryById(id!);
      if (response.success && response.data) {
        setDiary(response.data);
      } else {
        setErrorMessage(response.message || '日记不存在或无权访问');
      }
    } catch (error) {
      console.error('Failed to fetch diary:', error);
      setErrorMessage('加载日记失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 点正文图片放大；包在链接里的图保持跳转行为
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG' || target.closest('a')) return;
    const img = target as HTMLImageElement;
    if (img.src) {
      setLightbox({ src: img.src, alt: img.alt });
    }
  };

  const handleDelete = async () => {
    if (!diary) return;
    if (!window.confirm('确定删除这篇日记吗？删除后无法恢复。')) return;

    setIsDeleting(true);
    try {
      const response = await diaryApi.deleteDiary(diary.id);
      if (response.success) {
        navigate('/diaries');
      } else {
        setErrorMessage(response.message || '删除失败，请重试');
      }
    } catch (error) {
      console.error('Failed to delete diary:', error);
      setErrorMessage('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-gray-900 mb-2">无法打开这篇日记</p>
          <p className="text-gray-500 mb-6">{errorMessage || '日记不存在或无权访问'}</p>
          <Link
            to="/diaries"
            className="inline-block px-6 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            返回日记列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 pt-24 pb-12">
        <article className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/diaries"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-accent-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              日记列表
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to={`/diaries/${diary.id}/edit`}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                编辑
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-md p-6 sm:p-10">
            <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
              <Calendar className="w-4 h-4" />
              {formatDiaryDate(diary.date)}
            </div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">
              {diaryDisplayTitle(diary)}
            </h1>

            <div className="prose prose-lg max-w-none" onClick={handleContentClick}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={dataImageUrlTransform}
              >
                {diary.content || '*暂无内容*'}
              </ReactMarkdown>
            </div>
          </div>
        </article>
      </main>

      <Lightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
};
