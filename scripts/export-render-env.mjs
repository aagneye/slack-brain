#!/usr/bin/env node
/**
 * Builds a production .env file for Render worker import from your local .env.
 * Output: .env.render (gitignored — never commit it).
 *
 * Usage:
 *   npm run env:render
 *   # Render → Worker → Environment → Add from .env → paste contents of .env.render
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, '.env');
const OUTPUT = path.join(ROOT, '.env.render');

const PRODUCTION_HOST = process.env.VERCEL_PRODUCTION_HOST ?? 'slackbrain.vercel.app';
const PRODUCTION_BASE = `https://${PRODUCTION_HOST}`;

/** Keys the Render worker needs (web-only auth vars excluded). */
const WORKER_KEYS = [
  'NODE_ENV',
  'APP_BASE_URL',
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'SLACK_BOT_TOKEN',
  'SLACK_USER_TOKEN',
  'GITHUB_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OLLAMA_ENABLED',
  'OLLAMA_BASE_URL',
  'OLLAMA_CHAT_MODEL',
  'OLLAMA_EMBED_MODEL',
  'EMBEDDINGS_PROVIDER',
  'WORKER_CONCURRENCY',
  'RETRIEVAL_TIMEOUT_MS',
  'RETRIEVAL_TOP_K_PER_SOURCE',
  'DEDUPE_COSINE_THRESHOLD',
];

function parseEnvFile(content) {
  const vars = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars.set(key, val);
  }
  return vars;
}

if (!fs.existsSync(SOURCE)) {
  console.error('No .env found at repo root.');
  process.exit(1);
}

const vars = parseEnvFile(fs.readFileSync(SOURCE, 'utf8'));

vars.set('NODE_ENV', 'production');
vars.set('APP_BASE_URL', PRODUCTION_BASE);
if (!vars.get('WORKER_CONCURRENCY')) vars.set('WORKER_CONCURRENCY', '4');

if (!vars.get('OPENAI_API_KEY')?.trim() && !vars.get('ANTHROPIC_API_KEY')?.trim()) {
  if (!vars.get('OLLAMA_ENABLED')) vars.set('OLLAMA_ENABLED', 'true');
  if (!vars.get('OLLAMA_CHAT_MODEL')) vars.set('OLLAMA_CHAT_MODEL', 'llama3.2');
  if (!vars.get('OLLAMA_EMBED_MODEL')) vars.set('OLLAMA_EMBED_MODEL', 'nomic-embed-text');
  if (!vars.get('EMBEDDINGS_PROVIDER')) vars.set('EMBEDDINGS_PROVIDER', 'ollama');
}

const header = [
  '# Generated for Render WORKER — DO NOT COMMIT',
  `# Vercel URL: ${PRODUCTION_BASE}`,
  '# Render → Background Worker → Environment → paste below',
  '#',
  '# NOT included (Vercel only): AUTH_SECRET, AUTH_URL, GOOGLE_*, SLACK_SIGNING_SECRET, SLACK_CLIENT_*',
];

const lines = [...header, ''];
for (const key of WORKER_KEYS) {
  if (vars.has(key)) lines.push(`${key}=${vars.get(key) ?? ''}`);
}

fs.writeFileSync(OUTPUT, lines.join('\n') + '\n', 'utf8');

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`APP_BASE_URL=${PRODUCTION_BASE}`);
if (!vars.get('SLACK_USER_TOKEN')?.trim()) {
  console.warn('Warning: SLACK_USER_TOKEN empty — Slack search retrieval will be limited');
}
if (vars.get('OLLAMA_BASE_URL')?.includes('localhost')) {
  console.warn('Warning: OLLAMA_BASE_URL is localhost — Render cannot reach it. Use a remote Ollama host.');
}
