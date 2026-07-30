import { Request, Response } from 'express';
import { Article } from '../models/Article';
import { Tag } from '../models/Tag';

export const searchArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const type = (req.query.type as 'title' | 'content' | 'tag') || 'title';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query || query.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
      return;
    }

    let searchQuery: any = { status: 'published' };

    if (type === 'title') {
      searchQuery.title = { $regex: query, $options: 'i' };
    } else if (type === 'content') {
      searchQuery.content = { $regex: query, $options: 'i' };
    } else if (type === 'tag') {
      const tags = await Tag.find({ name: { $regex: query, $options: 'i' } });
      const tagIds = tags.map((tag) => tag._id);
      searchQuery.tagIds = { $in: tagIds };
    }

    const articles = await Article.find(searchQuery)
      .limit(limit)
      .sort({ publishedAt: -1 })
      .populate('authorId', 'username')
      .populate('categoryId', 'name slug');

    res.json({
      success: true,
      data: {
        articles: articles.map((article) => ({
          id: article._id.toString(),
          title: article.title,
          excerpt: article.excerpt || article.content.substring(0, 150),
          author: article.authorId as any,
          category: article.categoryId as any,
          publishedAt: article.publishedAt,
        })),
        count: articles.length,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
