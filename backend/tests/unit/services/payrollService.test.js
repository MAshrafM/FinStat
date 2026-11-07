// backend/tests/unit/services/payrollService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../helpers/testDb');
const Paycheck = require('../../../models/Paycheck');
const TaxBracket = require('../../../models/TaxBracket');
const SocialInsurance = require('../../../models/SocialInsurance');
const Expenditure = require('../../../models/Expenditure');
const payrollService = require('../../../services/payrollService');
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError } = require('../../../utils/errors');

jest.setTimeout(60000);

describe('Sub-step 8A.1a: Payroll Service Unit Tests [AUD-ARCH-002]', () => {
  const userId = new mongoose.Types.ObjectId();

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

  // Test 1: extractYear extracts year from regex pattern, fallback date, or defaults to current year
  test('1. extractYear extracts year from period regex, fallback date, or current year', () => {
    expect(payrollService.extractYear('2024-05', null)).toBe(2024);
    expect(payrollService.extractYear('May 2023', null)).toBe(2023);
    expect(payrollService.extractYear('invalid', 2025)).toBe(2025);
    expect(payrollService.extractYear(null, 2026)).toBe(2026);
    expect(payrollService.extractYear('invalid', null)).toBe(new Date().getFullYear());
  });

  // Test 2: normalizeToUtcMidday normalizes dates to 12:00:00 UTC and throws on invalid date
  test('2. normalizeToUtcMidday normalizes to 12:00:00 UTC and throws on invalid date', () => {
    const midday = payrollService.normalizeToUtcMidday('2026-05-15');
    expect(midday.toISOString()).toBe('2026-05-15T12:00:00.000Z');

    const objDate = payrollService.normalizeToUtcMidday(new Date('2026-06-20T03:00:00Z'));
    expect(objDate.getUTCHours()).toBe(12);

    expect(() => payrollService.normalizeToUtcMidday('not-a-date')).toThrow(BadRequestError);
  });

  // Test 3: resolveTaxConfig resolves active DB tax bracket or statutory fallback
  test('3. resolveTaxConfig resolves DB active config or falls back to statutory defaults', async () => {
    // Unseeded year falls back to defaultTaxBrackets
    const fallbackConfig = await payrollService.resolveTaxConfig(2024);
    expect(fallbackConfig.brackets.length).toBeGreaterThan(0);
    expect(fallbackConfig.personalExemption).toBeDefined();

    // Seed active DB bracket
    await TaxBracket.create({
      year: 2024,
      personalExemption: 15000,
      brackets: [{ level: 1, from: 0, to: 40000, rate: 0 }],
      isActive: true,
    });

    const dbConfig = await payrollService.resolveTaxConfig(2024);
    expect(dbConfig.personalExemption).toBe(15000);
    expect(dbConfig.brackets[0].to).toBe(40000);
  });

  // Test 4: resolveInsuranceConfig resolves active DB config or statutory fallback
  test('4. resolveInsuranceConfig resolves DB active config or falls back to statutory defaults', async () => {
    const fallbackConfig = await payrollService.resolveInsuranceConfig(2024);
    expect(fallbackConfig.employeeShare).toBe(11);
    expect(fallbackConfig.maxInsurableIncome).toBe(12600);

    // Seed active DB config
    await SocialInsurance.create({
      year: 2024,
      employeeShare: 11,
      employerShare: 18.75,
      minInsurableIncome: 2000,
      maxInsurableIncome: 13000,
      isActive: true,
      user: null,
    });

    const dbConfig = await payrollService.resolveInsuranceConfig(2024);
    expect(dbConfig.maxInsurableIncome).toBe(13000);
  });

  // Test 5: calculatePriorYtdGross sums gross across existing paychecks excluding target ID
  test('5. calculatePriorYtdGross sums gross across existing paychecks in target year', async () => {
    const p1 = await Paycheck.create({
      user: userId,
      period: '2024-01',
      payDate: new Date('2024-01-25T12:00:00Z'),
      grossSalary: 20000,
      grossSalaryInPiastres: 2000000,
      netPay: 17000,
      netPayInPiastres: 1700000,
    });

    const p2 = await Paycheck.create({
      user: userId,
      period: '2024-02',
      payDate: new Date('2024-02-25T12:00:00Z'),
      grossSalary: 25000,
      grossSalaryInPiastres: 2500000,
      netPay: 21000,
      netPayInPiastres: 2100000,
    });

    const totalPrior = await payrollService.calculatePriorYtdGross(userId, 2024);
    expect(totalPrior).toBe(45000);

    const priorExcludingP2 = await payrollService.calculatePriorYtdGross(userId, 2024, p2._id);
    expect(priorExcludingP2).toBe(20000);
  });

  // Test 6: calculatePaycheckPreview calculates preview without saving to DB
  test('6. calculatePaycheckPreview generates preview without mutating database', async () => {
    const previewResult = await payrollService.calculatePaycheckPreview({
      userId,
      period: '2024-03',
      year: 2024,
      components: [
        { name: 'Basic Salary', amount: 30000, type: 'Basic' },
      ],
    });

    expect(previewResult.success).toBe(true);
    expect(previewResult.preview.netPay).toBeDefined();
    expect(previewResult.appliedConfig.taxYear).toBe(2024);

    const count = await Paycheck.countDocuments();
    expect(count).toBe(0);
  });

  // Test 7: recalculateYearlyPaychecksChain chronologically calculates prior and cumulative YTD
  test('7. recalculateYearlyPaychecksChain updates prior and cumulative YTD in payDate order even if createdAt differs', async () => {
    // Create Feb paycheck first (earlier createdAt, later payDate)
    const feb = await Paycheck.create({
      user: userId,
      period: '2024-02',
      payDate: new Date('2024-02-25T12:00:00Z'),
      grossSalary: 20000,
      grossSalaryInPiastres: 2000000,
      netPay: 17000,
      netPayInPiastres: 1700000,
      priorYtdGross: 0,
      cumulativeYtdGross: 20000,
    });

    // Create Jan paycheck second (later createdAt, earlier payDate)
    const jan = await Paycheck.create({
      user: userId,
      period: '2024-01',
      payDate: new Date('2024-01-25T12:00:00Z'),
      grossSalary: 15000,
      grossSalaryInPiastres: 1500000,
      netPay: 13000,
      netPayInPiastres: 1300000,
      priorYtdGross: 0,
      cumulativeYtdGross: 15000,
    });

    await payrollService.recalculateYearlyPaychecksChain(userId, 2024);

    const refreshedJan = await Paycheck.findById(jan._id);
    const refreshedFeb = await Paycheck.findById(feb._id);

    // Jan must be first in chain
    expect(refreshedJan.priorYtdGross).toBe(0);
    expect(refreshedJan.cumulativeYtdGross).toBe(15000);

    // Feb must be second in chain
    expect(refreshedFeb.priorYtdGross).toBe(15000);
    expect(refreshedFeb.cumulativeYtdGross).toBe(35000);
  });

  // Test 8: createPaycheck creates paycheck, settlement expenditure bridge, and updates YTD chain
  test('8. createPaycheck creates paycheck within transaction, creates bridge expenditure, and updates chain', async () => {
    const paycheck = await payrollService.createPaycheck({
      userId,
      data: {
        period: '2024-04',
        payDate: '2024-04-25',
        grossSalary: 25000,
        netPay: 21000,
        taxDeduction: 2500,
        insuranceDeduction: 1386,
        martyrsFund: 12.5,
        totalDeductions: 3898.5,
      },
      canModify: true,
    });

    expect(paycheck).toBeDefined();
    expect(paycheck.grossSalary).toBe(25000);
    expect(paycheck.netPay).toBe(21000);
    expect(paycheck.grossSalaryInPiastres).toBe(2500000);
    expect(paycheck.linkedExpenditureId).toBeDefined();

    // Verify bridge expenditure was created
    const bridgeExp = await Expenditure.findById(paycheck.linkedExpenditureId);
    expect(bridgeExp).toBeDefined();
    expect(bridgeExp.linkedPaycheckId.toString()).toBe(paycheck._id.toString());
    expect(bridgeExp.autoGenerated).toBe(true);
    expect(bridgeExp.bridgeDirection).toBe('inflow');
  });

  // Test 9: createPaycheck rejects with ForbiddenError when canModify is false
  test('9. createPaycheck rejects with ForbiddenError when canModify is false', async () => {
    await expect(
      payrollService.createPaycheck({
        userId,
        data: { period: '2024-05', payDate: '2024-05-25', grossSalary: 10000, netPay: 9000 },
        canModify: false,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  // Test 10: createPaycheck throws ConflictError on duplicate period and disbursement type
  test('10. createPaycheck throws ConflictError on duplicate period and disbursement type', async () => {
    await payrollService.createPaycheck({
      userId,
      data: { period: '2024-06', payDate: '2024-06-25', grossSalary: 10000, netPay: 9000, disbursementType: 'Regular' },
      canModify: true,
    });

    await expect(
      payrollService.createPaycheck({
        userId,
        data: { period: '2024-06', payDate: '2024-06-25', grossSalary: 12000, netPay: 10000, disbursementType: 'Regular' },
        canModify: true,
      })
    ).rejects.toThrow(ConflictError);
  });

  // Test 11: listPaychecks returns paginated paychecks with year and period filters
  test('11. listPaychecks returns paginated paychecks with filters', async () => {
    await payrollService.createPaycheck({
      userId,
      data: { period: '2024-07', payDate: '2024-07-25', grossSalary: 10000, netPay: 9000 },
      canModify: true,
    });
    await payrollService.createPaycheck({
      userId,
      data: { period: '2025-01', payDate: '2025-01-25', grossSalary: 12000, netPay: 10500 },
      canModify: true,
    });

    const result2024 = await payrollService.listPaychecks({
      userId,
      query: { year: '2024', page: 1, limit: 10 },
    });
    expect(result2024.data.length).toBe(1);
    expect(result2024.total).toBe(1);

    const resultAll = await payrollService.listPaychecks({
      userId,
      query: { page: 1, limit: 10 },
    });
    expect(resultAll.total).toBe(2);
  });

  // Test 12: getAllPaychecks returns lean records capped at 1,000
  test('12. getAllPaychecks returns non-paginated lean paychecks', async () => {
    await payrollService.createPaycheck({
      userId,
      data: { period: '2024-08', payDate: '2024-08-25', grossSalary: 10000, netPay: 9000 },
      canModify: true,
    });

    const all = await payrollService.getAllPaychecks({ userId });
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
    expect(all[0].period).toBe('2024-08');
  });

  // Test 13: getPaycheckById returns single paycheck or throws NotFoundError
  test('13. getPaycheckById returns paycheck with populated profile or throws NotFoundError', async () => {
    const created = await payrollService.createPaycheck({
      userId,
      data: { period: '2024-09', payDate: '2024-09-25', grossSalary: 10000, netPay: 9000 },
      canModify: true,
    });

    const found = await payrollService.getPaycheckById({ userId, id: created._id });
    expect(found._id.toString()).toBe(created._id.toString());

    const otherUser = new mongoose.Types.ObjectId();
    await expect(
      payrollService.getPaycheckById({ userId: otherUser, id: created._id })
    ).rejects.toThrow(NotFoundError);
  });

  // Test 14: updatePaycheck purges legacy keys, updates fields, syncs bridge, and recalculates chains
  test('14. updatePaycheck purges legacy keys, updates fields, syncs bridge, and recalculates chains', async () => {
    const created = await payrollService.createPaycheck({
      userId,
      data: { period: '2024-10', payDate: '2024-10-25', grossSalary: 20000, netPay: 17000 },
      canModify: true,
    });

    const updated = await payrollService.updatePaycheck({
      userId,
      id: created._id,
      data: {
        grossSalary: 24000,
        netPay: 20000,
        notes: 'Updated salary',
        grossAmount: 99999, // Should be purged by updatePaycheck
        amount: 88888,       // Should be purged by updatePaycheck
      },
      canModify: true,
    });

    expect(updated.grossSalary).toBe(24000);
    expect(updated.netPay).toBe(20000);
    expect(updated.notes).toBe('Updated salary');

    // Confirm bridge expenditure was synced
    const bridgeExp = await Expenditure.findById(created.linkedExpenditureId);
    expect(bridgeExp.description).toContain('Updated salary');
  });

  // Test 15: deletePaycheck soft-deletes and reverses bridge; restorePaycheck restores record
  test('15. deletePaycheck soft-deletes and reverses bridge; restorePaycheck recovers record', async () => {
    const created = await payrollService.createPaycheck({
      userId,
      data: { period: '2024-11', payDate: '2024-11-25', grossSalary: 20000, netPay: 17000 },
      canModify: true,
    });

    const bridgeExpId = created.linkedExpenditureId;

    const delRes = await payrollService.deletePaycheck({ userId, id: created._id, canModify: true });
    expect(delRes.msg).toBe('Paycheck removed');

    const softDeleted = await Paycheck.findById(created._id);
    expect(softDeleted.deletedAt).toBeDefined();

    // Bridge expenditure reversed (soft-deleted)
    const reversedBridge = await Expenditure.findById(bridgeExpId);
    expect(reversedBridge.deletedAt).toBeDefined();

    // Restore paycheck
    const restoreRes = await payrollService.restorePaycheck({ userId, id: created._id, canModify: true });
    expect(restoreRes.msg).toBe('Paycheck restored successfully');

    const restored = await Paycheck.findById(created._id);
    expect(restored.deletedAt).toBeNull();
  });
});

