import express from 'express';
import { register, login, getCurrentUser, refreshToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/refresh', refreshToken);

export default router;
