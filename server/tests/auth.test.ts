import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Auth password flow', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('registers, logs in, changes password, refreshes and logs out', async () => {
    const email = `farmer-${Date.now()}@example.com`;
    const password = 'password123';

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, fullName: 'Test Farmer' });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.accessToken).toBeTruthy();
    expect(registerRes.body.data.user.email).toBe(email);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeTruthy();

    const token = loginRes.body.data.accessToken;
    const changeRes = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'password456' });

    expect(changeRes.status).toBe(200);

    const loginOld = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'password456' });
    expect(loginNew.status).toBe(200);

    const refreshToken = loginNew.body.data.refreshToken;
    const refreshed = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshed.body.data.accessToken}`)
      .send({ refreshToken: refreshed.body.data.refreshToken });

    expect(logout.status).toBe(200);

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginNew.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.passwordHash).toBeUndefined();
  });

  it('rejects invalid login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('Health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
