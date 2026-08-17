import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Township } from '../src/models/Township.js';

const app = createApp();

describe('Weather', () => {
  it('returns a 7-day forecast for GPS coordinates', async () => {
    const res = await request(app)
      .get('/api/v1/weather/forecast')
      .query({ lat: 20.8667, lng: 95.8667 });
    expect(res.status).toBe(200);
    expect(res.body.data.daily?.length).toBeGreaterThan(0);
    expect(res.body.data.summary).toBeTruthy();
  });

  it('returns current conditions, alerts, and crop tips', async () => {
    const current = await request(app)
      .get('/api/v1/weather/current')
      .query({ lat: 16.8661, lng: 96.1951 });
    expect(current.status).toBe(200);

    const alerts = await request(app)
      .get('/api/v1/weather/alerts')
      .query({ lat: 16.8661, lng: 96.1951 });
    expect(alerts.status).toBe(200);

    const recs = await request(app)
      .get('/api/v1/weather/recommendations')
      .query({ lat: 16.8661, lng: 96.1951 });
    expect(recs.status).toBe(200);
    expect(recs.body.data.recommendations).toBeTruthy();
  });

  it('rejects invalid coordinates', async () => {
    const res = await request(app).get('/api/v1/weather/forecast').query({ lat: 999, lng: 0 });
    expect(res.status).toBe(400);
  });

  it('looks up a seeded township', async () => {
    await Township.create({
      name: 'Meiktila',
      nameEn: 'Meiktila',
      nameMy: 'မိတ္ထီလာ',
      region: 'Mandalay',
      coordinates: { type: 'Point', coordinates: [95.8667, 20.8667] },
      isActive: true,
    });
    const res = await request(app).get('/api/v1/weather/township/Meiktila');
    expect(res.status).toBe(200);
    expect(res.body.data.township?.nameEn || res.body.data.nameEn).toMatch(/Meiktila/i);
  });
});
