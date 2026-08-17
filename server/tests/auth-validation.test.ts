import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader, TEST_PASSWORD } from './helpers.js';

const app = createApp();

describe('Auth validation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('rejects a short password on register', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: `short-${Date.now()}@example.com`,
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: TEST_PASSWORD,
    });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate email', async () => {
    const { email } = await registerAndLogin(app);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'Dup' });
    expect(res.status).toBe(409);
  });

  it('rejects garbage refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: 'this-is-not-a-valid-refresh-token-value' });
    expect(res.status).toBe(401);
  });

  it('guest login returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/guest');
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.isGuest).toBe(true);
  });

  it('lets a farmer update their profile', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set(authHeader(token))
      .send({ township: 'Meiktila', fullName: 'U Mg Mg' });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('U Mg Mg');
  });
});
