// backend/tests/integration/recurringSuggestionsApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');
const RecurringSuggestion = require('../../models/RecurringSuggestion');

jest.setTimeout(60000);

describe('Recurring Suggestions API Integration Tests', () => {
  let testUser;
  let userToken;

  beforeAll(async () => {
    await connectDB();

    const username = 'recur_test_user';
    const existing = await User.findOne({ username });
    if (existing) {
      await Expenditure.deleteMany({ user: existing._id });
      await RecurringSuggestion.deleteMany({ user: existing._id });
      await User.deleteOne({ _id: existing._id });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      username,
      email: 'recur_user@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    userToken = jwt.sign(
      { user: { id: testUser._id.toString(), role: testUser.role } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Seed 3 monthly rent expenditures (~30 days apart)
    const baseDate = new Date('2026-01-01T10:00:00Z');
    for (let i = 0; i < 3; i++) {
      const expDate = new Date(baseDate);
      expDate.setDate(baseDate.getDate() + i * 30);

      await Expenditure.create({
        user: testUser._id,
        date: expDate,
        transactionValue: 5000,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Rent & Housing'],
        description: 'Monthly Apartment Rent',
      });
    }
  });

  afterAll(async () => {
    if (testUser) {
      await Expenditure.deleteMany({ user: testUser._id });
      await RecurringSuggestion.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await mongoose.connection.close();
  });

  test('POST /api/recurring-suggestions/detect identifies recurring rent pattern', async () => {
    const res = await request(app)
      .post('/api/recurring-suggestions/detect')
      .set('x-auth-token', userToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThanOrEqual(1);

    const rentSuggestion = res.body.suggestions.find(
      (s) => s.description === 'Monthly Apartment Rent'
    );
    expect(rentSuggestion).toBeDefined();
    expect(rentSuggestion.frequency).toBe('monthly');
    expect(rentSuggestion.confidenceScore).toBeGreaterThanOrEqual(50);
  });

  test('GET /api/recurring-suggestions lists detected pending suggestions', async () => {
    const res = await request(app)
      .get('/api/recurring-suggestions?isAccepted=false')
      .set('x-auth-token', userToken);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/recurring-suggestions/:id/accept marks suggestion and flags expenditures', async () => {
    const listRes = await request(app)
      .get('/api/recurring-suggestions')
      .set('x-auth-token', userToken);

    const suggestionId = listRes.body.data[0]._id;

    const acceptRes = await request(app)
      .post(`/api/recurring-suggestions/${suggestionId}/accept`)
      .set('x-auth-token', userToken)
      .send({ frequency: 'monthly' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.suggestion.isAccepted).toBe(true);
    expect(acceptRes.body.flaggedExpendituresCount).toBe(3);

    // Verify expenditures now have isRecurring true
    const flagged = await Expenditure.find({
      user: testUser._id,
      isRecurring: true,
    });
    expect(flagged.length).toBe(3);
  });
});
