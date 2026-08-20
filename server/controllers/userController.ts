import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Article } from '../models/Article.js';
import { Note } from '../models/Note.js';
import { Comment } from '../models/Comment.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().optional(),
});

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const articleCount = await Article.countDocuments({ authorId: id });
    const commentCount = await Comment.countDocuments({ authorId: id });
    const noteCount = await Note.countDocuments({ authorId: id });

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        articleCount,
        commentCount,
        noteCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const validated = updateUserSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    if (validated.data.username) {
      const existingUser = await User.findOne({
        username: validated.data.username,
        _id: { $ne: id },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Username already taken',
        });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(id, validated.data, { new: true });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id.toString(),
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    if (id === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await Article.deleteMany({ authorId: id });
    await Comment.deleteMany({ authorId: id });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserArticles = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const articles = await Article.find({ authorId: id })
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 })
      .populate('categoryId', 'name slug');

    const total = await Article.countDocuments({ authorId: id });

    res.json({
      success: true,
      data: {
        articles: articles.map((article) => ({
          id: article._id.toString(),
          title: article.title,
          excerpt: article.excerpt,
          category: article.categoryId as any,
          status: article.status,
          publishedAt: article.publishedAt,
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
    console.error('Get user articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserNotes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const notes = await Note.find({ authorId: id })
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 });

    const total = await Note.countDocuments({ authorId: id });

    res.json({
      success: true,
      data: {
        notes: notes.map((note) => ({
          id: note._id.toString(),
          title: note.title,
          excerpt: note.excerpt,
          tags: note.tags,
          status: note.status,
          publishedAt: note.publishedAt,
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
    console.error('Get user notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserComments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    if (id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ authorId: id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('articleId', 'title');

    const total = await Comment.countDocuments({ authorId: id });

    res.json({
      success: true,
      data: {
        comments: comments.map((comment) => ({
          id: comment._id.toString(),
          content: comment.content,
          article: comment.articleId as any,
          createdAt: comment.createdAt,
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
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
