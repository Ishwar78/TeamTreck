import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function requireCompany(req: any, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  if (!req.user.company_id) {
    return next(new AppError('Company context required', 403));
  }

  next();
}
