/** Small, dependency-free vector helpers used by ranking, dedupe and contradiction. */

export function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += (a[i] as number) * (b[i] as number);
  return s;
}

export function magnitude(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const m = magnitude(a) * magnitude(b);
  return m === 0 ? 0 : dot(a, b) / m;
}
