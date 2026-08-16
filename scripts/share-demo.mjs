/**
 * Share the running Smart Agro app.
 * Phones always scan the SAME QR / URL:
 *   https://smart-agro-ucs.surge.sh
 *
 * Keep the API running on port 5000, then:
 *   node scripts/share-demo.mjs
 *
 * This builds a fast production copy (not the slow Vite dev server)
 * and shares it. Same QR as before.
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(root, 'scripts', 'demo-share.json'), 'utf8'));
const PUBLIC_URL = String(cfg.publicUrl || '').replace(/\/$/, '');
const SURGE_DOMAIN = String(cfg.surgeDomain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const PORT = Number(process.env.SHARE_PORT || 4173);
const TARGET = `http://127.0.0.1:${PORT}`;
const clientDir = join(root, 'client');

function which(cmd) {
  return new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'where' : 'which', [cmd], {
      stdio: 'ignore',
      shell: true,
    });
    child.on('exit', (code) => resolve(code === 0));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function assertLocal() {
  try {
    const res = await fetch(TARGET, { method: 'GET' });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      shell: true,
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
    );
  });
}

async function ensurePreview() {
  if (await assertLocal()) {
    console.log(`Using existing app on ${TARGET}`);
    return null;
  }

  console.log('Building a fast (production) copy of the app…');
  await run('npm', ['--prefix', clientDir, 'run', 'build'], { SMART_AGRO_SHARE: '1' });

  console.log(`Starting preview on ${TARGET}`);
  const child = spawn(
    'npm',
    ['--prefix', clientDir, 'run', 'preview', '--', '--host', '--port', String(PORT)],
    { shell: true, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  child.stdout.on('data', (buf) => process.stdout.write(buf));
  child.stderr.on('data', (buf) => process.stderr.write(buf));

  for (let i = 0; i < 40; i += 1) {
    await sleep(400);
    if (await assertLocal()) return child;
  }
  child.kill('SIGINT');
  throw new Error('Preview server did not start');
}

function writeRedirect(liveUrl) {
  const dir = join(root, 'scripts', 'demo-go');
  mkdirSync(dir, { recursive: true });
  const safe = liveUrl.replace(/"/g, '');
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Smart Agro Community</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: "Segoe UI", Arial, sans-serif; background: #1B4332; color: #fff; text-align: center; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { margin: 0 0 22px; opacity: .9; }
    a.btn { display: inline-block; background: #2E7D32; color: #fff; text-decoration: none;
      font-weight: 700; font-size: 18px; padding: 14px 28px; border-radius: 999px; }
  </style>
</head>
<body>
  <div>
    <h1>Smart Agro</h1>
    <p>Tap the button to open the live app</p>
    <a class="btn" id="go" href="${safe}">Open Smart Agro</a>
  </div>
  <script>
    var url = ${JSON.stringify(safe)};
    document.getElementById('go').href = url;
    setTimeout(function () { location.href = url; }, 200);
  </script>
</body>
</html>
`
  );
}

function deployRedirect() {
  return new Promise((resolve) => {
    if (!SURGE_DOMAIN) {
      resolve(false);
      return;
    }
    console.log(`Updating permanent link ${PUBLIC_URL} …`);
    const child = spawn(
      'npx',
      ['--yes', 'surge', join(root, 'scripts', 'demo-go'), SURGE_DOMAIN],
      { shell: true, stdio: 'inherit' }
    );
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(false);
    }, 90000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
    child.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function spawnLogged(cmd, args) {
  const child = spawn(cmd, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
  return child;
}

function waitForUrl(child, { patterns, readyPattern, failPattern, timeoutMs = 45000 }) {
  return new Promise((resolve, reject) => {
    const rlOut = createInterface({ input: child.stdout });
    const rlErr = createInterface({ input: child.stderr });
    let pendingUrl = '';
    let settled = false;

    const timer = setTimeout(() => {
      fail(new Error('Timed out waiting for a public tunnel URL'));
    }, timeoutMs);

    function succeed(url) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(url);
    }

    function fail(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    }

    function consider(line) {
      const text = String(line);
      process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
      if (settled) return;
      if (failPattern && failPattern.test(text)) {
        fail(new Error(text.trim()));
        return;
      }
      for (const re of patterns) {
        const m = text.match(re);
        const found = m?.[1] || m?.[0];
        if (found && /^https?:\/\//i.test(found)) {
          pendingUrl = found.replace(/\/$/, '');
          if (!readyPattern) succeed(pendingUrl);
          break;
        }
      }
      if (pendingUrl && readyPattern && readyPattern.test(text)) succeed(pendingUrl);
    }

    rlOut.on('line', consider);
    rlErr.on('line', consider);
    child.on('exit', (code) => {
      fail(new Error(`Tunnel process exited (${code ?? 'unknown'})`));
    });
  });
}

async function startCloudflared() {
  const has = await which('cloudflared');
  const cmd = has ? 'cloudflared' : 'npx';
  const args = has
    ? ['tunnel', '--url', TARGET, '--protocol', 'http2', '--edge-ip-version', '4']
    : ['--yes', 'cloudflared', 'tunnel', '--url', TARGET, '--protocol', 'http2', '--edge-ip-version', '4'];
  console.log(`Starting Cloudflare tunnel (http2) → ${TARGET}`);
  const child = spawnLogged(cmd, args);
  const url = await waitForUrl(child, {
    patterns: [/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i],
    readyPattern: /Registered tunnel connection|Connection [a-f0-9-]+ registered/i,
    failPattern: /failed to request quick Tunnel/i,
    timeoutMs: 50000,
  });
  return { child, url };
}

async function startLocaltunnel() {
  console.log(`Starting backup tunnel (localtunnel) → ${TARGET}`);
  const child = spawnLogged('npx', ['--yes', 'localtunnel', '--port', String(PORT)]);
  const url = await waitForUrl(child, {
    patterns: [/https?:\/\/[a-z0-9.-]+\.loca\.lt/i, /your url is:\s+(https?:\/\/\S+)/i],
    timeoutMs: 40000,
  });
  return { child, url };
}

async function openTunnel() {
  let lastErr;
  for (let i = 1; i <= 3; i += 1) {
    try {
      console.log(i === 1 ? '' : `Retrying Cloudflare (${i}/3)…`);
      return await startCloudflared();
    } catch (err) {
      lastErr = err;
      console.log(`Cloudflare attempt ${i} failed: ${err instanceof Error ? err.message : err}`);
      await sleep(2500 * i);
    }
  }
  console.log('Cloudflare is blocked or busy. Trying a backup tunnel…');
  try {
    return await startLocaltunnel();
  } catch (err) {
    throw lastErr || err;
  }
}

console.log(`Use only docs/Smart-Agro-Demo-QR.png → ${PUBLIC_URL}\n`);

let previewChild = null;
try {
  previewChild = await ensurePreview();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  console.error('Keep the API running:  cd server && npm run dev');
  process.exit(1);
}

let tunnel;
try {
  tunnel = await openTunnel();
} catch (err) {
  console.error('\nCould not open a public tunnel.');
  console.error(err instanceof Error ? err.message : err);
  console.error('The QR file stays the same. Try again on a more stable network (or mobile hotspot).');
  process.exit(1);
}

writeRedirect(tunnel.url);
const published = await deployRedirect();
console.log('\n========================================');
console.log('  Smart Agro is public');
console.log(`  Use this QR: docs/Smart-Agro-Demo-QR.png`);
console.log(`  Link:        ${PUBLIC_URL}`);
if (!published) {
  console.log('  Permanent link not updated. Run: npx --yes surge login');
}
console.log('  Leave this window open. Ctrl+C when the demo is over.');
console.log('========================================\n');

function stopAll() {
  try {
    tunnel?.child?.kill('SIGINT');
  } catch {
    /* ignore */
  }
  try {
    previewChild?.kill('SIGINT');
  } catch {
    /* ignore */
  }
}

tunnel.child.on('exit', (code) => {
  console.log('\nTunnel closed. The printed QR stays the same for next time.');
  try {
    previewChild?.kill('SIGINT');
  } catch {
    /* ignore */
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  stopAll();
});
