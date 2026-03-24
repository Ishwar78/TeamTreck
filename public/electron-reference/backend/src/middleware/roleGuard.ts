import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import type { AppRole } from '../types';

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // console.log('Role guard check:', { required: roles, userRole: req.auth?.role });
    if (!req.auth) throw new AppError('Unauthorized', 401);
    
    // Allow custom roles to access routes EXCEPT exclusively super_admin routes.
    // Frontend UI granular checking will handle hiding buttons.
    if (!roles.includes(req.auth.role)) {
      if (req.auth.role === 'custom' && !roles.includes('super_admin')) {
        return next();
      }
      // console.warn('Role check failed:', { required: roles, userRole: req.auth.role });
      throw new AppError('Insufficient permissions', 403);
    }
    
    next();
  };
}
