/** Upstash and other hosted Redis providers often require TLS even on port 6379. */
export function redisNeedsTls(url: string): boolean {
  return url.startsWith('rediss://') || url.includes('upstash.io');
}

export function getRedisOptions(url: string, overrides: Record<string, unknown> = {}) {
  return {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    ...(redisNeedsTls(url) ? { tls: {} } : {}),
    ...overrides,
  };
}

/** BullMQ connection object from a Redis URL. */
export function getBullMqConnection(url: string) {
  return {
    url,
    maxRetriesPerRequest: null as null,
    ...(redisNeedsTls(url) ? { tls: {} } : {}),
  };
}
