// backend/tests/integration/lendingLoansApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Person = require('../../models/Person');
const Loan = require('../../models/Loan');

jest.setTimeout(60000);

describe('Step 7A.5.3: Lending Loans & Transactions API Integration Tests [FEAT-005]', () => {
  let user;
  let authHeader;
  let otherUser;
  let otherAuthHeader;
  let viewerUser;
  let viewerAuthHeader;
  let person;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const primary = await createUserWithToken({ role: 'manager', username: 'loan_primary' });
    user = primary.user;
    authHeader = primary.authHeader;

    const secondary = await createUserWithToken({ role: 'manager', username: 'loan_secondary' });
    otherUser = secondary.user;
    otherAuthHeader = secondary.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'loan_viewer' });
    viewerUser = viewer.user;
    viewerAuthHeader = viewer.authHeader;

    person = await Person.create({ user: user._id, name: 'Hany' });
  });

  test('1. POST /api/lending/loans: creates loan with initial borrow transaction; balance equals initial amount', async () => {
    const res = await request(app)
      .post('/api/lending/loans')
      .set('Authorization', authHeader)
      .send({
        person: person._id,
        initialAmountInPiastres: 100000,
        date: '2026-01-15',
        note: 'First loan',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Active');
    expect(res.body.data.transactions).toHaveLength(1);
    expect(res.body.data.transactions[0].type).toBe('borrow');
    expect(res.body.data.transactions[0].amountInPiastres).toBe(100000);
    expect(res.body.data.balanceInPiastres).toBe(100000);
  });

  test('2. POST /api/lending/loans: rejects creation if person ID does not exist or belongs to another user', async () => {
    const otherPerson = await Person.create({ user: otherUser._id, name: 'Other Guy' });

    const res = await request(app)
      .post('/api/lending/loans')
      .set('Authorization', authHeader)
      .send({
        person: otherPerson._id,
        initialAmountInPiastres: 50000,
        date: '2026-01-15',
      });

    expect(res.status).toBe(404);
  });

  test('3. GET /api/lending/loans: lists loans filtered by status (Active, Repaid, WrittenOff, All)', async () => {
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date() }],
    });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 20000, date: new Date() },
        { type: 'repay', amountInPiastres: 20000, date: new Date() },
      ],
    });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'WrittenOff',
      transactions: [{ type: 'borrow', amountInPiastres: 30000, date: new Date() }],
    });

    const resActive = await request(app)
      .get('/api/lending/loans?status=Active')
      .set('Authorization', authHeader);
    expect(resActive.status).toBe(200);
    expect(resActive.body.data).toHaveLength(1);
    expect(resActive.body.data[0].status).toBe('Active');

    const resRepaid = await request(app)
      .get('/api/lending/loans?status=Repaid')
      .set('Authorization', authHeader);
    expect(resRepaid.status).toBe(200);
    expect(resRepaid.body.data).toHaveLength(1);
    expect(resRepaid.body.data[0].status).toBe('Repaid');

    const resWrittenOff = await request(app)
      .get('/api/lending/loans?status=WrittenOff')
      .set('Authorization', authHeader);
    expect(resWrittenOff.status).toBe(200);
    expect(resWrittenOff.body.data).toHaveLength(1);
    expect(resWrittenOff.body.data[0].status).toBe('WrittenOff');

    const resAll = await request(app)
      .get('/api/lending/loans?status=All')
      .set('Authorization', authHeader);
    expect(resAll.status).toBe(200);
    expect(resAll.body.data).toHaveLength(3);
  });

  test('4. GET /api/lending/loans/:id: returns chronological transaction ledger with runningBalanceInPiastres on every row', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 100000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 20000, date: new Date('2026-01-10') },
        { type: 'borrow', amountInPiastres: 30000, date: new Date('2026-01-20') },
      ],
    });

    const res = await request(app)
      .get(`/api/lending/loans/${loan._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(3);
    expect(res.body.data.transactions[0].runningBalanceInPiastres).toBe(100000);
    expect(res.body.data.transactions[1].runningBalanceInPiastres).toBe(80000);
    expect(res.body.data.transactions[2].runningBalanceInPiastres).toBe(110000);
  });

  test('5. POST /api/lending/loans/:id/transactions: adding repay decreases balance and updates status to Repaid when fully paid', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') }],
    });

    const res = await request(app)
      .post(`/api/lending/loans/${loan._id}/transactions`)
      .set('Authorization', authHeader)
      .send({
        type: 'repay',
        amountInPiastres: 50000,
        date: '2026-01-15',
        note: 'Full settlement',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.balanceInPiastres).toBe(0);
    expect(res.body.data.status).toBe('Repaid');
    expect(res.body.data.isFullyRepaid).toBe(true);
  });

  test('6. POST /api/lending/loans/:id/transactions: adding borrow increases balance on an existing loan (loan increase)', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') }],
    });

    const res = await request(app)
      .post(`/api/lending/loans/${loan._id}/transactions`)
      .set('Authorization', authHeader)
      .send({
        type: 'borrow',
        amountInPiastres: 25000,
        date: '2026-01-20',
        note: 'Top up',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.balanceInPiastres).toBe(75000);
    expect(res.body.data.totalBorrowedInPiastres).toBe(75000);
  });

  test('7. POST /api/lending/loans/:id/transactions: rejects repay if amount exceeds outstanding balance', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') }],
    });

    const res = await request(app)
      .post(`/api/lending/loans/${loan._id}/transactions`)
      .set('Authorization', authHeader)
      .send({
        type: 'repay',
        amountInPiastres: 60000,
        date: '2026-01-15',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceeds outstanding/i);
  });

  test('8. DELETE /api/lending/loans/:id/transactions/:txId: removes transaction and recomputes status and balances', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-15') },
      ],
    });

    const repayTxId = loan.transactions[1]._id;

    const res = await request(app)
      .delete(`/api/lending/loans/${loan._id}/transactions/${repayTxId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.balanceInPiastres).toBe(50000);
    expect(res.body.data.status).toBe('Active');
  });

  test('9. DELETE /api/lending/loans/:id/transactions/:txId: rejects deletion if removing a borrow causes negative balance', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-15') },
      ],
    });

    const borrowTxId = loan.transactions[0]._id;

    const res = await request(app)
      .delete(`/api/lending/loans/${loan._id}/transactions/${borrowTxId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/negative/i);
  });

  test('10. DELETE /api/lending/loans/:id/transactions/:txId: rejects deletion if intermediate running balance becomes negative', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date('2026-01-01') },
        { type: 'repay', amountInPiastres: 50000, date: new Date('2026-01-05') },
        { type: 'borrow', amountInPiastres: 100000, date: new Date('2026-01-10') },
      ],
    });

    const initialBorrowId = loan.transactions[0]._id;

    const res = await request(app)
      .delete(`/api/lending/loans/${loan._id}/transactions/${initialBorrowId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/intermediate running balance/i);
  });

  test('11. PUT /api/lending/loans/:id: rejects status: WrittenOff if balance is 0; transitions cleanly if balance > 0', async () => {
    const zeroLoan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 10000, date: new Date() },
        { type: 'repay', amountInPiastres: 10000, date: new Date() },
      ],
    });

    const activeLoan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 40000, date: new Date() }],
    });

    // Zero balance loan rejects write-off
    const resZero = await request(app)
      .put(`/api/lending/loans/${zeroLoan._id}`)
      .set('Authorization', authHeader)
      .send({ status: 'WrittenOff' });
    expect(resZero.status).toBe(400);

    // Active loan with positive balance transitions cleanly
    const resActive = await request(app)
      .put(`/api/lending/loans/${activeLoan._id}`)
      .set('Authorization', authHeader)
      .send({ status: 'WrittenOff', notes: 'Cannot collect' });
    expect(resActive.status).toBe(200);
    expect(resActive.body.data.status).toBe('WrittenOff');
  });

  test('12. PUT /api/lending/loans/:id: transitioning WrittenOff -> Active re-evaluates status (lands on Repaid if balance 0, Active if balance > 0)', async () => {
    const writtenOffLoan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'WrittenOff',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date() }],
    });

    const res = await request(app)
      .put(`/api/lending/loans/${writtenOffLoan._id}`)
      .set('Authorization', authHeader)
      .send({ status: 'Active' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Active');
  });

  test('13. DELETE /api/lending/loans/:id: soft deletes loan; does not delete associated Person', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date() }],
    });

    const res = await request(app)
      .delete(`/api/lending/loans/${loan._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    const checkLoan = await Loan.findById(loan._id);
    expect(checkLoan.deletedAt).not.toBeNull();

    const checkPerson = await Person.findById(person._id);
    expect(checkPerson.deletedAt).toBeNull();
  });

  test('14. IDOR Defense: User B cannot access or post transactions to User A loan', async () => {
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 50000, date: new Date() }],
    });

    const getRes = await request(app)
      .get(`/api/lending/loans/${loan._id}`)
      .set('Authorization', otherAuthHeader);
    expect(getRes.status).toBe(404);

    const postRes = await request(app)
      .post(`/api/lending/loans/${loan._id}/transactions`)
      .set('Authorization', otherAuthHeader)
      .send({ type: 'repay', amountInPiastres: 10000, date: '2026-01-20' });
    expect(postRes.status).toBe(404);
  });

  test('15. Date Normalization: Transaction dates normalize to midday UTC', async () => {
    const res = await request(app)
      .post('/api/lending/loans')
      .set('Authorization', authHeader)
      .send({
        person: person._id,
        initialAmountInPiastres: 50000,
        date: '2026-05-10T23:30:00+03:00',
      });

    expect(res.status).toBe(201);
    const txDate = new Date(res.body.data.transactions[0].date);
    expect(txDate.getUTCHours()).toBe(12);
    expect(txDate.getUTCMinutes()).toBe(0);
    expect(txDate.getUTCSeconds()).toBe(0);
  });
});
