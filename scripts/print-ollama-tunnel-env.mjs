#!/usr/bin/env node
/**
 * Prints the Production env vars to paste into Vercel + Render for a local
 * Ollama tunnel (ngrok or Cloudflare). Does not start the tunnel itself.
 *
 * Usage:
 *   node scripts/print-ollama-tunnel-env.mjs https://YOUR-TUNNEL-URL
 */
const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!base.startsWith('http')) {
  console.error('Usage: node scripts/print-ollama-tunnel-env.mjs https://YOUR-TUNNEL-URL');
  process.exit(1);
}

const chat = process.env.OLLAMA_CHAT_MODEL ?? 'qwen2.5-coder:7b';
const embed = process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';

const lines = [
  'OLLAMA_ENABLED=true',
  `OLLAMA_BASE_URL=${base}`,
  `OLLAMA_CHAT_MODEL=${chat}`,
  `OLLAMA_EMBED_MODEL=${embed}`,
  'EMBEDDINGS_PROVIDER=ollama',
];

console.log('# Paste on Vercel AND Render (Production), then redeploy:\n');
console.log(lines.join('\n'));
console.log('\n# Quick checks:');
console.log(`curl ${base}/api/tags`);
console.log('curl https://slackbrain.vercel.app/api/health');
console.log('\n# Slack uses the same worker LLM — no Slack app API setting to change.');
console.log('# Just keep this tunnel + Ollama running, then /slackbrain in a channel.');
