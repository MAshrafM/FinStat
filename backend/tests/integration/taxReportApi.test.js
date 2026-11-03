// backend/tests/integration/taxReportApi.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Paycheck = require('../../models/Paycheck');
const TaxBracket = require('../../models/TaxBracket');

jest.setTimeout(60000);

describe('Tax Report API Integration Tests [FEAT-003, GAP-006]', () => {
  let user;
  let authHeader;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const fixture = await createUserWithToken({ role: 'manager', username: 'tax_report_user' });
    user = fixture.user;
    authHeader = fixture.authHeader;

    // Seed Egyptian tax brackets for 2024
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

  test('Test 1 (Successful Tax Summary): returns 200 with statutory breakdown for configured year with paychecks', async () => {
    await Paycheck.create({
      user: user._id,
      payDate: new Date('2024-04-25'),
      period: '2024-04',
      grossSalary: 120000,
      netPay: 101940,
      taxDetails: { actualTax: 8000 },
      insuranceDetails: { actualEmployeeShare: 10000 },
      martyrsFund: 60,
    });

    const res = await request(app)
      .get('/api/reports/tax-summary?year=2024')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta.year).toBe(2024);
    expect(res.body.payrollSummary.totalGrossSalary).toBe(120000);
    expect(res.body.statutoryTax.actualTaxPaid).toBe(8000);
    expect(res.body.payrollSummary.totalSocialInsurance).toBe(10000);
    expect(res.body.martyrsFund.actualMartyrsFundPaid).toBe(60);
    expect(res.body.payrollSummary.personalExemption).toBe(20000);
    expect(res.body.payrollSummary.netTaxableIncome).toBe(90000); // 120000 - 10000 - 20000
    expect(res.body.statutoryTax.calculatedAnnualTax).toBe(7750);
    expect(res.body.statutoryTax.reconciliationDelta).toBe(250);
    expect(res.body.martyrsFund.reconciliationDelta).toBe(0);
    expect(res.body.statutoryTax.status).toBe('Overpaid');
  });

  test('Test 2 (Missing Year Parameter Validation): returns 400 when year query parameter is missing', async () => {
    const res = await request(app)
      .get('/api/reports/tax-summary')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/year parameter is required/i);
  });

  test('Test 3 (Non-Configured Year Error): returns 404 when requested year has no tax bracket configuration', async () => {
    const res = await request(app)
      .get('/api/reports/tax-summary?year=2030')
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no tax bracket configuration found for year 2030/i);
  });

  test('Test 4 (Zero Paychecks Graceful Response): returns 200 with zeroed amounts when user has no paychecks in requested year', async () => {
    const res = await request(app)
      .get('/api/reports/tax-summary?year=2024')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.payrollSummary.paycheckCount).toBe(0);
    expect(res.body.payrollSummary.totalGrossSalary).toBe(0);
    expect(res.body.statutoryTax.actualTaxPaid).toBe(0);
    expect(res.body.payrollSummary.netTaxableIncome).toBe(0);
    expect(res.body.statutoryTax.calculatedAnnualTax).toBe(0);
    expect(res.body.statutoryTax.reconciliationDelta).toBe(0);
    expect(res.body.statutoryTax.status).toBe('Reconciled');
  });
});
