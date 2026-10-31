// backend/tests/integration/tradesApi.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Trade = require('../../models/Trade');
const CorporateAction = require('../../models/CorporateAction');

jest.setTimeout(60000);

describe('Step 5B.1b: [AUD-TEST-001] Trades API Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    delete process.env.ENABLE_STRICT_OVERSELL;
    await clearDatabase();

    const manager = await createUserWithToken({ role: 'manager', username: 'trade_mgr' });
    managerUser = manager.user;
    managerAuth = manager.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'trade_view', managedBy: managerUser._id });
    viewerUser = viewer.user;
    viewerAuth = viewer.authHeader;

    const other = await createUserWithToken({ role: 'manager', username: 'trade_other' });
    otherUser = other.user;
    otherAuth = other.authHeader;
  });

  describe('1. Buy & TopUp Trade Execution (POST /api/trades)', () => {
    it('creates Buy trade with calculated piastres conversion fields', async () => {
      const payload = {
        date: '2024-05-15',
        broker: 'Thndr',
        stockCode: 'AAPL',
        type: 'Buy',
        shares: 20,
        price: 150.50,
        fees: 12.25,
        totalValue: 3022.25,
      };

      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.stockCode).toBe('AAPL');
      expect(res.body.shares).toBe(20);
      expect(res.body.price).toBe(150.50);
      expect(res.body.priceInPiastres).toBe(15050);
      expect(res.body.feesInPiastres).toBe(1225);
      expect(res.body.totalValueInPiastres).toBe(302225);
    });

    it('creates TopUp trade without requiring stockCode', async () => {
      const payload = {
        date: '2024-05-15',
        broker: 'Thndr',
        type: 'TopUp',
        totalValue: 10000,
      };

      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('TopUp');
      expect(res.body.totalValue).toBe(10000);
      expect(res.body.totalValueInPiastres).toBe(1000000);
    });

    it('rejects viewer role attempting to create trade with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', viewerAuth)
        .send({
          date: '2024-05-15',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Buy',
          shares: 10,
          price: 100,
          fees: 0,
          totalValue: 1000,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/read-only access/i);
    });
  });

  describe('2. Strict Oversell Defense (ENABLE_STRICT_OVERSELL)', () => {
    beforeEach(async () => {
      // User owns 30 AAPL shares
      await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-01',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Buy',
          shares: 30,
          price: 100,
          fees: 0,
          totalValue: 3000,
        });
    });

    it('rejects sell order exceeding available shares (sell 50 when 30 owned) with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-10',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Sell',
          shares: 50,
          price: 120,
          fees: 0,
          totalValue: 6000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient share balance/i);
    });

    it('allows sell order within available share balance (sell 30 when 30 owned)', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-10',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Sell',
          shares: 30,
          price: 120,
          fees: 0,
          totalValue: 3600,
        });

      expect(res.status).toBe(201);
      expect(res.body.shares).toBe(30);
    });

    it('evaluates dynamic corporate actions (splits and bonuses) in available balance', async () => {
      // Create user with 10 base shares
      const userB = await createUserWithToken({ role: 'manager', username: 'ca_user' });
      await request(app)
        .post('/api/trades')
        .set('Authorization', userB.authHeader)
        .send({
          date: '2024-01-01',
          broker: 'EFG',
          stockCode: 'COMI',
          type: 'Buy',
          shares: 10,
          price: 50,
          fees: 0,
          totalValue: 500,
        });

      // Bonus issue: 50% bonus (ratio 0.5): 10 * (1 + 0.5) = 15 shares
      await CorporateAction.create({
        user: userB.user._id,
        broker: 'EFG',
        stockCode: 'COMI',
        type: 'bonus',
        ratio: 0.5,
        effectiveDate: new Date('2024-02-01'),
        appliedDynamically: true,
      });

      // 2:1 Split: (10 + 5) * 2 = 30 shares available
      await CorporateAction.create({
        user: userB.user._id,
        broker: 'EFG',
        stockCode: 'COMI',
        type: 'split',
        ratio: 2,
        effectiveDate: new Date('2024-03-01'),
        appliedDynamically: true,
      });

      // Selling 30 succeeds
      const sell30 = await request(app)
        .post('/api/trades')
        .set('Authorization', userB.authHeader)
        .send({
          date: '2024-04-01',
          broker: 'EFG',
          stockCode: 'COMI',
          type: 'Sell',
          shares: 30,
          price: 40,
          fees: 0,
          totalValue: 1200,
        });
      expect(sell30.status).toBe(201);

      // Selling 1 more fails with HTTP 400
      const sellExtra = await request(app)
        .post('/api/trades')
        .set('Authorization', userB.authHeader)
        .send({
          date: '2024-04-02',
          broker: 'EFG',
          stockCode: 'COMI',
          type: 'Sell',
          shares: 1,
          price: 40,
          fees: 0,
          totalValue: 40,
        });
      expect(sellExtra.status).toBe(400);
      expect(sellExtra.body.message).toMatch(/Insufficient share balance/i);
    });

    it('allows oversell when ENABLE_STRICT_OVERSELL is disabled via relaxed mode', async () => {
      process.env.ENABLE_STRICT_OVERSELL = 'false';

      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-10',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Sell',
          shares: 50,
          price: 120,
          fees: 0,
          totalValue: 6000,
        });

      expect(res.status).toBe(201);
    });
  });

  describe('3. Trade Edit Oversell Validation (PUT /api/trades/:id) (🟡-42)', () => {
    let sellTradeAId;

    beforeEach(async () => {
      // 1. User buys 30 AAPL shares
      await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-01',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Buy',
          shares: 30,
          price: 100,
          fees: 0,
          totalValue: 3000,
        });

      // 2. User sells 20 AAPL shares (sellTradeA)
      const sellRes = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-10',
          broker: 'Thndr',
          stockCode: 'AAPL',
          type: 'Sell',
          shares: 20,
          price: 120,
          fees: 0,
          totalValue: 2400,
        });
      sellTradeAId = sellRes.body._id;
    });

    it('rejects editing sell trade from 20 to 35 shares (requested 35 > 30 available after excluding trade) with HTTP 400', async () => {
      const res = await request(app)
        .put(`/api/trades/${sellTradeAId}`)
        .set('Authorization', managerAuth)
        .send({
          shares: 35,
          totalValue: 4200,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Insufficient share balance/i);
    });

    it('allows editing sell trade from 20 to 25 shares (requested 25 <= 30 available after excluding trade) with HTTP 200', async () => {
      const res = await request(app)
        .put(`/api/trades/${sellTradeAId}`)
        .set('Authorization', managerAuth)
        .send({
          shares: 25,
          totalValue: 3000,
        });

      expect(res.status).toBe(200);
      expect(res.body.shares).toBe(25);
    });
  });

  describe('4. Trade Soft Delete & Multi-Tenant IDOR Defense', () => {
    let userATradeId;

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-01',
          broker: 'Thndr',
          stockCode: 'MSFT',
          type: 'Buy',
          shares: 10,
          price: 300,
          fees: 0,
          totalValue: 3000,
        });
      userATradeId = created.body._id;
    });

    it('soft deletes trade and hides from regular queries', async () => {
      const delRes = await request(app)
        .delete(`/api/trades/${userATradeId}`)
        .set('Authorization', managerAuth);

      expect(delRes.status).toBe(200);
      expect(delRes.body.msg).toMatch(/deleted successfully/i);

      const getRes = await request(app)
        .get(`/api/trades/${userATradeId}`)
        .set('Authorization', managerAuth);
      expect(getRes.status).toBe(404);
    });

    it('restores soft-deleted trade via POST /api/trades/:id/restore', async () => {
      await request(app)
        .delete(`/api/trades/${userATradeId}`)
        .set('Authorization', managerAuth);

      const restoreRes = await request(app)
        .post(`/api/trades/${userATradeId}/restore`)
        .set('Authorization', managerAuth);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.msg).toMatch(/restored successfully/i);
    });

    it('returns HTTP 404 across GET, PUT, DELETE, and restore when User B accesses User A trade (IDOR Defense)', async () => {
      const getRes = await request(app)
        .get(`/api/trades/${userATradeId}`)
        .set('Authorization', otherAuth);
      expect(getRes.status).toBe(404);

      const putRes = await request(app)
        .put(`/api/trades/${userATradeId}`)
        .set('Authorization', otherAuth)
        .send({ shares: 15 });
      expect(putRes.status).toBe(404);

      const delRes = await request(app)
        .delete(`/api/trades/${userATradeId}`)
        .set('Authorization', otherAuth);
      expect(delRes.status).toBe(404);

      const restoreRes = await request(app)
        .post(`/api/trades/${userATradeId}/restore`)
        .set('Authorization', otherAuth);
      expect(restoreRes.status).toBe(404);
    });
  });

  describe('5. List, Search, Summary & Corporate Action Wizard', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({ date: '2024-01-01', broker: 'Thndr', stockCode: 'AMZN', type: 'Buy', shares: 10, price: 100, fees: 0, totalValue: 1000 });
      await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({ date: '2024-01-02', broker: 'Telda', stockCode: 'GOOGL', type: 'Buy', shares: 5, price: 150, fees: 0, totalValue: 750 });
      await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({ date: '2024-01-03', broker: 'Thndr', type: 'TopUp', totalValue: 5000 });
    });

    it('returns paginated trades and filters by broker', async () => {
      const resAll = await request(app)
        .get('/api/trades?page=1&limit=2')
        .set('Authorization', managerAuth);
      expect(resAll.status).toBe(200);
      expect(resAll.body.data.length).toBe(2);

      const resTelda = await request(app)
        .get('/api/trades?broker=Telda')
        .set('Authorization', managerAuth);
      expect(resTelda.status).toBe(200);
      expect(resTelda.body.data.length).toBe(1);
      expect(resTelda.body.data[0].stockCode).toBe('GOOGL');

      const resTopUp = await request(app)
        .get('/api/trades?broker=TopUp')
        .set('Authorization', managerAuth);
      expect(resTopUp.status).toBe(200);
      expect(resTopUp.body.data[0].type).toBe('TopUp');
    });

    it('safely handles special regex characters in search parameter without crashing (Phase 2B Step 2B.2 escapeRegex)', async () => {
      const res = await request(app)
        .get('/api/trades?search=(')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('returns trade summary with cost basis grouping via GET /api/trades/summary', async () => {
      const res = await request(app)
        .get('/api/trades/summary')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('creates corporate action via wizard endpoint POST /api/trades/corporate-action/wizard', async () => {
      const res = await request(app)
        .post('/api/trades/corporate-action/wizard')
        .set('Authorization', managerAuth)
        .send({
          stockCode: 'AMZN',
          broker: 'Thndr',
          type: 'split',
          ratio: 2,
          effectiveDate: '2024-02-01',
          notes: 'Test split',
          logTrade: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.corporateAction).toBeDefined();
      expect(res.body.corporateAction.type).toBe('split');
    });
  });

  describe('7. [GAP-007] Expanded Broker Configuration & Regional Presets', () => {
    it('accepts Egyptian regional preset brokers (EFG Hermes, Mubasher, CI Capital, Beltone, Arabeya Online)', async () => {
      const presets = ['EFG Hermes', 'Mubasher', 'CI Capital', 'Beltone', 'Arabeya Online'];
      for (const broker of presets) {
        const res = await request(app)
          .post('/api/trades')
          .set('Authorization', managerAuth)
          .send({
            date: '2024-06-01',
            broker,
            stockCode: 'COMI',
            type: 'Buy',
            shares: 10,
            price: 50,
            fees: 5,
            totalValue: 505,
          });

        expect(res.status).toBe(201);
        expect(res.body.broker).toBe(broker);
      }
    });

    it('accepts custom broker string up to 50 characters (e.g. Interactive Brokers)', async () => {
      const customBroker = 'Interactive Brokers UK';
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-06-02',
          broker: customBroker,
          type: 'TopUp',
          totalValue: 10000,
        });

      expect(res.status).toBe(201);
      expect(res.body.broker).toBe(customBroker);
    });

    it('rejects broker name exceeding 50 characters with HTTP 400', async () => {
      const longBroker = 'A'.repeat(51);
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-06-03',
          broker: longBroker,
          type: 'TopUp',
          totalValue: 1000,
        });

      expect(res.status).toBe(400);
    });

    it('rejects empty or whitespace-only broker name with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-06-04',
          broker: '   ',
          type: 'TopUp',
          totalValue: 1000,
        });

      expect(res.status).toBe(400);
    });

    it('preserves and returns historical enum brokers (Thndr, EFG, Telda)', async () => {
      for (const broker of ['Thndr', 'EFG', 'Telda']) {
        const res = await request(app)
          .post('/api/trades')
          .set('Authorization', managerAuth)
          .send({
            date: '2024-06-05',
            broker,
            type: 'TopUp',
            totalValue: 500,
          });

        expect(res.status).toBe(201);
        expect(res.body.broker).toBe(broker);
      }
    });
  });
});

