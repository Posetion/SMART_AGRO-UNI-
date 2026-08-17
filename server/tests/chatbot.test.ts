import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader } from './helpers.js';
import { chatWithAi } from '../src/services/aiClient.service.js';

vi.mock('../src/services/aiClient.service.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/aiClient.service.js')>();
  return {
    ...actual,
    chatWithAi: vi.fn(),
  };
});

const app = createApp();
const mockChat = vi.mocked(chatWithAi);

describe('BaGyi Pyoe chatbot', () => {
  beforeEach(() => {
    mockChat.mockReset();
    mockChat.mockResolvedValue({
      reply: 'မင်္ဂလာပါ။ နှံဖြတ်ပိုး ကျပါက ညအချိန် စစ်ဆေးပြီး လိုအပ်မှ ဆေးဖျန်းပါ။',
    });
  });

  it('requires login', async () => {
    const res = await request(app).post('/api/v1/chatbot/message').send({ text: 'hello' });
    expect(res.status).toBe(401);
  });

  it('returns a Myanmar reply for a farmer question', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/chatbot/message')
      .set(authHeader(farmer.token))
      .send({ text: 'စပါးနှံဖြတ်ပိုး ဘယ်လို ကုသမလဲ' });
    expect(res.status).toBe(200);
    expect(res.body.data.reply || res.body.data.session?.messages?.at(-1)?.text).toBeTruthy();
    expect(String(JSON.stringify(res.body))).toMatch(/နှံဖြတ်ပိုး|မင်္ဂလာပါ/);
  });

  it('rejects an empty message', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/chatbot/message')
      .set(authHeader(farmer.token))
      .send({ text: '' });
    expect(res.status).toBe(400);
  });
});
