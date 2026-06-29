import Redis from 'ioredis';

/**
 * Shared ioredis connections. BullMQ requires `maxRetriesPerRequest: null`.
 * Cached on globalThis to survive Next.js hot reloads.
 */
const globalForRedis = globalThis as unknown as {
  redis?: Redis;
  redisSub?: Redis;
};

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis =
  globalForRedis.redis ?? new Redis(url, { maxRetriesPerRequest: null });

/** Dedicated connection for pub/sub subscriptions (cannot be shared with commands). */
export const redisSub = globalForRedis.redisSub ?? new Redis(url, { maxRetriesPerRequest: null });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
  globalForRedis.redisSub = redisSub;
}

/** Channel name for a job's progress stream. */
export const progressChannel = (jobId: string) => `job:${jobId}:progress`;
