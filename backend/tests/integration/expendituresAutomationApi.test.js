// backend/tests/integration/expendituresAutomationApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');
const CategorizationRule = require('../../models/CategorizationRule');

jest.setTimeout(60000);

describe('Expenditures Automation & Splits API Integration Tests', () => {
  let testUser;
  let userToken;

  beforeAll(async () => {
    await connectDB();

    const username = 'auto_exp_test_user';
    const existing = await User.findOne({ username });
    if (existing) {
      await Expenditure.deleteMany({ user: existing._id });
      await CategorizationRule.deleteMany({ user: existing._id });
      await User.deleteOne({ _id: existing._id });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      username,
      email: 'auto_exp_user@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    userToken = jwt.sign(
      { user: { id: testUser._id.toString(), role: testUser.role } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create a categorization rule for Amazon
    await CategorizationRule.create({
      user: testUser._id,
      name: 'Amazon to Shopping',
      field: 'description',
      operator: 'contains',
      value: 'amazon',
      category: 'Shopping & Leisure',
      priority: 10,
      isActive: true,
    });
  });

  afterAll(async () => {
    if (testUser) {
      await Expenditure.deleteMany({ user: testUser._id });
      await CategorizationRule.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await mongoose.connection.close();
  });

  test('POST /api/expenditures auto-categorizes when matching description rule exists', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('x-auth-token', userToken)
      .send({
        date: '2026-09-01',
        transactionValue: 350,
        transactionType: 'W',
        paymentMethod: 'Bank',
        description: 'amazon order #8841 electronics',
        // Omitted category or left default
      });

    expect(res.status).toBe(201);
    expect(res.body.categories).toContain('Shopping & Leisure');
  });

  test('POST /api/expenditures accepts split transactions when sum matches transactionValue', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('x-auth-token', userToken)
      .send({
        date: '2026-09-02',
        transactionValue: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        description: 'Supermarket mixed basket',
        splits: [
          { category: 'Groceries', amount: 60, description: 'Food supplies' },
          { category: 'Household', amount: 40, description: 'Cleaning detergents' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.splits.length).toBe(2);
    expect(res.body.splits[0].amount).toBe(60);
    expect(res.body.splits[1].amount).toBe(40);
    expect(res.body.categories).toEqual(expect.arrayContaining(['Groceries', 'Household']));
  });

  test('POST /api/expenditures rejects invalid split sum with 400', async () => {
    const res = await request(app)
      .post('/api/expenditures')
      .set('x-auth-token', userToken)
      .send({
        date: '2026-09-03',
        transactionValue: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        description: 'Mismatched splits',
        splits: [
          { category: 'Groceries', amount: 30 },
          { category: 'Household', amount: 40 },
        ],
      });

    expect(res.status).toBe(400);
  });

  test('GET /api/expenditures/recurring returns only flagged recurring records', async () => {
    // Add one recurring expenditure
    await Expenditure.create({
      user: testUser._id,
      date: '2026-09-04',
      transactionValue: 120,
      transactionType: 'W',
      paymentMethod: 'Bank',
      description: 'Spotify Family Subscription',
      categories: ['Shopping & Leisure'],
      isRecurring: true,
    });

    const res = await request(app)
      .get('/api/expenditures/recurring')
      .set('x-auth-token', userToken);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((e) => e.isRecurring === true)).toBe(true);
  });
});
