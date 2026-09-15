import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

const MENU_WIDTH = 168;
const MENU_HEIGHT = 88;

/** 右键菜单里的一次重命名会话，name 为草稿值，original 用于判断是否真的改了名 */
export interface RenameSession {
  id: string;
  name: string;
  original: string;
}

export interface FolderMenuTarget {
  folderId: string;
  name: string;
  x: number;
  y: number;
}

/**
 * 文件夹树上的右键菜单与重命名会话。
 * 管理页侧边栏和公开笔记页的树共用这套逻辑。
 */
export function useFolderTreeActions(
  onRenameFolder: (id: string, name: string) => void
) {
  const [menu, setMenu] = useState<FolderMenuTarget | null>(null);
  const [rename, setRename] = useState<RenameSession | null>(null);

  // 菜单打开期间，点击别处、滚动、缩放窗口或按 Esc 都应关闭
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

  const openContextMenu = useCallback(
    (event: ReactMouseEvent, folderId: string, name: string) => {
      setMenu({
        folderId,
        name,
        x: Math.max(4, Math.min(event.clientX, window.innerWidth - MENU_WIDTH - 8)),
        y: Math.max(4, Math.min(event.clientY, window.innerHeight - MENU_HEIGHT - 8)),
      });
    },
    []
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const startRename = useCallback((id: string, currentName: string) => {
    setRename({ id, name: currentName, original: currentName });
  }, []);

  const setRenameName = useCallback((name: string) => {
    setRename((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const commitRename = useCallback(() => {
    if (!rename) return;
    const trimmed = rename.name.trim();
    if (trimmed && trimmed !== rename.original) {
      onRenameFolder(rename.id, trimmed);
    }
    setRename(null);
  }, [rename, onRenameFolder]);

  const cancelRename = useCallback(() => setRename(null), []);

  return {
    menu,
    openContextMenu,
    closeMenu,
    rename,
    startRename,
    setRenameName,
    commitRename,
    cancelRename,
  };
}
