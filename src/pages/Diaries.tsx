import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Calendar, PenLine } from 'lucide-react';
import { diaryApi } from '../api';
import { Diary } from '../types';
import BorderGlow from '../components/BorderGlow';
import { Pagination } from '../components/Pagination';
import { diaryDisplayTitle, formatDiaryDate } from '../lib/diary';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

export const Diaries = () => {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDiaries();
  }, [currentPage]);

  // 卡片 stagger 入场
  useEffect(() => {
    if (isLoading || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('.diary-card');
    if (!cards.length) return;

    gsap.set(cards, { y: 50, opacity: 0, scale: 0.95 });

    const trigger = ScrollTrigger.create({
      trigger: gridRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(cards, {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out',
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [isLoading, diaries]);

  const fetchDiaries = async () => {
    setIsLoading(true);
    try {
      const response = await diaryApi.getDiaries({ page: currentPage, limit: 12 });
      if (response.success && response.data) {
        setDiaries(response.data.diaries);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-accent-600 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">日记</h1>
              <p className="text-lg text-white/80">
                只属于你自己的记录，别人看不到这里的内容
              </p>
            </div>
            <Link
              to="/diaries/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-lg font-medium hover:bg-white/25 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              写日记
            </Link>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full" />
          </div>
        ) : diaries.length > 0 ? (
          <>
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {diaries.map((diary) => (
                <div key={diary.id} className="diary-card">
                  <BorderGlow
                    glowColor="280 70"
                    backgroundColor="#ffffff"
                    borderRadius={16}
                    glowRadius={30}
                    glowIntensity={0.8}
                    coneSpread={20}
                    colors={['#a78bfa', '#c084fc', '#818cf8']}
                  >
                    <Link
                      to={`/diaries/${diary.id}`}
                      className="block p-6 hover:translate-y-[-2px] transition-transform duration-200"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDiaryDate(diary.date)}
                        </span>
                        {diary.status === 'draft' && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                            草稿
                          </span>
                        )}
                      </div>
                      <h2 className="font-display text-lg font-bold text-gray-900 mb-3 hover:text-accent-600 transition-colors line-clamp-2">
                        {diaryDisplayTitle(diary)}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {diary.excerpt || '（无正文摘要）'}
                      </p>
                    </Link>
                  </BorderGlow>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-20">
            <NotebookPen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">还没有日记</h3>
            <p className="text-gray-400 mb-6">记录下今天的第一件事吧</p>
            <Link
              to="/diaries/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              <PenLine className="w-4 h-4" />
              写日记
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
