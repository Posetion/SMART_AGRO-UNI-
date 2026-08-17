import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader, PNG_1X1 } from './helpers.js';
import { detectDisease, predictRisk } from '../src/services/aiClient.service.js';

vi.mock('../src/services/aiClient.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/aiClient.service.js')>();
  return {
    ...actual,
    detectDisease: vi.fn(),
    predictRisk: vi.fn(),
  };
});

const app = createApp();

const mockDetect = vi.mocked(detectDisease);
const mockPredict = vi.mocked(predictRisk);

describe('Disease detection', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockPredict.mockReset();
    mockPredict.mockResolvedValue({ riskLevel: 'Medium', forecastDays: 14, confidence: 0.8 });
  });

  it('analyzes a leaf image and stores history', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Blast',
      diseaseMy: 'စပါးဂုတ်ကျိုးရောဂါ',
      severityIndex: 62,
      probabilities: [{ disease: 'Blast', probability: 0.86 }],
      treatmentProtocol: 'Tricyclazole ကို တံဆိပ်အတိုင်း ဖျန်းပါ။',
      quality: { ok: true, issues: [] },
      confidence: 0.86,
      model: 'test-mock',
    });

    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .field('lat', '20.8667')
      .field('lng', '95.8667')
      .field('township', 'Meiktila')
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.disease).toBe('Blast');
    expect(res.body.data.cropType).toBe('Rice');
    expect(res.body.data.treatmentProtocol).toBeTruthy();

    const history = await request(app)
      .get('/api/v1/detections/history')
      .set(authHeader(farmer.token));
    expect(history.status).toBe(200);
    expect(history.body.data.length).toBeGreaterThan(0);
  });

  it('rejects a non-crop image', async () => {
    mockDetect.mockResolvedValue({
      cropType: '',
      disease: 'Healthy',
      severityIndex: 0,
      probabilities: [{ disease: 'Healthy', probability: 1 }],
      treatmentProtocol: '',
      quality: { ok: false, issues: ['not_leaf_like'] },
      confidence: 0,
      model: 'test-mock',
    });

    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', PNG_1X1, { filename: 'wall.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('lets an expert verify a diagnosis', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Brown Spot',
      severityIndex: 40,
      probabilities: [{ disease: 'Brown Spot', probability: 0.7 }],
      treatmentProtocol: 'Propiconazole',
      quality: { ok: true, issues: [] },
      confidence: 0.7,
      model: 'test-mock',
    });

    const farmer = await registerAndLogin(app, 'farmer');
    const expert = await registerAndLogin(app, 'expert');

    const analyzed = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });
    const id = analyzed.body.data._id as string;

    await request(app)
      .post(`/api/v1/detections/${id}/request-review`)
      .set(authHeader(farmer.token));

    const verified = await request(app)
      .post(`/api/v1/detections/${id}/verify`)
      .set(authHeader(expert.token))
      .send({
        disease: 'Brown Spot',
        expertDrugs: 'Propiconazole',
        expertSuggestion: 'Burn residue after harvest.',
      });
    expect(verified.status).toBe(200);
    expect(verified.body.data.isVerified).toBe(true);
  });

  it('forbids a farmer from verifying', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Blast',
      severityIndex: 50,
      probabilities: [{ disease: 'Blast', probability: 0.9 }],
      treatmentProtocol: 'ok',
      quality: { ok: true, issues: [] },
      confidence: 0.9,
      model: 'test-mock',
    });
    const farmer = await registerAndLogin(app, 'farmer');
    const analyzed = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });

    const res = await request(app)
      .post(`/api/v1/detections/${analyzed.body.data._id}/verify`)
      .set(authHeader(farmer.token))
      .send({ disease: 'Blast' });
    expect(res.status).toBe(403);
  });
});
