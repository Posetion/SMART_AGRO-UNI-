import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { registerAndLogin, authHeader } from './helpers.js';

const app = createApp();

describe('Community social', () => {
  it('creates a post, comments, and likes', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const created = await request(app)
      .post('/api/v1/social/posts')
      .set(authHeader(farmer.token))
      .field('content', 'Blast on my rice in Meiktila');
    expect(created.status).toBe(201);
    const postId = created.body.data._id as string;

    const comment = await request(app)
      .post(`/api/v1/social/posts/${postId}/comments`)
      .set(authHeader(farmer.token))
      .send({ content: 'Try Tricyclazole at label rate' });
    expect(comment.status).toBe(201);

    const liked = await request(app)
      .post(`/api/v1/social/posts/${postId}/like`)
      .set(authHeader(farmer.token));
    expect(liked.status).toBe(200);

    const list = await request(app).get('/api/v1/social/posts').set(authHeader(farmer.token));
    expect(list.status).toBe(200);
    expect(list.body.data.some((p: { _id: string }) => p._id === postId)).toBe(true);
  });

  it('lets an admin hide a post', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const admin = await registerAndLogin(app, 'admin');
    const created = await request(app)
      .post('/api/v1/social/posts')
      .set(authHeader(farmer.token))
      .field('content', 'Spam link buy fake pesticide');
    const postId = created.body.data._id as string;

    const hidden = await request(app)
      .post(`/api/v1/social/posts/${postId}/moderate`)
      .set(authHeader(admin.token))
      .send({ action: 'hide', reason: 'spam' });
    expect(hidden.status).toBe(200);

    const list = await request(app).get('/api/v1/social/posts').set(authHeader(farmer.token));
    expect(list.body.data.some((p: { _id: string }) => p._id === postId)).toBe(false);
  });

  it('rejects an empty post', async () => {
    const farmer = await registerAndLogin(app, 'farmer');
    const res = await request(app)
      .post('/api/v1/social/posts')
      .set(authHeader(farmer.token))
      .field('content', '');
    expect(res.status).toBe(400);
  });
});
