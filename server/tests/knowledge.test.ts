import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Knowledge } from '../src/models/Knowledge.js';
import { registerAndLogin, authHeader } from './helpers.js';

const app = createApp();

describe('Knowledge center', () => {
  it('lists published articles to guests', async () => {
    const admin = await registerAndLogin(app, 'admin');
    await Knowledge.create({
      title: 'Rice blast field guide',
      category: 'Article',
      description: 'How to spot blast',
      content: 'Spindle spots on leaves.',
      isPublished: true,
      uploadedBy: admin.userId,
    });
    await Knowledge.create({
      title: 'Draft only',
      category: 'Article',
      content: 'secret',
      isPublished: false,
      uploadedBy: admin.userId,
    });

    const res = await request(app).get('/api/v1/knowledge/articles');
    expect(res.status).toBe(200);
    const titles = (res.body.data as Array<{ title: string }>).map((a) => a.title);
    expect(titles).toContain('Rice blast field guide');
    expect(titles).not.toContain('Draft only');
  });

  it('returns knowledge categories', async () => {
    const res = await request(app).get('/api/v1/knowledge/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(['Book', 'Article', 'Journal']);
  });

  it('searches published articles', async () => {
    const admin = await registerAndLogin(app, 'admin');
    await Knowledge.create({
      title: 'Onion thrips control',
      category: 'Article',
      description: 'Blue traps',
      isPublished: true,
      uploadedBy: admin.userId,
    });
    const res = await request(app).get('/api/v1/knowledge/search').query({ q: 'thrips' });
    expect(res.status).toBe(200);
    expect(res.body.data.some((a: { title: string }) => /thrips/i.test(a.title))).toBe(true);
  });

  it('lets an admin create an article and forbids a farmer', async () => {
    const admin = await registerAndLogin(app, 'admin');
    const farmer = await registerAndLogin(app, 'farmer');

    const created = await request(app)
      .post('/api/v1/knowledge/articles')
      .set(authHeader(admin.token))
      .send({
        title: 'Meiktila rice notes',
        category: 'Article',
        content: 'Scout weekly.',
        isPublished: true,
      });
    expect(created.status).toBe(201);

    const denied = await request(app)
      .post('/api/v1/knowledge/articles')
      .set(authHeader(farmer.token))
      .send({
        title: 'Hacker article',
        category: 'Article',
        content: 'nope',
        isPublished: true,
      });
    expect(denied.status).toBe(403);
  });
});
