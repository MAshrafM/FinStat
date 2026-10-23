// backend/tests/integration/expenditureExchangeRateSnapshot.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');
const ForexRateHistory = require('../../models/ForexRateHistory');

jest.setTimeout(60000);

describe('Step 4B.3: [MF-DEF-005] Multi-Currency Historical Exchange Rate Snapshot & Ledger Protection', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;

  beforeAll(async () => {
    await connect();
    await Expenditure.init();
    await ForexRateHistory.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await Expenditure.init();
    await ForexRateHistory.init();

    regularUser = await User.create({
      username: 'regular_forex_user',
      email: 'forex_reg@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    regularToken = generateAccessToken(regularUser);

    adminUser = await User.create({
      username: 'admin_forex_user',
      email: 'forex_adm@test.com',
      password: 'HashedPassword123!',
      role: 'admin',
    });
    adminToken = generateAccessToken(adminUser);

    // Seed historical rate snapshot for 2026-06-15: 1 USD = 48.50 EGP, 1 EUR = 52.00 EGP
    await ForexRateHistory.create({
      baseCurrency: 'EGP',
      rates: new Map([
        ['USD', 48.50],
        ['EUR', 52.00],
      ]),
      source: 'CIB',
      date: new Date('2026-06-15T12:00:00.000Z'),
    });
  });

  it('resolves historical snapshot rate and stores base currency transactionValue in ledger', async () => {
    // Regular user logs 100 USD expenditure on 2026-06-16 (within 7 days of 2026-06-15)
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2026-06-16',
        currency: 'USD',
        foreignAmount: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        logBankOp: '-',
        categories: ['Travel'],
      });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('USD');
    expect(res.body.foreignAmount).toBe(100);
    expect(res.body.exchangeRateSnapshot).toBe(48.50);
    expect(res.body.transactionValue).toBe(4850);
    expect(res.body.transactionValueInPiastres).toBe(485000);
    // Ledger running balance in EGP
    expect(res.body.runningBalances.bank).toBe(-4850);
    expect(res.body.runningBalancesInPiastres.bank).toBe(-485000);
  });

  it('rejects foreignAmount for base currency EGP transactions', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2026-06-16',
        currency: 'EGP',
        foreignAmount: 50, // Invalid for EGP
        transactionValue: 50,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Groceries'],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/foreignAmount cannot be specified for base currency/i);
  });

  it('requires foreignAmount for non-EGP transactions', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2026-06-16',
        currency: 'EUR',
        // foreignAmount missing
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Software'],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/foreignAmount is required for EUR transactions/i);
  });

  it('allows admin override of exchangeRateSnapshot and transactionValue', async () => {
    // Admin supplies custom rate 50.00 and custom transactionValue 5000 for a historical correction
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: '2026-06-16',
        currency: 'USD',
        foreignAmount: 100,
        exchangeRateSnapshot: 50.00,
        transactionValue: 5000,
        transactionType: 'W',
        paymentMethod: 'Bank',
        logBankOp: '-',
        categories: ['Adjustment'],
      });

    expect(res.status).toBe(201);
    expect(res.body.exchangeRateSnapshot).toBe(50.00);
    expect(res.body.transactionValue).toBe(5000);
    expect(res.body.transactionValueInPiastres).toBe(500000);
  });

  it('rejects historical transaction when no exchange rate snapshot exists within 7 days', async () => {
    // Date: 2025-01-01 (1.5 years before the 2026 snapshot, > 7 days old and not recent)
    const res = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2025-01-01',
        currency: 'USD',
        foreignAmount: 50,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Historical'],
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/No exchange rate snapshot available for USD/i);
  });

  it('preserves existing exchangeRateSnapshot on PUT when foreignAmount changes on the same date', async () => {
    // 1. Create initial USD transaction
    const createRes = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2026-06-16',
        currency: 'USD',
        foreignAmount: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        logBankOp: '-',
        categories: ['Travel'],
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.exchangeRateSnapshot).toBe(48.50);
    expect(createRes.body.transactionValue).toBe(4850);

    // 2. Later update foreignAmount from 100 to 150 on same date
    const updateRes = await request(app)
      .put(`/api/expenditures/${createRes.body._id}`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        foreignAmount: 150,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.foreignAmount).toBe(150);
    // Rate must still be 48.50!
    expect(updateRes.body.exchangeRateSnapshot).toBe(48.50);
    // Base transaction value recalculated: 150 * 48.50 = 7275
    expect(updateRes.body.transactionValue).toBe(7275);
    expect(updateRes.body.transactionValueInPiastres).toBe(727500);
    expect(updateRes.body.runningBalances.bank).toBe(-7275);
  });
});
