/**
 * Smoke-test all API routes against a running server.
 * Usage: npx tsx scripts/test-all-routes.ts
 */
import { connectDb, disconnectDb } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { issueRefreshToken, signAccessToken } from '../src/services/token.service.js';
import type { Role } from '../src/config/constants.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Prefer 127.0.0.1 on Windows — `localhost` can hit IPv6 (::1) and ETIMEDOUT
const BASE = process.env.API_BASE || 'http://127.0.0.1:5000/api/v1';
const __dirname = dirname(fileURLToPath(import.meta.url));

type Result = {
  method: string;
  path: string;
  status: number;
  ok: boolean;
  note?: string;
};

const results: Result[] = [];

async function req(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    token?: string;
    formData?: FormData;
    expectOk?: boolean;
  } = {}
): Promise<{ status: number; json: any; ok: boolean }> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  let json: any = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }

  const expectOk = opts.expectOk !== false;
  const ok = expectOk ? res.status >= 200 && res.status < 300 && json?.success !== false : true;

  results.push({
    method,
    path,
    status: res.status,
    ok: expectOk ? ok : res.status < 500,
    note: !ok ? json?.message || JSON.stringify(json)?.slice(0, 120) : undefined,
  });

  return { status: res.status, json, ok };
}

function png1x1(): Buffer {
  // Minimal valid 1x1 PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
}

/** Mint JWTs in-process — avoids OTP rate limit (5/min) when re-running smoke tests. */
async function ensureAuth(email: string, role: Role) {
  const user = await User.findOneAndUpdate(
    { email },
    { email, role, isVerified: true, isActive: true, fullName: role },
    { upsert: true, new: true }
  );

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role,
  });
  const refreshToken = await issueRefreshToken(String(user._id), {
    userAgent: 'route-test',
    ip: '127.0.0.1',
  });

  return {
    accessToken,
    refreshToken,
    userId: String(user._id),
  };
}

/** Hit password auth routes once with a unique email (rate-limit safe). */
async function exercisePasswordRoutesOnce() {
  const email = `auth-smoke-${Date.now()}@example.com`;
  const password = 'password123';
  await req('POST', '/auth/register', {
    body: { email, password, fullName: 'Smoke Tester' },
  });
  await req('POST', '/auth/login', { body: { email, password } });
}

async function assertServerUp() {
  try {
    const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`health returned ${res.status}`);
  } catch (err) {
    console.error(`\nAPI not reachable at ${BASE}`);
    console.error('Start the server first:  npm run dev');
    console.error(String(err));
    process.exit(1);
  }
}

