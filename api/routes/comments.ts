import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  getPendingComments,
} from '../controllers/commentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getComments);
router.get('/pending', authenticate, requireAdmin, getPendingComments);
router.post('/', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);
router.post('/:id/approve', authenticate, requireAdmin, approveComment);

export default router;
