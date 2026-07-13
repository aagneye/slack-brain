import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env found at repo root');
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return [key, val];
    }),
);

const enabled =
  env.OLLAMA_ENABLED === 'true' ||
  !!env.OLLAMA_BASE_URL ||
  (env.NODE_ENV !== 'production' && !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY);

if (!enabled) {
  console.log('Ollama not enabled (set OLLAMA_ENABLED=true or OLLAMA_BASE_URL)');
  process.exit(0);
}

const base = (env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');
const chatModel = env.OLLAMA_CHAT_MODEL ?? 'qwen2.5-coder:7b';
const embedModel = env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text';

console.log('Base URL:', base);
console.log('Chat model:', chatModel);
console.log('Embed model:', embedModel);

try {
  const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    console.error('Status: FAILED — tags endpoint returned', res.status);
    process.exit(1);
  }
  const json = await res.json();
  const names = (json.models ?? []).map((m) => m.name);
  console.log('Installed models:', names.length ? names.join(', ') : '(none)');
  const missing = [chatModel, embedModel].filter((m) => !names.some((n) => n.startsWith(m)));
  if (missing.length) {
    console.warn('Tip: pull missing models:', missing.map((m) => `ollama pull ${m}`).join(' && '));
  }
  console.log('Status: OK — Ollama reachable');
} catch (err) {
  console.error('Status: FAILED');
  console.error('Error:', err.message);
  console.error('Tip: start Ollama locally or set OLLAMA_BASE_URL to your remote host');
  process.exit(1);
}
