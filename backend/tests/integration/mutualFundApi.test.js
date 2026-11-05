// backend/tests/integration/mutualFundApi.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const MutualFundTrade = require('../../models/MutualFundTrade');
const Expenditure = require('../../models/Expenditure');

jest.setTimeout(60000);

describe('Phase 7C.0 Mutual Fund Bridge API Integration Tests [FEAT-002]', () => {
  let managerUser;
  let managerAuth;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const manager = await createUserWithToken({ role: 'manager', username: 'mf_mgr' });
    managerUser = manager.user;
    managerAuth = manager.authHeader;
  });

  it('1. creates Buy trade and generates linked purchase outflow bridge expenditure with transactionType S', async () => {
    const res = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-01T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Buy',
        units: 100,
        price: 150,
        fees: 25,
        totalValue: 15025,
        sourceAccount: 'Bank',
      });

    expect(res.status).toBe(201);
    expect(res.body.linkedExpenditureId).toBeDefined();

    const exp = await Expenditure.findById(res.body.linkedExpenditureId);
    expect(exp).toBeDefined();
    expect(exp.transactionType).toBe('S');
    expect(exp.bridgeDirection).toBe('outflow');
    expect(exp.paymentMethod).toBe('Bank');
    expect(exp.categories).toEqual(['Investment']);
    expect(exp.transactionValue).toBe(15025);
    expect(exp.linkedMfTradeId.toString()).toBe(res.body._id.toString());
  });

  it('2. creates Coupon trade and generates linked coupon inflow bridge expenditure with transactionType T', async () => {
    const res = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-15T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Coupon',
        units: 100,
        price: 5,
        fees: 0,
        totalValue: 500,
        destinationAccount: 'Bank',
        autoReinvest: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.linkedExpenditureId).toBeDefined();

    const exp = await Expenditure.findById(res.body.linkedExpenditureId);
    expect(exp).toBeDefined();
    expect(exp.transactionType).toBe('T');
    expect(exp.bridgeDirection).toBe('inflow');
    expect(exp.paymentMethod).toBe('Bank');
    expect(exp.categories).toEqual(['Investment']);
    expect(exp.transactionValue).toBe(500);
    expect(exp.linkedMfTradeId.toString()).toBe(res.body._id.toString());
  });

  it('3. creates Coupon trade with autoReinvest: true without linked expenditure', async () => {
    const res = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-15T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Coupon',
        units: 100,
        price: 5,
        fees: 0,
        totalValue: 500,
        autoReinvest: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.linkedExpenditureId).toBeNull();

    const expCount = await Expenditure.countDocuments({ user: managerUser._id, linkedMfTradeId: res.body._id });
    expect(expCount).toBe(0);
  });

  it('4. soft-deleting trade cascades reversal to linked expenditure', async () => {
    const createRes = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-01T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Buy',
        units: 50,
        price: 100,
        fees: 0,
        totalValue: 5000,
        sourceAccount: 'Bank',
      });
    expect(createRes.status).toBe(201);
    const tradeId = createRes.body._id;
    const expId = createRes.body.linkedExpenditureId;

    const delRes = await request(app)
      .delete(`/api/mutual-funds/${tradeId}`)
      .set('Authorization', managerAuth);
    expect(delRes.status).toBe(200);

    const reversedExp = await Expenditure.findById(expId);
    expect(reversedExp.deletedAt).not.toBeNull();
  });

  it('5. rejects deletion of Buy trade with HTTP 400 when subsequent Sell trades depend on units', async () => {
    // Buy 100 units
    const buyRes = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-01T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Buy',
        units: 100,
        price: 100,
        fees: 0,
        totalValue: 10000,
      });
    expect(buyRes.status).toBe(201);
    const buyId = buyRes.body._id;

    // Sell 80 units
    const sellRes = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-10T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Sell',
        units: 80,
        price: 120,
        fees: 0,
        totalValue: 9600,
      });
    expect(sellRes.status).toBe(201);

    // Attempt to delete Buy trade: net units (100 - 80 = 20) is less than buy trade units (100)
    const delRes = await request(app)
      .delete(`/api/mutual-funds/${buyId}`)
      .set('Authorization', managerAuth);

    expect(delRes.status).toBe(400);
    expect(delRes.body.msg).toMatch(/subsequent sell transactions depend on these units/i);

    // Verify Buy trade is still active
    const buyDoc = await MutualFundTrade.findById(buyId);
    expect(buyDoc.deletedAt).toBeNull();
  });

  it('6. restores soft-deleted trade and re-creates bridge expenditure', async () => {
    const createRes = await request(app)
      .post('/api/mutual-funds')
      .set('Authorization', managerAuth)
      .send({
        date: '2026-07-01T00:00:00.000Z',
        name: 'AZ Opportunity Fund',
        code: 'AZO',
        type: 'Buy',
        units: 25,
        price: 100,
        fees: 0,
        totalValue: 2500,
        sourceAccount: 'Bank',
      });
    const tradeId = createRes.body._id;

    // Delete
    await request(app)
      .delete(`/api/mutual-funds/${tradeId}`)
      .set('Authorization', managerAuth);

    // Restore
    const restoreRes = await request(app)
      .post(`/api/mutual-funds/${tradeId}/restore`)
      .set('Authorization', managerAuth);
    expect(restoreRes.status).toBe(200);

    const activeExp = await Expenditure.findOne({
      user: managerUser._id,
      linkedMfTradeId: tradeId,
      deletedAt: null,
    });
    expect(activeExp).toBeDefined();
    expect(activeExp.transactionValue).toBe(2500);
    expect(activeExp.bridgeDirection).toBe('outflow');
  });
});
