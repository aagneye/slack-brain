#!/usr/bin/env node
/**
 * Pre-deploy smoke checks — run locally before Render/Vercel deploy.
 * Usage: npm run smoke:prod
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const envPath = path.join(ROOT, '.env');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.trim().startsWith('#') && l.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

const env = { ...loadEnvFile(), ...process.env };
let failed = 0;

function check(name, ok, detail) {
  const icon = ok ? 'OK' : 'FAIL';
  console.log(`${icon.padEnd(5)} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed++;
}

console.log('Slack Brain — production smoke checks\n');

// Worker-critical
check('DATABASE_URL', !!env.DATABASE_URL);
check('REDIS_URL', !!env.REDIS_URL);
check('SLACK_BOT_TOKEN', !!env.SLACK_BOT_TOKEN);
check(
  'LLM provider',
  !!(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY || env.OLLAMA_ENABLED === 'true' || env.OLLAMA_BASE_URL),
);
check('APP_BASE_URL', !!env.APP_BASE_URL, env.APP_BASE_URL);

// Optional but recommended
check('GITHUB_TOKEN', true, env.GITHUB_TOKEN ? 'set' : 'optional — GitHub disabled');
check('SLACK_USER_TOKEN', true, env.SLACK_USER_TOKEN ? 'set' : 'optional — Slack search fallback');
check(
  'OLLAMA_BASE_URL',
  !env.OLLAMA_BASE_URL?.includes('localhost') || env.NODE_ENV !== 'production',
  env.OLLAMA_BASE_URL?.includes('localhost')
    ? 'localhost will not work on Render — use remote host'
    : env.OLLAMA_BASE_URL ?? 'not set',
);

// Web-critical (Vercel)
check('AUTH_SECRET', !!env.AUTH_SECRET, env.AUTH_SECRET ? 'set' : 'required on Vercel');
check('SLACK_SIGNING_SECRET', !!env.SLACK_SIGNING_SECRET);

console.log('');
if (failed > 0) {
  console.error(`${failed} required check(s) failed. Fix .env before deploy.`);
  process.exit(1);
}
console.log('All required checks passed. Optional warnings above are OK for hackathon demo.');
