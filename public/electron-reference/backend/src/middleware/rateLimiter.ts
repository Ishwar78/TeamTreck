// import rateLimit from 'express-rate-limit';
// import RedisStore from 'rate-limit-redis';
// import { getRedis } from '../config/redis';
// import { env } from '../config/env';

// export const apiLimiter = rateLimit({
//   windowMs: env.RATE_LIMIT_WINDOW_MS,
//   max: env.RATE_LIMIT_MAX,
//   standardHeaders: true,
//   legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args: string[]) => getRedis().sendCommand(args),
//   }),
//   message: { error: 'Too many requests, please try again later' },
// });

// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   standardHeaders: true,
//   message: { error: 'Too many login attempts, try again in 15 minutes' },
// });




import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 1000,
  message: 'Too many requests, please try again later.',
});
