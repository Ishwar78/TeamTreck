/**
 * Auth API Integration Tests
 *
 * Prerequisites:
 *   npm install --save-dev mongodb-memory-server supertest
 *
 * These tests use an in-memory MongoDB instance — no external DB needed.
 *
 * Run:  npm test -- --testPathPattern=auth
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// We need to mock env and redis BEFORE importing app
// Generate RSA key pair for tests
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Mock env
jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4001,
    MONGODB_URI: 'mock',
    REDIS_URL: 'mock',
    JWT_PRIVATE_KEY: privateKey,
    JWT_PUBLIC_KEY: publicKey,
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    AWS_REGION: 'us-east-1',
    AWS_S3_BUCKET: 'test-bucket',
    AWS_ACCESS_KEY_ID: 'test',
    AWS_SECRET_ACCESS_KEY: 'test',
    CORS_ORIGIN: '*',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX: 1000,
  },
}));

// Mock Redis
const mockRedisStore: Record<string, string> = {};
jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  getRedis: () => ({
    get: jest.fn((key: string) => Promise.resolve(mockRedisStore[key] || null)),
    set: jest.fn((key: string, value: string) => {
      mockRedisStore[key] = value;
      return Promise.resolve('OK');
    }),
    del: jest.fn((key: string) => {
      delete mockRedisStore[key];
      return Promise.resolve(1);
    }),
    sendCommand: jest.fn(() => Promise.resolve(null)),
  }),
  disconnectRedis: jest.fn(),
}));

// Mock rate limiter to be a passthrough
jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  authLimiter: (_req: any, _res: any, next: any) => next(),
}));

import app from '../app';
import { User } from '../models/User';
import { Company } from '../models/Company';

let mongoServer: MongoMemoryServer;
let companyId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const company = await Company.create({
    name: 'Test Corp',
    domain: 'test.com',
    plan: 'business',
    max_users: 10,
  });
  companyId = company._id.toString();

  const hash = await bcrypt.hash('Password@123', 12);
  await User.create({
    company_id: company._id,
    email: 'test@test.com',
    password_hash: hash,
    name: 'Test User',
    role: 'company_admin',
    status: 'active',
    devices: [],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/auth/login', () => {
  const deviceId = '550e8400-e29b-41d4-a716-446655440000';

  it('returns 401 for wrong password', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'WrongPass1', device_id: deviceId });
    expect(res.status).toBe(401);
  });

  it('returns 422 for invalid email', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Password@123', device_id: deviceId });
    expect(res.status).toBe(422);
  });

  it('returns token for valid credentials', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'Password@123', device_id: deviceId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@test.com');

    // Verify JWT
    const decoded = jwt.verify(res.body.token, publicKey, { algorithms: ['RS256'] }) as any;
    expect(decoded.user_id).toBeDefined();
    expect(decoded.company_id).toBe(companyId);
    expect(decoded.role).toBe('company_admin');
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 401 without token', async () => {
    const res = await supertest(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
