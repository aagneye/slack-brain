import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertSlackSearchToken, slackTokenRole } from '../slack-tokens.js';

test('identifies bot vs user token prefixes', () => {
  assert.equal(slackTokenRole('xoxb-123'), 'bot');
  assert.equal(slackTokenRole('xoxp-456'), 'user_search');
});

test('rejects bot token for slack search', () => {
  assert.throws(() => assertSlackSearchToken('xoxb-bot-token'), /cannot be used for Slack search/);
});

test('accepts user token for slack search', () => {
  assert.doesNotThrow(() => assertSlackSearchToken('xoxp-user-token'));
});
