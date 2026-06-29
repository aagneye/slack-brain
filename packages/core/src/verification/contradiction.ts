import type { Contradiction, RetrievedItem } from '@cpe/shared';
import { cosineSimilarity } from '../ranking/vector.js';

/**
 * Contradiction detection (stage 4d) — STRETCH per docs/04-roadmap-risks.md.
 *
 * Two-step, high-precision approach:
 *   1. Select semantically-close pairs (vector neighbors) as candidates.
 *   2. Ask a judge (LLM/NLI) whether the pair actually conflicts.
 *
 * The judge is injected so the core stays pure and testable. Without a judge,
 * only candidate pairs are produced (judge step skipped).
 */

export type ContradictionJudge = (
  a: RetrievedItem,
  b: RetrievedItem,
) => Promise<{ conflict: boolean; claimA: string; claimB: string; reason: string; confidence: number }>;

export interface ContradictionOptions {
  /** Lower bound to consider two items "about the same thing". */
  candidateThreshold?: number; // default 0.8
  /** Upper bound — near-identical items are duplicates, not contradictions. */
  duplicateThreshold?: number; // default 0.95
  maxCandidates?: number;
}

export function selectCandidatePairs(
  items: RetrievedItem[],
  opts: ContradictionOptions = {},
): Array<[RetrievedItem, RetrievedItem]> {
  const lo = opts.candidateThreshold ?? 0.8;
  const hi = opts.duplicateThreshold ?? 0.95;
  const max = opts.maxCandidates ?? 20;
  const pairs: Array<[RetrievedItem, RetrievedItem, number]> = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i] as RetrievedItem;
      const b = items[j] as RetrievedItem;
      if (!a.embedding || !b.embedding) continue;
      const sim = cosineSimilarity(a.embedding, b.embedding);
      if (sim >= lo && sim < hi) pairs.push([a, b, sim]);
    }
  }
  pairs.sort((x, y) => y[2] - x[2]);
  return pairs.slice(0, max).map(([a, b]) => [a, b]);
}

export async function detectContradictions(
  items: RetrievedItem[],
  judge: ContradictionJudge | null,
  opts: ContradictionOptions = {},
): Promise<Contradiction[]> {
  const candidates = selectCandidatePairs(items, opts);
  if (!judge) return [];
  const out: Contradiction[] = [];
  for (const [a, b] of candidates) {
    const verdict = await judge(a, b);
    if (verdict.conflict) {
      out.push({
        itemAId: a.id,
        itemBId: b.id,
        claimA: verdict.claimA,
        claimB: verdict.claimB,
        reason: verdict.reason,
        confidence: verdict.confidence,
      });
    }
  }
  return out;
}
