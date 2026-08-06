import { Request, Response } from 'express';
import { z } from 'zod';
import { Comment } from '../models/Comment.js';
import { Article } from '../models/Article.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createCommentSchema = z.object({
  articleId: z.string(),
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const articleId = req.query.articleId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const approvedParam = req.query.approved;

    const skip = (page - 1) * limit;

    const query: any = {};

    if (articleId) {
      query.articleId = articleId;
    }

    if (approvedParam !== undefined) {
      query.approved = approvedParam === 'true';
    }

    const comments = await Comment.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('authorId', 'username avatarUrl')
      .populate('parentId', 'content authorId');

    const total = await Comment.countDocuments(query);

    const nestedComments = comments
      .filter((c) => !c.parentId)
      .map((parent) => {
        const children = comments.filter(
          (c) => c.parentId && c.parentId._id.toString() === parent._id.toString()
        );
        return {
          id: parent._id.toString(),
          content: parent.content,
          author: parent.authorId as any,
          parentId: parent.parentId ? (parent.parentId as any)._id.toString() : null,
          approved: parent.approved,
          createdAt: parent.createdAt,
          children: children.map((child) => ({
            id: child._id.toString(),
            content: child.content,
            author: child.authorId as any,
            parentId: child.parentId ? (child.parentId as any)._id.toString() : null,
            approved: child.approved,
            createdAt: child.createdAt,
          })),
        };
      });

    res.json({
      success: true,
      data: {
        comments: nestedComments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = createCommentSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { articleId, content, parentId } = validated.data;

    const article = await Article.findById(articleId);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const comment = new Comment({
      articleId,
      authorId: req.user.id,
      content,
      parentId: parentId || null,
      // 自由发言：评论发布即通过，无需审核
      approved: true,
    });

    await comment.save();

    await comment.populate('authorId', 'username avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Comment submitted successfully',
      data: {
        id: comment._id.toString(),
        content: comment.content,
        author: comment.authorId as any,
        approved: comment.approved,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.length < 1) {
      res.status(400).json({ success: false, message: 'Content is required' });
      return;
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    comment.content = content;
    await comment.save();

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        id: comment._id.toString(),
        content: comment.content,
      },
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await Comment.deleteMany({ parentId: id });
    await Comment.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const approveComment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const comment = await Comment.findByIdAndUpdate(
      id,
      { approved: true },
      { new: true }
    );

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Comment approved successfully',
      data: {
        id: comment._id.toString(),
        approved: comment.approved,
      },
    });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPendingComments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ approved: false })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('authorId', 'username avatarUrl')
      .populate('articleId', 'title');

    const total = await Comment.countDocuments({ approved: false });

    res.json({
      success: true,
      data: {
        comments: comments.map((comment) => ({
          id: comment._id.toString(),
          content: comment.content,
          author: comment.authorId as any,
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
    console.error('Get pending comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
