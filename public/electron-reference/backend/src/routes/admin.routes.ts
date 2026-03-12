
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

import { User } from '../models/User';
import { Company } from '../models/Company';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const router = Router();

/* ================= SCHEMAS ================= */

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  device_id: z.string().min(3),
  device_name: z.string().max(100).optional(),
  os: z.string().max(50).optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

/* ================= TOKEN GENERATION ================= */

function generateTokens(payload: any) {

  const accessToken = jwt.sign(
    payload,
    env.JWT_PRIVATE_KEY as string,
    {
      algorithm: 'HS256',
      expiresIn: (env.JWT_ACCESS_EXPIRY || '1h') as any
    }
  );

  const refreshToken = jwt.sign(
    payload,
    env.JWT_PRIVATE_KEY as string,
    {
      algorithm: 'HS256',
      expiresIn: (env.JWT_REFRESH_EXPIRY || '7d') as any
    }
  );

  return { accessToken, refreshToken };
}

/* ================= LOGIN ================= */

router.post(
  '/login',
  rateLimiter,
  validate(loginSchema),
  async (req, res) => {

    const { email, password, device_id, device_name, os } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      status: 'active',
    }).select('+password_hash');

    if (!user) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    /* ================= DEVICE LOGIC ================= */

    if (user.role !== 'super_admin') {

      const existingDevice = user.devices.find(
        (d: any) => d.device_id === device_id
      );

      if (!existingDevice) {

        if (
          env.NODE_ENV === 'production' &&
          user.devices.length >= 3
        ) {
          throw new AppError(
            'Maximum devices reached. Remove a device first.',
            403
          );
        }

        user.devices.push({
          device_id,
          device_name: device_name || 'Unknown',
          os: os || 'Unknown',
          bound_at: new Date(),
          last_seen: new Date(),
        });

      } else {
        existingDevice.last_seen = new Date();
      }
    }

    user.last_login = new Date();
    await user.save();

    const company =
      user.company_id
        ? await Company.findById(user.company_id).lean()
        : null;

    const payload = {
      user_id: user._id.toString(),
      company_id: user.company_id
        ? user.company_id.toString()
        : null,
      role: user.role,
      device_id,
    };

    const tokens = generateTokens(payload);

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id || null,
        companyName: company?.name || null,
      },
    });
  }
);

/* ================= REFRESH ================= */

router.post(
  '/refresh',
  validate(refreshSchema),
  async (req, res) => {

    const { refresh_token } = req.body;

    let decoded: any;

    try {

      decoded = jwt.verify(
        refresh_token,
        env.JWT_PRIVATE_KEY as string,
        { algorithms: ['HS256'] }
      );

    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = generateTokens({
      user_id: decoded.user_id,
      company_id: decoded.company_id,
      role: decoded.role,
      device_id: decoded.device_id,
    });

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }
);

/* ================= LOGOUT ================= */

router.post('/logout', authenticate, async (_req, res) => {
  res.json({ success: true });
});

export const adminRoutes = router;

