import { Request, Response } from 'express';
import { Article } from '../models/Article';
import { Category } from '../models/Category';

export const generateSitemap = async (req: Request, res: Response): Promise<void> => {
  try {
    const baseUrl = req.protocol + '://' + req.get('host');

    const articles = await Article.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .select('title publishedAt');

    const categories = await Category.find().select('slug');

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    categories.forEach((category) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/articles/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    articles.forEach((article) => {
      sitemap += `
  <url>
    <loc>${baseUrl}/articles/${article._id}</loc>
    <lastmod>${article.publishedAt?.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Generate sitemap error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
