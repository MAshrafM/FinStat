// backend/tests/integration/lendingSummaryApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Person = require('../../models/Person');
const Loan = require('../../models/Loan');

jest.setTimeout(60000);

describe('Step 7A.5.3: Lending Summary API Integration Tests [FEAT-005]', () => {
  let user;
  let authHeader;
  let person1;
  let person2;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const primary = await createUserWithToken({ role: 'manager', username: 'summary_user' });
    user = primary.user;
    authHeader = primary.authHeader;

    person1 = await Person.create({ user: user._id, name: 'Debtor One' });
    person2 = await Person.create({ user: user._id, name: 'Debtor Two' });
  });

  test('1. Returns aggregate receivables across all active loans (totalBorrowed, totalRepaid, totalOutstanding)', async () => {
    await Loan.create({
      user: user._id,
      person: person1._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 100000, date: new Date() },
        { type: 'repay', amountInPiastres: 20000, date: new Date() },
      ],
    });

    await Loan.create({
      user: user._id,
      person: person2._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
        { type: 'repay', amountInPiastres: 10000, date: new Date() },
      ],
    });

    const res = await request(app)
      .get('/api/lending/summary')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalBorrowed).toBe(150000);
    expect(res.body.data.totalRepaid).toBe(30000);
    expect(res.body.data.totalOutstanding).toBe(120000);
    expect(res.body.data.activeLoansCount).toBe(2);
    expect(res.body.data.personsCount).toBe(2);
  });

  test('2. Excludes soft-deleted loans and soft-deleted transactions', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person1._id,
      status: 'Active',
      deletedAt: new Date(),
      transactions: [{ type: 'borrow', amountInPiastres: 100000, date: new Date() }],
    });

    const res = await request(app)
      .get('/api/lending/summary')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.totalOutstanding).toBe(0);
    expect(res.body.data.activeLoansCount).toBe(0);
  });

  test('3. Returns count of distinct active debtors', async () => {
    // 2 loans to person 1, 1 loan to person 2
    await Loan.create({
      user: user._id,
      person: person1._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 30000, date: new Date() }],
    });
    await Loan.create({
      user: user._id,
      person: person1._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 20000, date: new Date() }],
    });
    await Loan.create({
      user: user._id,
      person: person2._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 40000, date: new Date() }],
    });

    const res = await request(app)
      .get('/api/lending/summary')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.personsCount).toBe(2);
    expect(res.body.data.activeLoansCount).toBe(3);
    expect(res.body.data.topDebtors).toHaveLength(2);
    expect(res.body.data.topDebtors[0].personName).toBe('Debtor One');
    expect(res.body.data.topDebtors[0].balanceInPiastres).toBe(50000);
  });

  test('4. Returns zero totals when user has no loans', async () => {
    const res = await request(app)
      .get('/api/lending/summary')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.totalBorrowed).toBe(0);
    expect(res.body.data.totalRepaid).toBe(0);
    expect(res.body.data.totalOutstanding).toBe(0);
    expect(res.body.data.personsCount).toBe(0);
    expect(res.body.data.activeLoansCount).toBe(0);
  });

  test('5. WrittenOff loans are excluded from totalOutstanding but remain queryable via GET /loans?status=WrittenOff', async () => {
    await Loan.create({
      user: user._id,
      person: person1._id,
      status: 'WrittenOff',
      transactions: [{ type: 'borrow', amountInPiastres: 80000, date: new Date() }],
    });

    const resSummary = await request(app)
      .get('/api/lending/summary')
      .set('Authorization', authHeader);

    expect(resSummary.status).toBe(200);
    expect(resSummary.body.data.totalOutstanding).toBe(0);

    const resLoans = await request(app)
      .get('/api/lending/loans?status=WrittenOff')
      .set('Authorization', authHeader);

    expect(resLoans.status).toBe(200);
    expect(resLoans.body.data).toHaveLength(1);
    expect(resLoans.body.data[0].status).toBe('WrittenOff');
  });
});
