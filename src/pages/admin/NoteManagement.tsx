import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, Clock, Search, Filter, GripVertical, FolderInput,
} from 'lucide-react';
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { noteApi } from '../../api';
import { Note, NoteFolder } from '../../types';
import { NoteFolderSidebar } from '../../components/NoteFolderSidebar';

function DraggableNoteRow({
  note,
  children,
}: {
  note: Note;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `note-${note.id}`,
    data: { type: 'note', note },
  });

  return (
    <tr
      ref={setNodeRef}
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'opacity-40' : ''}`}
    >
      <td className="px-2 py-4 w-8">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      {children}
    </tr>
  );
}

export const NoteManagement = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [unfiledCount, setUnfiledCount] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [activeFolderId, setActiveFolderId] = useState<string | null | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDragNote, setActiveDragNote] = useState<Note | null>(null);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [currentPage, filterStatus, activeFolderId]);

  const fetchFolders = async () => {
    try {
      const response = await noteApi.getFolders();
      if (response.success && response.data) {
        setFolders(response.data.folders);
        setUnfiledCount(response.data.unfiledCount);
        const total = response.data.folders.reduce((sum, f) => sum + f.noteCount, 0) + response.data.unfiledCount;
        setTotalNotes(total);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: 10, status: filterStatus };
      if (activeFolderId === null) {
        params.folderId = 'null';
      } else if (activeFolderId) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇笔记吗？')) return;
    try {
      const response = await noteApi.deleteNote(id);
      if (response.success) {
        fetchNotes();
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const response = await noteApi.createFolder(name);
      if (response.success) {
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    try {
      const response = await noteApi.renameFolder(id, name);
      if (response.success) {
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('确定要删除这个文件夹吗？文件夹内的笔记将移回"未归档"。')) return;
    try {
      const response = await noteApi.deleteFolder(id);
      if (response.success) {
        if (activeFolderId === id) setActiveFolderId(undefined);
        fetchFolders();
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'note') {
      setActiveDragNote(active.data.current.note);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverFolderId(null);
      return;
    }
    const overId = over.id as string;
    if (overId === 'folder-all') {
      setOverFolderId('all');
    } else if (overId === 'folder-unfiled') {
      setOverFolderId('unfiled');
    } else if (overId.startsWith('folder-')) {
      setOverFolderId(overId.replace('folder-', ''));
    } else {
      setOverFolderId(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragNote(null);
    setOverFolderId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (!activeId.startsWith('note-') || !overId.startsWith('folder-')) return;

    const noteId = activeId.replace('note-', '');
    let targetFolderId: string | null = null;

    if (overId === 'folder-unfiled') {
      targetFolderId = null;
    } else if (overId === 'folder-all') {
      return; // dropping on "all" is a no-op
    } else {
      targetFolderId = overId.replace('folder-', '');
    }

    // Don't move if already in this folder
    const draggedNote = active.data.current?.note as Note | undefined;
    const currentFolderId = draggedNote?.folderId ?? null;
    if (currentFolderId === targetFolderId) return;

    try {
      const response = await noteApi.moveNoteToFolder(noteId, targetFolderId);
      if (response.success) {
        fetchNotes();
        fetchFolders();
      }
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const filteredNotes = notes.filter((note) =>
    searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">笔记管理</h1>
            <p className="text-gray-500 mt-1">管理您的 Markdown 笔记，拖拽笔记到文件夹进行整理</p>
          </div>
          <Link
            to="/admin/notes/new"
            className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新建笔记
          </Link>
        </div>

        <div className="flex gap-6 items-start">
          {/* Left sidebar - folders */}
          <div className="w-56 flex-shrink-0 sticky top-4">
            <NoteFolderSidebar
              folders={folders}
              unfiledCount={unfiledCount}
              totalNotes={totalNotes}
              activeFolderId={activeFolderId}
              onSelectFolder={(id) => { setActiveFolderId(id); setCurrentPage(1); }}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              isOver={overFolderId}
            />
          </div>

          {/* Right main area - notes table */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索笔记标题..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value as typeof filterStatus); setCurrentPage(1); }}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
                  >
                    <option value="all">全部状态</option>
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-4 w-8" />
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">标题</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">标签</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">状态</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">发布时间</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto" />
                        </td>
                      </tr>
                    ) : filteredNotes.length > 0 ? (
                      filteredNotes.map((note) => (
                        <DraggableNoteRow key={note.id} note={note}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{note.title}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{note.excerpt}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              note.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {note.status === 'published' ? '已发布' : '草稿'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(note.publishedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/notes/${note.id}`}
                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/admin/notes/${note.id}/edit`}
                                className="p-2 text-gray-500 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(note.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </DraggableNoteRow>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className="text-gray-500">
                            {searchQuery ? `未找到包含 "${searchQuery}" 的笔记` : '暂无笔记'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <p className="text-gray-500 text-sm">
                    显示第 {currentPage} 页，共 {totalPages} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1 text-gray-600 font-medium">{currentPage}</span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragNote ? (
          <div className="bg-white shadow-xl rounded-lg px-4 py-3 border-2 border-accent-400 opacity-90 max-w-xs">
            <div className="flex items-center gap-2">
              <FolderInput className="w-4 h-4 text-accent-500 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 truncate">{activeDragNote.title}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
