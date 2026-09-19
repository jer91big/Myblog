import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  X,
} from 'lucide-react';
import { FolderNode, getAncestorIds } from '../lib/folderTree';
import type { Note, NoteFolder } from '../types';
import { noteApi } from '../api';
import { FolderContextMenu } from './FolderContextMenu';
import { useFolderTreeActions, type RenameSession } from '../hooks/useFolderTreeActions';

/** 管理员的右键操作；不传则整棵树只读 */
export interface NoteFolderTreeActions {
  onCreateNote: (folderId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
}

interface NoteFolderTreeProps {
  nodes: FolderNode[];
  /** 扁平列表，用于计算祖先链 */
  flatFolders: NoteFolder[];
  totalNotes: number;
  activeFolderId: string | undefined;
  onSelect: (folderId: string | undefined) => void;
  actions?: NoteFolderTreeActions;
}

interface TreeItemProps {
  node: FolderNode;
  activeFolderId: string | undefined;
  expandedIds: Set<string>;
  rename: RenameSession | null;
  canManage: boolean;
  childInputActive: boolean;
  childName: string;
  notesByFolder: Record<string, Note[]>;
  loadingIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (folderId: string) => void;
  onOpenNote: (noteId: string) => void;
  onChildNameChange: (value: string) => void;
  onSubmitChild: () => void;
  onCancelChild: () => void;
  onStartRename: (id: string, currentName: string) => void;
  onRenameNameChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onContextMenu: (event: React.MouseEvent, folderId: string, name: string) => void;
}

function TreeItem({
  node,
  activeFolderId,
  expandedIds,
  rename,
  canManage,
  childInputActive,
  childName,
  notesByFolder,
  loadingIds,
  onToggle,
  onSelect,
  onOpenNote,
  onChildNameChange,
  onSubmitChild,
  onCancelChild,
  onStartRename,
  onRenameNameChange,
  onCommitRename,
  onCancelRename,
  onContextMenu,
}: TreeItemProps) {
  const isEditing = rename?.id === node.id;
  // 只挂了直属笔记（没有子文件夹）的文件夹同样要能展开
  const hasChildren = node.children.length > 0 || (node.directNoteCount ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeFolderId === node.id;
  const notes = notesByFolder[node.id];
  const isLoadingNotes = loadingIds.has(node.id);
  const childIndent = 10 + (node.depth + 1) * 14;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isEditing && onSelect(node.id)}
        onKeyDown={(e) => {
          if (isEditing) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.id);
          }
        }}
        onContextMenu={(e) => {
          if (!canManage || isEditing) return;
          e.preventDefault();
          onContextMenu(e, node.id, node.name);
        }}
        style={{ paddingLeft: 10 + node.depth * 14 }}
        className={`
          flex items-center gap-1.5 w-full pr-3 py-2 rounded-lg text-left cursor-pointer transition-colors
          ${isActive ? 'bg-accent-50 text-accent-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
        `}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        {isActive ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0" />
        )}

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              type="text"
              value={rename.name}
              onChange={(e) => onRenameNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitRename();
                if (e.key === 'Escape') onCancelRename();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 px-1 py-0.5 text-sm border border-accent-300 rounded focus:outline-none"
              autoFocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCommitRename();
              }}
              className="p-0.5 text-green-600 hover:bg-green-50 rounded"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancelRename();
              }}
              className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm truncate">{node.name}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{node.noteCount}</span>
          </>
        )}
      </div>

      {/* 内联新建子文件夹输入框 */}
      {childInputActive && (
        <div
          style={{ paddingLeft: childIndent }}
          className="flex items-center gap-1 pr-3 py-1.5"
        >
          <input
            type="text"
            value={childName}
            onChange={(e) => onChildNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitChild();
              if (e.key === 'Escape') onCancelChild();
            }}
            placeholder="子文件夹名称"
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-accent-300 rounded focus:outline-none"
            autoFocus
          />
          <button
            onClick={onSubmitChild}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelChild}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              activeFolderId={activeFolderId}
              expandedIds={expandedIds}
              rename={rename}
              canManage={canManage}
              childInputActive={childInputActive}
              childName={childName}
              notesByFolder={notesByFolder}
              loadingIds={loadingIds}
              onToggle={onToggle}
              onSelect={onSelect}
              onOpenNote={onOpenNote}
              onChildNameChange={onChildNameChange}
              onSubmitChild={onSubmitChild}
              onCancelChild={onCancelChild}
              onStartRename={onStartRename}
              onRenameNameChange={onRenameNameChange}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onContextMenu={onContextMenu}
            />
          ))}

          {/* 直属笔记：排在子文件夹之后，点击进入笔记详情 */}
          {notes?.map((note) => (
            <button
              key={note.id}
              onClick={() => onOpenNote(note.id)}
              style={{ paddingLeft: childIndent + 24 }}
              className="flex items-center gap-1.5 w-full pr-3 py-1.5 rounded-lg text-left text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span className="flex-1 text-sm truncate">{note.title}</span>
            </button>
          ))}

          {isLoadingNotes && (
            <div
              style={{ paddingLeft: childIndent + 24 }}
              className="py-1.5 text-xs text-gray-400"
            >
              加载中…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const noop = () => {};

export const NoteFolderTree = ({
  nodes,
  flatFolders,
  totalNotes,
  activeFolderId,
  onSelect,
  actions,
}: NoteFolderTreeProps) => {
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [childInputParentId, setChildInputParentId] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [notesByFolder, setNotesByFolder] = useState<Record<string, Note[]>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const loadedRef = useRef<Set<string>>(new Set());
  const inflightRef = useRef<Set<string>>(new Set());
  const {
    menu,
    openContextMenu,
    closeMenu,
    rename,
    startRename,
    setRenameName,
    commitRename,
    cancelRename,
  } = useFolderTreeActions(actions?.onRenameFolder ?? noop);

  // 展开时才拉取该文件夹的直属笔记，结果缓存到本地
  const loadNotes = useCallback(async (folderId: string) => {
    if (loadedRef.current.has(folderId) || inflightRef.current.has(folderId)) return;
    inflightRef.current.add(folderId);
    setLoadingIds((prev) => new Set(prev).add(folderId));

    try {
      const response = await noteApi.getNotes({
        folderId,
        direct: true,
        status: 'published',
        limit: 100,
      });
      if (response.success && response.data) {
        loadedRef.current.add(folderId);
        setNotesByFolder((prev) => ({ ...prev, [folderId]: response.data!.notes }));
      }
    } catch (error) {
      console.error('Failed to load folder notes:', error);
    } finally {
      inflightRef.current.delete(folderId);
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  }, []);

  // 文件夹列表刷新（新建 / 重命名 / 计数变化）后作废缓存，避免树里停留在旧标题
  useEffect(() => {
    loadedRef.current.clear();
    inflightRef.current.clear();
    setNotesByFolder({});
  }, [nodes]);

  // 已展开的文件夹在缓存作废后重新拉取
  useEffect(() => {
    expandedIds.forEach((id) => {
      void loadNotes(id);
    });
  }, [expandedIds, nodes, loadNotes]);

  // 选中深层文件夹时逐级展开祖先，避免选中项被折叠隐藏
  useEffect(() => {
    if (typeof activeFolderId !== 'string') return;
    const ancestors = getAncestorIds(flatFolders, activeFolderId);
    setExpandedIds((prev) => {
      const missing = ancestors.filter((id) => !prev.has(id));
      if (missing.length === 0) return prev;
      return new Set([...prev, ...missing]);
    });
  }, [activeFolderId, flatFolders]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startAddFolder = (parentId: string) => {
    setExpandedIds((prev) => (prev.has(parentId) ? prev : new Set([...prev, parentId])));
    setChildInputParentId(parentId);
    setChildName('');
  };

  const submitChild = () => {
    const trimmed = childName.trim();
    if (trimmed && childInputParentId && actions) {
      actions.onCreateFolder(trimmed, childInputParentId);
    }
    setChildInputParentId(null);
    setChildName('');
  };

  return (
    <nav className="bg-white rounded-xl shadow-sm p-3">
      <h3 className="font-semibold text-gray-800 text-sm mb-2 px-1">文件夹</h3>

      <button
        onClick={() => onSelect(undefined)}
        className={`
          flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors
          ${activeFolderId === undefined ? 'bg-accent-50 text-accent-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
        `}
      >
        <BookOpen className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-sm">全部笔记</span>
        <span className="text-xs text-gray-400">{totalNotes}</span>
      </button>

      {nodes.length > 0 && <div className="border-t border-gray-100 my-2" />}

      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          activeFolderId={activeFolderId}
          expandedIds={expandedIds}
          rename={rename}
          canManage={Boolean(actions)}
          childInputActive={childInputParentId === node.id}
          childName={childName}
          notesByFolder={notesByFolder}
          loadingIds={loadingIds}
          onToggle={toggle}
          onSelect={onSelect}
          onOpenNote={(noteId) => navigate(`/notes/${noteId}`)}
          onChildNameChange={setChildName}
          onSubmitChild={submitChild}
          onCancelChild={() => {
            setChildInputParentId(null);
            setChildName('');
          }}
          onStartRename={startRename}
          onRenameNameChange={setRenameName}
          onCommitRename={commitRename}
          onCancelRename={cancelRename}
          onContextMenu={openContextMenu}
        />
      ))}

      {menu && actions && (
        <FolderContextMenu
          menu={menu}
          onClose={closeMenu}
          onCreateNote={actions.onCreateNote}
          onAddFolder={startAddFolder}
          onRename={startRename}
        />
      )}
    </nav>
  );
};
