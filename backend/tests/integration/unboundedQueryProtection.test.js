// backend/tests/integration/unboundedQueryProtection.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');
const Trade = require('../../models/Trade');

jest.setTimeout(60000);

describe('Unbounded /all Query Protection Integration Tests [AUD-PERF-004]', () => {
  let user;
  let token;
  let authHeader;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'unbounded_test_user',
      email: 'unbounded@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
    authHeader = `Bearer ${token}`;
  });

  test('GET /api/expenditures/all default clamp: seed 1,001 minimal docs via insertMany, returns 1,000 and X-Truncated: true', async () => {
    // Generate 1,001 minimal docs
    const docs = [];
    const baseDate = new Date('2026-01-01T00:00:00.000Z').getTime();
    for (let i = 0; i < 1001; i++) {
      docs.push({
        user: user._id,
        date: new Date(baseDate + i * 60000),
        bank: 100,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        description: `Expenditure item ${i}`,
      });
    }

    await Expenditure.insertMany(docs);

    const res = await request(app)
      .get('/api/expenditures/all')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1000);
    expect(res.headers['x-truncated']).toBe('true');
  });

  test('GET /api/expenditures/all explicit limit: seed 6 docs, ?limit=5, returns 5 and X-Truncated: true', async () => {
    const docs = [];
    for (let i = 0; i < 6; i++) {
      docs.push({
        user: user._id,
        date: new Date(`2026-02-0${i + 1}T10:00:00.000Z`),
        bank: 50,
        cash: 0,
        prepaid: 0,
        transactionValue: 50,
        transactionType: 'W',
        description: `Expenditure ${i}`,
      });
    }
    await Expenditure.insertMany(docs);

    const res = await request(app)
      .get('/api/expenditures/all?limit=5')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
    expect(res.headers['x-truncated']).toBe('true');
  });

  test('GET /api/trades/all default clamp: seed 1,001 minimal docs via insertMany, returns 1,000 and X-Truncated: true', async () => {
    const docs = [];
    const baseDate = new Date('2026-01-01T00:00:00.000Z').getTime();
    for (let i = 0; i < 1001; i++) {
      docs.push({
        user: user._id,
        date: new Date(baseDate + i * 60000),
        broker: 'Thndr',
        stockCode: 'COMI',
        type: 'Buy',
        shares: 10,
        price: 50,
        totalValue: 500,
      });
    }
    await Trade.insertMany(docs);

    const res = await request(app)
      .get('/api/trades/all')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1000);
    expect(res.headers['x-truncated']).toBe('true');
  });

  test('GET /api/trades/all exact limit edge case: seed 5 docs, ?limit=5, returns 5 and X-Truncated: false', async () => {
    const docs = [];
    for (let i = 0; i < 5; i++) {
      docs.push({
        user: user._id,
        date: new Date(`2026-03-0${i + 1}T10:00:00.000Z`),
        broker: 'Thndr',
        stockCode: 'EAST',
        type: 'Buy',
        shares: 5,
        price: 20,
        totalValue: 100,
      });
    }
    await Trade.insertMany(docs);

    const res = await request(app)
      .get('/api/trades/all?limit=5')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
    expect(res.headers['x-truncated']).toBe('false');
  });
});
