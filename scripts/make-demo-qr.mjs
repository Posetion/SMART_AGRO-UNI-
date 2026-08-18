/**
 * Writes the one permanent project QR (never a trycloudflare URL).
 * Phones always scan docs/Smart-Agro-Demo-QR.png → https://smart-agro-ucs.surge.sh
 *   node scripts/make-demo-qr.mjs
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'scripts', 'demo-share.json'), 'utf8'));
const url = String(cfg.publicUrl || '').replace(/\/$/, '');
if (!url) {
  console.error('scripts/demo-share.json is missing publicUrl');
  process.exit(1);
}

const docs = join(root, 'docs');
mkdirSync(docs, { recursive: true });
const pngPath = join(docs, 'Smart-Agro-Demo-QR.png');

await new Promise((resolve, reject) => {
  const child = spawn('npx', ['--yes', 'qrcode', '-o', pngPath, '-w', '1024', url], {
    shell: true,
    stdio: 'inherit',
  });
  child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`qrcode exited ${code}`))));
});

console.log(`One QR: ${pngPath}`);
console.log(`URL:    ${url}`);
