import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserArticles,
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.get('/:id', authenticate, getUserById);
router.get('/:id/articles', authenticate, getUserArticles);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, requireAdmin, deleteUser);

export default router;
