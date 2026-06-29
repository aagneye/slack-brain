import Redis from 'ioredis';

/**
 * Redis helpers for the web app. Connections are created lazily so `next build`
 * does not require a running Redis instance.
 */
const globalForRedis = globalThis as unknown as {
  redis?: Redis;
  redisSub?: Redis;
};

export const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return globalForRedis.redis;
}

/** Dedicated pub/sub connection (cannot share the command connection). */
export function getRedisSub(): Redis {
  if (!globalForRedis.redisSub) {
    globalForRedis.redisSub = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return globalForRedis.redisSub;
}

/** Channel name for a job's progress stream. */
export const progressChannel = (jobId: string) => `job:${jobId}:progress`;
