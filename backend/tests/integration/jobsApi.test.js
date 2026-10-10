// backend/tests/integration/jobsApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const connectDB = require('../../config/db');

jest.setTimeout(60000);

describe('Jobs API Integration Tests (Cron)', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should reject GET /api/jobs/forex-revaluation without secret (403 Forbidden)', async () => {
    const res = await request(app).get('/api/jobs/forex-revaluation');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should reject GET /api/jobs/forex-revaluation with invalid secret', async () => {
    const res = await request(app)
      .get('/api/jobs/forex-revaluation')
      .set('x-cron-secret', 'invalid-wrong-secret');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should accept GET /api/jobs/forex-revaluation with valid secret', async () => {
    const validSecret = process.env.CRON_SECRET || 'finstat-cron-default-secret-2026';
    const res = await request(app)
      .get('/api/jobs/forex-revaluation')
      .set('x-cron-secret', validSecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.usersProcessed).toBe('number');
    expect(typeof res.body.holdingsUpdated).toBe('number');
  });
});
