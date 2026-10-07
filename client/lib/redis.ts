import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis | undefined };

const createRedisInstance = () => {
  const redisUrl = process.env.REDIS_URL;

  // Si existe REDIS_URL (Upstash en Producción)
  if (redisUrl) {
    return new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      tls: {
        rejectUnauthorized: false, // Requerido para certificados de Upstash
      },
    });
  }

  // Fallback para Desarrollo / Docker Local
  const host = process.env.REDIS_HOST || 'localhost';
  const port = Number(process.env.REDIS_PORT) || 6379;

  return new Redis({
    host,
    port,
    maxRetriesPerRequest: 3,
  });
};

export const redis = globalForRedis.redis || createRedisInstance();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}