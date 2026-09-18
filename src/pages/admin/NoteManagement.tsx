import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, Clock, Search, Filter, GripVertical, FolderInput, Folder,
} from 'lucide-react';
import {
  DndContext, DragOverlay, useSensor, useSensors, PointerSensor,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { noteApi } from '../../api';
import { Note, NoteFolder } from '../../types';
import { NoteFolderSidebar } from '../../components/NoteFolderSidebar';
import { ObsidianImportModal } from '../../components/ObsidianImportModal';
import {
  buildFolderTree,
  collectDescendantIds,
  getAncestorIds,
} from '../../lib/folderTree';

type DragItem =
  | { type: 'note'; note: Note }
  | { type: 'folder'; folder: NoteFolder };

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
  const navigate = useNavigate();
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
  const [activeDragItem, setActiveDragItem] = useState<DragItem | null>(null);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandIds = useCallback((ids: string[]) => {
    setExpandedIds((prev) => {
      const missing = ids.filter((id) => !prev.has(id));
      if (missing.length === 0) return prev;
      return new Set([...prev, ...missing]);
    });
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await noteApi.getFolders();
      if (response.success && response.data) {
        setFolders(response.data.folders);
        setUnfiledCount(response.data.unfiledCount);
        // 递归计数由服务端汇总，客户端直接采用避免重复累加
        setTotalNotes(response.data.totalNotes);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  }, []);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        status: string;
        folderId?: string;
      } = { page: currentPage, limit: 10, status: filterStatus };
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
  }, [currentPage, filterStatus, activeFolderId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 选中深层文件夹时，逐级展开它的祖先，保证选中项可见
  useEffect(() => {
    if (typeof activeFolderId !== 'string') return;
    expandIds(getAncestorIds(folders, activeFolderId));
  }, [activeFolderId, folders, expandIds]);

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

  const handleCreateFolder = useCallback(
    async (name: string, parentId: string | null) => {
      try {
        const response = await noteApi.createFolder(name, parentId);
        if (response.success) {
          if (parentId) expandIds([parentId]);
          fetchFolders();
        } else if (response.message) {
          alert(response.message);
        }
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    },
    [fetchFolders, expandIds]
  );

  const handleRenameFolder = useCallback(
    async (id: string, name: string) => {
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
    },
    [fetchFolders]
  );

  /** 在指定文件夹下新建笔记：把归属带给编辑器预选 */
  const handleCreateNoteInFolder = useCallback(
    (folderId: string) => {
      navigate(`/admin/notes/new?folderId=${encodeURIComponent(folderId)}`);
    },
    [navigate]
  );

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      const descendants = collectDescendantIds(folders, id);
      const noteCount = folders.find((f) => f.id === id)?.noteCount ?? 0;
      const scope =
        descendants.length > 0
          ? `该文件夹及其 ${descendants.length} 个子文件夹将被删除`
          : '该文件夹将被删除';
      if (!confirm(`${scope}，其中 ${noteCount} 篇笔记将移回“未归档”。确定继续吗？`)) {
        return;
      }

      try {
        const response = await noteApi.deleteFolder(id);
        if (response.success) {
          if (
            activeFolderId &&
            (activeFolderId === id || descendants.includes(activeFolderId))
          ) {
            setActiveFolderId(undefined);
          }
          fetchFolders();
          fetchNotes();
        }
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    },
    [folders, activeFolderId, fetchFolders, fetchNotes]
  );

  /** 把 dnd-kit 的 over id 解析成有效落点；无效组合返回 null */
  const resolveDropTarget = useCallback(
    (activeData: DragItem['type'] | undefined, draggedFolder: NoteFolder | undefined, overId: string | null) => {
      if (!overId) return null;

      let target: string | null = null;
      if (overId === 'folder-all') target = 'all';
      else if (overId === 'folder-unfiled') target = 'unfiled';
      else if (overId.startsWith('folder-')) target = overId.slice('folder-'.length);
      if (!target) return null;

      if (activeData === 'folder' && draggedFolder) {
        // 文件夹不能移入未归档；也不能移到自己或自己的子孙下
        if (target === 'unfiled') return null;
        if (target !== 'all') {
          if (target === draggedFolder.id) return null;
          if (collectDescendantIds(folders, draggedFolder.id).includes(target)) return null;
        }
      } else if (activeData === 'note') {
        // 「全部笔记」不是笔记的有效归类目标
        if (target === 'all') return null;
      }

      return target;
    },
    [folders]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'note') {
      setActiveDragItem({ type: 'note', note: data.note as Note });
    } else if (data?.type === 'folder') {
      setActiveDragItem({ type: 'folder', folder: data.folder as NoteFolder });
    }
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      const data = active.data.current;
      const draggedFolder =
        data?.type === 'folder' ? (data.folder as NoteFolder) : undefined;
      setOverFolderId(
        resolveDropTarget(
          data?.type as DragItem['type'] | undefined,
          draggedFolder,
          (over?.id as string) ?? null
        )
      );
    },
    [resolveDropTarget]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const data = active.data.current;
      const draggedFolder =
        data?.type === 'folder' ? (data.folder as NoteFolder) : undefined;

      setActiveDragItem(null);
      setOverFolderId(null);

      const target = resolveDropTarget(
        data?.type as DragItem['type'] | undefined,
        draggedFolder,
        (over?.id as string) ?? null
      );
      if (!target) return;

      try {
        if (data?.type === 'note') {
          const note = data.note as Note;
          const targetFolderId = target === 'unfiled' ? null : target;
          if ((note.folderId ?? null) === targetFolderId) return;

          const response = await noteApi.moveNoteToFolder(note.id, targetFolderId);
          if (response.success) {
            fetchNotes();
            fetchFolders();
          }
        } else if (data?.type === 'folder' && draggedFolder) {
          const newParentId = target === 'all' ? null : target;
          if ((draggedFolder.parentId ?? null) === newParentId) return;

          const response = await noteApi.moveFolder(draggedFolder.id, newParentId);
          if (response.success) {
            if (newParentId) expandIds([newParentId]);
            fetchFolders();
          } else if (response.message) {
            alert(response.message);
          }
        }
      } catch (error) {
        console.error('Failed to complete drag:', error);
      }
    },
    [resolveDropTarget, fetchNotes, fetchFolders, expandIds]
  );

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
            <p className="text-gray-500 mt-1">管理您的 Markdown 笔记，拖拽笔记或文件夹进行整理</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 border border-accent-500 text-accent-600 rounded-lg hover:bg-accent-50 transition-colors"
            >
              <FolderInput className="w-5 h-5" />
              导入 Obsidian
            </button>
            <Link
              to="/admin/notes/new"
              className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              新建笔记
            </Link>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* 左侧：文件夹树 */}
          <div className="w-64 flex-shrink-0 sticky top-4">
            <NoteFolderSidebar
              nodes={folderTree}
              unfiledCount={unfiledCount}
              totalNotes={totalNotes}
              activeFolderId={activeFolderId}
              expandedIds={expandedIds}
              dragType={activeDragItem?.type ?? null}
              isOver={overFolderId}
              onSelectFolder={(id) => {
                setActiveFolderId(id);
                setCurrentPage(1);
              }}
              onCreateFolder={handleCreateFolder}
              onCreateNote={handleCreateNoteInFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onToggleExpand={toggleExpand}
              onExpand={(id) => expandIds([id])}
            />
          </div>

          {/* 右侧：笔记列表 */}
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
                    onChange={(e) => {
                      setFilterStatus(e.target.value as typeof filterStatus);
                      setCurrentPage(1);
                    }}
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

      <DragOverlay dropAnimation={null}>
        {activeDragItem?.type === 'note' ? (
          <div className="bg-white shadow-xl rounded-lg px-4 py-3 border-2 border-accent-400 opacity-90 max-w-xs">
            <div className="flex items-center gap-2">
              <FolderInput className="w-4 h-4 text-accent-500 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 truncate">
                {activeDragItem.note.title}
              </p>
            </div>
          </div>
        ) : activeDragItem?.type === 'folder' ? (
          <div className="bg-white shadow-xl rounded-lg px-3 py-2 border-2 border-accent-400 opacity-90 max-w-xs">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-accent-500 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 truncate">
                {activeDragItem.folder.name}
              </p>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <ObsidianImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        folders={folders}
        defaultParentId={activeFolderId ?? null}
        onImported={() => {
          fetchFolders();
          fetchNotes();
        }}
      />
    </DndContext>
  );
};
