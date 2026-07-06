import { NextResponse } from 'next/server';
import { prisma } from '@cpe/db';
import { getProductionChecks, getSlackWebhookUrls } from '@cpe/shared';
import { checkOllamaHealth, isOllamaEnabled } from '@cpe/llm-gateway';
import { getRedis, redisUrl } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/health — liveness/readiness for Vercel, uptime monitors, and deploy smoke tests.
 * Returns 200 when DB + Redis respond; 503 when degraded.
 */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, 'ok' | 'error' | 'skipped'> = {
    database: 'skipped',
    redis: 'skipped',
    ollama: 'skipped',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  if (redisUrl) {
    try {
      const redis = getRedis();
      if (redis.status !== 'ready') await redis.connect();
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }
  }

  if (isOllamaEnabled()) {
    const ollama = await checkOllamaHealth();
    checks.ollama = ollama.ok ? 'ok' : 'error';
  }

  const configChecks =
    process.env.NODE_ENV === 'production' ? getProductionChecks() : [];
  const configOk = configChecks.every((c) => c.ok);

  const infraOk =
    checks.database === 'ok' &&
    checks.redis === 'ok' &&
    (checks.ollama === 'ok' || checks.ollama === 'skipped');
  const healthy = infraOk && configOk;

  const appBaseUrl = process.env.APP_BASE_URL ?? process.env.AUTH_URL;
  const slackUrls = appBaseUrl ? getSlackWebhookUrls(appBaseUrl) : undefined;

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
      slack: slackUrls,
      config: process.env.NODE_ENV === 'production' ? configChecks : undefined,
      latencyMs: Date.now() - started,
    },
    { status: healthy ? 200 : 503 },
  );
}
