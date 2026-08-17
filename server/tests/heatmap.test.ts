import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Diagnosis } from '../src/models/Diagnosis.js';
import { DiseaseLocation } from '../src/models/DiseaseLocation.js';
import { registerAndLogin, authHeader } from './helpers.js';

const app = createApp();

describe('Outbreak heatmap', () => {
  it('returns GeoJSON-style data and accepts disease + day filters', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const diagnosis = await Diagnosis.create({
      userId: farmer.userId,
      imageUrl: '/api/v1/files/test',
      cropType: 'Rice',
      disease: 'Blast',
      severityIndex: 70,
      probabilities: [{ disease: 'Blast', probability: 0.9 }],
      location: { type: 'Point', coordinates: [95.8667, 20.8667] },
      treatmentProtocol: 'Spray',
      isVerified: false,
    });
    await DiseaseLocation.create({
      diagnosticId: diagnosis._id,
      location: { type: 'Point', coordinates: [95.8667, 20.8667] },
      township: 'Meiktila',
      disease: 'Blast',
      severity: 70,
      timestamp: new Date(),
    });

    const open = await request(app).get('/api/v1/heatmap/data');
    expect(open.status).toBe(200);

    const filtered = await request(app).post('/api/v1/heatmap/filter').send({
      disease: 'Blast',
      from: new Date(Date.now() - 86400000).toISOString(),
      to: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(filtered.status).toBe(200);

    const byDay = await request(app).post('/api/v1/heatmap/filter').send({
      disease: 'Blast',
      day: new Date().toISOString().slice(0, 10),
    });
    expect(byDay.status).toBe(200);
  });

  it('restricts statistics to admins', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const admin = await registerAndLogin(app, 'admin');

    const denied = await request(app)
      .get('/api/v1/heatmap/statistics')
      .set(authHeader(farmer.token));
    expect(denied.status).toBe(403);

    const ok = await request(app)
      .get('/api/v1/heatmap/statistics')
      .set(authHeader(admin.token));
    expect(ok.status).toBe(200);
    expect(ok.body.data.total).toBeGreaterThanOrEqual(0);
  });
});
