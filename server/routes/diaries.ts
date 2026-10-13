import express from 'express';
import {
  getDiaries,
  getDiaryById,
  createDiary,
  updateDiary,
  deleteDiary,
} from '../controllers/diaryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 日记是私人内容，所有接口都必须登录，且只能操作自己的日记
router.use(authenticate);

router.get('/', getDiaries);
router.get('/:id', getDiaryById);
router.post('/', createDiary);
router.put('/:id', updateDiary);
router.delete('/:id', deleteDiary);

export default router;
