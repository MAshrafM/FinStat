// backend/tests/integration/mutualFundBatchPrice.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const marketPriceService = require('../../utils/marketPriceService');

jest.setTimeout(60000);

describe('Mutual Fund Batch Price Hydration Integration Tests [AUD-PERF-005]', () => {
  let user;
  let token;
  let authHeader;
  let getFundPriceSpy;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'mf_batch_user',
      email: 'mf_batch@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
    authHeader = `Bearer ${token}`;

    getFundPriceSpy = jest.spyOn(marketPriceService, 'getFundPrice').mockImplementation(async (name, options) => {
      const mockPrices = {
        'Misr El Kheir': 15.5,
        'CIB Fund 1': 42.0,
        'Thndr Fund': 105.75,
      };
      const price = mockPrices[name] || 0;
      return {
        data: {
          rows: [{ name, price }],
        },
        isLive: true,
        isStale: false,
        source: 'mubasher-mock',
      };
    });
  });

  afterEach(() => {
    if (getFundPriceSpy) {
      getFundPriceSpy.mockRestore();
    }
  });

  test('returns prices for multiple funds in a single HTTP request', async () => {
    const res = await request(app)
      .post('/api/mutual-funds/batch-prices')
      .set('Authorization', authHeader)
      .send({
        names: ['Misr El Kheir', 'CIB Fund 1'],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prices');
    expect(Array.isArray(res.body.prices)).toBe(true);
    expect(res.body.prices).toHaveLength(2);

    expect(res.body.prices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Misr El Kheir', lastPrice: 15.5, isLive: true }),
        expect.objectContaining({ name: 'CIB Fund 1', lastPrice: 42.0, isLive: true }),
      ])
    );
  });

  test('enforces max 50 names ceiling', async () => {
    const names = [];
    for (let i = 1; i <= 60; i++) {
      names.push(`Fund #${i}`);
    }

    const res = await request(app)
      .post('/api/mutual-funds/batch-prices')
      .set('Authorization', authHeader)
      .send({ names });

    expect(res.status).toBe(200);
    expect(res.body.prices).toHaveLength(50);
  });

  test('handles empty and invalid names array gracefully', async () => {
    const resEmpty = await request(app)
      .post('/api/mutual-funds/batch-prices')
      .set('Authorization', authHeader)
      .send({ names: [] });

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.prices).toEqual([]);

    const resMissing = await request(app)
      .post('/api/mutual-funds/batch-prices')
      .set('Authorization', authHeader)
      .send({});

    expect(resMissing.status).toBe(200);
    expect(resMissing.body.prices).toEqual([]);
  });
});

