import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'admin' | 'user';
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, authConfig.jwtSecret) as any;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
