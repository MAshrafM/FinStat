// backend/tests/integration/cardTransactionCurrencyEdit.test.js
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

describe('Step CC.4: CardTransaction Currency PUT & Rate Preservation', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let testCard;
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
      username: 'reg_user',
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

    testCard = await CreditCard.create({
      user: regularUser._id,
      name: 'Regular Visa',
      bank: 'CIB',
      limit: 50000,
      billingCycleDay: 1,
    });

    adminCard = await CreditCard.create({
      user: adminUser._id,
      name: 'Admin Visa',
      bank: 'HSBC',
      limit: 100000,
      billingCycleDay: 1,
    });

    // Seed snapshots:
    // 2026-06-15: 1 USD = 48.50 EGP
    // 2026-06-25: 1 USD = 51.00 EGP
    await ForexRateHistory.create({
      baseCurrency: 'EGP',
      rates: new Map([['USD', 48.50]]),
      source: 'CIB',
      date: new Date('2026-06-15T12:00:00.000Z'),
    });

    await ForexRateHistory.create({
      baseCurrency: 'EGP',
      rates: new Map([['USD', 51.00]]),
      source: 'CIB',
      date: new Date('2026-06-25T12:00:00.000Z'),
    });
  });

  test('PUT with foreignAmount change on same date preserves exchangeRateSnapshot and recomputes amount', async () => {
    // Initial transaction on 2026-06-16 with rate 48.50
    const tx = await CardTransaction.create({
      user: regularUser._id,
      card: testCard._id,
      description: 'Foreign SaaS',
      category: 'Services',
      amount: 4850,
      amountInPiastres: 485000,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRateSnapshot: 48.50,
      date: new Date('2026-06-16T10:00:00.000Z'),
      type: 'Purchase',
    });

    const res = await request(app)
      .put(`/api/credit-cards/transactions/${tx._id}`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        foreignAmount: 150,
      });

    expect(res.status).toBe(200);
    expect(res.body.foreignAmount).toBe(150);
    expect(res.body.exchangeRateSnapshot).toBe(48.50); // Preserved
    expect(res.body.amount).toBe(7275); // 150 * 48.50
    expect(res.body.amountInPiastres).toBe(727500);
  });

  test('PUT with date change re-resolves exchange rate for new date', async () => {
    const tx = await CardTransaction.create({
      user: regularUser._id,
      card: testCard._id,
      description: 'Foreign SaaS',
      category: 'Services',
      amount: 4850,
      amountInPiastres: 485000,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRateSnapshot: 48.50,
      date: new Date('2026-06-16T10:00:00.000Z'),
      type: 'Purchase',
    });

    const res = await request(app)
      .put(`/api/credit-cards/transactions/${tx._id}`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        date: '2026-06-26', // near 2026-06-25 snapshot (51.00)
      });

    expect(res.status).toBe(200);
    expect(res.body.exchangeRateSnapshot).toBe(51.00); // Re-resolved
    expect(res.body.amount).toBe(5100);
    expect(res.body.amountInPiastres).toBe(510000);
  });

  test('PUT with regular user client exchangeRateSnapshot spoof is ignored', async () => {
    const tx = await CardTransaction.create({
      user: regularUser._id,
      card: testCard._id,
      description: 'Foreign SaaS',
      category: 'Services',
      amount: 4850,
      amountInPiastres: 485000,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRateSnapshot: 48.50,
      date: new Date('2026-06-16T10:00:00.000Z'),
      type: 'Purchase',
    });

    const res = await request(app)
      .put(`/api/credit-cards/transactions/${tx._id}`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        foreignAmount: 200,
        exchangeRateSnapshot: 0.01, // Spoofed rate
      });

    expect(res.status).toBe(200);
    expect(res.body.exchangeRateSnapshot).toBe(48.50); // Original preserved
    expect(res.body.amount).toBe(9700); // 200 * 48.50
  });

  test('PUT with admin exchangeRateSnapshot override is preserved', async () => {
    const tx = await CardTransaction.create({
      user: adminUser._id,
      card: adminCard._id,
      description: 'Admin SaaS',
      category: 'Services',
      amount: 4850,
      amountInPiastres: 485000,
      currency: 'USD',
      foreignAmount: 100,
      exchangeRateSnapshot: 48.50,
      date: new Date('2026-06-16T10:00:00.000Z'),
      type: 'Purchase',
    });

    const res = await request(app)
      .put(`/api/credit-cards/transactions/${tx._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        foreignAmount: 100,
        exchangeRateSnapshot: 50.0, // Admin override
      });

    expect(res.status).toBe(200);
    expect(res.body.exchangeRateSnapshot).toBe(50.0);
    expect(res.body.amount).toBe(5000);
  });
});