async function main() {
  console.log(`Testing ${BASE}\n`);
  await assertServerUp();
  await connectDb();

  // --- Public / health ---
  await req('GET', '/health');

  // --- Auth (OTP once; other users get minted JWTs to avoid 5/min OTP rate limit) ---
  await exercisePasswordRoutesOnce();

  const farmer = await ensureAuth('route-test-farmer@example.com', 'farmer');

  await req('POST', '/auth/refresh-token', {
    body: { refreshToken: farmer.refreshToken },
  }).then(async (r) => {
    if (r.json?.data?.refreshToken) {
      farmer.refreshToken = r.json.data.refreshToken;
      farmer.accessToken = r.json.data.accessToken;
    }
  });

  await req('GET', '/auth/me', { token: farmer.accessToken });

  // --- Weather ---
  await req('GET', '/weather/forecast?lat=16.8661&lng=96.1951');
  await req('GET', '/weather/current?lat=16.8661&lng=96.1951');
  await req('GET', '/weather/alerts?lat=16.8661&lng=96.1951');
  await req('GET', '/weather/township/Yangon');

  // --- Knowledge public ---
  const knowledgeList = await req('GET', '/knowledge/articles');
  await req('GET', '/knowledge/categories');
  await req('GET', '/knowledge/search?q=Rice');

  let articleId: string | undefined = knowledgeList.json?.data?.[0]?._id;

  // --- Heatmap public ---
  await req('GET', '/heatmap/data');
  await req('GET', '/heatmap/township');
  await req('POST', '/heatmap/filter', { body: { disease: 'Blast' } });

  // --- Admin + Expert auth ---
  const admin = await ensureAuth('admin@smartagro.local', 'admin');
  const expert = await ensureAuth('expert@smartagro.local', 'expert');

  // --- Knowledge admin ---
  const created = await req('POST', '/knowledge/articles', {
    token: admin.accessToken,
    body: {
      title: 'Route Test Article',
      category: 'Article',
      description: 'Created by route test',
      content: 'Test content about rice blast.',
      tags: ['test', 'rice'],
      isPublished: true,
      author: 'Tester',
    },
  });
  articleId = created.json?.data?._id || articleId;

  if (articleId) {
    await req('GET', `/knowledge/articles/${articleId}`);
    await req('PUT', `/knowledge/articles/${articleId}`, {
      token: admin.accessToken,
      body: { description: 'Updated by route test', changeNote: 'route test' },
    });
  }

  // --- Social ---
  const post = await req('POST', '/social/posts', {
    token: farmer.accessToken,
    body: { content: 'Hello from route test feed' },
  });
  const postId = post.json?.data?._id as string;

  await req('GET', '/social/posts', { token: farmer.accessToken });
  if (postId) {
    await req('GET', `/social/posts/${postId}`, { token: farmer.accessToken });
    await req('PUT', `/social/posts/${postId}`, {
      token: farmer.accessToken,
      body: { content: 'Updated post content' },
    });
    await req('POST', `/social/posts/${postId}/like`, { token: farmer.accessToken });
    const comment = await req('POST', `/social/posts/${postId}/comments`, {
      token: farmer.accessToken,
      body: { content: 'First comment' },
    });
    const commentId = comment.json?.data?.comments?.slice(-1)?.[0]?._id as string;
    if (commentId) {
      await req('POST', `/social/posts/${postId}/comments/${commentId}/replies`, {
        token: farmer.accessToken,
        body: { content: 'Nested reply' },
      });
    }
    await req('POST', `/social/posts/${postId}/moderate`, {
      token: admin.accessToken,
      body: { action: 'hide', reason: 'route test' },
    });
    await req('POST', `/social/posts/${postId}/moderate`, {
      token: admin.accessToken,
      body: { action: 'restore', reason: 'route test restore' },
    });
  }

  // --- Detections ---
  const form = new FormData();
  form.append('image', new Blob([png1x1()], { type: 'image/png' }), 'leaf.png');
  form.append('lat', '16.8661');
  form.append('lng', '96.1951');
  form.append('township', 'Yangon');

  const detection = await req('POST', '/detections/analyze', {
    token: farmer.accessToken,
    formData: form,
  });
  const diagnosisId = detection.json?.data?._id as string;

  await req('POST', '/detections/predict', {
    token: farmer.accessToken,
    body: { cropType: 'Rice', disease: 'Blast', humidity: 80, temperature: 30, rainfall: 5 },
  });
  await req('GET', '/detections/history', { token: farmer.accessToken });

  if (diagnosisId) {
    await req('GET', `/detections/${diagnosisId}`, { token: farmer.accessToken });
    await req('PUT', `/detections/${diagnosisId}`, {
      token: expert.accessToken,
      body: { severityIndex: 55 },
    });
    await req('POST', `/detections/${diagnosisId}/verify`, {
      token: expert.accessToken,
    });

    // Link verified diagnosis on a new post
    await req('POST', '/social/posts', {
      token: farmer.accessToken,
      body: {
        content: 'Post with verified diagnosis',
        diagnosticId: diagnosisId,
      },
    });
  }

  // --- Chatbot ---
  const session = await req('POST', '/chatbot/session', { token: farmer.accessToken });
  const sessionId = session.json?.data?.sessionId as string;
  await req('POST', '/chatbot/message', {
    token: farmer.accessToken,
    body: { text: 'ဆန် ရောဂါ အကြံပေးပါ', sessionId },
  });
  await req('GET', '/chatbot/history', { token: farmer.accessToken });
  if (sessionId) {
    await req('GET', `/chatbot/session/${sessionId}`, { token: farmer.accessToken });
  }

  // --- Admin ---
  await req('GET', '/admin/dashboard', { token: admin.accessToken });
  await req('GET', '/admin/users', { token: admin.accessToken });
  await req('GET', '/admin/audit-logs', { token: admin.accessToken });
  await req('GET', '/heatmap/statistics', { token: admin.accessToken });
  await req('POST', '/admin/backup', { token: admin.accessToken });

  if (farmer.userId) {
    await req('PUT', `/admin/users/${farmer.userId}`, {
      token: admin.accessToken,
      body: { role: 'farmer' },
    });
  }

  // --- Files (from diagnosis imageUrl if present) ---
  const imageUrl = detection.json?.data?.imageUrl as string | undefined;
  if (imageUrl?.includes('/files/')) {
    const fileId = imageUrl.split('/files/')[1];
    await req('GET', `/files/${fileId}`);
  } else {
    results.push({
      method: 'GET',
      path: '/files/:id',
      status: 0,
      ok: false,
      note: 'Skipped — no uploaded file id',
    });
  }

  // --- Logout (last) ---
  await req('POST', '/auth/logout', {
    token: farmer.accessToken,
    body: { refreshToken: farmer.refreshToken },
  });

  // Cleanup optional knowledge article delete
  if (articleId && created.json?.data?._id) {
    await req('DELETE', `/knowledge/articles/${articleId}`, {
      token: admin.accessToken,
    });
  }

  // Delete social post
  if (postId) {
    await req('DELETE', `/social/posts/${postId}`, {
      token: farmer.accessToken,
      expectOk: false, // may already be moderated/deleted
    });
  }

  await disconnectDb();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log('METHOD  STATUS  OK   PATH');
  console.log('------  ------  ---  ----');
  for (const r of results) {
    const mark = r.ok ? 'PASS' : 'FAIL';
    console.log(
      `${r.method.padEnd(6)}  ${String(r.status).padEnd(6)}  ${mark}  ${r.path}${r.note ? '  → ' + r.note : ''}`
    );
  }

  console.log(`\n${passed}/${results.length} passed`);
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) {
      console.log(`- ${f.method} ${f.path} [${f.status}] ${f.note || ''}`);
    }
  }

  const reportPath = join(__dirname, 'route-test-report.json');
  writeFileSync(reportPath, JSON.stringify({ base: BASE, passed, total: results.length, results }, null, 2));
  console.log(`\nReport: ${reportPath}`);

  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
