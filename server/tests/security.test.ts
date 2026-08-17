import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader } from './helpers.js';

const app = createApp();

describe('Security — JWT, RBAC, upload abuse', () => {
  it('rejects missing Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set({ Authorization: 'Bearer not-a-jwt' });
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign(
      { sub: '000000000000000000000000', email: 'evil@example.com', role: 'admin' },
      'wrong-secret-not-the-test-secret',
      { expiresIn: '1h' }
    );
    const res = await request(app).get('/api/v1/auth/me').set(authHeader(forged));
    expect(res.status).toBe(401);
  });

  it('rejects an expired access token', async () => {
    const { userId, email } = await registerAndLogin(app);
    const expired = jwt.sign(
      { sub: userId, email, role: 'farmer' },
      process.env.JWT_ACCESS_SECRET as string,
      { expiresIn: '-10s' }
    );
    const res = await request(app).get('/api/v1/auth/me').set(authHeader(expired));
    expect(res.status).toBe(401);
  });

  it('forbids a farmer from opening the admin dashboard', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set(authHeader(farmer.token));
    expect(res.status).toBe(403);
  });

  it('forbids a farmer from moderating community posts', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/social/posts/000000000000000000000000/moderate')
      .set(authHeader(farmer.token))
      .send({ action: 'hide', reason: 'spam' });
    expect(res.status).toBe(403);
  });

  it('rejects a fake image (wrong magic bytes) on detect', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', Buffer.from('this is not an image'), 'leaf.txt');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid image/i);
  });

  it('rejects detect with no file', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token));
    expect(res.status).toBe(400);
  });
});
