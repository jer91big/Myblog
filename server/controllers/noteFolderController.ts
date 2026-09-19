import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { NoteFolder } from '../models/NoteFolder.js';
import { Note } from '../models/Note.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  buildChildrenMap,
  collectSubtreeIds,
  loadFolderParentMap,
  wouldCreateCycle,
} from '../utils/folderTree.js';

const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(50),
  parentId: z.string().nullable().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

const moveFolderSchema = z.object({
  parentId: z.string().nullable(),
});

const moveNoteSchema = z.object({
  folderId: z.string().nullable(),
});

const SIBLING_DUPLICATE_MESSAGE = '同级下已存在同名文件夹';

export const getFolders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const publishedOnly =
      req.query.publishedOnly === '1' || req.query.publishedOnly === 'true';

    const folders = await NoteFolder.find().sort({ createdAt: 1 }).lean();

    const noteFilter: Record<string, unknown> = {};
    if (publishedOnly) noteFilter.status = 'published';

    // 一次聚合拿到每个文件夹的「直接」笔记数，避免逐个 countDocuments
    const grouped = await Note.aggregate([
      { $match: { ...noteFilter, folderId: { $ne: null } } },
      { $group: { _id: '$folderId', count: { $sum: 1 } } },
    ]);
    const directCount = new Map<string, number>(
      grouped.map((g) => [g._id.toString(), g.count as number])
    );

    const parentOf = new Map<string, string | null>(
      folders.map((f) => [
        f._id.toString(),
        f.parentId ? f.parentId.toString() : null,
      ])
    );
    const childrenOf = buildChildrenMap(parentOf);

    // 自底向上累加成递归计数（父文件夹 = 自身 + 全部子孙）
    const totalMemo = new Map<string, number>();
    const inProgress = new Set<string>();
    const computeTotal = (id: string): number => {
      const cached = totalMemo.get(id);
      if (cached !== undefined) return cached;
      if (inProgress.has(id)) return 0; // 环兜底
      inProgress.add(id);

      let total = directCount.get(id) ?? 0;
      for (const child of childrenOf.get(id) ?? []) {
        total += computeTotal(child);
      }

      inProgress.delete(id);
      totalMemo.set(id, total);
      return total;
    };

    const unfiledCount = await Note.countDocuments({
      ...noteFilter,
      folderId: null,
    });

    let totalNotes = unfiledCount;
    for (const folder of folders) {
      if (parentOf.get(folder._id.toString()) === null) {
        totalNotes += computeTotal(folder._id.toString());
      }
    }

    res.json({
      success: true,
      data: {
        folders: folders.map((folder) => ({
          id: folder._id.toString(),
          name: folder.name,
          parentId: folder.parentId ? folder.parentId.toString() : null,
          noteCount: computeTotal(folder._id.toString()),
          directNoteCount: directCount.get(folder._id.toString()) ?? 0,
          createdAt: folder.createdAt,
        })),
        unfiledCount,
        totalNotes,
      },
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const validated = createFolderSchema.safeParse(req.body);
    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { name } = validated.data;
    const parentId = validated.data.parentId ?? null;

    if (parentId) {
      if (!Types.ObjectId.isValid(parentId)) {
        res.status(404).json({ success: false, message: '父文件夹不存在' });
        return;
      }
      const parent = await NoteFolder.findById(parentId);
      if (!parent) {
        res.status(404).json({ success: false, message: '父文件夹不存在' });
        return;
      }
    }

    const existing = await NoteFolder.findOne({ name, parentId });
    if (existing) {
      res.status(409).json({ success: false, message: SIBLING_DUPLICATE_MESSAGE });
      return;
    }

    const folder = new NoteFolder({
      name,
      parentId,
      authorId: req.user.id,
    });

    await folder.save();

    res.status(201).json({
      success: true,
      message: '文件夹创建成功',
      data: {
        id: folder._id.toString(),
        name: folder.name,
        parentId: folder.parentId ? folder.parentId.toString() : null,
        noteCount: 0,
        createdAt: folder.createdAt,
      },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validated = updateFolderSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const folder = await NoteFolder.findById(id);
    if (!folder) {
      res.status(404).json({ success: false, message: '文件夹不存在' });
      return;
    }

    // 同名只允许出现在不同父级下
    const duplicate = await NoteFolder.findOne({
      name: validated.data.name,
      parentId: folder.parentId ?? null,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(409).json({ success: false, message: SIBLING_DUPLICATE_MESSAGE });
      return;
    }

    folder.name = validated.data.name;
    await folder.save();

    res.json({
      success: true,
      message: '文件夹重命名成功',
      data: {
        id: folder._id.toString(),
        name: folder.name,
      },
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const folder = await NoteFolder.findById(id);
    if (!folder) {
      res.status(404).json({ success: false, message: '文件夹不存在' });
      return;
    }

    // 级联：整个子树一并删除，先清空笔记归属再删文件夹
    const parentOf = await loadFolderParentMap();
    const ids = collectSubtreeIds(parentOf, id);

    const moved = await Note.updateMany(
      { folderId: { $in: ids } },
      { folderId: null }
    );
    await NoteFolder.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: '文件夹及其子文件夹已删除，笔记已移回未归档',
      data: {
        deletedFolderCount: ids.length,
        movedNoteCount: moved.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const moveFolder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validated = moveFolderSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const folder = await NoteFolder.findById(id);
    if (!folder) {
      res.status(404).json({ success: false, message: '文件夹不存在' });
      return;
    }

    const newParentId = validated.data.parentId;

    if (newParentId && !Types.ObjectId.isValid(newParentId)) {
      res.status(404).json({ success: false, message: '目标文件夹不存在' });
      return;
    }

    const parentOf = await loadFolderParentMap();

    if (newParentId && wouldCreateCycle(parentOf, id, newParentId)) {
      res
        .status(400)
        .json({ success: false, message: '不能将文件夹移动到自己或其子文件夹中' });
      return;
    }

    if (newParentId) {
      const target = await NoteFolder.findById(newParentId);
      if (!target) {
        res.status(404).json({ success: false, message: '目标文件夹不存在' });
        return;
      }
    }

    const currentParentId = folder.parentId ? folder.parentId.toString() : null;
    if (currentParentId === newParentId) {
      res.json({ success: true, message: '文件夹位置未变化' });
      return;
    }

    // 拖拽同样不能绕过同级重名限制
    const duplicate = await NoteFolder.findOne({
      name: folder.name,
      parentId: newParentId,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(409).json({ success: false, message: SIBLING_DUPLICATE_MESSAGE });
      return;
    }

    folder.parentId = newParentId ? new Types.ObjectId(newParentId) : null;
    await folder.save();

    res.json({
      success: true,
      message: newParentId ? '文件夹已移动' : '文件夹已移到顶层',
      data: {
        id: folder._id.toString(),
        parentId: folder.parentId ? folder.parentId.toString() : null,
      },
    });
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const moveNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validated = moveNoteSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ success: false, message: '笔记不存在' });
      return;
    }

    const folderId = validated.data.folderId;
    if (folderId) {
      const folder = await NoteFolder.findById(folderId);
      if (!folder) {
        res.status(404).json({ success: false, message: '目标文件夹不存在' });
        return;
      }
    }

    note.folderId = folderId ? (folderId as any) : null;
    await note.save();

    res.json({
      success: true,
      message: folderId ? '笔记已移动到文件夹' : '笔记已移出文件夹',
    });
  } catch (error) {
    console.error('Move note error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
