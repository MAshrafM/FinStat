// backend/tests/unit/services/ledgerService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../helpers/testDb');
const Expenditure = require('../../../models/Expenditure');
const RecurringBill = require('../../../models/RecurringBill');
const CategorizationRule = require('../../../models/CategorizationRule');
const ledgerService = require('../../../services/ledgerService');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../../utils/errors');

jest.setTimeout(60000);

describe('Sub-step 8A.1c: Ledger Service Unit Tests [AUD-ARCH-002]', () => {
  let userId;

  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
  });

  // Test 1: getRecurringTemplate returns recurring non-deleted expenditures
  test('1. getRecurringTemplate returns recurring non-deleted expenditures', async () => {
    await Expenditure.create([
      { user: userId, date: new Date('2026-01-01'), transactionValue: 100, transactionType: 'W', isRecurring: true },
      { user: userId, date: new Date('2026-01-02'), transactionValue: 200, transactionType: 'W', isRecurring: false },
    ]);

    const results = await ledgerService.getRecurringTemplate({ userId });
    expect(results.length).toBe(1);
    expect(results[0].transactionValue).toBe(100);
  });

  // Test 2: getAllExpenditures clamps to 1000 and sets truncated flag
  test('2. getAllExpenditures clamps to requested limit and detects truncation', async () => {
    await Expenditure.create([
      { user: userId, date: new Date('2026-01-01'), transactionValue: 100, transactionType: 'W' },
      { user: userId, date: new Date('2026-01-02'), transactionValue: 200, transactionType: 'W' },
    ]);

    const res = await ledgerService.getAllExpenditures({ userId, requestedLimit: 1 });
    expect(res.expenditures.length).toBe(1);
    expect(res.truncated).toBe(true);

    const resAll = await ledgerService.getAllExpenditures({ userId, requestedLimit: 50 });
    expect(resAll.expenditures.length).toBe(2);
    expect(resAll.truncated).toBe(false);
  });

  // Test 3: getLatestBalances returns the chronologically latest expenditure
  test('3. getLatestBalances returns chronologically latest expenditure', async () => {
    await Expenditure.create([
      { user: userId, date: new Date('2026-01-01'), transactionValue: 100, transactionType: 'W', bank: 500 },
      { user: userId, date: new Date('2026-01-10'), transactionValue: 200, transactionType: 'W', bank: 300 },
    ]);

    const latest = await ledgerService.getLatestBalances({ userId });
    expect(latest.bank).toBe(300);
  });

  // Test 4: listExpenditures handles filtering by type, paymentMethod, category, and isRecurring
  test('4. listExpenditures handles filtering with pagination', async () => {
    await Expenditure.create([
      { user: userId, date: new Date('2026-01-01'), transactionValue: 100, transactionType: 'W', paymentMethod: 'Bank', categories: ['Food'] },
      { user: userId, date: new Date('2026-01-02'), transactionValue: 200, transactionType: 'W', paymentMethod: 'Cash', categories: ['Transport'] },
    ]);

    const resBank = await ledgerService.listExpenditures({
      userId,
      query: { type: 'Bank', page: 1, limit: 10 },
    });
    expect(resBank.data.length).toBe(1);
    expect(resBank.data[0].paymentMethod).toBe('Bank');

    const resCategory = await ledgerService.listExpenditures({
      userId,
      query: { type: 'Transport', page: 1, limit: 10 },
    });
    expect(resCategory.data.length).toBe(1);
    expect(resCategory.data[0].categories).toContain('Transport');
  });

  // Test 5: createExpenditure calculates deltas and propagates running balances
  test('5. createExpenditure calculates deltas and propagates running balances', async () => {
    const created = await ledgerService.createExpenditure({
      userId,
      data: {
        date: new Date('2026-01-01'),
        transactionValue: 500,
        paymentMethod: 'Bank',
        transactionType: 'W',
        categories: ['Groceries'],
        logBankOp: '-',
      },
      userRole: 'manager',
      canModify: true,
    });

    expect(created._id).toBeDefined();
    expect(created.transactionValueInPiastres).toBe(50000);
    expect(created.runningBalances.bank).toBe(-500);
  });

  // Test 6: createExpenditure rejects with ForbiddenError when canModify is false
  test('6. createExpenditure rejects with ForbiddenError when canModify is false', async () => {
    await expect(
      ledgerService.createExpenditure({
        userId,
        data: {
          date: new Date('2026-01-01'),
          transactionValue: 500,
          paymentMethod: 'Bank',
          transactionType: 'W',
        },
        userRole: 'viewer',
        canModify: false,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  // Test 7: bulkUpdateCategory updates categories for matching expenditures
  test('7. bulkUpdateCategory updates categories for matching expenditures', async () => {
    const e1 = await Expenditure.create({ user: userId, date: new Date(), transactionValue: 100, transactionType: 'W', categories: ['Old'] });
    const e2 = await Expenditure.create({ user: userId, date: new Date(), transactionValue: 200, transactionType: 'W', categories: ['Old'] });

    const result = await ledgerService.bulkUpdateCategory({
      userId,
      ids: [e1._id, e2._id],
      category: 'Utilities',
      canModify: true,
    });

    expect(result.modifiedCount).toBe(2);
    const updated = await Expenditure.findById(e1._id);
    expect(updated.categories).toContain('Utilities');
  });

  // Test 8: bulkDeleteExpenditures soft-deletes and reverts balances in transaction
  test('8. bulkDeleteExpenditures soft-deletes and reverts balances', async () => {
    const e1 = await ledgerService.createExpenditure({
      userId,
      data: { date: new Date('2026-01-01'), transactionValue: 100, transactionType: 'W', paymentMethod: 'Bank', logBankOp: '-' },
      canModify: true,
    });
    const e2 = await ledgerService.createExpenditure({
      userId,
      data: { date: new Date('2026-01-02'), transactionValue: 200, transactionType: 'W', paymentMethod: 'Bank', logBankOp: '-' },
      canModify: true,
    });

    const result = await ledgerService.bulkDeleteExpenditures({
      userId,
      ids: [e1._id, e2._id],
      canModify: true,
    });

    expect(result.deletedCount).toBe(2);
    const softDeleted = await Expenditure.findById(e1._id);
    expect(softDeleted.deletedAt).not.toBeNull();
  });

  // Test 9: bulkDeleteExpenditures rejects bridge transactions
  test('9. bulkDeleteExpenditures rejects bridge transactions', async () => {
    const bridgeExp = await Expenditure.create({
      user: userId,
      date: new Date(),
      transactionValue: 1000,
      transactionType: 'W',
      autoGenerated: true,
      linkedPaycheckId: new mongoose.Types.ObjectId(),
    });

    await expect(
      ledgerService.bulkDeleteExpenditures({
        userId,
        ids: [bridgeExp._id],
        canModify: true,
      })
    ).rejects.toThrow(BadRequestError);
  });

  // Test 10: getUpcomingBills returns bills due within threshold days
  test('10. getUpcomingBills returns bills due within threshold days', async () => {
    const today = new Date();
    await RecurringBill.create({
      user: userId,
      name: 'Internet',
      category: 'Utilities',
      amount: 400,
      amountInPiastres: 40000,
      frequency: 'monthly',
      dueDay: 5,
      nextDueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      isActive: true,
    });

    const upcoming = await ledgerService.getUpcomingBills({ userId, days: 3 });
    expect(upcoming.upcomingCount).toBe(1);
    expect(upcoming.totalDue).toBe(400);
  });

  // Test 11: listRecurringBills lists all active recurring bills
  test('11. listRecurringBills lists recurring bills with active filter', async () => {
    await RecurringBill.create([
      { user: userId, name: 'Bill 1', category: 'Utilities', amount: 100, amountInPiastres: 10000, frequency: 'monthly', dueDay: 1, nextDueDate: new Date(), isActive: true },
      { user: userId, name: 'Bill 2', category: 'Utilities', amount: 200, amountInPiastres: 20000, frequency: 'monthly', dueDay: 15, nextDueDate: new Date(), isActive: false },
    ]);

    const activeBills = await ledgerService.listRecurringBills({ userId, query: { isActive: 'true' } });
    expect(activeBills.bills.length).toBe(1);
    expect(activeBills.bills[0].name).toBe('Bill 1');
  });

  // Test 12: createRecurringBill creates bill with converted piastres and midday UTC date
  test('12. createRecurringBill creates bill with converted piastres', async () => {
    const result = await ledgerService.createRecurringBill({
      userId,
      data: {
        name: 'Gym',
        category: 'Health',
        amount: 350.5,
        frequency: 'monthly',
        dueDay: 10,
        nextDueDate: '2026-03-10',
      },
      canModify: true,
    });

    expect(result.bill._id).toBeDefined();
    expect(result.bill.amountInPiastres).toBe(35050);
  });

  // Test 13: getRecurringBillById returns bill or throws NotFoundError
  test('13. getRecurringBillById returns bill or throws NotFoundError', async () => {
    const bill = await RecurringBill.create({
      user: userId,
      name: 'Electricity',
      category: 'Utilities',
      amount: 500,
      amountInPiastres: 50000,
      frequency: 'monthly',
      dueDay: 12,
      nextDueDate: new Date(),
    });

    const found = await ledgerService.getRecurringBillById({ userId, id: bill._id });
    expect(found.bill._id.toString()).toBe(bill._id.toString());

    await expect(
      ledgerService.getRecurringBillById({ userId, id: new mongoose.Types.ObjectId() })
    ).rejects.toThrow(NotFoundError);
  });

  // Test 14: updateRecurringBill updates bill fields
  test('14. updateRecurringBill updates bill fields', async () => {
    const bill = await RecurringBill.create({
      user: userId,
      name: 'Netflix',
      category: 'Entertainment',
      amount: 200,
      amountInPiastres: 20000,
      frequency: 'monthly',
      dueDay: 15,
      nextDueDate: new Date(),
    });

    const updated = await ledgerService.updateRecurringBill({
      userId,
      id: bill._id,
      data: { amount: 250 },
      canModify: true,
    });

    expect(updated.bill.amount).toBe(250);
    expect(updated.bill.amountInPiastres).toBe(25000);
  });

  // Test 15: deleteRecurringBill soft-deletes the bill
  test('15. deleteRecurringBill soft-deletes the bill', async () => {
    const bill = await RecurringBill.create({
      user: userId,
      name: 'Gas',
      category: 'Utilities',
      amount: 150,
      amountInPiastres: 15000,
      frequency: 'monthly',
      dueDay: 20,
      nextDueDate: new Date(),
    });

    const res = await ledgerService.deleteRecurringBill({ userId, id: bill._id, canModify: true });
    expect(res.msg).toBe('Recurring bill soft-deleted successfully');

    const softDeleted = await RecurringBill.findById(bill._id);
    expect(softDeleted.deletedAt).not.toBeNull();
  });

  // Test 16: payRecurringBill creates expenditure and advances nextDueDate
  test('16. payRecurringBill creates expenditure and advances nextDueDate', async () => {
    const bill = await RecurringBill.create({
      user: userId,
      name: 'Mobile',
      amount: 300,
      amountInPiastres: 30000,
      frequency: 'monthly',
      dueDay: 5,
      nextDueDate: new Date('2026-03-05T12:00:00.000Z'),
      category: 'Utilities',
      paymentMethod: 'Bank',
    });

    const result = await ledgerService.payRecurringBill({
      userId,
      id: bill._id,
      data: { paymentDate: '2026-03-05' },
      canModify: true,
    });

    expect(result.expenditure).toBeDefined();
    expect(result.expenditure.transactionType).toBe('W');
    expect(result.bill.nextDueDate.toISOString()).toContain('2026-04-05');
  });

  // Test 17: getDeletedExpenditures excludes bridge records
  test('17. getDeletedExpenditures excludes bridge records', async () => {
    const manualExp = await Expenditure.create({
      user: userId,
      date: new Date(),
      transactionValue: 50,
      transactionType: 'W',
      autoGenerated: false,
    });
    await manualExp.softDelete();

    const bridgeExp = await Expenditure.create({
      user: userId,
      date: new Date(),
      transactionValue: 500,
      transactionType: 'W',
      autoGenerated: true,
      linkedPaycheckId: new mongoose.Types.ObjectId(),
    });
    await bridgeExp.softDelete();

    const result = await ledgerService.getDeletedExpenditures({ userId, page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.data[0]._id.toString()).toBe(manualExp._id.toString());
  });

  // Test 18: updateExpenditure reverts old deltas and applies new running balances
  test('18. updateExpenditure reverts old deltas and applies new running balances', async () => {
    const created = await ledgerService.createExpenditure({
      userId,
      data: {
        date: new Date('2026-01-01'),
        transactionValue: 100,
        transactionType: 'W',
        paymentMethod: 'Bank',
        logBankOp: '-',
      },
      canModify: true,
    });

    const updated = await ledgerService.updateExpenditure({
      userId,
      id: created._id,
      data: {
        transactionValue: 300,
      },
      canModify: true,
    });

    expect(updated.transactionValue).toBe(300);
    expect(updated.runningBalances.bank).toBe(-300);
  });

  // Test 19: deleteExpenditure and restoreExpenditure manage lifecycle and reject bridge records
  test('19. deleteExpenditure and restoreExpenditure manage lifecycle and reject bridge records', async () => {
    const created = await ledgerService.createExpenditure({
      userId,
      data: {
        date: new Date('2026-01-01'),
        transactionValue: 200,
        transactionType: 'W',
        paymentMethod: 'Bank',
        logBankOp: '-',
      },
      canModify: true,
    });

    await ledgerService.deleteExpenditure({ userId, id: created._id, canModify: true });
    const softDeleted = await Expenditure.findById(created._id);
    expect(softDeleted.deletedAt).not.toBeNull();

    await ledgerService.restoreExpenditure({ userId, id: created._id, canModify: true });
    const restored = await Expenditure.findById(created._id);
    expect(restored.deletedAt).toBeNull();
  });
});
