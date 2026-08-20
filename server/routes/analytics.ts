import express from 'express';
import { getTodayVisitors, getTodayVisitorList } from '../controllers/analyticsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 今日上线人数统计（仅管理员）
router.get('/visitors', authenticate, requireAdmin, getTodayVisitors);
router.get('/visitors/list', authenticate, requireAdmin, getTodayVisitorList);

export default router;
