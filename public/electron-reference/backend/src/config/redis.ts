// import { createClient, RedisClientType } from 'redis';
// import { env } from './env';
// import { logger } from '../utils/logger';

// let redis: RedisClientType;

// export async function connectRedis(): Promise<RedisClientType> {
//   redis = createClient({ url: env.REDIS_URL });
//   redis.on('error', (err) => logger.error('Redis error', err));
//   await redis.connect();
//   logger.info('Redis connected');
//   return redis;
// }

// export function getRedis(): RedisClientType {
//   if (!redis) throw new Error('Redis not initialized — call connectRedis() first');
//   return redis;
// }

// export async function disconnectRedis(): Promise<void> {
//   if (redis) await redis.disconnect();
// }

















export const connectRedis = async () => {
  console.log('⚠ Redis disabled (dev mode)');
};

export const getRedis = () => {
  throw new Error('Redis disabled');
};
