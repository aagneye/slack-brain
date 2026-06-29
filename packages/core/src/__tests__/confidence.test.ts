import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeConfidence } from '../confidence/index.js';
import type { RetrievedItem } from '@cpe/shared';

const now = Date.now();

function item(partial: Partial<RetrievedItem>): RetrievedItem {
  return {
    id: Math.random().toString(36).slice(2),
    source: 'github',
    externalId: 'x',
    type: 'pull_request',
    title: 't',
    body: 'b',
    url: 'http://x',
    sourceUpdatedAt: new Date(now).toISOString(),
    ...partial,
  };
}

test('full coverage and no issues yields a high score', () => {
  const c = computeConfidence({
    items: [item({}), item({})],
    requiredInfo: ['a', 'b'],
    missing: [],
    contradictions: [],
    now,
  });
  assert.ok(c.score >= 70, `expected >=70, got ${c.score}`);
  assert.equal(c.factors.coverage, 1);
});

test('missing requirements reduce the score via gap penalty', () => {
  const high = computeConfidence({
    items: [item({})],
    requiredInfo: ['a', 'b'],
    missing: [],
    contradictions: [],
    now,
  });
  const low = computeConfidence({
    items: [item({})],
    requiredInfo: ['a', 'b'],
    missing: [{ requirement: 'a', reason: 'x' }],
    contradictions: [],
    now,
  });
  assert.ok(low.score < high.score);
});
