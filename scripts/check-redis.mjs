import fs from 'node:fs';
import path from 'node:path';
import Redis from 'ioredis';

function redisNeedsTls(url) {
  return url.startsWith('rediss://') || url.includes('upstash.io');
}

function getRedisOptions(url) {
  return {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    ...(redisNeedsTls(url) ? { tls: {} } : {}),
  };
}

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env found at repo root');
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [key, val];
    }),
);

const url = env.REDIS_URL;
if (!url) {
  console.error('REDIS_URL is not set in .env');
  process.exit(1);
}

const masked = url.replace(/:([^:@/]+)@/, ':***@');
console.log('Testing:', masked);

const redis = new Redis(url, { ...getRedisOptions(url), maxRetriesPerRequest: 1 });

try {
  await redis.connect();
  const pong = await redis.ping();
  const info = await redis.info('server');
  const version = info.match(/redis_version:([^\r\n]+)/)?.[1] ?? 'unknown';
  console.log('PING:', pong);
  console.log('Redis version:', version);
  console.log('Status: OK — connection successful');
} catch (err) {
  console.error('Status: FAILED');
  console.error('Error:', err.message);
  if (url.includes('upstash.io') && !url.startsWith('rediss://')) {
    console.error('Tip: Upstash also provides a rediss:// URL in the dashboard (recommended).');
  }
  process.exit(1);
} finally {
  redis.disconnect();
}
