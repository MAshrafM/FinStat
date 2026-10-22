// backend/tests/integration/cardSettlementAtomicity.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const CardPayment = require('../../models/CardPayment');
const Expenditure = require('../../models/Expenditure');

jest.setTimeout(60000);

describe('Card Settlement Atomicity & Session Teardown Integration Tests', () => {
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
      username: 'atomicity_test_user',
      email: 'atomicity@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);

    card = await CreditCard.create({
      user: user._id,
      name: 'Atomicity CIB Card',
      bank: 'CIB',
      limit: 50000,
      billingCycleDay: 25,
    });

    // Seed initial bank balance expenditure
    await Expenditure.create({
      user: user._id,
      date: new Date('2026-10-01T10:00:00Z'),
      transactionValue: 10000,
      transactionValueInPiastres: 1000000,
      transactionType: 'T',
      paymentMethod: 'Bank',
      categories: ['Salary & Income'],
      bank: 10000,
      bankInPiastres: 1000000,
      runningBalances: { bank: 10000, cash: 0, prepaid: 0 },
      runningBalancesInPiastres: { bank: 1000000, cash: 0, prepaid: 0 },
    });
  });

  it('should rollback CardPayment and CardTransaction status completely when expenditure creation fails mid-transaction', async () => {
    const tx = await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Supermarket Grocery Purchase',
      category: 'Groceries',
      amount: 1500,
      amountInPiastres: 150000,
      paidAmount: 0,
      paidAmountInPiastres: 0,
      date: new Date('2026-10-05T12:00:00Z'),
      type: 'Purchase',
      status: 'Due',
    });

    // Monkey-patch Expenditure.prototype.save to simulate mid-transaction failure
    const originalSave = Expenditure.prototype.save;
    Expenditure.prototype.save = jest.fn().mockImplementation(function (...args) {
      if (this.categories && this.categories.includes('Credit Card Settlement')) {
        throw new Error('Simulated database write error during settlement expenditure creation');
      }
      return originalSave.apply(this, args);
    });

    try {
      const res = await request(app)
        .post('/api/credit-cards/payments/full')
        .set('Authorization', `Bearer ${token}`)
        .send({
          transactionId: tx._id.toString(),
          paymentSource: 'Bank',
          createExpenditure: true,
        });

      expect(res.status).toBe(500);

      // Verify that CardPayment was rolled back and never committed
      const paymentCount = await CardPayment.countDocuments({ user: user._id });
      expect(paymentCount).toBe(0);

      // Verify that CardTransaction status remains unchanged
      const freshTx = await CardTransaction.findById(tx._id);
      expect(freshTx.status).toBe('Due');
      expect(freshTx.paidAmount).toBe(0);
      expect(freshTx.paidAmountInPiastres).toBe(0);

      // Verify no orphan expenditure exists
      const expCount = await Expenditure.countDocuments({
        user: user._id,
        categories: 'Credit Card Settlement',
      });
      expect(expCount).toBe(0);
    } finally {
      Expenditure.prototype.save = originalSave;
    }
  });

  it('should rollback everything if propagateBalanceChanges updateMany fails during settlement', async () => {
    const tx = await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Online Tech Purchase',
      category: 'Electronics',
      amount: 2000,
      amountInPiastres: 200000,
      paidAmount: 0,
      paidAmountInPiastres: 0,
      date: new Date('2026-10-06T12:00:00Z'),
      type: 'Purchase',
      status: 'Due',
    });

    // Monkey-patch Expenditure.updateMany to simulate failure during propagation
    const originalUpdateMany = Expenditure.updateMany;
    Expenditure.updateMany = jest.fn().mockImplementation(() => {
      throw new Error('Simulated failure in propagateBalanceChanges updateMany');
    });

    try {
      const res = await request(app)
        .post('/api/credit-cards/payments/full')
        .set('Authorization', `Bearer ${token}`)
        .send({
          transactionId: tx._id.toString(),
          paymentSource: 'Bank',
          createExpenditure: true,
        });

      expect(res.status).toBe(500);

      // CardPayment should be rolled back
      const payments = await CardPayment.find({ user: user._id });
      expect(payments.length).toBe(0);

      // CardTransaction remains untouched
      const freshTx = await CardTransaction.findById(tx._id);
      expect(freshTx.status).toBe('Due');
      expect(freshTx.paidAmount).toBe(0);

      // No settlement expenditures committed
      const expenditures = await Expenditure.find({
        user: user._id,
        categories: 'Credit Card Settlement',
      });
      expect(expenditures.length).toBe(0);
    } finally {
      Expenditure.updateMany = originalUpdateMany;
    }
  });

  it('should successfully commit CardPayment, CardTransaction status, and Expenditure atomically on normal settlement', async () => {
    const tx = await CardTransaction.create({
      user: user._id,
      card: card._id,
      description: 'Bookstore Order',
      category: 'Education',
      amount: 500,
      amountInPiastres: 50000,
      paidAmount: 0,
      paidAmountInPiastres: 0,
      date: new Date('2026-10-07T12:00:00Z'),
      type: 'Purchase',
      status: 'Due',
    });

    const res = await request(app)
      .post('/api/credit-cards/payments/full')
      .set('Authorization', `Bearer ${token}`)
      .send({
        transactionId: tx._id.toString(),
        paymentSource: 'Bank',
        createExpenditure: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.msg).toContain('marked as paid');

    // Verify all documents are committed and linked
    const payment = await CardPayment.findOne({ user: user._id, card: card._id });
    expect(payment).toBeDefined();
    expect(payment.amount).toBe(500);
    expect(payment.linkedExpenditureId).toBeDefined();

    const updatedTx = await CardTransaction.findById(tx._id);
    expect(updatedTx.status).toBe('Paid');
    expect(updatedTx.paidAmount).toBe(500);

    const expenditure = await Expenditure.findById(payment.linkedExpenditureId);
    expect(expenditure).toBeDefined();
    expect(expenditure.transactionValue).toBe(500);
    // Bank balance should be deducted from 10000 to 9500
    expect(expenditure.runningBalances.bank).toBe(9500);
  });
});
