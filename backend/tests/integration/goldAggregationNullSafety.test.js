// backend/tests/integration/goldAggregationNullSafety.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Gold = require('../../models/Gold');
const Expenditure = require('../../models/Expenditure');

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
  describe('Step 7B.1b-i: [FEAT-002, GAP-003] Gold Liquidation Settlement Bridge', () => {
    it('creates linked Expenditure with linkedGoldId and credits chosen account when gold is sold', async () => {
      const res = await request(app)
        .post('/api/golds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2026-03-01',
          item: 'Gold Ingot 24k',
          karat: 24,
          weight: 10,
          price: 3000,
          paid: 30000,
          status: 'sold',
          sellingPrice: 3500,
          sellingDate: '2026-03-10',
          destinationAccount: 'Bank',
        });

      expect(res.status).toBe(201);
      const goldId = res.body._id;
      const linkedExpId = res.body.linkedExpenditureId;
      expect(linkedExpId).toBeDefined();

      const linkedExp = await Expenditure.findById(linkedExpId);
      expect(linkedExp).toBeDefined();
      expect(linkedExp.transactionType).toBe('T');
      expect(linkedExp.paymentMethod).toBe('Bank');
      // 10 grams * 3500 sellingPrice = 35000 EGP
      expect(linkedExp.transactionValue).toBe(35000);
      expect(linkedExp.linkedGoldId.toString()).toBe(goldId.toString());
      // Running bank balance: 35,000 sale proceeds - 30,000 purchase debit = 5,000
      expect(linkedExp.bank).toBe(5000);
    });

    it('rolls back linked Expenditure balance impact when sold gold holding is deleted', async () => {
      const createRes = await request(app)
        .post('/api/golds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2026-04-01',
          item: 'Gold Bar 24k For Deletion',
          karat: 24,
          weight: 5,
          price: 3000,
          paid: 15000,
          status: 'sold',
          sellingPrice: 4000,
          sellingDate: '2026-04-10',
          destinationAccount: 'Cash',
        });

      expect(createRes.status).toBe(201);
      const goldId = createRes.body._id;
      const linkedExpId = createRes.body.linkedExpenditureId;
      expect(linkedExpId).toBeDefined();

      const beforeExp = await Expenditure.findById(linkedExpId);
      expect(beforeExp.deletedAt).toBeNull();

      // Delete sold gold
      const delRes = await request(app)
        .delete(`/api/golds/${goldId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delRes.status).toBe(200);

      // Verify linked expenditure is soft-deleted
      const afterExp = await Expenditure.findById(linkedExpId);
      expect(afterExp.deletedAt).not.toBeNull();

      // Verify previous balance does not include the deleted 20,000 cash proceeds
      const { calculatePreviousBalance } = require('../../utils/ledgerHelpers');
      const prevBal = await calculatePreviousBalance(user._id, new Date('2026-04-15T00:00:00.000Z'), null);
      expect(prevBal.cash).toBe(0);
    });
  });
  describe('Phase 7C.0 Gold Purchase Settlement Bridge [FEAT-002]', () => {
    it('creates gold holding and generates linked purchase outflow bridge expenditure with transactionType S', async () => {
      const res = await request(app)
        .post('/api/golds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2026-06-01',
          item: 'Gold Bar 24k 50g',
          karat: 24,
          weight: 50,
          price: 3200,
          paid: 160000,
          sourceAccount: 'Bank',
        });

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();

      const gold = await Gold.findById(res.body._id);
      expect(gold.linkedPurchaseExpenditureId).toBeDefined();

      const exp = await Expenditure.findById(gold.linkedPurchaseExpenditureId);
      expect(exp).toBeDefined();
      expect(exp.transactionType).toBe('S');
      expect(exp.categories).toEqual(['Investment']);
      expect(exp.bridgeDirection).toBe('outflow');
      expect(exp.autoGenerated).toBe(true);
      expect(exp.paymentMethod).toBe('Bank');
      expect(exp.transactionValue).toBe(160000);
      expect(exp.linkedGoldId.toString()).toBe(res.body._id.toString());
    });

    it('soft-deleting gold holding cascades reversal to linked purchase expenditure', async () => {
      const createRes = await request(app)
        .post('/api/golds')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2026-06-02',
          item: 'Gold Coin 21k For Purchase Deletion',
          karat: 21,
          weight: 10,
          price: 2800,
          paid: 28000,
          sourceAccount: 'Cash',
        });

      const goldId = createRes.body._id;
      const gold = await Gold.findById(goldId);
      const purchaseExpId = gold.linkedPurchaseExpenditureId;
      expect(purchaseExpId).toBeDefined();

      const delRes = await request(app)
        .delete(`/api/golds/${goldId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.status).toBe(200);

      const exp = await Expenditure.findById(purchaseExpId);
      expect(exp.deletedAt).not.toBeNull();
    });
  });
});
