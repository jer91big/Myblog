import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Tag } from 'lucide-react';
import { noteApi } from '../api';
import { Note, NoteFolder } from '../types';
import BorderGlow from '../components/BorderGlow';
import { Pagination } from '../components/Pagination';
import { NoteFolderTree } from '../components/NoteFolderTree';
import { buildFolderTree } from '../lib/folderTree';
import { useAuthStore } from '../store/authStore';
import { gsap, ScrollTrigger } from '../hooks/useGsap';

export const Notes = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const notesGridRef = useRef<HTMLDivElement>(null);

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [currentPage, activeFolderId]);

  // 笔记卡片 stagger 入场
  useEffect(() => {
    if (isLoading || !notesGridRef.current) return;

    const cards = notesGridRef.current.querySelectorAll('.note-card');
    if (!cards.length) return;

    gsap.set(cards, { y: 50, opacity: 0, scale: 0.95 });

    const trigger = ScrollTrigger.create({
      trigger: notesGridRef.current,
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
  }, [isLoading, notes]);

  const fetchFolders = async () => {
    try {
      // 公开页只统计已发布笔记，避免草稿让计数虚高
      const response = await noteApi.getFolders({ publishedOnly: true });
      if (response.success && response.data) {
        setFolders(response.data.folders);
        setTotalNotes(response.data.totalNotes);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        folderId?: string;
      } = { page: currentPage, limit: 12 };
      if (activeFolderId) {
        params.folderId = activeFolderId;
      }
      const response = await noteApi.getNotes(params);
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

  const handleFolderChange = (folderId: string | undefined) => {
    setActiveFolderId(folderId);
    setCurrentPage(1);
  };

  // 管理员的右键菜单操作，普通访客不传则文件夹树保持只读
  const handleCreateNoteInFolder = (folderId: string) => {
    navigate(`/admin/notes/new?folderId=${encodeURIComponent(folderId)}`);
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      const response = await noteApi.renameFolder(id, name);
      if (response.success) {
        fetchFolders();
      } else if (response.message) {
        alert(response.message);
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    try {
      const response = await noteApi.createFolder(name, parentId);
      if (response.success) {
        fetchFolders();
      } else if (response.message) {
        alert(response.message);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
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

  // 仅在首次进入时显示整页 loading；切换文件夹时保留侧边栏，避免闪烁与展开状态丢失
  if (isLoading && notes.length === 0 && folders.length === 0) {
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
        <div
          className={
            folders.length > 0
              ? 'lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:items-start'
              : ''
          }
        >
          {folders.length > 0 && (
            <aside className="mb-6 lg:mb-0 lg:sticky lg:top-6 max-h-72 overflow-y-auto lg:max-h-[calc(100vh-6rem)]">
              <NoteFolderTree
                nodes={folderTree}
                flatFolders={folders}
                totalNotes={totalNotes}
                activeFolderId={activeFolderId}
                onSelect={handleFolderChange}
                actions={
                  isAdmin
                    ? {
                        onCreateNote: handleCreateNoteInFolder,
                        onCreateFolder: handleCreateFolder,
                        onRenameFolder: handleRenameFolder,
                      }
                    : undefined
                }
              />
            </aside>
          )}

          <div className="min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin w-10 h-10 border-4 border-accent-500 border-t-transparent rounded-full" />
              </div>
            ) : notes.length > 0 ? (
              <>
                <div
                  ref={notesGridRef}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {notes.map((note) => (
                    <div key={note.id} className="note-card">
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
                          to={`/notes/${note.id}`}
                          className="block p-6 hover:translate-y-[-2px] transition-transform duration-200"
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
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无笔记</h3>
                <p className="text-gray-400">
                  {activeFolderId ? '该文件夹下暂无笔记' : '还没有发布任何笔记'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
