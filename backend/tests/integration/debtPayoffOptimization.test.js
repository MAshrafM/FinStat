// backend/tests/integration/debtPayoffOptimization.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');

jest.setTimeout(60000);

describe('Debt Payoff Optimization Integration Tests [AUD-PERF-003]', () => {
  let user;
  let token;
  let authHeader;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'debt_opt_user',
      email: 'debt_opt@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
    authHeader = `Bearer ${token}`;
  });

  test('calculates debt payoff schedule executing exactly ONE aggregation query regardless of card count', async () => {
    // Seed 5 cards for the user
    const cards = [];
    for (let i = 1; i <= 5; i++) {
      const card = await CreditCard.create({
        user: user._id,
        name: `Credit Card ${i}`,
        bank: `Bank ${i}`,
        limit: 20000,
        apr: 18 + i,
        minimumPaymentPercent: 5,
        billingCycleDay: 1,
        paymentDueDay: 25,
      });
      cards.push(card);

      // Seed 2 transactions per card (one Purchase, one Installment)
      await CardTransaction.create({
        user: user._id,
        card: card._id,
        description: `Purchase for Card ${i}`,
        category: 'Shopping',
        amount: 2000,
        amountInPiastres: 200000,
        paidAmount: 500,
        paidAmountInPiastres: 50000,
        currency: 'EGP',
        date: new Date('2026-05-10'),
        type: 'Purchase',
        status: 'Due',
      });

      await CardTransaction.create({
        user: user._id,
        card: card._id,
        description: `Installment for Card ${i}`,
        category: 'Electronics',
        amount: 3000,
        amountInPiastres: 300000,
        paidAmount: 0,
        paidAmountInPiastres: 0,
        currency: 'EGP',
        date: new Date('2026-05-12'),
        type: 'Installment',
        status: 'Due',
      });
    }

    const aggregateSpy = jest.spyOn(CardTransaction, 'aggregate');

    const res = await request(app)
      .post('/api/debt-payoff/calculate')
      .set('Authorization', authHeader)
      .send({
        strategy: 'snowball',
        monthlyBudget: 3000,
      });

    expect(res.status).toBe(200);
    expect(res.body.strategy).toBe('snowball');
    expect(res.body.cards).toHaveLength(5);

    // In the legacy unoptimized code, CardTransaction.aggregate was called 2N times (10 times for 5 cards).
    // The optimized route must execute CardTransaction.aggregate exactly ONCE across all cards.
    expect(aggregateSpy).toHaveBeenCalledTimes(1);

    aggregateSpy.mockRestore();
  });

  test('produces accurate balance and payoff schedules with correct piastre conversions', async () => {
    const cardA = await CreditCard.create({
      user: user._id,
      name: 'Card Alpha',
      bank: 'CIB',
      limit: 30000,
      apr: 24,
      minimumPaymentPercent: 5,
      billingCycleDay: 1,
      paymentDueDay: 25,
    });

    // Net balance = (3000 - 1000) = 2000 EGP
    await CardTransaction.create({
      user: user._id,
      card: cardA._id,
      description: 'Alpha Purchase',
      category: 'General',
      amount: 3000,
      amountInPiastres: 300000,
      paidAmount: 1000,
      paidAmountInPiastres: 100000,
      currency: 'EGP',
      date: new Date('2026-06-01'),
      type: 'Purchase',
      status: 'Due',
    });

    const res = await request(app)
      .post('/api/debt-payoff/calculate')
      .set('Authorization', authHeader)
      .send({
        strategy: 'snowball',
        monthlyBudget: 2500,
      });

    expect(res.status).toBe(200);
    expect(res.body.cards).toHaveLength(1);

    const payloadCard = res.body.cards[0];
    expect(payloadCard.name).toBe('Card Alpha');
    expect(payloadCard.balanceInPiastres).toBe(200000); // 2000 * 100
    // minPayment = Math.max(2000 * 0.05, 50) = 100 EGP -> 10,000 piastres
    expect(payloadCard.minimumPaymentInPiastres).toBe(10000);
    expect(res.body.schedule).toBeInstanceOf(Array);
    expect(res.body.schedule.length).toBeGreaterThan(0);
  });

  test('handles cards with zero balance without adding them to cardsPayload', async () => {
    // Card with zero balance (paid in full)
    const cardPaid = await CreditCard.create({
      user: user._id,
      name: 'Paid Off Card',
      bank: 'NBE',
      limit: 15000,
      apr: 20,
      minimumPaymentPercent: 5,
      billingCycleDay: 1,
      paymentDueDay: 25,
    });

    await CardTransaction.create({
      user: user._id,
      card: cardPaid._id,
      description: 'Paid Transaction',
      category: 'Groceries',
      amount: 1500,
      amountInPiastres: 150000,
      paidAmount: 1500,
      paidAmountInPiastres: 150000,
      currency: 'EGP',
      date: new Date('2026-06-05'),
      type: 'Purchase',
      status: 'Paid', // Not Due or Partial
    });

    const res = await request(app)
      .post('/api/debt-payoff/calculate')
      .set('Authorization', authHeader)
      .send({
        strategy: 'avalanche',
        monthlyBudget: 2000,
      });

    expect(res.status).toBe(200);
    expect(res.body.cards).toHaveLength(0);
    expect(res.body.schedule).toHaveLength(0);
  });

  test('mix of zero-balance and active-balance cards includes ONLY positive balance cards in cardsPayload and schedule [AUD-TEST-DEBT-001]', async () => {
    // 1. Zero-balance card (paid off)
    const cardZero = await CreditCard.create({
      user: user._id,
      name: 'Zero Balance Card',
      bank: 'CIB',
      limit: 20000,
      apr: 22,
      minimumPaymentPercent: 5,
      billingCycleDay: 1,
      paymentDueDay: 25,
    });
    await CardTransaction.create({
      user: user._id,
      card: cardZero._id,
      description: 'Fully Paid Transaction',
      category: 'Utilities',
      amount: 1000,
      amountInPiastres: 100000,
      paidAmount: 1000,
      paidAmountInPiastres: 100000,
      currency: 'EGP',
      date: new Date('2026-06-05'),
      type: 'Purchase',
      status: 'Paid',
    });

    // 2. Active card with outstanding balance (5,000 EGP)
    const cardActive = await CreditCard.create({
      user: user._id,
      name: 'Active Debt Card',
      bank: 'HSBC',
      limit: 30000,
      apr: 24,
      minimumPaymentPercent: 5,
      billingCycleDay: 5,
      paymentDueDay: 28,
    });
    await CardTransaction.create({
      user: user._id,
      card: cardActive._id,
      description: 'Pending Debt Transaction',
      category: 'Electronics',
      amount: 5000,
      amountInPiastres: 500000,
      paidAmount: 0,
      paidAmountInPiastres: 0,
      currency: 'EGP',
      date: new Date('2026-06-10'),
      type: 'Purchase',
      status: 'Due',
    });

    const res = await request(app)
      .post('/api/debt-payoff/calculate')
      .set('Authorization', authHeader)
      .send({
        strategy: 'snowball',
        monthlyBudget: 2500,
      });

    expect(res.status).toBe(200);
    // Only the active card should be included
    expect(res.body.cards).toHaveLength(1);
    expect(res.body.cards[0].name).toBe('Active Debt Card');
    expect(res.body.cards[0].balanceInPiastres).toBe(500000);

    // Schedule should be computed only for the active card
    expect(res.body.schedule.length).toBeGreaterThan(0);
    const scheduledCardIds = new Set(res.body.schedule.map(s => s.cardId.toString()));
    expect(scheduledCardIds.has(cardActive._id.toString())).toBe(true);
    expect(scheduledCardIds.has(cardZero._id.toString())).toBe(false);
  });
});

