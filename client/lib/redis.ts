import Redis from 'ioredis';

const getRedisUrl = () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT) || 6379;
  return { host, port };
};

const globalForRedis = global as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ||
  new Redis({
    host: getRedisUrl().host,
    port: getRedisUrl().port,
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}