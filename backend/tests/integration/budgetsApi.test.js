// backend/tests/integration/budgetsApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');
const Budget = require('../../models/Budget');

jest.setTimeout(60000);

describe('Budgets API Integration Tests', () => {
  let testUser;
  let userToken;

  beforeAll(async () => {
    await connectDB();

    const username = 'budget_test_user';
    const existing = await User.findOne({ username });
    if (existing) {
      await Expenditure.deleteMany({ user: existing._id });
      await Budget.deleteMany({ user: existing._id });
      await User.deleteOne({ _id: existing._id });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      username,
      email: 'budget_user@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    userToken = jwt.sign(
      { user: { id: testUser._id.toString(), role: testUser.role } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser) {
      await Expenditure.deleteMany({ user: testUser._id });
      await Budget.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await mongoose.connection.close();
  });

  test('POST /api/budgets creates a monthly budget and calculates initial progress', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const res = await request(app)
      .post('/api/budgets')
      .set('x-auth-token', userToken)
      .send({
        category: 'Groceries',
        period: 'monthly',
        year: currentYear,
        month: currentMonth,
        amount: 1000,
        alertThreshold: 80,
      });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Groceries');
    expect(res.body.amount).toBe(1000);

    const budgetId = res.body._id;

    // Check progress before expenditures
    const progressRes = await request(app)
      .get(`/api/budgets/${budgetId}`)
      .set('x-auth-token', userToken);

    expect(progressRes.status).toBe(200);
    expect(progressRes.body.spentAmount).toBe(0);
    expect(progressRes.body.remainingAmount).toBe(1000);
    expect(progressRes.body.alertStatus).toBe('green');
  });

  test('GET /api/budgets/progress updates alertStatus to yellow (>= 70%) and red (>= 90%)', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Add expenditure for 750 EGP (75% -> yellow)
    await Expenditure.create({
      user: testUser._id,
      date: new Date(),
      transactionValue: 750,
      transactionType: 'W',
      paymentMethod: 'Bank',
      categories: ['Groceries'],
      description: 'Supermarket shopping',
    });

    const yellowRes = await request(app)
      .get(`/api/budgets/progress?period=monthly&year=${currentYear}&month=${currentMonth}`)
      .set('x-auth-token', userToken);

    expect(yellowRes.status).toBe(200);
    const groceryProgress = yellowRes.body.find((b) => b.category === 'Groceries');
    expect(groceryProgress).toBeDefined();
    expect(groceryProgress.spentAmount).toBe(750);
    expect(groceryProgress.alertStatus).toBe('yellow');

    // Add another expenditure of 200 EGP (total 950 EGP -> 95% -> red)
    await Expenditure.create({
      user: testUser._id,
      date: new Date(),
      transactionValue: 200,
      transactionType: 'W',
      paymentMethod: 'Bank',
      categories: ['Groceries'],
      description: 'Bakery & fresh fruits',
    });

    const redRes = await request(app)
      .get(`/api/budgets/progress?period=monthly&year=${currentYear}&month=${currentMonth}`)
      .set('x-auth-token', userToken);

    const updatedGrocery = redRes.body.find((b) => b.category === 'Groceries');
    expect(updatedGrocery.spentAmount).toBe(950);
    expect(updatedGrocery.alertStatus).toBe('red');
  });

  describe('Step 4D.1: [AUD-CORR-004] Budget Period Conditional Validation & Duplicate Guard', () => {
    test('POST /api/budgets rejects monthly budget missing month field with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Dining Out',
          period: 'monthly',
          year: 2025,
          amount: 2500,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errors = res.body.errors || [];
      expect(errors.some((e) => e.field === 'month' || e.message.includes('Month is required'))).toBe(true);
    });

    test('POST /api/budgets rejects monthly budget containing forbidden quarter field with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Dining Out',
          period: 'monthly',
          year: 2025,
          month: 5,
          quarter: 2,
          amount: 2500,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errors = res.body.errors || [];
      expect(errors.some((e) => e.field === 'quarter' || e.message.includes('Quarter must not be set'))).toBe(true);
    });

    test('POST /api/budgets rejects quarterly budget missing quarter field with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Healthcare',
          period: 'quarterly',
          year: 2025,
          amount: 6000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errors = res.body.errors || [];
      expect(errors.some((e) => e.field === 'quarter' || e.message.includes('Quarter is required'))).toBe(true);
    });

    test('POST /api/budgets rejects yearly budget containing forbidden month or quarter with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Insurance',
          period: 'yearly',
          year: 2025,
          month: 1,
          amount: 15000,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      const errors = res.body.errors || [];
      expect(errors.some((e) => e.field === 'month' || e.message.includes('Month and quarter must not be set'))).toBe(true);
    });

    test('POST /api/budgets rejects duplicate active monthly budget with HTTP 409 Conflict', async () => {
      // First submission succeeds
      const firstRes = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Utilities',
          period: 'monthly',
          year: 2025,
          month: 6,
          amount: 1200,
        });
      expect(firstRes.status).toBe(201);

      // Duplicate submission rejected with HTTP 409
      const dupRes = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Utilities',
          period: 'monthly',
          year: 2025,
          month: 6,
          amount: 1500,
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toMatch(/already exists|conflict/i);
    });

    test('POST /api/budgets rejects duplicate active yearly budget with HTTP 409 Conflict', async () => {
      const firstRes = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Vacation',
          period: 'yearly',
          year: 2025,
          amount: 30000,
        });
      expect(firstRes.status).toBe(201);

      const dupRes = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Vacation',
          period: 'yearly',
          year: 2025,
          amount: 35000,
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toMatch(/already exists|conflict/i);
    });

    test('PUT /api/budgets/:id rejects attempts to modify period or year with HTTP 400', async () => {
      const budget = await Budget.create({
        user: testUser._id,
        category: 'Education',
        period: 'monthly',
        year: 2025,
        month: 9,
        amount: 5000,
      });

      const putPeriodRes = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-auth-token', userToken)
        .send({ period: 'yearly' });

      expect(putPeriodRes.status).toBe(400);
      const periodErrors = putPeriodRes.body.errors || [];
      expect(
        /Period and year cannot be modified/i.test(putPeriodRes.body.message || '') ||
        periodErrors.some((e) => /Period and year cannot be modified/i.test(e.message))
      ).toBe(true);

      const putYearRes = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-auth-token', userToken)
        .send({ year: 2026 });

      expect(putYearRes.status).toBe(400);
      const yearErrors = putYearRes.body.errors || [];
      expect(
        /Period and year cannot be modified/i.test(putYearRes.body.message || '') ||
        yearErrors.some((e) => /Period and year cannot be modified/i.test(e.message))
      ).toBe(true);
    });

    test('PUT /api/budgets/:id rejects updating month on a quarterly budget with HTTP 400', async () => {
      const budget = await Budget.create({
        user: testUser._id,
        category: 'Investments',
        period: 'quarterly',
        year: 2025,
        quarter: 1,
        amount: 10000,
      });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-auth-token', userToken)
        .send({ month: 3 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Month can only be updated on monthly budgets/i);
    });

    test('PUT /api/budgets/:id rejects updating quarter on a monthly budget with HTTP 400', async () => {
      const budget = await Budget.create({
        user: testUser._id,
        category: 'Fitness',
        period: 'monthly',
        year: 2025,
        month: 2,
        amount: 800,
      });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('x-auth-token', userToken)
        .send({ quarter: 1 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Quarter can only be updated on quarterly budgets/i);
    });

    test('POST /api/budgets allows creating budget when an older one for same period was soft-deleted', async () => {
      const budget = await Budget.create({
        user: testUser._id,
        category: 'Electronics',
        period: 'monthly',
        year: 2025,
        month: 11,
        amount: 4000,
      });

      // Soft delete the budget
      await budget.softDelete();

      // Create new budget for same category/period/year/month
      const recreateRes = await request(app)
        .post('/api/budgets')
        .set('x-auth-token', userToken)
        .send({
          category: 'Electronics',
          period: 'monthly',
          year: 2025,
          month: 11,
          amount: 4500,
        });

      expect(recreateRes.status).toBe(201);
      expect(recreateRes.body.amount).toBe(4500);
    });
  });
});
