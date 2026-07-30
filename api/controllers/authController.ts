import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { email, password, username } = validated.data;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists',
      });
      return;
    }

    const user = new User({
      email,
      passwordHash: password,
      username,
    });

    await user.save();

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.safeParse(req.body);

    if (!validated.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validated.error.errors,
      });
      return;
    }

    const { email, password } = validated.data;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
