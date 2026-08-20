import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

const getSecret = (): string => {
  return process.env.JWT_SECRET as string;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
};
