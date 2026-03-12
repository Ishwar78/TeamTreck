import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import type { AppRole } from '../types';

export function requireRole(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    console.log('Role guard check:', { required: roles, userRole: req.auth?.role });
    if (!req.auth) throw new AppError('Unauthorized', 401);
    if (!roles.includes(req.auth.role)) {
      console.warn('Role check failed:', { required: roles, userRole: req.auth.role });
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
}
