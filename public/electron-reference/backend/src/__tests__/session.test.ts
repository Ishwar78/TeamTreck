/**
 * Session API Integration Tests
 *
 * Run:  npm test -- --testPathPattern=session
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4002,
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

jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  getRedis: () => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    sendCommand: jest.fn(() => Promise.resolve(null)),
  }),
  disconnectRedis: jest.fn(),
}));

jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (_req: any, _res: any, next: any) => next(),
  authLimiter: (_req: any, _res: any, next: any) => next(),
}));

import app from '../app';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Session } from '../models/Session';

let mongoServer: MongoMemoryServer;
let authToken: string;
const deviceId = '550e8400-e29b-41d4-a716-446655440000';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const company = await Company.create({ name: 'Test Corp', domain: 'session-test.com', plan: 'business', max_users: 10 });
  const hash = await bcrypt.hash('Password@123', 12);
  const user = await User.create({
    company_id: company._id,
    email: 'session@test.com',
    password_hash: hash,
    name: 'Session Tester',
    role: 'company_admin',
    status: 'active',
    devices: [],
  });

  authToken = jwt.sign(
    { user_id: user._id.toString(), company_id: company._id.toString(), role: 'company_admin', device_id: deviceId },
    privateKey,
    { algorithm: 'RS256', expiresIn: '15m', issuer: 'teamtreck-api', audience: 'teamtreck-agent' },
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Session.deleteMany({});
});

describe('POST /api/sessions/start', () => {
  it('creates a new session', async () => {
    const res = await supertest(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_id: deviceId, timestamp: new Date().toISOString() });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('session_id');
  });

  it('rejects duplicate active session', async () => {
    await supertest(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_id: deviceId, timestamp: new Date().toISOString() });

    const res = await supertest(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_id: deviceId, timestamp: new Date().toISOString() });

    expect(res.status).toBe(409);
  });
});

describe('Session lifecycle', () => {
  it('start → pause → resume → end', async () => {
    const startRes = await supertest(app)
      .post('/api/sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_id: deviceId, timestamp: new Date().toISOString() });

    const sessionId = startRes.body.session_id;

    const pauseRes = await supertest(app)
      .put(`/api/sessions/${sessionId}/pause`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(pauseRes.status).toBe(200);

    const resumeRes = await supertest(app)
      .put(`/api/sessions/${sessionId}/resume`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(resumeRes.status).toBe(200);

    const endRes = await supertest(app)
      .put(`/api/sessions/${sessionId}/end`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ summary: { total_duration: 3600 } });
    expect(endRes.status).toBe(200);
  });
});
