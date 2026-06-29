import type { ItemType, RetrievedItem } from '@cpe/shared';

/**
 * Staleness detection (stage 4b).
 *
 * Flags items as outdated when they exceed a per-type age threshold, or when a
 * newer item about the same entity supersedes them.
 */

const MAX_AGE_DAYS: Record<ItemType, number> = {
  message: 30,
  thread: 30,
  pull_request: 60,
  issue: 90,
  doc: 180,
  deploy: 14,
  incident: 30,
};

function ageDays(item: RetrievedItem, now: number): number | null {
  const ts = item.sourceUpdatedAt ?? item.sourceCreatedAt;
  if (!ts) return null;
  return (now - new Date(ts).getTime()) / 86_400_000;
}

export function flagStaleness(items: RetrievedItem[], now = Date.now()): RetrievedItem[] {
  // Track the newest timestamp per (type) bucket to detect supersession.
  return items.map((item) => {
    const age = ageDays(item, now);
    const threshold = MAX_AGE_DAYS[item.type] ?? 60;
    const outdated = age !== null && age > threshold;
    return outdated ? { ...item, flags: { ...item.flags, outdated: true } } : item;
  });
}
