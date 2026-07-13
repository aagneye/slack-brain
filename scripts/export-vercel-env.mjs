#!/usr/bin/env node
/**
 * Builds a production .env file for Vercel import from your local .env.
 * Output: .env.vercel (gitignored — never commit it).
 *
 * Usage:
 *   npm run env:vercel
 *   # Vercel → Project → Settings → Environment Variables → Import .env → upload .env.vercel
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, '.env');
const OUTPUT = path.join(ROOT, '.env.vercel');

/** Production hostname — custom domain on Vercel. */
const PRODUCTION_HOST = process.env.VERCEL_PRODUCTION_HOST ?? 'slackbrain.vercel.app';
const PRODUCTION_BASE = `https://${PRODUCTION_HOST}`;

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

function serializeEnv(vars, headerLines) {
  const keys = [...vars.keys()];
  const lines = [...headerLines, ''];
  for (const key of keys) {
    const val = vars.get(key) ?? '';
    lines.push(`${key}=${val}`);
  }
  return lines.join('\n') + '\n';
}

if (!fs.existsSync(SOURCE)) {
  console.error('No .env found at repo root. Copy .env.example to .env first.');
  process.exit(1);
}

const vars = parseEnvFile(fs.readFileSync(SOURCE, 'utf8'));

// Production overrides
vars.set('NODE_ENV', 'production');
vars.set('APP_BASE_URL', PRODUCTION_BASE);
vars.set('AUTH_URL', PRODUCTION_BASE);

// Ensure auth secret exists for production sessions
if (!vars.get('AUTH_SECRET')?.trim()) {
  console.warn('Warning: AUTH_SECRET is empty — generate one: openssl rand -base64 32');
}

// Ollama defaults when no cloud LLM keys
if (!vars.get('OPENAI_API_KEY')?.trim() && !vars.get('ANTHROPIC_API_KEY')?.trim()) {
  if (!vars.get('OLLAMA_ENABLED')) vars.set('OLLAMA_ENABLED', 'true');
  if (!vars.get('OLLAMA_BASE_URL')) vars.set('OLLAMA_BASE_URL', 'http://localhost:11434');
  if (!vars.get('OLLAMA_CHAT_MODEL')) vars.set('OLLAMA_CHAT_MODEL', 'qwen2.5-coder:7b');
  if (!vars.get('OLLAMA_EMBED_MODEL')) vars.set('OLLAMA_EMBED_MODEL', 'nomic-embed-text');
  if (!vars.get('EMBEDDINGS_PROVIDER')) vars.set('EMBEDDINGS_PROVIDER', 'ollama');
}

const header = [
  '# Generated for Vercel import — DO NOT COMMIT (see .gitignore)',
  `# Host: ${PRODUCTION_HOST}`,
  '# Import: Vercel → Settings → Environment Variables → Import .env',
  '#',
  '# Slack Request URLs (paste into api.slack.com):',
  `#   OAuth redirect:  ${PRODUCTION_BASE}/api/auth/callback/slack`,
  `#   Slash command:   ${PRODUCTION_BASE}/api/slack/commands`,
  `#   Interactivity:   ${PRODUCTION_BASE}/api/slack/interactions`,
  `#   Events:          ${PRODUCTION_BASE}/api/slack/events`,
];

fs.writeFileSync(OUTPUT, serializeEnv(vars, header), 'utf8');

console.log(`Wrote ${path.relative(ROOT, OUTPUT)}`);
console.log(`Production URL: ${PRODUCTION_BASE}`);
console.log('');
console.log('Next steps:');
console.log('  1. Review .env.vercel (fill AUTH_SECRET, SLACK_USER_TOKEN, OLLAMA_BASE_URL if needed)');
console.log('  2. Vercel → Project → Settings → Environment Variables → Import .env');
console.log('  3. Add custom domain creator.tmi.production in Vercel → Domains');
console.log('  4. Update Slack app Request URLs to the URLs printed above');
