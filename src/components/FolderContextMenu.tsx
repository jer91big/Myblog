import { Edit2, FilePlus } from 'lucide-react';
import type { FolderMenuTarget } from '../hooks/useFolderTreeActions';

const MENU_WIDTH = 168;

interface FolderContextMenuProps {
  menu: FolderMenuTarget | null;
  onClose: () => void;
  onCreateNote: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
}

export function FolderContextMenu({
  menu,
  onClose,
  onCreateNote,
  onRename,
}: FolderContextMenuProps) {
  if (!menu) return null;

  return (
    <div
      style={{ top: menu.y, left: menu.x, width: MENU_WIDTH }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 py-1 bg-white border border-gray-200 rounded-lg shadow-lg"
    >
      <button
        onClick={() => {
          const { folderId } = menu;
          onClose();
          onCreateNote(folderId);
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <FilePlus className="w-4 h-4 text-gray-400" />
        新建笔记
      </button>
      <button
        onClick={() => {
          const { folderId, name } = menu;
          onClose();
          onRename(folderId, name);
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Edit2 className="w-4 h-4 text-gray-400" />
        重命名
      </button>
    </div>
  );
}
