import express from 'express';
import {
  getTags,
  getTagById,
  createTag,
  deleteTag,
} from '../controllers/tagController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', getTags);
router.get('/:id', getTagById);
router.post('/', authenticate, requireAdmin, createTag);
router.delete('/:id', authenticate, requireAdmin, deleteTag);

export default router;
