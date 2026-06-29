import type { RetrievedItem, SourceKind } from '@cpe/shared';
import { cosineSimilarity } from './vector.js';

/**
 * Relevance ranking (stage 3).
 *
 * Hybrid score = w_sem * semantic + w_lex * lexical, then boosted by recency,
 * source authority and entity matches. Pure function of its inputs.
 */

export interface RankOptions {
  taskEmbedding: number[];
  entities: string[];
  now?: number;
  topKPerSource?: number;
  weights?: Partial<RankWeights>;
}

export interface RankWeights {
  semantic: number;
  lexical: number;
  recency: number;
  authority: number;
  entity: number;
}

const DEFAULT_WEIGHTS: RankWeights = {
  semantic: 0.55,
  lexical: 0.2,
  recency: 0.1,
  authority: 0.1,
  entity: 0.05,
};

/** Rough authority prior per source (tunable; later learned from feedback). */
const SOURCE_AUTHORITY: Record<SourceKind, number> = {
  incident: 1.0,
  deploy: 0.9,
  github: 0.85,
  jira: 0.7,
  confluence: 0.65,
  notion: 0.6,
  slack: 0.55,
};

function lexicalOverlap(text: string, entities: string[]): number {
  if (entities.length === 0) return 0;
  const t = text.toLowerCase();
  const hits = entities.filter((e) => t.includes(e.toLowerCase())).length;
  return hits / entities.length;
}

function recencyScore(item: RetrievedItem, now: number): number {
  const ts = item.sourceUpdatedAt ?? item.sourceCreatedAt;
  if (!ts) return 0.3;
  const ageDays = (now - new Date(ts).getTime()) / 86_400_000;
  // 1.0 today, ~0.5 at 14 days, decaying.
  return 1 / (1 + ageDays / 14);
}

export function scoreItem(item: RetrievedItem, opts: RankOptions): number {
  const w = { ...DEFAULT_WEIGHTS, ...opts.weights };
  const now = opts.now ?? Date.now();
  const semantic =
    item.embedding && opts.taskEmbedding.length
      ? Math.max(0, cosineSimilarity(item.embedding, opts.taskEmbedding))
      : 0;
  const text = `${item.title} ${item.body}`;
  const lexical = lexicalOverlap(text, opts.entities);
  const recency = recencyScore(item, now);
  const authority = SOURCE_AUTHORITY[item.source] ?? 0.5;
  const entity = lexical > 0 ? 1 : 0;

  return (
    w.semantic * semantic +
    w.lexical * lexical +
    w.recency * recency +
    w.authority * authority +
    w.entity * entity
  );
}

/** Score, sort, and cap top-K per source. */
export function rankItems(items: RetrievedItem[], opts: RankOptions): RetrievedItem[] {
  const topK = opts.topKPerSource ?? 8;
  const scored = items.map((it) => ({ ...it, relevance: scoreItem(it, opts) }));
  scored.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

  const perSource = new Map<SourceKind, number>();
  const kept: RetrievedItem[] = [];
  for (const it of scored) {
    const n = perSource.get(it.source) ?? 0;
    if (n >= topK) continue;
    perSource.set(it.source, n + 1);
    kept.push(it);
  }
  return kept;
}
