import { useMemo, useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { noteApi } from '../api';
import { NoteFolder } from '../types';

interface ObsidianImportModalProps {
  open: boolean;
  onClose: () => void;
  folders: NoteFolder[];
  defaultParentId?: string | null;
  onImported: () => void;
}

interface ImportStats {
  done: number;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const MAX_FOLDER_NAME_LENGTH = 50;

type FolderCache = Map<string, Map<string, string>>;

const buildFolderCache = (folders: NoteFolder[]): FolderCache => {
  const cache: FolderCache = new Map();
  for (const folder of folders) {
    const key = folder.parentId ?? '';
    if (!cache.has(key)) cache.set(key, new Map());
    cache.get(key)!.set(folder.name, folder.id);
  }
  return cache;
};

const stripFrontmatter = (text: string): string => {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
};

/** Obsidian 导入弹窗：选择本地文件夹，按目录结构自动创建文件夹与笔记 */
export const ObsidianImportModal = ({
  open,
  onClose,
  folders,
  defaultParentId = null,
  onImported,
}: ObsidianImportModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);
  const folderCacheRef = useRef<FolderCache>(new Map());
  const [targetFolderId, setTargetFolderId] = useState<string>(
    defaultParentId ?? ''
  );
  const [includeRoot, setIncludeRoot] = useState(true);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [overwrite, setOverwrite] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'importing' | 'done'>('idle');
  const [currentName, setCurrentName] = useState('');
  const [stats, setStats] = useState<ImportStats | null>(null);

  const folderOptions = useMemo(() => {
    const byParent = new Map<string, NoteFolder[]>();
    for (const folder of folders) {
      const key = folder.parentId ?? '';
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(folder);
    }
    const out: { id: string; label: string }[] = [];
    const walk = (parentId: string, depth: number) => {
      for (const folder of byParent.get(parentId) ?? []) {
        out.push({ id: folder.id, label: `${'　'.repeat(depth)}${folder.name}` });
        walk(folder.id, depth + 1);
      }
    };
    walk('', 0);
    return out;
  }, [folders]);

  if (!open) return null;

  const reset = () => {
    setPhase('idle');
    setStats(null);
    setCurrentName('');
    cancelRef.current = false;
  };

  const handleClose = () => {
    if (phase === 'importing') return; // 导入中不允许关闭，避免中断产生半成品
    reset();
    onClose();
  };

  const truncateName = (name: string) => name.trim().slice(0, MAX_FOLDER_NAME_LENGTH);

  const ensureFolder = async (
    parentId: string | null,
    name: string
  ): Promise<string> => {
    const key = parentId ?? '';
    const hit = folderCacheRef.current.get(key)?.get(name);
    if (hit) return hit;

    const res = await noteApi.createFolder(name, parentId);
    if (res.success && res.data) {
      const cache = folderCacheRef.current;
      if (!cache.has(key)) cache.set(key, new Map());
      cache.get(key)!.set(name, res.data.id);
      return res.data.id;
    }

    // 同级重名（409）或并发冲突：重新拉取文件夹列表后再找一次
    const refetch = await noteApi.getFolders();
    folderCacheRef.current = buildFolderCache(refetch.data?.folders ?? []);
    const hit2 = folderCacheRef.current.get(key)?.get(name);
    if (hit2) return hit2;
    throw new Error(`创建文件夹「${name}」失败：${res.message ?? '未知错误'}`);
  };

  const collectExistingNoteIds = async (): Promise<Map<string, string>> => {
    const map = new Map<string, string>();
    let page = 1;
    for (;;) {
      const res = await noteApi.getNotes({ page, limit: 100, status: 'all' });
      if (!res.success || !res.data) break;
      for (const note of res.data.notes) {
        map.set(`${note.folderId ?? ''}|${note.title}`, note.id);
      }
      const pages = res.data.pagination?.pages ?? 1;
      if (page >= pages) break;
      page++;
    }
    return map;
  };

  const runImport = async (mdFiles: File[], rootName: string) => {
    cancelRef.current = false;
    setPhase('importing');
    setStats({ done: 0, total: mdFiles.length, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] });
    setCurrentName('');

    const errors: string[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const folderRes = await noteApi.getFolders();
      folderCacheRef.current = buildFolderCache(folderRes.data?.folders ?? []);

      let targetParentId: string | null = targetFolderId || null;
      if (includeRoot) {
        targetParentId = await ensureFolder(targetParentId, truncateName(rootName));
      }

      const existingIds = overwrite ? await collectExistingNoteIds() : new Map<string, string>();

      for (let i = 0; i < mdFiles.length; i++) {
        if (cancelRef.current) break;
        const file = mdFiles[i];
        setCurrentName(file.name);
        try {
          const segments = file.webkitRelativePath.split('/');
          const dirSegments = segments.slice(1, -1);

          let folderId: string | null = targetParentId;
          for (const segment of dirSegments) {
            const name = truncateName(segment);
            if (!name) continue;
            folderId = await ensureFolder(folderId, name);
          }

          const title = file.name.replace(/\.md$/i, '').trim();
          const content = stripFrontmatter(await file.text());

          if (!title || !content.trim()) {
            skipped++;
          } else {
            const key = `${folderId ?? ''}|${title}`;
            const existingId = overwrite ? existingIds.get(key) : undefined;

            if (existingId) {
              const res = await noteApi.updateNote(existingId, { content, status });
              if (res.success) {
                updated++;
              } else {
                failed++;
                errors.push(`「${title}」更新失败：${res.message ?? '未知错误'}`);
              }
            } else {
              const res = await noteApi.createNote({
                title,
                content,
                status,
                folderId,
              });
              if (res.success && res.data) {
                created++;
                existingIds.set(key, res.data.id);
              } else {
                failed++;
                errors.push(`「${title}」上传失败：${res.message ?? '未知错误'}`);
              }
            }
          }
        } catch (err: any) {
          failed++;
          errors.push(`「${file.name}」处理失败：${err?.message ?? '未知错误'}`);
        } finally {
          setStats((prev) =>
            prev
              ? { ...prev, done: prev.done + 1, created, updated, skipped, failed, errors }
              : prev
          );
        }
      }
    } catch (err: any) {
      errors.push(`导入中断：${err?.message ?? '未知错误'}`);
      failed++;
    }

    setStats((prev) =>
      prev
        ? {
            ...prev,
            created,
            updated,
            skipped,
            failed,
            errors,
            done: cancelRef.current ? prev.done : mdFiles.length,
          }
        : prev
    );
    setPhase('done');
    onImported();
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    event.target.value = ''; // 允许重复选择同一个文件夹

    const all = Array.from(fileList ?? []);
    if (all.length === 0) return;

    const mdFiles = all.filter((file) => {
      const segments = file.webkitRelativePath.split('/');
      return segments.every((s) => !s.startsWith('.')) && /\.md$/i.test(file.name);
    });

    if (mdFiles.length === 0) {
      alert('所选文件夹中没有找到 Markdown（.md）文件');
      return;
    }

    const rootName = mdFiles[0].webkitRelativePath.split('/')[0] || 'Obsidian 导入';
    await runImport(mdFiles, rootName);
  };

  const progressPercent = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">导入 Obsidian 笔记</h2>
            <p className="text-sm text-gray-500 mt-1">
              选择本地 Obsidian 笔记夹，将按目录结构自动创建文件夹与笔记（仅导入 .md 文件，跳过 .obsidian 等隐藏目录）。
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={phase === 'importing'}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">导入位置</span>
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              disabled={phase === 'importing'}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="">顶层（新建根文件夹）</option>
              {folderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <input
              id="obsidian-include-root"
              type="checkbox"
              checked={includeRoot}
              onChange={(e) => setIncludeRoot(e.target.checked)}
              disabled={phase === 'importing'}
              className="w-4 h-4 text-accent-500 rounded"
            />
            <label htmlFor="obsidian-include-root" className="text-sm text-gray-700">
              创建以所选文件夹命名的根文件夹（例如「java基础」）
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">发布状态</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
              disabled={phase === 'importing'}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            >
              <option value="published">发布（前台可见）</option>
              <option value="draft">草稿（仅自己可见）</option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <input
              id="obsidian-overwrite"
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={phase === 'importing'}
              className="w-4 h-4 text-accent-500 rounded"
            />
            <label htmlFor="obsidian-overwrite" className="text-sm text-gray-700">
              覆盖更新同名笔记（重复导入时同步内容，不产生重复）
            </label>
          </div>
        </div>

        {phase !== 'idle' && stats && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span className="truncate max-w-[60%]">
                {phase === 'importing' ? `正在导入：${currentName}` : '导入完成'}
              </span>
              <span>
                {stats.done} / {stats.total}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {phase === 'done' && (
              <div className="text-sm space-y-1">
                <p className="text-gray-700">
                  新建 {stats.created} 篇 · 更新 {stats.updated} 篇 · 跳过 {stats.skipped} 篇 · 失败 {stats.failed} 篇
                </p>
                {stats.errors.length > 0 && (
                  <div className="bg-red-50 text-red-700 rounded-lg p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                    {stats.errors.slice(0, 10).map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                    {stats.errors.length > 10 && (
                      <p>……共 {stats.errors.length} 条错误</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {phase === 'importing' ? (
            <button
              onClick={() => {
                cancelRef.current = true;
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              停止导入
            </button>
          ) : phase === 'done' ? (
            <button
              onClick={handleClose}
              className="min-h-11 inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              完成
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="min-h-11 inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                选择文件夹并导入
              </button>
            </>
          )}
        </div>

        {phase === 'importing' && (
          <p className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            请保持页面打开，正在逐篇上传……
          </p>
        )}
        {phase === 'done' && stats && stats.failed > 0 && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            部分笔记导入失败，可修正后重新导入，同名笔记会被覆盖更新而不会重复。
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={handleFilesSelected}
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        />
      </div>
    </div>
  );
};
