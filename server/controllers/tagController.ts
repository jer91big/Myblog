import { Request, Response } from 'express';
import { z } from 'zod';
import { Tag } from '../models/Tag.js';
import { Article } from '../models/Article.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(30),
});

export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });

    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const count = await Article.countDocuments({
          tagIds: tag._id,
          status: 'published',
        });
        return {
          id: tag._id.toString(),
          name: tag.name,
          slug: tag.slug,
          articleCount: count,
          createdAt: tag.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: tagsWithCount,
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const tag = await Tag.findById(id);

    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: tag._id.toString(),
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
      },
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const validated = createTagSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const existingTag = await Tag.findOne({ name: validated.data.name });

    if (existingTag) {
      res.status(409).json({
        success: false,
        message: 'Tag already exists',
      });
      return;
    }

    const tag = new Tag(validated.data);
    await tag.save();

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: {
        id: tag._id.toString(),
        name: tag.name,
        slug: tag.slug,
      },
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteTag = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const tag = await Tag.findByIdAndDelete(id);

    if (!tag) {
      res.status(404).json({ success: false, message: 'Tag not found' });
      return;
    }

    await Article.updateMany({ tagIds: id }, { $pull: { tagIds: id } });

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
