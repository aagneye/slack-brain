import { prisma } from '@cpe/db';
import {
  assertProductionReady,
  getRedisOptions,
  loadConfig,
  logger,
} from '@cpe/shared';
import Redis from 'ioredis';

/**
 * Validates env vars and connectivity before the worker starts consuming jobs.
 * Fails fast in production so Render surfaces a clear deploy error.
 */
export async function validateWorkerProductionEnv(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return;

  const config = loadConfig();
  assertProductionReady(process.env, config, { role: 'worker' });

  if (!process.env.GITHUB_TOKEN) {
    logger.warn('GITHUB_TOKEN not set — GitHub connector disabled');
  }
  if (!process.env.SLACK_USER_TOKEN) {
    logger.warn(
      'SLACK_USER_TOKEN not set — Slack search uses per-user tokens from portal when available',
    );
  }

  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl.includes('neon.tech') && !dbUrl.includes('pgbouncer=true')) {
    logger.warn(
      'DATABASE_URL missing pgbouncer=true — add it to Neon pooled URL to avoid idle disconnects',
    );
  }

  await prisma.$queryRaw`SELECT 1`;

  const redisUrl = process.env.REDIS_URL ?? config.REDIS_URL;
  const redis = new Redis(redisUrl, getRedisOptions(redisUrl));
  try {
    await redis.connect();
    await redis.ping();
  } finally {
    redis.disconnect();
  }

  logger.info('worker production checks passed');
}
