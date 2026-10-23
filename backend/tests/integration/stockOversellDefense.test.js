// backend/tests/integration/stockOversellDefense.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Trade = require('../../models/Trade');
const CorporateAction = require('../../models/CorporateAction');

jest.setTimeout(60000);

describe('Step 4A.2: [AUD-CORR-002] & [GAP-012] Stock Sell Overselling Validation', () => {
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
    process.env.ENABLE_STRICT_OVERSELL = 'true';

    user = await User.create({
      username: 'trade_tester',
      email: 'trade@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  afterEach(() => {
    delete process.env.ENABLE_STRICT_OVERSELL;
  });

  it('Scenario 1: should block direct oversell (selling 50 shares when owning only 30)', async () => {
    // 1. Buy 30 shares
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-10',
        broker: 'Thndr',
        type: 'Buy',
        stockCode: 'AAPL',
        shares: 30,
        price: 150,
        fees: 10,
        totalValue: 4510,
        iteration: 1,
      })
      .expect(201);

    // 2. Try to sell 50 shares
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-15',
        broker: 'Thndr',
        type: 'Sell',
        stockCode: 'AAPL',
        shares: 50,
        price: 160,
        fees: 10,
        totalValue: 7990,
        iteration: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message || JSON.stringify(res.body)).toMatch(/Insufficient share balance/i);
  });

  it('Scenario 2: should honor corporate action split and dividend bonus shares when computing available shares', async () => {
    // 1. Buy 10 shares on Jan 01
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-01',
        broker: 'Thndr',
        type: 'Buy',
        stockCode: 'COMI',
        shares: 10,
        price: 50,
        fees: 5,
        totalValue: 505,
        iteration: 1,
      })
      .expect(201);

    // 2. Receive 5 dividend bonus shares on Jan 05
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-05',
        broker: 'Thndr',
        type: 'Dividend',
        stockCode: 'COMI',
        shares: 5,
        price: 0,
        fees: 0,
        totalValue: 0,
        iteration: 1,
      })
      .expect(201);

    // 3. Apply 2:1 dynamic stock split effective Jan 10
    await CorporateAction.create({
      user: user._id,
      stockCode: 'COMI',
      broker: 'Thndr',
      type: 'split',
      ratio: 2,
      effectiveDate: new Date('2026-01-10'),
      appliedDynamically: true,
    });

    // Total available post-split: (10 + 5) * 2 = 30 shares
    // 4. Selling 30 shares should succeed
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-15',
        broker: 'Thndr',
        type: 'Sell',
        stockCode: 'COMI',
        shares: 30,
        price: 30,
        fees: 5,
        totalValue: 895,
        iteration: 1,
      })
      .expect(201);

    // 5. Selling 1 more share should fail
    const oversellRes = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-16',
        broker: 'Thndr',
        type: 'Sell',
        stockCode: 'COMI',
        shares: 1,
        price: 30,
        fees: 5,
        totalValue: 25,
        iteration: 1,
      });

    expect(oversellRes.status).toBe(400);
    expect(oversellRes.body.error || oversellRes.body.message || JSON.stringify(oversellRes.body)).toMatch(/Insufficient share balance/i);
  });

  it('Scenario 3: should correctly account for existing trade in trade edit mode (PUT /api/trades/:id)', async () => {
    // 1. Buy 30 shares
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-01',
        broker: 'Thndr',
        type: 'Buy',
        stockCode: 'HRHO',
        shares: 30,
        price: 20,
        fees: 5,
        totalValue: 605,
        iteration: 1,
      })
      .expect(201);

    // 2. Sell 20 shares (10 remaining)
    const sellRes = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-05',
        broker: 'Thndr',
        type: 'Sell',
        stockCode: 'HRHO',
        shares: 20,
        price: 25,
        fees: 5,
        totalValue: 495,
        iteration: 1,
      })
      .expect(201);

    const sellTradeId = sellRes.body._id;

    // 3. Edit sell trade to 35 shares (Available with original 20 released is 30) -> Should fail
    const editFailRes = await request(app)
      .put(`/api/trades/${sellTradeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        shares: 35,
        totalValue: 35 * 25 - 5,
      });

    expect(editFailRes.status).toBe(400);
    expect(editFailRes.body.error || editFailRes.body.message || JSON.stringify(editFailRes.body)).toMatch(/Insufficient share balance/i);

    // 4. Edit sell trade to 25 shares (<= 30) -> Should succeed
    const editSuccessRes = await request(app)
      .put(`/api/trades/${sellTradeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        shares: 25,
        totalValue: 25 * 25 - 5,
      });

    expect(editSuccessRes.status).toBe(200);
    expect(editSuccessRes.body.shares).toBe(25);
  });

  it('Scenario 4: should allow oversell when ENABLE_STRICT_OVERSELL is set to false', async () => {
    process.env.ENABLE_STRICT_OVERSELL = 'false';

    // Buy 10 shares
    await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-01',
        broker: 'Thndr',
        type: 'Buy',
        stockCode: 'ETEL',
        shares: 10,
        price: 15,
        fees: 2,
        totalValue: 152,
        iteration: 1,
      })
      .expect(201);

    // Sell 50 shares with flag disabled -> Should succeed with 201
    const res = await request(app)
      .post('/api/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-01-05',
        broker: 'Thndr',
        type: 'Sell',
        stockCode: 'ETEL',
        shares: 50,
        price: 16,
        fees: 2,
        totalValue: 798,
        iteration: 1,
      });

    expect(res.status).toBe(201);
  });
});
