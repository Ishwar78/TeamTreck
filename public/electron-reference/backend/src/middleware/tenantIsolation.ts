import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function enforceTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth?.company_id) {
    throw new AppError('Missing tenant context', 403);
  }
  // Attach for service layer use — all DB queries MUST scope by this
  (req.query as any)._company_id = req.auth.company_id;
  next();
}
