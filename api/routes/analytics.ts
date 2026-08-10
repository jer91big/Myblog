import express from 'express';
import { getTodayVisitors } from '../controllers/analyticsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 今日上线人数统计（仅管理员）
router.get('/visitors', authenticate, requireAdmin, getTodayVisitors);

export default router;
