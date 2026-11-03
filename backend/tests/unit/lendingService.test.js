// backend/tests/unit/lendingService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const Person = require('../../models/Person');
const Loan = require('../../models/Loan');
const {
  normalizeMiddayUTC,
  computeRunningBalance,
  validateNewTransaction,
  validateTransactionDeletion,
  recalculateLoanStatus,
  getPersonAggregate,
  getSummaryAggregate,
} = require('../../services/lendingService');
const { BadRequestError } = require('../../utils/errors');

describe('Step 7A.5.1: Lending Service Unit Tests [FEAT-005]', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('1. computeRunningBalance: calculates correct running balance across alternating borrow and repay transactions', () => {
    const txs = [
      { type: 'borrow', amountInPiastres: 100000, date: new Date('2026-01-01') },
      { type: 'repay', amountInPiastres: 20000, date: new Date('2026-01-05') },
      { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-10') },
      { type: 'repay', amountInPiastres: 30000, date: new Date('2026-01-15') },
    ];

    const result = computeRunningBalance(txs);
    expect(result).toHaveLength(4);
    expect(result[0].runningBalanceInPiastres).toBe(100000);
    expect(result[1].runningBalanceInPiastres).toBe(80000);
    expect(result[2].runningBalanceInPiastres).toBe(130000);
    expect(result[3].runningBalanceInPiastres).toBe(100000);
  });

  test('2. computeRunningBalance: handles out-of-order transaction dates by sorting chronologically', () => {
    const txs = [
      { type: 'repay', amountInPiastres: 30000, date: new Date('2026-01-15') },
      { type: 'borrow', amountInPiastres: 100000, date: new Date('2026-01-01') },
      { type: 'repay', amountInPiastres: 20000, date: new Date('2026-01-05') },
    ];

    const result = computeRunningBalance(txs);
    expect(result[0].date).toEqual(new Date('2026-01-01'));
    expect(result[0].runningBalanceInPiastres).toBe(100000);
    expect(result[1].date).toEqual(new Date('2026-01-05'));
    expect(result[1].runningBalanceInPiastres).toBe(80000);
    expect(result[2].date).toEqual(new Date('2026-01-15'));
    expect(result[2].runningBalanceInPiastres).toBe(50000);
  });

  test('3. recalculateLoanStatus: transitions loan to Repaid when balance reaches zero', () => {
    const loan = new Loan({
      user: new mongoose.Types.ObjectId(),
      person: new mongoose.Types.ObjectId(),
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
        { type: 'repay', amountInPiastres: 50000, date: new Date() },
      ],
    });

    const status = recalculateLoanStatus(loan);
    expect(status).toBe('Repaid');
    expect(loan.status).toBe('Repaid');
    expect(loan.isFullyRepaid).toBe(true);
  });

  test('4. recalculateLoanStatus: re-activates Repaid loan to Active when an additional borrow transaction is added', () => {
    const loan = new Loan({
      user: new mongoose.Types.ObjectId(),
      person: new mongoose.Types.ObjectId(),
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-10') },
        { type: 'borrow', amountInPiastres: 20000, date: new Date('2026-01-20') },
      ],
    });

    const status = recalculateLoanStatus(loan);
    expect(status).toBe('Active');
    expect(loan.status).toBe('Active');
    expect(loan.isFullyRepaid).toBe(false);
  });

  test('5. recalculateLoanStatus: preserves WrittenOff status and does not auto-activate upon borrow', () => {
    const loan = new Loan({
      user: new mongoose.Types.ObjectId(),
      person: new mongoose.Types.ObjectId(),
      status: 'WrittenOff',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'borrow', amountInPiastres: 10000, date: new Date('2026-01-20') },
      ],
    });

    const status = recalculateLoanStatus(loan);
    expect(status).toBe('WrittenOff');
    expect(loan.status).toBe('WrittenOff');
  });

  test('6. recalculateLoanStatus: preserves WrittenOff status when a repayment is added (reduces balance without status change)', () => {
    const loan = new Loan({
      user: new mongoose.Types.ObjectId(),
      person: new mongoose.Types.ObjectId(),
      status: 'WrittenOff',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 20000, date: new Date('2026-01-20') },
      ],
    });

    const status = recalculateLoanStatus(loan);
    expect(status).toBe('WrittenOff');
    expect(loan.balanceInPiastres).toBe(30000);
    expect(loan.isFullyRepaid).toBe(false);
  });

  test('7. validateNewTransaction: throws BadRequestError if repayment exceeds outstanding balance', () => {
    const loan = new Loan({
      user: new mongoose.Types.ObjectId(),
      person: new mongoose.Types.ObjectId(),
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
      ],
    });

    expect(() => {
      validateNewTransaction(loan, { type: 'repay', amountInPiastres: 60000 });
    }).toThrow(BadRequestError);
  });

  test('8. validateTransactionDeletion: throws BadRequestError if removing a borrow transaction drops final balance below zero', () => {
    const tx1Id = new mongoose.Types.ObjectId();
    const tx2Id = new mongoose.Types.ObjectId();
    const transactions = [
      { _id: tx1Id, type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
      { _id: tx2Id, type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-10') },
    ];

    expect(() => {
      validateTransactionDeletion(transactions, tx1Id.toString());
    }).toThrow(BadRequestError);
  });

  test('9. validateTransactionDeletion: throws BadRequestError if removing a borrow transaction produces a negative intermediate running balance at any row', () => {
    const tx1Id = new mongoose.Types.ObjectId();
    const tx2Id = new mongoose.Types.ObjectId();
    const tx3Id = new mongoose.Types.ObjectId();
    const tx4Id = new mongoose.Types.ObjectId();

    // Sequence: borrow 50000, repay 50000 (bal 0), borrow 100000, repay 100000 (bal 0)
    // Deleting tx1: tx2 (repay 50000) produces intermediate balance -50000, even if subsequent borrows exist
    const transactions = [
      { _id: tx1Id, type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
      { _id: tx2Id, type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-05') },
      { _id: tx3Id, type: 'borrow', amountInPiastres: 100000, date: new Date('2026-01-10') },
      { _id: tx4Id, type: 'repay', amountInPiastres: 80000, date: new Date('2026-01-15') },
    ];

    expect(() => {
      validateTransactionDeletion(transactions, tx1Id.toString());
    }).toThrow(BadRequestError);
  });

  test('10. getPersonAggregate: correctly sums balances and active loan count across multiple loans for a person, segregating written-off debt', async () => {
    const userId = new mongoose.Types.ObjectId();
    const person = await Person.create({ user: userId, name: 'Karim', note: 'Friend' });

    // Loan 1: Active, owed 30,000
    await Loan.create({
      user: userId,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
        { type: 'repay', amountInPiastres: 20000, date: new Date() },
      ],
    });

    // Loan 2: Repaid (balance 0)
    await Loan.create({
      user: userId,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 10000, date: new Date() },
        { type: 'repay', amountInPiastres: 10000, date: new Date() },
      ],
    });

    // Loan 3: WrittenOff (balance 40,000)
    await Loan.create({
      user: userId,
      person: person._id,
      status: 'WrittenOff',
      transactions: [
        { type: 'borrow', amountInPiastres: 40000, date: new Date() },
      ],
    });

    const aggregate = await getPersonAggregate(userId, person._id);
    expect(aggregate.totalOutstandingInPiastres).toBe(30000);
    expect(aggregate.activeLoanCount).toBe(1);
    expect(aggregate.writtenOffCount).toBe(1);
    expect(aggregate.totalWrittenOffInPiastres).toBe(40000);
  });

  test('11. getSummaryAggregate with { periodStart, periodEnd }: excludes transactions with date < periodStart from totalBorrowed and totalRepaid', async () => {
    const userId = new mongoose.Types.ObjectId();
    const person = await Person.create({ user: userId, name: 'Hany' });

    await Loan.create({
      user: userId,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 100000, date: new Date('2023-06-01T12:00:00.000Z') },
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2024-06-01T12:00:00.000Z') },
        { type: 'repay', amountInPiastres: 20000, date: new Date('2024-08-01T12:00:00.000Z') },
      ],
    });

    const summary = await getSummaryAggregate(userId, {
      periodStart: new Date('2024-01-01T00:00:00.000Z'),
      periodEnd: new Date('2024-12-31T23:59:59.999Z'),
    });

    // In 2024: only borrowed 50,000 and repaid 20,000
    expect(summary.totalBorrowed).toBe(50000);
    expect(summary.totalRepaid).toBe(20000);
  });

  test('12. getSummaryAggregate with { periodEnd }: returns totalOutstanding reflecting loans active at that period-end date, rather than current balance', async () => {
    const userId = new mongoose.Types.ObjectId();
    const person = await Person.create({ user: userId, name: 'Sami' });

    // Loan borrowed in 2023 (100,000), repaid in 2024 (50,000)
    await Loan.create({
      user: userId,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 100000, date: new Date('2023-01-15T12:00:00.000Z') },
        { type: 'repay', amountInPiastres: 50000, date: new Date('2024-06-01T12:00:00.000Z') },
      ],
    });

    // Evaluated at year-end 2023: outstanding should be 100,000 (not current 50,000)
    const summary2023 = await getSummaryAggregate(userId, {
      periodStart: new Date('2023-01-01T00:00:00.000Z'),
      periodEnd: new Date('2023-12-31T23:59:59.999Z'),
    });
    expect(summary2023.totalOutstanding).toBe(100000);

    // Current summary (no period args): outstanding should be 50,000
    const currentSummary = await getSummaryAggregate(userId);
    expect(currentSummary.totalOutstanding).toBe(50000);
  });
});
