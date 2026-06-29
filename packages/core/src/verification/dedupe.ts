import type { RetrievedItem } from '@cpe/shared';
import { cosineSimilarity } from '../ranking/vector.js';

/**
 * Duplicate detection (stage 4a).
 *
 * Clusters near-duplicates by exact content hash and by embedding cosine
 * similarity. Returns one canonical item per cluster, annotated with how many
 * places it was seen and which items it absorbed.
 */

export interface DedupeOptions {
  cosineThreshold?: number; // default 0.92
}

export interface DedupeResult {
  canonical: RetrievedItem[];
  duplicatesRemoved: number;
}

function authorityRank(item: RetrievedItem): number {
  // Prefer more recent, then items that already carry a relevance score.
  const ts = new Date(item.sourceUpdatedAt ?? item.sourceCreatedAt ?? 0).getTime();
  return ts + (item.relevance ?? 0) * 1_000;
}

export function dedupe(items: RetrievedItem[], opts: DedupeOptions = {}): DedupeResult {
  const threshold = opts.cosineThreshold ?? 0.92;
  const clusters: RetrievedItem[][] = [];

  for (const item of items) {
    let placed = false;
    for (const cluster of clusters) {
      const head = cluster[0] as RetrievedItem;
      const sameHash =
        !!item.contentHash && !!head.contentHash && item.contentHash === head.contentHash;
      const hashConflict =
        !!item.contentHash && !!head.contentHash && item.contentHash !== head.contentHash;
      const sameUrl = !hashConflict && !!item.url && item.url === head.url;
      const similar =
        item.embedding && head.embedding
          ? cosineSimilarity(item.embedding, head.embedding) >= threshold
          : false;
      if (sameHash || sameUrl || similar) {
        cluster.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) clusters.push([item]);
  }

  let removed = 0;
  const canonical = clusters.map((cluster) => {
    cluster.sort((a, b) => authorityRank(b) - authorityRank(a));
    const head = { ...(cluster[0] as RetrievedItem) };
    if (cluster.length > 1) {
      removed += cluster.length - 1;
      head.flags = { ...head.flags, seenCount: cluster.length };
    }
    return head;
  });

  return { canonical, duplicatesRemoved: removed };
}
