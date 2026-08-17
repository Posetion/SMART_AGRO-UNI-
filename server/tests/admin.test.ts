import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader } from './helpers.js';

const app = createApp();

describe('Admin', () => {
  it('returns dashboard KPIs', async () => {
    const admin = await registerAndLogin(app, 'admin');
    const res = await request(app).get('/api/v1/admin/dashboard').set(authHeader(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeGreaterThanOrEqual(1);
    expect(res.body.data.diagnoses).toBeGreaterThanOrEqual(0);
  });

  it('lists users and audit logs', async () => {
    const admin = await registerAndLogin(app, 'admin');
    const users = await request(app).get('/api/v1/admin/users').set(authHeader(admin.token));
    expect(users.status).toBe(200);

    const logs = await request(app).get('/api/v1/admin/audit-logs').set(authHeader(admin.token));
    expect(logs.status).toBe(200);
  });

  it('can change another user role', async () => {
    const admin = await registerAndLogin(app, 'admin');
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .put(`/api/v1/admin/users/${farmer.userId}`)
      .set(authHeader(admin.token))
      .send({ role: 'expert' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('expert');
  });
});
