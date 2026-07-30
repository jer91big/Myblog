import { Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { Article } from '../models/Article';
import { AuthenticatedRequest } from '../middleware/auth';

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Article.countDocuments({
          categoryId: category._id,
          status: 'published',
        });
        return {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          articleCount: count,
          createdAt: category.createdAt,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        createdAt: category.createdAt,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const validated = createCategorySchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const existingCategory = await Category.findOne({ name: validated.data.name });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: 'Category already exists',
      });
      return;
    }

    const category = new Category(validated.data);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validated = createCategorySchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const category = await Category.findByIdAndUpdate(
      id,
      validated.data,
      { new: true }
    );

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const articleCount = await Article.countDocuments({ categoryId: id });

    if (articleCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing articles',
      });
      return;
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
