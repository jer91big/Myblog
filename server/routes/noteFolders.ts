import express from 'express';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder,
} from '../controllers/noteFolderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getFolders);
router.post('/', authenticate, requireAdmin, createFolder);
router.put('/:id', authenticate, requireAdmin, updateFolder);
router.patch('/:id/move', authenticate, requireAdmin, moveFolder);
router.delete('/:id', authenticate, requireAdmin, deleteFolder);

export default router;
