import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  FilePlus,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FolderNode } from '../lib/folderTree';

export type DragType = 'note' | 'folder' | null;

/** 右键菜单里的一次编辑会话，name 为草稿值，original 用于判断是否真的改了名 */
interface RenameSession {
  id: string;
  name: string;
  original: string;
}

interface ContextMenuState {
  folderId: string;
  name: string;
  x: number;
  y: number;
}

interface NoteFolderSidebarProps {
  nodes: FolderNode[];
  unfiledCount: number;
  totalNotes: number;
  /** undefined = 全部, null = 未归档, string = 具体文件夹 */
  activeFolderId: string | null | undefined;
  expandedIds: Set<string>;
  dragType: DragType;
  /** 当前拖拽悬停的目标：'all' | 'unfiled' | 文件夹 id | null */
  isOver: string | null;
  onSelectFolder: (folderId: string | null | undefined) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreateNote: (folderId: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onExpand: (id: string) => void;
}

const HOVER_EXPAND_DELAY = 700;
const CONTEXT_MENU_WIDTH = 168;
const CONTEXT_MENU_HEIGHT = 88;

interface FolderTreeItemProps {
  node: FolderNode;
  activeFolderId: string | null | undefined;
  expandedIds: Set<string>;
  isOver: string | null;
  childInputParentId: string | null;
  childName: string;
  rename: RenameSession | null;
  onChildNameChange: (value: string) => void;
  onSubmitChild: () => void;
  onCancelChild: () => void;
  onRenameNameChange: (value: string) => void;
  onStartRename: (id: string, currentName: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onContextMenu: (event: React.MouseEvent, folderId: string, name: string) => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onExpand: (id: string) => void;
  onStartChild: (id: string) => void;
}

function FolderTreeItem({
  node,
  activeFolderId,
  expandedIds,
  isOver,
  childInputParentId,
  childName,
  rename,
  onChildNameChange,
  onSubmitChild,
  onCancelChild,
  onRenameNameChange,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onContextMenu,
  onSelectFolder,
  onDeleteFolder,
  onToggleExpand,
  onExpand,
  onStartChild,
}: FolderTreeItemProps) {
  const isEditing = rename?.id === node.id;

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeFolderId === node.id;
  const isOverThis = isOver === node.id;

  const { setNodeRef: setDropRef } = useDroppable({
    id: `folder-${node.id}`,
    data: { type: 'folder-target', folderId: node.id },
  });
  const {
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({
    id: `folder-${node.id}`,
    data: { type: 'folder', folder: node },
  });

  const setRefs = useCallback(
    (element: HTMLElement | null) => {
      setDropRef(element);
      setDragRef(element);
    },
    [setDropRef, setDragRef]
  );

  // 拖拽悬停一段时间后自动展开，便于拖进深层文件夹
  useEffect(() => {
    if (!isOverThis || isExpanded || !hasChildren || isEditing) return;
    const timer = window.setTimeout(() => onExpand(node.id), HOVER_EXPAND_DELAY);
    return () => window.clearTimeout(timer);
  }, [isOverThis, isExpanded, hasChildren, isEditing, node.id, onExpand]);

  return (
    <div>
      <div
        ref={setRefs}
        onClick={() => !isEditing && onSelectFolder(node.id)}
        onContextMenu={(e) => {
          if (isEditing) return;
          e.preventDefault();
          onContextMenu(e, node.id, node.name);
        }}
        style={{ paddingLeft: 8 + node.depth * 14 }}
        className={`
          group flex items-center gap-1.5 pr-2 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${isActive ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'hover:bg-gray-50 text-gray-700'}
          ${isOverThis ? 'bg-accent-100 ring-2 ring-accent-400' : ''}
          ${isDragging ? 'opacity-40' : ''}
        `}
      >
        {/* 展开/折叠 */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
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

        {/* 拖拽手柄 */}
        {!isEditing && (
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing rounded flex-shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
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
            <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {node.noteCount}
            </span>
            <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartChild(node.id);
                }}
                title="新建子文件夹"
                className="p-0.5 text-gray-400 hover:text-accent-600 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename(node.id, node.name);
                }}
                title="重命名"
                className="p-0.5 text-gray-400 hover:text-accent-600 rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(node.id);
                }}
                title="删除"
                className="p-0.5 text-gray-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 子层级：内联新建输入框 + 子文件夹 */}
      {childInputParentId === node.id && (
        <div
          style={{ paddingLeft: 8 + (node.depth + 1) * 14 }}
          className="flex items-center gap-1 pr-2 py-1.5"
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
            <FolderTreeItem
              key={child.id}
              node={child}
              activeFolderId={activeFolderId}
              expandedIds={expandedIds}
              isOver={isOver}
              childInputParentId={childInputParentId}
              childName={childName}
              rename={rename}
              onChildNameChange={onChildNameChange}
              onSubmitChild={onSubmitChild}
              onCancelChild={onCancelChild}
              onRenameNameChange={onRenameNameChange}
              onStartRename={onStartRename}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onContextMenu={onContextMenu}
              onSelectFolder={onSelectFolder}
              onDeleteFolder={onDeleteFolder}
              onToggleExpand={onToggleExpand}
              onExpand={onExpand}
              onStartChild={onStartChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const NoteFolderSidebar = ({
  nodes,
  unfiledCount,
  totalNotes,
  activeFolderId,
  expandedIds,
  dragType,
  isOver,
  onSelectFolder,
  onCreateFolder,
  onCreateNote,
  onRenameFolder,
  onDeleteFolder,
  onToggleExpand,
  onExpand,
}: NoteFolderSidebarProps) => {
  const [showRootInput, setShowRootInput] = useState(false);
  const [rootName, setRootName] = useState('');
  const [childInputParentId, setChildInputParentId] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [rename, setRename] = useState<RenameSession | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const { setNodeRef: setAllRef } = useDroppable({
    id: 'folder-all',
    data: { type: 'all-target' },
  });
  const { setNodeRef: setUnfiledRef } = useDroppable({
    id: 'folder-unfiled',
    data: { type: 'unfiled-target' },
  });

  // 右键菜单打开期间，点击别处、滚动或按 Esc 都应关闭
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menu]);

  const openContextMenu = (event: React.MouseEvent, folderId: string, name: string) => {
    setMenu({
      folderId,
      name,
      x: Math.max(4, Math.min(event.clientX, window.innerWidth - CONTEXT_MENU_WIDTH - 8)),
      y: Math.max(4, Math.min(event.clientY, window.innerHeight - CONTEXT_MENU_HEIGHT - 8)),
    });
  };

  const startRename = (id: string, currentName: string) => {
    setRename({ id, name: currentName, original: currentName });
  };

  const commitRename = () => {
    if (!rename) return;
    const trimmed = rename.name.trim();
    if (trimmed && trimmed !== rename.original) {
      onRenameFolder(rename.id, trimmed);
    }
    setRename(null);
  };

  const isFolderDrag = dragType === 'folder';

  const submitRoot = () => {
    const trimmed = rootName.trim();
    if (trimmed) {
      onCreateFolder(trimmed, null);
      setRootName('');
      setShowRootInput(false);
    }
  };

  const submitChild = () => {
    const trimmed = childName.trim();
    if (trimmed && childInputParentId) {
      onCreateFolder(trimmed, childInputParentId);
      setChildName('');
      setChildInputParentId(null);
    }
  };

  const startChild = (parentId: string) => {
    onExpand(parentId);
    setChildInputParentId(parentId);
    setChildName('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-3 space-y-0.5">
      <h3 className="font-semibold text-gray-800 text-sm mb-2 px-1">文件夹</h3>

      {/* 全部笔记：拖拽文件夹时可作为「移到根目录」的目标 */}
      <div
        ref={setAllRef}
        onClick={() => onSelectFolder(undefined)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${activeFolderId === undefined ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'hover:bg-gray-50 text-gray-700'}
          ${isOver === 'all' ? 'bg-accent-100 ring-2 ring-accent-400' : ''}
        `}
      >
        {isFolderDrag ? (
          <FolderInput className="w-4 h-4" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="flex-1 text-sm font-medium">
          {isFolderDrag ? '移到顶层' : '全部笔记'}
        </span>
        <span className="text-xs text-gray-400">{totalNotes}</span>
      </div>

      {/* 未归档 */}
      <div
        ref={setUnfiledRef}
        onClick={() => onSelectFolder(null)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${activeFolderId === null ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'hover:bg-gray-50 text-gray-700'}
          ${isOver === 'unfiled' ? 'bg-accent-100 ring-2 ring-accent-400' : ''}
        `}
      >
        <Folder className="w-4 h-4" />
        <span className="flex-1 text-sm font-medium">未归档</span>
        <span className="text-xs text-gray-400">{unfiledCount}</span>
      </div>

      {nodes.length > 0 && <div className="border-t border-gray-100 my-2" />}

      {nodes.map((node) => (
        <FolderTreeItem
          key={node.id}
          node={node}
          activeFolderId={activeFolderId}
          expandedIds={expandedIds}
          isOver={isOver}
          childInputParentId={childInputParentId}
          childName={childName}
          rename={rename}
          onChildNameChange={setChildName}
          onSubmitChild={submitChild}
          onCancelChild={() => {
            setChildInputParentId(null);
            setChildName('');
          }}
          onRenameNameChange={(value) =>
            setRename((prev) => (prev ? { ...prev, name: value } : prev))
          }
          onStartRename={startRename}
          onCommitRename={commitRename}
          onCancelRename={() => setRename(null)}
          onContextMenu={openContextMenu}
          onSelectFolder={(id) => onSelectFolder(id)}
          onDeleteFolder={onDeleteFolder}
          onToggleExpand={onToggleExpand}
          onExpand={onExpand}
          onStartChild={startChild}
        />
      ))}

      {/* 顶层新建文件夹 */}
      {showRootInput ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRoot();
              if (e.key === 'Escape') {
                setShowRootInput(false);
                setRootName('');
              }
            }}
            placeholder="文件夹名称"
            className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={submitRoot}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setShowRootInput(false);
              setRootName('');
            }}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowRootInput(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-accent-600 hover:bg-gray-50 rounded-lg transition-colors mt-1"
        >
          <Plus className="w-4 h-4" />
          新建文件夹
        </button>
      )}

      {menu && (
        <div
          style={{ top: menu.y, left: menu.x, width: CONTEXT_MENU_WIDTH }}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed z-50 py-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <button
            onClick={() => {
              const folderId = menu.folderId;
              setMenu(null);
              onCreateNote(folderId);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <FilePlus className="w-4 h-4 text-gray-400" />
            新建笔记
          </button>
          <button
            onClick={() => {
              startRename(menu.folderId, menu.name);
              setMenu(null);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
            重命名
          </button>
        </div>
      )}
    </div>
  );
};
