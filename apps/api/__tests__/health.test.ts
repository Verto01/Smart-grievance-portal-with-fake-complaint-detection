import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp({ clientOrigin: 'http://localhost:3000', logLevel: 'silent' });

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200) {
      console.log('Response body:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('returns 503 when DB is not connected', async () => {
    const res = await request(app).get('/ready');
    if (res.status !== 503) {
      console.log('Ready body:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('not ready');
  });
});

describe('404 handler', () => {
  it('returns structured error for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');
    if (res.status !== 404) {
      console.log('404 body:', JSON.stringify(res.body));
    }
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });
});

describe('error format', () => {
  it('includes requestId in error responses', async () => {
    const res = await request(app).get('/nonexistent');
    expect(typeof res.body.error.requestId).toBe('string');
    expect(res.body.error.requestId.length).toBeGreaterThan(0);
  });
});

describe('POST /health/seed', () => {
  it('does not expose database seeding publicly', async () => {
    const res = await request(app).post('/health/seed');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

