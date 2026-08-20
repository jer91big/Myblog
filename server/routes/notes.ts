import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getNotes);
router.get('/:id', optionalAuth, getNoteById);
router.post('/', authenticate, createNote);
router.put('/:id', authenticate, updateNote);
router.delete('/:id', authenticate, deleteNote);

export default router;
