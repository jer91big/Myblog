import express from 'express';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/noteFolderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getFolders);
router.post('/', authenticate, createFolder);
router.put('/:id', authenticate, updateFolder);
router.delete('/:id', authenticate, deleteFolder);

export default router;
