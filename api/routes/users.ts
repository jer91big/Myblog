import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserArticles,
  getUserNotes,
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.get('/:id', authenticate, getUserById);
router.get('/:id/articles', authenticate, getUserArticles);
router.get('/:id/notes', authenticate, getUserNotes);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
