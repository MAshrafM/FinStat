// backend/tests/integration/cardTransactionCurrencyValidation.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const Expenditure = require('../../models/Expenditure');
const { backfillCardTransactionCurrency } = require('../../scripts/backfillCardTransactionCurrency');

jest.setTimeout(60000);

describe('Step CC.2: CardTransaction Multi-Currency Validation & Migration', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let testCard;

  beforeAll(async () => {
    await connect();
    await CreditCard.init();
    await CardTransaction.init();
    await Expenditure.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await CreditCard.init();
    await CardTransaction.init();
    await Expenditure.init();

    regularUser = await User.create({
      username: 'reg_user',
      email: 'reg_user@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    regularToken = generateAccessToken(regularUser);

    adminUser = await User.create({
      username: 'admin_user',
      email: 'admin_user@test.com',
      password: 'HashedPassword123!',
      role: 'admin',
    });
    adminToken = generateAccessToken(adminUser);

    testCard = await CreditCard.create({
      user: regularUser._id,
      name: 'Gold Visa',
      bank: 'CIB',
      limit: 50000,
      billingCycleDay: 1,
    });
  });

  test('POST with non-EGP currency without foreignAmount returns 400', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        card: testCard._id.toString(),
        description: 'Foreign software subscription',
        category: 'Services',
        amount: 100,
        currency: 'USD',
        date: '2026-06-15',
        type: 'Purchase',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors || res.body.message || res.body.error).toBeDefined();
  });

  test('POST with EGP currency and foreignAmount returns 400 (forbidden)', async () => {
    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        card: testCard._id.toString(),
        description: 'Local groceries with foreignAmount',
        category: 'Food & Drink',
        amount: 500,
        currency: 'EGP',
        foreignAmount: 100,
        date: '2026-06-15',
        type: 'Purchase',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors || res.body.message || res.body.error).toBeDefined();
  });

  test('POST with USD, foreignAmount, and admin exchangeRateSnapshot override stores correctly', async () => {
    // Admin card
    const adminCard = await CreditCard.create({
      user: adminUser._id,
      name: 'Platinum Mastercard',
      bank: 'HSBC',
      limit: 100000,
      billingCycleDay: 5,
    });

    const res = await request(app)
      .post('/api/credit-cards/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        card: adminCard._id.toString(),
        description: 'Server Hosting',
        category: 'Services',
        amount: 4850,
        currency: 'USD',
        foreignAmount: 100,
        exchangeRateSnapshot: 48.50,
        date: '2026-06-15',
        type: 'Purchase',
      });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('USD');
    expect(res.body.foreignAmount).toBe(100);
    expect(res.body.exchangeRateSnapshot).toBe(48.50);
    expect(res.body.amount).toBe(4850);
    expect(res.body.amountInPiastres).toBe(485000);
  });

  test('Migration backfills legacy records without currency or snapshot, idempotent', async () => {
    // Insert 5 legacy documents directly bypass mongoose schema defaults
    const rawDocs = [1, 2, 3, 4, 5].map((i) => ({
      user: regularUser._id,
      card: testCard._id,
      description: `Legacy Transaction ${i}`,
      category: 'General',
      amount: 100 * i,
      amountInPiastres: 10000 * i,
      date: new Date('2026-01-01'),
      type: 'Purchase',
      createExpenditure: false,
      status: 'Due',
      paidAmount: 0,
      paidAmountInPiastres: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await CardTransaction.collection.insertMany(rawDocs);

    // Verify raw records lack currency and snapshot
    const beforeCount = await CardTransaction.collection.countDocuments({
      $or: [
        { currency: { $exists: false } },
        { exchangeRateSnapshot: { $exists: false } },
      ],
    });
    expect(beforeCount).toBe(5);

    // Run migration
    const summary1 = await backfillCardTransactionCurrency();
    expect(summary1.updatedCount).toBe(5);
    expect(summary1.errorCount).toBe(0);

    // Verify all 5 records are updated
    const afterRecords = await CardTransaction.find({
      description: /^Legacy Transaction/,
    });
    expect(afterRecords).toHaveLength(5);
    for (const record of afterRecords) {
      expect(record.currency).toBe('EGP');
      expect(record.foreignAmount).toBeNull();
      expect(record.exchangeRateSnapshot).toBe(1);
    }

    // Run migration second time - idempotent no-op
    const summary2 = await backfillCardTransactionCurrency();
    expect(summary2.updatedCount).toBe(0);
    expect(summary2.skippedCount).toBe(5);
  });
});
