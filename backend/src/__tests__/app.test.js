import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Express App Integration', () => {
  it('GET / should return 200 and healthy status message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      message: 'Savings Helper API is running',
    });
  });

  it('GET /non-existent-route should return 404', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toBe(404);
  });
});
