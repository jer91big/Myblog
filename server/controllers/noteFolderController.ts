import { Response } from 'express';
import { z } from 'zod';
import { NoteFolder } from '../models/NoteFolder.js';
import { Note } from '../models/Note.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

const moveNoteSchema = z.object({
  folderId: z.string().nullable(),
});

export const getFolders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const folders = await NoteFolder.find().sort({ createdAt: 1 });

    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const noteCount = await Note.countDocuments({ folderId: folder._id });
        return {
          id: folder._id.toString(),
          name: folder.name,
          noteCount,
          createdAt: folder.createdAt,
        };
      })
    );

    const unfiledCount = await Note.countDocuments({ folderId: null });

    res.json({
      success: true,
      data: {
        folders: foldersWithCount,
        unfiledCount,
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

    const existing = await NoteFolder.findOne({ name: validated.data.name });
    if (existing) {
      res.status(409).json({ success: false, message: '同名文件夹已存在' });
      return;
    }

    const folder = new NoteFolder({
      name: validated.data.name,
      authorId: req.user.id,
    });

    await folder.save();

    res.status(201).json({
      success: true,
      message: '文件夹创建成功',
      data: {
        id: folder._id.toString(),
        name: folder.name,
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

    const duplicate = await NoteFolder.findOne({
      name: validated.data.name,
      _id: { $ne: id },
    });
    if (duplicate) {
      res.status(409).json({ success: false, message: '同名文件夹已存在' });
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

    // Move notes in this folder back to unfiled
    await Note.updateMany({ folderId: id }, { folderId: null });
    await NoteFolder.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '文件夹已删除，笔记已移回未归档',
    });
  } catch (error) {
    console.error('Delete folder error:', error);
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

    note.folderId = folderId ? folderId as any : null;
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
