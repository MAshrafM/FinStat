// backend/tests/integration/currencyApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Currency = require('../../models/Currency');
const ForexRateHistory = require('../../models/ForexRateHistory');

jest.setTimeout(60000);

describe('Currency API Integration Tests (Phase 7)', () => {
  let testManager;
  let managerToken;
  let testViewer;
  let viewerToken;

  beforeAll(async () => {
    await connectDB();

    const mUsername = 'curr_test_manager';
    const vUsername = 'curr_test_viewer';
    await User.deleteMany({ username: { $in: [mUsername, vUsername] } });

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testManager = await User.create({
      username: mUsername,
      email: 'curr_mgr@finstat.io',
      password: hashedPassword,
      role: 'manager',
    });

    testViewer = await User.create({
      username: vUsername,
      email: 'curr_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: testManager._id,
    });

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    managerToken = jwt.sign(
      { user: { id: testManager._id.toString(), role: testManager.role } },
      jwtSecret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { user: { id: testViewer._id.toString(), role: testViewer.role } },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testManager) {
      await Currency.deleteMany({ user: testManager._id });
      await User.deleteMany({ _id: { $in: [testManager._id, testViewer._id] } });
    }
    await mongoose.connection.close();
  });

  let createdCurrencyId;

  test('POST /api/currency creates currency holding with normalized code and valuation', async () => {
    const res = await request(app)
      .post('/api/currency')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Dollar',
        amount: 2000,
        price: 94000, // 47.0 EGP/USD
        date: '2026-02-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.currencyCode).toBe('USD');
    expect(res.body.purchaseRate).toBe(47);
    expect(res.body.priceInPiastres).toBe(9400000);
    expect(res.body.currentRate).toBeGreaterThan(0);
    expect(typeof res.body.unrealizedGainLoss).toBe('number');
    expect(res.body.rateSource).toBeDefined();
    expect(typeof res.body.isStale).toBe('boolean');
    createdCurrencyId = res.body._id;
  });

  test('GET /api/currency returns list with health status and unrealized P&L', async () => {
    const res = await request(app)
      .get('/api/currency')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const item = res.body.find((c) => c._id === createdCurrencyId);
    expect(item).toBeDefined();
    expect(item.currencyCode).toBe('USD');
    expect(item.currentValue).toBeGreaterThan(0);
    expect(typeof item.gainLossPercentage).toBe('number');
  });

  test('POST /api/currency/revalue revalues holdings and records daily snapshot', async () => {
    const res = await request(app)
      .post('/api/currency/revalue')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updated).toBeGreaterThan(0);
    expect(res.body.rates).toBeDefined();
    expect(Array.isArray(res.body.holdings)).toBe(true);

    // Verify snapshot in database
    const snapshot = await ForexRateHistory.findOne().sort({ date: -1 });
    expect(snapshot).toBeDefined();
    expect(snapshot.baseCurrency).toBe('EGP');
  });

  test('GET /api/currency/rate-history retrieves daily snapshots', async () => {
    const res = await request(app)
      .get('/api/currency/rate-history?limit=10&currencyCode=USD')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].date).toBeDefined();
    expect(res.body[0].rate).toBeDefined();
  });

  test('Viewer is rejected from triggering revaluation (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/currency/revalue')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});
