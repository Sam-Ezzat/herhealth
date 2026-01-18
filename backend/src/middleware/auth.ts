import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import ApiError from '../utils/ApiError';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      req.user = {
        id: decoded.id,
        username: decoded.username,
        roleId: decoded.roleId,
      };

      next();
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      // For now, we'll check by role name in a future enhancement
      // This is a placeholder for role-based authorization
      next();
    } catch (error) {
      next(error);
    }
  };
};
