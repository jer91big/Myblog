import { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  X,
} from 'lucide-react';
import { FolderNode, getAncestorIds } from '../lib/folderTree';
import type { NoteFolder } from '../types';
import { FolderContextMenu } from './FolderContextMenu';
import { useFolderTreeActions, type RenameSession } from '../hooks/useFolderTreeActions';

/** 管理员的右键操作；不传则整棵树只读 */
export interface NoteFolderTreeActions {
  onCreateNote: (folderId: string) => void;
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
  onToggle: (id: string) => void;
  onSelect: (folderId: string) => void;
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
  onToggle,
  onSelect,
  onStartRename,
  onRenameNameChange,
  onCommitRename,
  onCancelRename,
  onContextMenu,
}: TreeItemProps) {
  const isEditing = rename?.id === node.id;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeFolderId === node.id;

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
              onToggle={onToggle}
              onSelect={onSelect}
              onStartRename={onStartRename}
              onRenameNameChange={onRenameNameChange}
              onCommitRename={onCommitRename}
              onCancelRename={onCancelRename}
              onContextMenu={onContextMenu}
            />
          ))}
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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
          onToggle={toggle}
          onSelect={onSelect}
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
          onRename={startRename}
        />
      )}
    </nav>
  );
};
