# TeamTreck Backend — Setup Guide

## Quick Start (Docker)

```bash
cd public/electron-reference/backend

# Copy env file
cp .env.example .env

# Generate RSA keys for JWT
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Update .env with key paths
# JWT_PRIVATE_KEY=./keys/private.pem
# JWT_PUBLIC_KEY=./keys/public.pem

# Start everything (API + MongoDB + Redis)
docker compose up -d

# Seed demo data
docker compose exec api npx tsx src/scripts/seed.ts
```

## Quick Start (Local)

```bash
# Prerequisites: Node.js 20+, MongoDB 7+, Redis 7+

cd public/electron-reference/backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Redis URL, JWT keys, AWS creds

# Generate RSA keys
npm run generate:keys

# Seed demo data
npm run seed

# Start dev server (hot reload)
npm run dev

# Or build + start production
npm run build
npm start
```

## API Endpoints

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/health` | GET | — | Health check |
| `/api/auth/login` | POST | — | Login with email/password |
| `/api/auth/refresh` | POST | — | Refresh access token |
| `/api/auth/logout` | POST | JWT | Logout + revoke refresh |
| `/api/sessions/start` | POST | JWT | Start tracking session |
| `/api/sessions/:id/pause` | PUT | JWT | Pause session |
| `/api/sessions/:id/resume` | PUT | JWT | Resume session |
| `/api/sessions/:id/end` | PUT | JWT | End session |
| `/api/sessions/active` | GET | Admin | List active sessions |
| `/api/sessions/:id/force-end` | POST | Admin | Force-end a session |
| `/api/agent/activity` | POST | JWT | Batch upload activity logs |
| `/api/agent/activity/heartbeat` | POST | JWT | Agent heartbeat |
| `/api/activity/:userId/timeline` | GET | Admin | User activity timeline |
| `/api/activity/:userId/summary` | GET | Admin | User activity summary |
| `/api/agent/screenshots` | POST | JWT | Upload screenshot |
| `/api/screenshots/:userId` | GET | Admin | List user screenshots |
| `/api/screenshots/:id/url` | GET | Admin | Get signed download URL |
| `/api/admin/dashboard` | GET | Admin | Dashboard stats |
| `/api/admin/monitoring-rules` | PUT | Admin | Update monitoring config |
| `/api/admin/invite` | POST | Admin | Invite team member |
| `/api/admin/users` | GET | Admin | List company users |
| `/api/admin/users/:id` | DELETE | Admin | Remove user |

## WebSocket (Socket.IO)

```
ws://localhost:4000/ws
```

Connect with `{ auth: { token: "JWT_TOKEN" } }`.

Events emitted to admin rooms:
- `session:started` — User started tracking
- `session:ended` — User stopped tracking
- `screenshot:new` — New screenshot uploaded
- `idle:detected` — User went idle

## Running Tests

```bash
npm test                          # All tests
npm test -- --testPathPattern=auth    # Auth tests only
npm test -- --coverage            # With coverage report
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment |
| `PORT` | No | 4000 | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `REDIS_URL` | **Yes** | — | Redis connection string |
| `JWT_PRIVATE_KEY` | **Yes** | — | RSA private key (PEM or file path) |
| `JWT_PUBLIC_KEY` | **Yes** | — | RSA public key (PEM or file path) |
| `JWT_ACCESS_EXPIRY` | No | 15m | Access token TTL |
| `JWT_REFRESH_EXPIRY` | No | 7d | Refresh token TTL |
| `AWS_REGION` | **Yes** | us-east-1 | AWS region |
| `AWS_S3_BUCKET` | **Yes** | — | S3 bucket for screenshots |
| `AWS_ACCESS_KEY_ID` | **Yes** | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | **Yes** | — | AWS secret key |
| `STRIPE_SECRET_KEY` | No | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook secret |
| `CORS_ORIGIN` | No | http://localhost:5173 | Allowed CORS origin |
| `RATE_LIMIT_WINDOW_MS` | No | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | No | 100 | Max requests per window |

## Project Structure

```
backend/
├── src/
│   ├── index.ts                  # Server bootstrap
│   ├── app.ts                    # Express app
│   ├── config/
│   │   ├── env.ts                # Zod-validated env vars
│   │   ├── database.ts           # MongoDB connection
│   │   └── redis.ts              # Redis connection
│   ├── middleware/
│   │   ├── auth.ts               # RS256 JWT + device binding
│   │   ├── roleGuard.ts          # Role-based access
│   │   ├── tenantIsolation.ts    # Multi-tenant company_id scoping
│   │   ├── rateLimiter.ts        # Redis-backed rate limiting
│   │   ├── validate.ts           # Zod request validation
│   │   └── errorHandler.ts       # Global error handler
│   ├── models/                   # Mongoose schemas + indexes
│   ├── routes/                   # Express route handlers
│   ├── services/
│   │   └── websocket.service.ts  # Socket.IO real-time service
│   ├── utils/                    # Logger, S3, error classes
│   ├── scripts/
│   │   └── seed.ts               # Database seeder
│   └── __tests__/                # Jest + Supertest integration tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── SETUP.md                      # This file
```
