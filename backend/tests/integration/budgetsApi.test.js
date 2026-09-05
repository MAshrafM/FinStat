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
});
