import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Tag } from 'lucide-react';
import { noteApi } from '../api';
import { Note } from '../types';
import BorderGlow from '../components/BorderGlow';
import { Pagination } from '../components/Pagination';

export const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, [currentPage]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await noteApi.getNotes({ page: currentPage, limit: 12 });
      if (response.success && response.data) {
        setNotes(response.data.notes);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-accent-600 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-primary-400 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              笔记
            </h1>
            <p className="text-lg text-white/80">
              使用 Markdown 记录的技术笔记和知识碎片
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {notes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <BorderGlow
                  key={note.id}
                  glowColor="280 70"
                  backgroundColor="#ffffff"
                  borderRadius={16}
                  glowRadius={30}
                  glowIntensity={0.8}
                  coneSpread={20}
                  colors={['#a78bfa', '#c084fc', '#818cf8']}
                >
                  <Link
                    to={`/notes/${note.id}`}
                    className="block p-6"
                  >
                    <h2 className="font-display text-lg font-bold text-gray-900 mb-3 hover:text-accent-600 transition-colors line-clamp-2">
                      {note.title}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {note.excerpt}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {note.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatDate(note.publishedAt)}
                    </div>
                  </Link>
                </BorderGlow>
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
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无笔记</h3>
            <p className="text-gray-400">还没有发布任何笔记</p>
          </div>
        )}
      </main>
    </div>
  );
};
