// backend/tests/integration/cardTransactionCurrencyCreation.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const Expenditure = require('../../models/Expenditure');
const ForexRateHistory = require('../../models/ForexRateHistory');

jest.setTimeout(60000);

describe('Step CC.3: CardTransaction Foreign Currency Creation & Bridge Integration', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let userCard;
  let adminCard;

  beforeAll(async () => {
    await connect();
    await CreditCard.init();
    await CardTransaction.init();
    await Expenditure.init();
    await ForexRateHistory.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await CreditCard.init();
    await CardTransaction.init();
    await Expenditure.init();
    await ForexRateHistory.init();

    regularUser = await User.create({
      username: 'regular_user',
      email: 'reg@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    regularToken = generateAccessToken(regularUser);

    adminUser = await User.create({
      username: 'admin_user',
      email: 'admin@test.com',
      password: 'HashedPassword123!',
      role: 'admin',
    });
    adminToken = generateAccessToken(adminUser);

    userCard = await CreditCard.create({
      user: regularUser._id,
      name: 'User Card',
      bank: 'CIB',
      limit: 50000,
      billingCycleDay: 1,
    });

    adminCard = await CreditCard.create({
      user: adminUser._id,
      name: 'Admin Card',
      bank: 'HSBC',
      limit: 100000,
      billingCycleDay: 1,
    });

    // Seed historical forex snapshot for 2026-06-15 (1 USD = 48.50 EGP, 1 EUR = 52.00 EGP)
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

  test('Regular user: resolves exchange rate, converts amount, and propagates to Expenditure', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        card: userCard._id.toString(),
        description: 'AWS Cloud Hosting',
        category: 'Services',
        currency: 'USD',
        foreignAmount: 100,
        date: '2026-06-16', // within 1 day of 2026-06-15 snapshot
        type: 'Purchase',
        createExpenditure: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('USD');
    expect(res.body.foreignAmount).toBe(100);
    expect(res.body.exchangeRateSnapshot).toBe(48.50);
    expect(res.body.amount).toBe(4850);
    expect(res.body.amountInPiastres).toBe(485000);

    // Verify linked Expenditure was created with mirrored foreign metadata
    const linkedExp = await Expenditure.findOne({
      linkedCardTransactionId: res.body._id,
    });
    expect(linkedExp).not.toBeNull();
    expect(linkedExp.currency).toBe('USD');
    expect(linkedExp.foreignAmount).toBe(100);
    expect(linkedExp.exchangeRateSnapshot).toBe(48.50);
    expect(linkedExp.transactionValue).toBe(4850);
    expect(linkedExp.transactionValueInPiastres).toBe(485000);
    expect(linkedExp.paidWithCreditCard).toBe(true);
  });

  test('Regular user: rate in request body is ignored in favor of server resolution', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        card: userCard._id.toString(),
        description: 'Spoofed rate test',
        category: 'Services',
        currency: 'USD',
        foreignAmount: 100,
        exchangeRateSnapshot: 10.0, // Attempted spoof
        date: '2026-06-16',
        type: 'Purchase',
      });

    expect(res.status).toBe(201);
    expect(res.body.exchangeRateSnapshot).toBe(48.50); // Server authoritative
    expect(res.body.amount).toBe(4850);
  });

  test('Admin user: exchangeRateSnapshot override is preserved and amount is calculated or overridden', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        card: adminCard._id.toString(),
        description: 'Admin Custom FX Purchase',
        category: 'Equipment',
        currency: 'USD',
        foreignAmount: 100,
        exchangeRateSnapshot: 50.0, // Admin override
        date: '2026-06-16',
        type: 'Purchase',
      });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('USD');
    expect(res.body.foreignAmount).toBe(100);
    expect(res.body.exchangeRateSnapshot).toBe(50.0);
    expect(res.body.amount).toBe(5000);
    expect(res.body.amountInPiastres).toBe(500000);
  });

  test('Historical date (>7 days) without snapshot rejects with 400', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        card: userCard._id.toString(),
        description: 'Too old purchase',
        category: 'Services',
        currency: 'USD',
        foreignAmount: 100,
        date: '2025-01-01', // No snapshot within 7 days
        type: 'Purchase',
      });

    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error).toMatch(/No exchange rate snapshot available/);
  });
});
