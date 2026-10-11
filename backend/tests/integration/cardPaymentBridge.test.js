// backend/tests/integration/cardPaymentBridge.test.js
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const CreditCard = require('../../models/CreditCard');
const CardTransaction = require('../../models/CardTransaction');
const CardPayment = require('../../models/CardPayment');
const Expenditure = require('../../models/Expenditure');
const {
  createExpenditureFromCardTransaction,
  createExpenditureFromCardPayment,
  unlinkExpenditure,
} = require('../../utils/cardPaymentBridge');

jest.setTimeout(60000);

describe('Card Payment Bridge Integration Tests', () => {
  let testUser;
  let testCard;

  beforeAll(async () => {
    await connectDB();

    // Clean up any existing test user
    await User.deleteMany({ username: 'bridge_test_user' });
    testUser = await User.create({
      username: 'bridge_test_user',
      email: 'bridge@finstat.io',
      password: 'HashedPassword123!',
      role: 'manager',
    });

    testCard = await CreditCard.create({
      user: testUser._id,
      name: 'Test CIB Visa',
      bank: 'CIB',
      limit: 50000,
      billingCycleDay: 25,
      statementCloseDay: 25,
      paymentDueDay: 15,
    });

    // Seed an initial bank topup expenditure so bank balance is 10,000 EGP
    await Expenditure.create({
      user: testUser._id,
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

  afterAll(async () => {
    if (testUser) {
      await Expenditure.deleteMany({ user: testUser._id });
      await CardTransaction.deleteMany({ user: testUser._id });
      await CardPayment.deleteMany({ user: testUser._id });
      await CreditCard.deleteMany({ user: testUser._id });
      await User.deleteMany({ _id: testUser._id });
    }
    await mongoose.connection.close();
  });

  it('should create an expenditure with real category, paidWithCreditCard: true, and 0 bank balance impact', async () => {
    const tx = new CardTransaction({
      user: testUser._id,
      card: testCard._id,
      description: 'Spinneys Groceries',
      category: 'Groceries',
      amount: 1200,
      amountInPiastres: 120000,
      date: new Date('2026-10-05T12:00:00Z'),
      type: 'Purchase',
      createExpenditure: true,
    });
    await tx.save();

    const exp = await createExpenditureFromCardTransaction(tx, testCard, testUser._id);
    expect(exp).toBeDefined();
    expect(exp.paidWithCreditCard).toBe(true);
    expect(exp.settledFromBank).toBe(false);
    expect(exp.settledAmountInPiastres).toBe(0);
    expect(exp.categories).toEqual(['Groceries']);
    expect(exp.paymentMethod).toBe('Credit Card');
    // Bank balance should remain unchanged (10000)
    expect(exp.runningBalances.bank).toBe(10000);
    expect(exp.linkedCardTransactionId.toString()).toBe(tx._id.toString());
  });

  it('should handle partial payment towards purchase: reduces bank balance and sets settledAmountInPiastres', async () => {
    // Make a 400 EGP payment from Bank
    const payment = new CardPayment({
      user: testUser._id,
      card: testCard._id,
      amount: 400,
      amountInPiastres: 40000,
      date: new Date('2026-10-10T12:00:00Z'),
      paymentSource: 'Bank',
      createExpenditure: true,
    });
    await payment.save();

    const settlementExp = await createExpenditureFromCardPayment(payment, testCard, testUser._id);
    expect(settlementExp).toBeDefined();
    expect(settlementExp.categories).toEqual(['Credit Card Settlement']);
    expect(settlementExp.settledFromBank).toBe(true);
    // Bank balance should now be reduced from 10000 to 9600
    expect(settlementExp.runningBalances.bank).toBe(9600);

    // Verify the earlier 1200 EGP purchase expenditure is now partially settled (400 / 1200)
    const updatedPurchaseExp = await Expenditure.findOne({
      user: testUser._id,
      paidWithCreditCard: true,
    });
    expect(updatedPurchaseExp.settledAmountInPiastres).toBe(40000); // 400 EGP
    expect(updatedPurchaseExp.settledFromBank).toBe(false); // Not fully settled yet
  });

  it('should fully settle purchase when subsequent payment covers remaining balance', async () => {
    // Pay remaining 800 EGP
    const payment2 = new CardPayment({
      user: testUser._id,
      card: testCard._id,
      amount: 800,
      amountInPiastres: 80000,
      date: new Date('2026-10-12T12:00:00Z'),
      paymentSource: 'Bank',
      createExpenditure: true,
    });
    await payment2.save();

    await createExpenditureFromCardPayment(payment2, testCard, testUser._id);

    const fullySettledExp = await Expenditure.findOne({
      user: testUser._id,
      paidWithCreditCard: true,
    });
    expect(fullySettledExp.settledAmountInPiastres).toBe(120000); // 1200 EGP
    expect(fullySettledExp.settledFromBank).toBe(true); // Fully settled!
  });

  it('should unlink expenditure on deletion and retain audit record without rolling back bank balance', async () => {
    const payment3 = new CardPayment({
      user: testUser._id,
      card: testCard._id,
      amount: 300,
      amountInPiastres: 30000,
      date: new Date('2026-10-15T12:00:00Z'),
      paymentSource: 'Bank',
      createExpenditure: true,
    });
    await payment3.save();

    const exp3 = await createExpenditureFromCardPayment(payment3, testCard, testUser._id);
    expect(exp3.linkedCardPaymentId.toString()).toBe(payment3._id.toString());

    // Unlink upon payment deletion
    const unlinked = await unlinkExpenditure(payment3, testUser._id);
    expect(unlinked).toBeDefined();
    expect(unlinked.linkedCardPaymentId).toBeNull();
    expect(unlinked.autoGenerated).toBe(false);
    expect(unlinked.description).toContain('expenditure retained for audit');

    // Expenditure still exists in database
    const checkExp = await Expenditure.findById(exp3._id);
    expect(checkExp).not.toBeNull();
  });
});
