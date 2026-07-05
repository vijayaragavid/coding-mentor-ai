import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Middleware to protect routes
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(createError('Authentication required', 401));
    }

    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch {
    next(createError('Invalid or expired token', 401));
  }
}
