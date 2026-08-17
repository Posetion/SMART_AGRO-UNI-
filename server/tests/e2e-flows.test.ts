/**
 * SRS §9 mandatory flows — API-level end-to-end (no browser).
 * OTP login in the SRS was replaced by email/password; this suite uses that live auth.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Knowledge } from '../src/models/Knowledge.js';
import { registerAndLogin, authHeader, PNG_1X1, TEST_PASSWORD } from './helpers.js';
import { chatWithAi, detectDisease, predictRisk } from '../src/services/aiClient.service.js';

vi.mock('../src/services/aiClient.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/aiClient.service.js')>();
  return {
    ...actual,
    detectDisease: vi.fn(),
    predictRisk: vi.fn(),
    chatWithAi: vi.fn(),
  };
});

const app = createApp();
const mockDetect = vi.mocked(detectDisease);
const mockPredict = vi.mocked(predictRisk);
const mockChat = vi.mocked(chatWithAi);

describe('SRS mandatory E2E flows', () => {
  beforeEach(() => {
    mockDetect.mockReset();
    mockPredict.mockReset();
    mockChat.mockReset();
    mockPredict.mockResolvedValue({ riskLevel: 'Low', forecastDays: 14, confidence: 0.75 });
    mockChat.mockResolvedValue({ reply: 'ရွက်ညိုပြောက်အတွက် ပိုတက်ရှ် ထည့်ပြီး ပင်ကြွင်း မီးရှို့ပါ။' });
  });

  it('1. Guest views weather + published knowledge', async () => {
    const admin = await registerAndLogin(app, 'admin');
    await Knowledge.create({
      title: 'Guest readable guide',
      category: 'Article',
      content: 'Public rice care.',
      isPublished: true,
      uploadedBy: admin.userId,
    });

    const weather = await request(app)
      .get('/api/v1/weather/forecast')
      .query({ lat: 16.8661, lng: 96.1951 });
    expect(weather.status).toBe(200);

    const knowledge = await request(app).get('/api/v1/knowledge/articles');
    expect(knowledge.status).toBe(200);
    expect(knowledge.body.data.some((a: { title: string }) => a.title === 'Guest readable guide')).toBe(
      true
    );
  });

  it('2. Farmer registers and logs in', async () => {
    const email = `flow2-${Date.now()}@example.com`;
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: TEST_PASSWORD, fullName: 'U Flow' });
    expect(registered.status).toBe(201);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();
  });

  it('3. Farmer uploads a leaf and receives a diagnosis', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Blast',
      severityIndex: 55,
      probabilities: [{ disease: 'Blast', probability: 0.8 }],
      treatmentProtocol: 'Tricyclazole',
      quality: { ok: true, issues: [] },
      confidence: 0.8,
      model: 'test-mock',
    });
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.disease).toBe('Blast');
  });

  it('4. Expert verifies a diagnosis; farmer links it on a social post', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Sheath Blight',
      severityIndex: 44,
      probabilities: [{ disease: 'Sheath Blight', probability: 0.77 }],
      treatmentProtocol: 'Azoxystrobin',
      quality: { ok: true, issues: [] },
      confidence: 0.77,
      model: 'test-mock',
    });
    const farmer = await registerAndLogin(app, 'farmer');
    const expert = await registerAndLogin(app, 'expert');
    const analyzed = await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });
    const diagnosisId = analyzed.body.data._id as string;

    const verified = await request(app)
      .post(`/api/v1/detections/${diagnosisId}/verify`)
      .set(authHeader(expert.token))
      .send({ disease: 'Sheath Blight', expertDrugs: 'Azoxystrobin' });
    expect(verified.body.data.isVerified).toBe(true);

    const post = await request(app)
      .post('/api/v1/social/posts')
      .set(authHeader(farmer.token))
      .field('content', 'Expert confirmed sheath blight on my field')
      .field('diagnosticId', diagnosisId);
    expect(post.status).toBe(201);
    expect(String(post.body.data.diagnosticId)).toBe(diagnosisId);
  });

  it('5. Admin moderates a post', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const admin = await registerAndLogin(app, 'admin');
    const created = await request(app)
      .post('/api/v1/social/posts')
      .set(authHeader(farmer.token))
      .field('content', 'Please remove this test spam');
    const hidden = await request(app)
      .post(`/api/v1/social/posts/${created.body.data._id}/moderate`)
      .set(authHeader(admin.token))
      .send({ action: 'hide', reason: 'test spam' });
    expect(hidden.status).toBe(200);
  });

  it('6. Farmer chatbot round-trip in Burmese', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/chatbot/message')
      .set(authHeader(farmer.token))
      .send({ text: 'ရွက်ညိုပြောက် ဘာလုပ်ရမလဲ' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toMatch(/ရွက်ညိုပြောက်|ပိုတက်ရှ်/);
  });

  it('7. Heatmap filter by disease and date', async () => {
    mockDetect.mockResolvedValue({
      cropType: 'Rice',
      disease: 'Blast',
      severityIndex: 60,
      probabilities: [{ disease: 'Blast', probability: 0.9 }],
      treatmentProtocol: 'ok',
      quality: { ok: true, issues: [] },
      confidence: 0.9,
      model: 'test-mock',
    });
    const farmer = await registerAndLogin(app, 'farmer');
    await request(app)
      .post('/api/v1/detections/analyze')
      .set(authHeader(farmer.token))
      .field('township', 'Meiktila')
      .field('lat', '20.8667')
      .field('lng', '95.8667')
      .attach('image', PNG_1X1, { filename: 'leaf.png', contentType: 'image/png' });

    const filtered = await request(app).post('/api/v1/heatmap/filter').send({
      disease: 'Blast',
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
    });
    expect(filtered.status).toBe(200);
  });
});
