// backend/tests/integration/goldAggregationNullSafety.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Gold = require('../../models/Gold');

jest.setTimeout(60000);

describe('Step 4A.3: [AUD-CORR-005] Gold Aggregation Null Safety & Schema Validation', () => {
  let user;
  let token;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'gold_tester',
      email: 'gold@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  it('should exclude sold records with null sellingDate from avgHoldingDays without returning null or averaging as 0', async () => {
    // Holding A: status: 'hold', sellingDate: null (unsold)
    await Gold.create({
      user: user._id,
      date: new Date('2026-01-01'),
      item: 'Gold Bar 24k',
      karat: 24,
      weight: 10,
      price: 3000,
      paid: 30000,
      status: 'hold',
      sellingDate: null,
      sellingPrice: null,
    });

    // Holding B: status: 'sold', sellingDate: null (legacy sold item with missing sellingDate)
    await Gold.create({
      user: user._id,
      date: new Date('2026-01-01'),
      item: 'Gold Coin 24k Legacy',
      karat: 24,
      weight: 8,
      price: 3000,
      paid: 24000,
      status: 'sold',
      sellingPrice: 3200,
      sellingDate: null,
    });

    // Holding C: status: 'sold', 30 days holding (2026-01-01 to 2026-01-31)
    await Gold.create({
      user: user._id,
      date: new Date('2026-01-01T00:00:00.000Z'),
      item: 'Gold Bar 24k C',
      karat: 24,
      weight: 10,
      price: 3000,
      paid: 30000,
      status: 'sold',
      sellingPrice: 3500,
      sellingDate: new Date('2026-01-31T00:00:00.000Z'),
    });

    // Holding D: status: 'sold', 60 days holding (2026-01-01 to 2026-03-02)
    // Jan 31 days + Feb 28 days + 1 day = 60 days
    await Gold.create({
      user: user._id,
      date: new Date('2026-01-01T00:00:00.000Z'),
      item: 'Gold Bar 24k D',
      karat: 24,
      weight: 10,
      price: 3000,
      paid: 30000,
      status: 'sold',
      sellingPrice: 3600,
      sellingDate: new Date('2026-03-02T00:00:00.000Z'),
    });

    const res = await request(app)
      .get('/api/golds/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const soldSummary = res.body.find((s) => s.status === 'sold' && s.karat === 24);
    expect(soldSummary).toBeDefined();

    // The unpatched pipeline produces avgHoldingDays: null because subtracting null sellingDate evaluates to null.
    // If treated as 0 days, (30 + 60 + 0) / 3 = 30 days.
    // The correct known-good value averages ONLY the items with known sellingDate: (30 + 60) / 2 = 45 days.
    expect(soldSummary.avgHoldingDays).not.toBeNull();
    expect(soldSummary.avgHoldingDays).toBe(45);
  });

  it('should reject POST /api/golds with status sold when sellingDate or sellingPrice is missing', async () => {
    const res = await request(app)
      .post('/api/golds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-01',
        item: 'Gold Coin 21k',
        karat: 21,
        weight: 5,
        price: 2500,
        paid: 12500,
        status: 'sold',
        // missing sellingDate and sellingPrice
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/selling/i);
  });
});
