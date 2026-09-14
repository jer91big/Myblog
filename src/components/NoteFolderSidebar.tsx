import { useState } from 'react';
import { Folder, FolderOpen, Plus, Edit2, Trash2, FileText, Check, X } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { NoteFolder } from '../types';

interface NoteFolderSidebarProps {
  folders: NoteFolder[];
  unfiledCount: number;
  totalNotes: number;
  activeFolderId: string | null | undefined; // null = unfiled, undefined = all
  onSelectFolder: (folderId: string | null | undefined) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  isOver: string | null; // folder id being dragged over
}

function DroppableFolder({
  folder,
  isActive,
  isOver,
  onSelect,
  onRename,
  onDelete,
}: {
  folder: NoteFolder;
  isActive: boolean;
  isOver: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const { setNodeRef } = useDroppable({ id: `folder-${folder.id}` });

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
    setEditName(folder.name);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={() => !isEditing && onSelect()}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
        ${isActive ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'hover:bg-gray-50 text-gray-700'}
        ${isOver ? 'bg-accent-100 ring-2 ring-accent-400 scale-[1.02]' : ''}
      `}
    >
      {isActive ? (
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Folder className="w-4 h-4 flex-shrink-0" />
      )}
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setIsEditing(false); setEditName(folder.name); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 text-sm border border-accent-300 rounded focus:outline-none"
            autoFocus
          />
          <button onClick={(e) => { e.stopPropagation(); handleRename(); }} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditName(folder.name); }} className="p-0.5 text-gray-400 hover:bg-gray-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{folder.noteCount}</span>
          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setEditName(folder.name); setIsEditing(true); }}
              className="p-0.5 text-gray-400 hover:text-accent-600 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-0.5 text-gray-400 hover:text-red-600 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export const NoteFolderSidebar = ({
  folders,
  unfiledCount,
  totalNotes,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  isOver,
}: NoteFolderSidebarProps) => {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { setNodeRef: setAllRef } = useDroppable({ id: 'folder-all' });
  const { setNodeRef: setUnfiledRef } = useDroppable({ id: 'folder-unfiled' });

  const handleCreate = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-1">
      <h3 className="font-semibold text-gray-800 text-sm mb-3 px-1">文件夹</h3>

      {/* All notes */}
      <div
        ref={setAllRef}
        onClick={() => onSelectFolder(undefined)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
          ${activeFolderId === undefined ? 'bg-accent-50 text-accent-700 border border-accent-200' : 'hover:bg-gray-50 text-gray-700'}
          ${isOver === 'all' ? 'bg-accent-100 ring-2 ring-accent-400' : ''}
        `}
      >
        <FileText className="w-4 h-4" />
        <span className="flex-1 text-sm font-medium">全部笔记</span>
        <span className="text-xs text-gray-400">{totalNotes}</span>
      </div>

      {/* Unfiled */}
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

      {folders.length > 0 && <div className="border-t border-gray-100 my-2" />}

      {/* Folder list */}
      {folders.map((folder) => (
        <DroppableFolder
          key={folder.id}
          folder={folder}
          isActive={activeFolderId === folder.id}
          isOver={isOver === folder.id}
          onSelect={() => onSelectFolder(folder.id)}
          onRename={(name) => onRenameFolder(folder.id, name)}
          onDelete={() => onDeleteFolder(folder.id)}
        />
      ))}

      {/* New folder input */}
      {showNewFolder ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
            }}
            placeholder="文件夹名称"
            className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-accent-500 focus:outline-none"
            autoFocus
          />
          <button onClick={handleCreate} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewFolder(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-accent-600 hover:bg-gray-50 rounded-lg transition-colors mt-1"
        >
          <Plus className="w-4 h-4" />
          新建文件夹
        </button>
      )}
    </div>
  );
};
