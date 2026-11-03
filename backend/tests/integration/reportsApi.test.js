// backend/tests/integration/reportsApi.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Paycheck = require('../../models/Paycheck');
const Expenditure = require('../../models/Expenditure');

jest.setTimeout(60000);

describe('Reports API Integration Tests [FEAT-003]', () => {
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
    const fixture = await createUserWithToken({ role: 'manager', username: 'report_user' });
    user = fixture.user;
    authHeader = fixture.authHeader;
  });

  test('Test 1 (Authentication Guard): rejects unauthenticated requests with HTTP 401', async () => {
    const res = await request(app).get('/api/reports/comprehensive');
    expect(res.status).toBe(401);
  });

  test('Test 2 (Role Access Verification): allows authorized user to access report', async () => {
    const res = await request(app)
      .get('/api/reports/comprehensive')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(res.body).toHaveProperty('kpi');
  });

  test('Test 3 (Successful Report Delivery): returns 200 with complete 12-module structured JSON payload for valid year range', async () => {
    await Paycheck.create({
      user: user._id,
      payDate: new Date('2025-03-15'),
      period: '2025-03',
      grossSalary: 45000,
      netPay: 36000,
      taxDetails: { actualTax: 5000 },
      insuranceDetails: { actualEmployeeShare: 3975 },
      martyrsFund: 25,
    });

    await Expenditure.create({
      user: user._id,
      date: new Date('2025-03-20'),
      transactionValue: 2200,
      transactionType: 'W',
      categories: ['Groceries'],
    });

    const res = await request(app)
      .get('/api/reports/comprehensive?startYear=2025&endYear=2025')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.payroll.totalGrossSalary).toBe(45000);
    expect(res.body.expenditures.totalSpent).toBe(2200);
    expect(res.body).toHaveProperty('creditCards');
    expect(res.body).toHaveProperty('investments');
    expect(res.body).toHaveProperty('currency');
    expect(res.body).toHaveProperty('budget');
    expect(res.body).toHaveProperty('debtPayoff');
    expect(res.body).toHaveProperty('categorizationRules');
  });

  test('Test 4 (Year Range Cap Validation): returns 400 when (endYear - startYear) > 5', async () => {
    const res = await request(app)
      .get('/api/reports/comprehensive?startYear=2018&endYear=2025')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot exceed 5 years/i);
  });

  test('Test 5 (Invalid Year Format Validation): returns 400 when query contains non-numeric year strings', async () => {
    const res = await request(app)
      .get('/api/reports/comprehensive?startYear=abc&endYear=2025')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/numeric integers/i);
  });

  test('Test 6 (Empty Period Graceful Structure): returns 200 with zeroed metric cards when user has no transactions in period', async () => {
    const res = await request(app)
      .get('/api/reports/comprehensive?startYear=2020&endYear=2020')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.kpi.netWorth).toBe(0);
    expect(res.body.kpi.totalGrossIncome).toBe(0);
    expect(res.body.payroll.monthlyTrend).toEqual([]);
    expect(res.body.expenditures.spendByCategory).toEqual([]);
  });
});
