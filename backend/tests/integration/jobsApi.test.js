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

  it('should reject GET /api/jobs/forex-revaluation without secret (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/jobs/forex-revaluation');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject GET /api/jobs/forex-revaluation with invalid secret', async () => {
    const res = await request(app)
      .get('/api/jobs/forex-revaluation')
      .set('x-cron-secret', 'invalid-wrong-secret');
    expect(res.status).toBe(401);
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

  it('should reject GET /api/jobs/daily-maintenance without secret (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/jobs/daily-maintenance');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject GET /api/jobs/daily-maintenance with invalid secret', async () => {
    const res = await request(app)
      .get('/api/jobs/daily-maintenance')
      .set('x-cron-secret', 'invalid-wrong-secret');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should accept GET /api/jobs/daily-maintenance with valid secret', async () => {
    const validSecret = process.env.CRON_SECRET || 'finstat-cron-default-secret-2026';
    const res = await request(app)
      .get('/api/jobs/daily-maintenance')
      .set('x-cron-secret', validSecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Daily maintenance completed successfully');
    expect(res.body.recurring).toBeDefined();
    expect(res.body.certificatePayouts).toBeDefined();
    expect(typeof res.body.certificatePayouts.processedCount).toBe('number');
  });
});
