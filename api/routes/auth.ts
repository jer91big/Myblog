import express from 'express';
import { register, login, getCurrentUser, refreshToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/refresh', refreshToken);

export default router;
