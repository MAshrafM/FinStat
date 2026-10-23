// backend/tests/integration/creditCardStatementDue.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const CardPayment = require('../../models/CardPayment');

jest.setTimeout(60000);

describe('Step 4A.1: [AUD-CORR-001] Credit Card Statement Due & Interest Calculation', () => {
  let user;
  let token;
  let card;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    user = await User.create({
      username: 'card_statement_user',
      email: 'statement@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);

    // Create card with 36% APR (3% monthly interest rate)
    card = await CreditCard.create({
      user: user._id,
      name: 'CIB Platinum Visa',
      bank: 'CIB',
      limit: 100000,
      billingCycleDay: 25,
      statementCloseDay: 25,
      paymentDueDay: 15,
      apr: 36, // 36% annual percentage rate
    });
  });

  it('should return numeric interestOnUnpaid and amountDueThisMonth instead of NaN when unpaidBeforeCycle > 0', async () => {
    const now = new Date();
    // Prior cycle date (before cycleStart)
    const priorDate = new Date(now.getFullYear(), now.getMonth() - 2, 10);
    // Current cycle date
    const currentDate = new Date(now.getFullYear(), now.getMonth(), 10);

    // 1. Previous unpaid transaction from prior cycle: 5,000 EGP
    await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Prior Cycle Unpaid Purchase',
      amount: 5000,
      amountInPiastres: 500000,
      date: priorDate,
      type: 'Purchase',
      status: 'Due',
      paidAmount: 0,
      paidAmountInPiastres: 0,
    });

    // 2. Current cycle transactions matching test vector:
    // Charges: 12,500.50 EGP, Payment: 5,000.00 EGP, Refund: -1,200.00 EGP -> Net current purchases: 6,300.50 EGP
    await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Current Cycle Purchase 1',
      amount: 12500.50,
      amountInPiastres: 1250050,
      date: currentDate,
      type: 'Purchase',
      status: 'Due',
      paidAmount: 5000.00,
      paidAmountInPiastres: 500000,
    });

    await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Current Cycle Refund / Adjustment',
      amount: -1200.00,
      amountInPiastres: -120000,
      date: currentDate,
      type: 'Purchase',
      status: 'Due',
      paidAmount: 0,
      paidAmountInPiastres: 0,
    });

    const res = await request(app)
      .get(`/api/credit-cards/summary/${card._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Assert that calculations do NOT evaluate to NaN
    expect(res.body.interestOnUnpaid).not.toBeNull();
    expect(Number.isNaN(res.body.interestOnUnpaid)).toBe(false);
    expect(res.body.amountDueThisMonth).not.toBeNull();
    expect(Number.isNaN(res.body.amountDueThisMonth)).toBe(false);

    // Monthly APR rate is 36% / 100 / 12 = 0.03
    // Interest on 5,000 EGP = 5,000 * 0.03 = 150.00 EGP
    expect(res.body.interestOnUnpaid).toBeCloseTo(150.00, 2);

    // Net current purchase due = 12,500.50 - 5,000.00 - 1,200.00 = 6,300.50 EGP
    expect(res.body.totalPurchaseDue).toBeCloseTo(6300.50, 2);

    // Total amountDueThisMonth = 6,300.50 + 150.00 = 6,450.50 EGP
    expect(res.body.amountDueThisMonth).toBeCloseTo(6450.50, 2);
  });

  it('should evaluate amountDueThisMonth to exact net purchases when previous unpaid balance is zero', async () => {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), 10);

    // Charges 12,500.50 - Paid 5,000 - Refund 1,200 = 6,300.50
    await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Current Cycle Electronics',
      amount: 12500.50,
      amountInPiastres: 1250050,
      date: currentDate,
      type: 'Purchase',
      status: 'Due',
      paidAmount: 5000.00,
      paidAmountInPiastres: 500000,
    });

    await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Merchant Refund',
      amount: -1200.00,
      amountInPiastres: -120000,
      date: currentDate,
      type: 'Purchase',
      status: 'Due',
      paidAmount: 0,
      paidAmountInPiastres: 0,
    });

    const res = await request(app)
      .get(`/api/credit-cards/summary/${card._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.interestOnUnpaid).toBe(0);
    expect(res.body.totalPurchaseDue).toBeCloseTo(6300.50, 2);
    expect(res.body.amountDueThisMonth).toBeCloseTo(6300.50, 2);
  });
});
