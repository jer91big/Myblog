import express from 'express';
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  incrementViews,
  toggleLike,
  getPopularArticles,
  getRelatedArticles,
} from '../controllers/articleController.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getArticles);
router.get('/popular', getPopularArticles);
router.get('/:id', optionalAuth, getArticleById);
router.get('/:id/related', getRelatedArticles);
router.post('/', authenticate, createArticle);
router.put('/:id', authenticate, updateArticle);
router.delete('/:id', authenticate, deleteArticle);
router.post('/:id/views', incrementViews);
router.post('/:id/likes', authenticate, toggleLike);

export default router;
