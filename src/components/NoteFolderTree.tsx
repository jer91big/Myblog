import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { FolderNode, getAncestorIds } from '../lib/folderTree';
import type { NoteFolder } from '../types';

interface NoteFolderTreeProps {
  nodes: FolderNode[];
  /** 扁平列表，用于计算祖先链 */
  flatFolders: NoteFolder[];
  totalNotes: number;
  activeFolderId: string | undefined;
  onSelect: (folderId: string | undefined) => void;
}

interface TreeItemProps {
  node: FolderNode;
  activeFolderId: string | undefined;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (folderId: string) => void;
}

function TreeItem({
  node,
  activeFolderId,
  expandedIds,
  onToggle,
  onSelect,
}: TreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeFolderId === node.id;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(node.id);
          }
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

        <span className="flex-1 text-sm truncate">{node.name}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{node.noteCount}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              activeFolderId={activeFolderId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const NoteFolderTree = ({
  nodes,
  flatFolders,
  totalNotes,
  activeFolderId,
  onSelect,
}: NoteFolderTreeProps) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
          onToggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
};
