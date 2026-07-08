#!/usr/bin/env node
/**
 * Verify local OAuth env + optional live check against http://localhost:3000
 * Usage: npm run check:local-auth
 *        npm run check:local-auth -- --live
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = process.argv.includes('--live');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.trim().startsWith('#') && l.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        const key = line.slice(0, i).trim();
        let val = line.slice(i + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        return [key, val];
      }),
  );
}

const env = { ...loadEnvFile(path.join(ROOT, '.env')), ...process.env };
let failed = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'OK   ' : 'FAIL '}${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

console.log('Local auth check\n');

check('root .env exists', fs.existsSync(path.join(ROOT, '.env')));
check('AUTH_SECRET', !!env.AUTH_SECRET);
check('AUTH_URL', !!env.AUTH_URL, env.AUTH_URL ?? 'missing');
check('GOOGLE_CLIENT_ID', !!env.GOOGLE_CLIENT_ID);
check('GOOGLE_CLIENT_SECRET', !!env.GOOGLE_CLIENT_SECRET);
check('SLACK_CLIENT_ID', !!env.SLACK_CLIENT_ID);
check('SLACK_CLIENT_SECRET', !!env.SLACK_CLIENT_SECRET);

const base = (env.AUTH_URL ?? env.APP_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
console.log(`\nGoogle OAuth redirect URI (add in Google Cloud Console):\n  ${base}/api/auth/callback/google\n`);

const sync = spawnSync(process.execPath, [path.join(ROOT, 'scripts/sync-web-env.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (sync.status !== 0) failed++;

check('apps/web/.env.local synced', fs.existsSync(path.join(ROOT, 'apps/web/.env.local')));

if (live) {
  try {
    const res = await fetch(`${base}/api/auth/status`);
    const body = await res.json();
    check('/api/auth/status', res.ok);
    check('providers.google', !!body.providers?.google);
    check('providers.slack', !!body.providers?.slack);
    console.log('\nLive status:', JSON.stringify(body, null, 2));
  } catch (err) {
    check('/api/auth/status reachable', false, 'run npm run dev first');
    console.error(String(err));
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nLocal auth ready. Restart npm run dev if it was already running.');
