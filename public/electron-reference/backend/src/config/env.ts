import { z } from 'zod';
import fs from 'fs';
import path from 'path';

function loadKey(envVar: string): string {
  const value = process.env[envVar] || '';

  // If it looks like a file path, read the file
  if (value.startsWith('/') || value.startsWith('./')) {
    return fs.readFileSync(path.resolve(value), 'utf-8');
  }

  return value.replace(/\\n/g, '\n');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  /* ================= DATABASE ================= */
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().optional(),

  /* ================= JWT ================= */
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ACCESS_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  /* ================= AWS ================= */
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  /* ================= STRIPE ================= */
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  /* ================= RAZORPAY ================= */
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),

  /* ================= SMTP ================= */
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  FRONTEND_URL: z.string().min(1),

  /* ================= APP ================= */
  CORS_ORIGIN: z.string().default('http://localhost:8080,http://localhost:5173,http://localhost:8081'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});


const raw = {
  ...process.env,
  JWT_PRIVATE_KEY: loadKey('JWT_PRIVATE_KEY'),
  JWT_PUBLIC_KEY: loadKey('JWT_PUBLIC_KEY'),
};

export const env = envSchema.parse(raw);
