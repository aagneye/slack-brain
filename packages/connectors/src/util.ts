import { createHash } from 'node:crypto';

/** Stable content hash for exact-duplicate detection. */
export function contentHash(parts: Array<string | undefined>): string {
  return createHash('sha256').update(parts.filter(Boolean).join('\u0000')).digest('hex').slice(0, 32);
}

/** Wrap a promise with a timeout so a slow connector cannot stall the pipeline. */
export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Minimal fetch JSON helper with auth header and error surfacing. */
export async function getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
