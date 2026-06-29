import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupe } from '../verification/dedupe.js';
import type { RetrievedItem } from '@cpe/shared';

function item(partial: Partial<RetrievedItem>): RetrievedItem {
  return {
    id: Math.random().toString(36).slice(2),
    source: 'slack',
    externalId: 'x',
    type: 'message',
    title: 't',
    body: 'b',
    url: 'http://x',
    ...partial,
  };
}

test('collapses items sharing a content hash', () => {
  const res = dedupe([
    item({ contentHash: 'same' }),
    item({ contentHash: 'same' }),
    item({ contentHash: 'other' }),
  ]);
  assert.equal(res.canonical.length, 2);
  assert.equal(res.duplicatesRemoved, 1);
});

test('annotates canonical item with seenCount', () => {
  const res = dedupe([item({ url: 'http://dup' }), item({ url: 'http://dup' })]);
  assert.equal(res.canonical.length, 1);
  assert.equal(res.canonical[0]?.flags?.seenCount, 2);
});
