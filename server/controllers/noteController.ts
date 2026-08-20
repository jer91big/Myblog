import { Request, Response } from 'express';
import { z } from 'zod';
import { Note } from '../models/Note.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  status: z.enum(['published', 'draft']).default('draft'),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['published', 'draft']).optional(),
});

export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const query: any = {};

    if (status === 'all' || !status) {
      if (!req.user || req.user.role !== 'admin') {
        query.status = 'published';
      }
    } else {
      query.status = status;
    }

    const notes = await Note.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 })
      .populate('authorId', 'username avatarUrl');

    const total = await Note.countDocuments(query);

    res.json({
      success: true,
      data: {
        notes: notes.map((note) => ({
          id: note._id.toString(),
          title: note.title,
          excerpt: note.excerpt || note.content.substring(0, 200),
          tags: note.tags,
          author: note.authorId as any,
          status: note.status,
          views: note.views,
          publishedAt: note.publishedAt,
          createdAt: note.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getNoteById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id)
      .populate('authorId', 'username avatarUrl');

    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    if (note.status === 'draft') {
      const isOwner = req.user && req.user.id === note.authorId._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'Note is not published' });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        excerpt: note.excerpt,
        tags: note.tags,
        author: note.authorId as any,
        status: note.status,
        views: note.views,
        publishedAt: note.publishedAt,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = createNoteSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { title, content, tags = [], status } = validated.data;

    const note = new Note({
      title,
      content,
      excerpt: content.substring(0, 200),
      authorId: req.user.id,
      tags,
      status,
    });

    await note.save();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        id: note._id.toString(),
        title: note.title,
        tags: note.tags,
        status: note.status,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validated = updateNoteSchema.safeParse(req.body);

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
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    if (note.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    Object.assign(note, validated.data);

    if (validated.data.content) {
      note.excerpt = validated.data.content.substring(0, 200);
    }

    await note.save();

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: {
        id: note._id.toString(),
        title: note.title,
        status: note.status,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNote = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const note = await Note.findById(id);

    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    if (note.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await Note.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
