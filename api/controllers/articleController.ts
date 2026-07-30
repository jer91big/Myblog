import { Request, Response } from 'express';
import { z } from 'zod';
import { Article } from '../models/Article';
import { Category } from '../models/Category';
import { Tag } from '../models/Tag';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import slugify from 'slugify';

const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(['published', 'draft']).default('draft'),
  featuredImage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  tagIds: z.array(z.string()).optional(),
  status: z.enum(['published', 'draft']).optional(),
  featuredImage: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const getArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const tag = req.query.tag as string;
    const status = (req.query.status as 'published' | 'draft') || 'published';

    const skip = (page - 1) * limit;

    const query: any = { status };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) {
        query.categoryId = cat._id;
      }
    }

    if (tag) {
      const t = await Tag.findOne({ slug: tag });
      if (t) {
        query.tagIds = t._id;
      }
    }

    const articles = await Article.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ publishedAt: -1 })
      .populate('authorId', 'username avatarUrl')
      .populate('categoryId', 'name slug')
      .populate('tagIds', 'name slug');

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      data: {
        articles: articles.map((article) => ({
          id: article._id.toString(),
          title: article.title,
          excerpt: article.excerpt || article.content.substring(0, 200),
          author: article.authorId as any,
          category: article.categoryId as any,
          tags: article.tagIds as any[],
          featuredImage: article.featuredImage,
          views: article.views,
          likes: article.likes,
          status: article.status,
          publishedAt: article.publishedAt,
          createdAt: article.createdAt,
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
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getArticleById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id)
      .populate('authorId', 'username avatarUrl')
      .populate('categoryId', 'name slug')
      .populate('tagIds', 'name slug');

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.status === 'draft') {
      const isOwner = req.user && req.user.id === article.authorId._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'Article is not published' });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        id: article._id.toString(),
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        author: article.authorId as any,
        category: article.categoryId as any,
        tags: article.tagIds as any[],
        featuredImage: article.featuredImage,
        views: article.views,
        likes: article.likes,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createArticle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = createArticleSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const {
      title,
      content,
      excerpt,
      categoryId,
      tagIds = [],
      status,
      featuredImage,
      metaTitle,
      metaDescription,
    } = validated.data;

    const article = new Article({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      authorId: req.user.id,
      categoryId,
      tagIds,
      status,
      featuredImage,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || (excerpt || content.substring(0, 160)),
    });

    await article.save();

    await article.populate('categoryId', 'name slug');
    await article.populate('tagIds', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: {
        id: article._id.toString(),
        title: article.title,
        excerpt: article.excerpt,
        category: article.categoryId as any,
        tags: article.tagIds as any[],
        status: article.status,
        createdAt: article.createdAt,
      },
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateArticle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validated = updateArticleSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    Object.assign(article, validated.data);

    if (validated.data.content && !validated.data.excerpt) {
      article.excerpt = validated.data.content.substring(0, 200);
    }

    await article.save();

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: {
        id: article._id.toString(),
        title: article.title,
        excerpt: article.excerpt,
        status: article.status,
        updatedAt: article.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteArticle = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    if (article.authorId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await Article.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const incrementViews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    article.views += 1;
    await article.save();

    res.json({
      success: true,
      data: { views: article.views },
    });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const toggleLike = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const userId = req.user.id;

    if (article.likedBy.some((id) => id.toString() === userId)) {
      article.likedBy = article.likedBy.filter((id) => id.toString() !== userId);
      article.likes -= 1;
    } else {
      article.likedBy.push(userId as any);
      article.likes += 1;
    }

    await article.save();

    res.json({
      success: true,
      data: {
        likes: article.likes,
        liked: article.likedBy.some((id) => id.toString() === userId),
      },
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPopularArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const articles = await Article.find({ status: 'published' })
      .limit(limit)
      .sort({ views: -1 })
      .populate('authorId', 'username');

    res.json({
      success: true,
      data: articles.map((article) => ({
        id: article._id.toString(),
        title: article.title,
        views: article.views,
        author: article.authorId as any,
      })),
    });
  } catch (error) {
    console.error('Get popular articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getRelatedArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 3;

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found' });
      return;
    }

    const relatedArticles = await Article.find({
      _id: { $ne: id },
      status: 'published',
      $or: [
        { categoryId: article.categoryId },
        { tagIds: { $in: article.tagIds } },
      ],
    })
      .limit(limit)
      .sort({ publishedAt: -1 })
      .populate('categoryId', 'name slug');

    res.json({
      success: true,
      data: relatedArticles.map((article) => ({
        id: article._id.toString(),
        title: article.title,
        excerpt: article.excerpt || article.content.substring(0, 100),
        category: article.categoryId as any,
        publishedAt: article.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Get related articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
