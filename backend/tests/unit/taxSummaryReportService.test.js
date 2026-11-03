// backend/tests/unit/taxSummaryReportService.test.js
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const {
  validateTaxYear,
  generateTaxSummaryReport,
} = require('../../services/taxSummaryReportService');
const Paycheck = require('../../models/Paycheck');
const TaxBracket = require('../../models/TaxBracket');

describe('Tax Summary Report Service Unit Tests [FEAT-003, GAP-006]', () => {
  let userId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    userId = new mongoose.Types.ObjectId();

    // Standard Egyptian Tax Brackets 2024 (Law 175/2023)
    // Personal exemption: 20,000 EGP
    // Brackets on net taxable:
    // 0 - 40,000: 0%
    // 40,000 - 55,000: 10%
    // 55,000 - 70,000: 15%
    // 70,000 - 200,000: 20%
    // 200,000 - 400,000: 22.5%
    // 400,000+: 25%
    await TaxBracket.create({
      country: 'Egypt',
      year: 2024,
      personalExemption: 20000,
      isActive: true,
      brackets: [
        { level: 1, from: 0, to: 40000, rate: 0 },
        { level: 2, from: 40000, to: 55000, rate: 10 },
        { level: 3, from: 55000, to: 70000, rate: 15 },
        { level: 4, from: 70000, to: 200000, rate: 20 },
        { level: 5, from: 200000, to: 400000, rate: 22.5 },
        { level: 6, from: 400000, to: 1000000000, rate: 25 },
      ],
    });
  });

  test('Test 1 (Annual Gross Aggregation): aggregates grossSalary across paychecks in the calendar year', async () => {
    await Paycheck.create([
      {
        user: userId,
        payDate: new Date('2024-01-25'),
        period: '2024-01',
        grossSalary: 25000,
        netPay: 20000,
        taxDetails: { actualTax: 2500 },
        insuranceDetails: { actualEmployeeShare: 2475 },
        martyrsFund: 12.5,
      },
      {
        user: userId,
        payDate: new Date('2024-02-25'),
        period: '2024-02',
        grossSalary: 30000,
        netPay: 24000,
        taxDetails: { actualTax: 3200 },
        insuranceDetails: { actualEmployeeShare: 2700 },
        martyrsFund: 15,
      },
    ]);

    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.payrollSummary.totalGrossSalary).toBe(55000);
    expect(report.payrollSummary.paycheckCount).toBe(2);
  });

  test('Test 2 (Social Insurance Aggregation): aggregates insuranceDetails.actualEmployeeShare accurately', async () => {
    await Paycheck.create([
      {
        user: userId,
        payDate: new Date('2024-03-25'),
        period: '2024-03',
        grossSalary: 20000,
        insuranceDetails: { actualEmployeeShare: 2200 },
      },
      {
        user: userId,
        payDate: new Date('2024-04-25'),
        period: '2024-04',
        grossSalary: 20000,
        insuranceDetails: { actualEmployeeShare: 2200 },
      },
    ]);

    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.payrollSummary.totalSocialInsurance).toBe(4400);
  });

  test('Test 3 (Personal Exemption Lookup): retrieves personalExemption from TaxBracket model for the requested year', async () => {
    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.payrollSummary.personalExemption).toBe(20000);
  });

  test('Test 4 (Progressive Bracket Calculation): computes progressive tax brackets per Law 175/2023 accurately', async () => {
    // Gross: 120,000, SI: 24,000, Exemption: 20,000 -> Net Taxable: 76,000 EGP
    // 0 - 40,000 @ 0% = 0
    // 40,000 - 55,000 (15,000) @ 10% = 1,500
    // 55,000 - 70,000 (15,000) @ 15% = 2,250
    // 70,000 - 76,000 (6,000) @ 20% = 1,200
    // Total Statutory Tax = 1,500 + 2,250 + 1,200 = 4,950 EGP
    await Paycheck.create({
      user: userId,
      payDate: new Date('2024-06-25'),
      period: '2024-06',
      grossSalary: 120000,
      taxDetails: { actualTax: 4950 },
      insuranceDetails: { actualEmployeeShare: 24000 },
      martyrsFund: 60,
    });

    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.payrollSummary.netTaxableIncome).toBe(76000);
    expect(report.statutoryTax.calculatedAnnualTax).toBe(4950);
    expect(report.bracketsBreakdown.length).toBeGreaterThan(0);
  });

  test('Test 5 (Martyrs Fund Reconciliation): verifies 0.05% gross salary deduction calculation per Law 200/2020', async () => {
    // Gross: 100,000 EGP * 0.05% = 50 EGP expected
    await Paycheck.create({
      user: userId,
      payDate: new Date('2024-05-25'),
      period: '2024-05',
      grossSalary: 100000,
      martyrsFund: 50,
    });

    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.martyrsFund.calculatedAnnualMartyrsFund).toBe(50);
    expect(report.martyrsFund.actualMartyrsFundPaid).toBe(50);
    expect(report.martyrsFund.reconciliationDelta).toBe(0);
  });

  test('Test 6 (Tax Reconciliation Delta): computes variance between actual payroll tax deducted vs statutory liability', async () => {
    // Gross 120,000, statutory tax = 4,950.
    // Case A: Actual paid was 5,500 -> Overpaid by 550 EGP
    await Paycheck.create({
      user: userId,
      payDate: new Date('2024-07-25'),
      period: '2024-07',
      grossSalary: 120000,
      taxDetails: { actualTax: 5500 },
      insuranceDetails: { actualEmployeeShare: 24000 },
    });

    const report = await generateTaxSummaryReport(userId, 2024);

    expect(report.statutoryTax.actualTaxPaid).toBe(5500);
    expect(report.statutoryTax.calculatedAnnualTax).toBe(4950);
    expect(report.statutoryTax.reconciliationDelta).toBe(550);
    expect(report.statutoryTax.status).toBe('Overpaid');
  });
});

