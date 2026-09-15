import { Edit2, FilePlus, FolderPlus } from 'lucide-react';
import type { FolderMenuTarget } from '../hooks/useFolderTreeActions';

const MENU_WIDTH = 168;

interface FolderContextMenuProps {
  menu: FolderMenuTarget | null;
  onClose: () => void;
  onCreateNote: (folderId: string) => void;
  /** 提供则显示「新建文件夹」项，在该文件夹下创建子文件夹 */
  onAddFolder?: (folderId: string) => void;
  onRename: (folderId: string, name: string) => void;
}

export function FolderContextMenu({
  menu,
  onClose,
  onCreateNote,
  onAddFolder,
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
      {onAddFolder && (
        <button
          onClick={() => {
            const { folderId } = menu;
            onClose();
            onAddFolder(folderId);
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <FolderPlus className="w-4 h-4 text-gray-400" />
          新建文件夹
        </button>
      )}
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
