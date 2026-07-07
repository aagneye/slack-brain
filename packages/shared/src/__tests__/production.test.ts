import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getProductionChecks } from '../production.js';

describe('getProductionChecks worker role', () => {
  it('passes without optional GITHUB_TOKEN and SLACK_USER_TOKEN', () => {
    const checks = getProductionChecks(
      {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/db',
        REDIS_URL: 'redis://localhost:6379',
        SLACK_BOT_TOKEN: 'xoxb-test',
        OLLAMA_ENABLED: 'true',
      },
      undefined,
      { role: 'worker' },
    );
    const failed = checks.filter((c) => !c.ok);
    assert.equal(failed.length, 0);
  });
});
