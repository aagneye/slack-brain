import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(ROOT, '.env');
const dest = path.join(ROOT, 'apps/web/.env.local');

if (!fs.existsSync(src)) {
  console.error('sync-web-env: root .env not found — copy .env.example to .env first');
  process.exit(1);
}

const content = fs.readFileSync(src, 'utf8');
fs.writeFileSync(dest, content, 'utf8');
console.log('sync-web-env: copied .env → apps/web/.env.local');
