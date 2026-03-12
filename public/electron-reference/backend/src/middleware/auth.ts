import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { Company } from '../models/Company';
import type { AuthPayload } from '../types';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Allow token in header OR query param (for <img> tags)
  const header = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  let token = '';

  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    throw new AppError('Missing authorization token', 401);
  }

  try {
    console.log('Verifying token:', token.substring(0, 10) + '...');
    const payload = jwt.verify(
      token,
      env.JWT_PRIVATE_KEY,
      {
        algorithms: ['HS256'],
      }
    ) as AuthPayload;

    console.log('Token verified, payload:', JSON.stringify(payload));

    // Optional device binding check
    const deviceHeader = req.headers['x-device-id'] as string | undefined;
    if (
      deviceHeader &&
      payload.device_id &&
      deviceHeader !== payload.device_id
    ) {
      console.warn('Device ID mismatch:', { header: deviceHeader, payload: payload.device_id });
      throw new AppError(
        'Device ID mismatch — token bound to a different device',
        403
      );
    }

    req.auth = payload;
    console.log('Auth middleware passed for user:', payload.user_id, 'role:', payload.role);

    // Skip expiration check for super admins, authentication routes, and payment routes
    if (
      payload.role !== 'super_admin' &&
      !req.originalUrl.startsWith('/api/auth') &&
      !req.originalUrl.startsWith('/api/payment')
    ) {
      if (payload.company_id) {
        const company = await Company.findById(payload.company_id);
        if (company) {
          // If past the end date, freeze the account
          if (
            company.subscription &&
            company.subscription.current_period_end &&
            new Date(company.subscription.current_period_end) < new Date()
          ) {
            // Update the DB if not already matching
            if (company.is_active !== false || company.subscription.status !== 'expired') {
              company.is_active = false;
              company.subscription.status = 'expired';
              await company.save();
            }
            throw new AppError('Your subscription has expired. Please upgrade or renew your plan to restore access.', 403);
          }
        }
      }
    }

    next();
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 403) {
      next(err); // Pass the custom 403 expiration error directly to the error handler
      return;
    }
    console.error('Auth middleware failed:', err instanceof Error ? err.message : err);
    next(new AppError('Invalid or expired token', 401));
  }
}
