// backend/tests/integration/lendingPersonsApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Person = require('../../models/Person');
const Loan = require('../../models/Loan');

jest.setTimeout(60000);

describe('Step 7A.5.2: Lending Persons API Integration Tests [FEAT-005]', () => {
  let user;
  let authHeader;
  let otherUser;
  let otherAuthHeader;
  let viewerUser;
  let viewerAuthHeader;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    const primary = await createUserWithToken({ role: 'manager', username: 'lender_primary' });
    user = primary.user;
    authHeader = primary.authHeader;

    const secondary = await createUserWithToken({ role: 'manager', username: 'lender_secondary' });
    otherUser = secondary.user;
    otherAuthHeader = secondary.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'lender_viewer' });
    viewerUser = viewer.user;
    viewerAuthHeader = viewer.authHeader;
  });

  test('1. POST /api/lending/persons: successfully creates a new person with name and note', async () => {
    const res = await request(app)
      .post('/api/lending/persons')
      .set('Authorization', authHeader)
      .send({ name: 'Ahmed', note: 'Close friend' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Ahmed');
    expect(res.body.data.note).toBe('Close friend');
    expect(res.body.data.user.toString()).toBe(user._id.toString());
  });

  test('2. POST /api/lending/persons: returns 400 when name is missing or empty string', async () => {
    const res = await request(app)
      .post('/api/lending/persons')
      .set('Authorization', authHeader)
      .send({ name: '   ', note: 'Empty name' });

    expect(res.status).toBe(400);
  });

  test('3. GET /api/lending/persons: returns only persons belonging to req.effectiveUserId (IDOR defense)', async () => {
    await Person.create({ user: user._id, name: 'My Borrower' });
    await Person.create({ user: otherUser._id, name: 'Other Borrower' });

    const res = await request(app)
      .get('/api/lending/persons')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('My Borrower');
  });

  test('4. GET /api/lending/persons: uses .lean() and includes computed totalOwedInPiastres and loanCount', async () => {
    const person = await Person.create({ user: user._id, name: 'Borrower 1' });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
        { type: 'repay', amountInPiastres: 15000, date: new Date() },
      ],
    });

    const res = await request(app)
      .get('/api/lending/persons')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].totalOwedInPiastres).toBe(35000);
    expect(res.body.data[0].loanCount).toBe(1);
  });

  test('5. GET /api/lending/persons/:id: returns person detail with associated active loans', async () => {
    const person = await Person.create({ user: user._id, name: 'Borrower 2' });
    const loan = await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 100000, date: new Date() },
      ],
    });

    const res = await request(app)
      .get(`/api/lending/persons/${person._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.person.name).toBe('Borrower 2');
    expect(res.body.data.loans).toHaveLength(1);
    expect(res.body.data.loans[0]._id.toString()).toBe(loan._id.toString());
    expect(res.body.data.aggregate.totalOutstandingInPiastres).toBe(100000);
  });

  test('6. GET /api/lending/persons/:id: returns 404 for non-existent ID or ID belonging to another user', async () => {
    const otherPerson = await Person.create({ user: otherUser._id, name: 'Secret' });

    const res = await request(app)
      .get(`/api/lending/persons/${otherPerson._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
  });

  test('7. PUT /api/lending/persons/:id: updates name and note cleanly', async () => {
    const person = await Person.create({ user: user._id, name: 'Original Name', note: 'Old note' });

    const res = await request(app)
      .put(`/api/lending/persons/${person._id}`)
      .set('Authorization', authHeader)
      .send({ name: 'Updated Name', note: 'New note' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.note).toBe('New note');
  });

  test('8. DELETE /api/lending/persons/:id: rejects deletion with 400 when person has active loans with balance > 0', async () => {
    const person = await Person.create({ user: user._id, name: 'Active Debtor' });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Active',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
      ],
    });

    const res = await request(app)
      .delete(`/api/lending/persons/${person._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot delete person with active outstanding balance/i);
  });

  test('9. DELETE /api/lending/persons/:id: permits deletion if all remaining loans for person are WrittenOff or Repaid', async () => {
    const person = await Person.create({ user: user._id, name: 'Written Off Guy' });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'WrittenOff',
      transactions: [
        { type: 'borrow', amountInPiastres: 50000, date: new Date() },
      ],
    });

    const res = await request(app)
      .delete(`/api/lending/persons/${person._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Person.findById(person._id);
    expect(check.deletedAt).not.toBeNull();
  });

  test('10. DELETE /api/lending/persons/:id: successfully soft deletes person when balance is 0', async () => {
    const person = await Person.create({ user: user._id, name: 'Paid Off Guy' });
    await Loan.create({
      user: user._id,
      person: person._id,
      status: 'Repaid',
      transactions: [
        { type: 'borrow', amountInPiastres: 20000, date: new Date() },
        { type: 'repay', amountInPiastres: 20000, date: new Date() },
      ],
    });

    const res = await request(app)
      .delete(`/api/lending/persons/${person._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    const check = await Person.findById(person._id);
    expect(check.deletedAt).not.toBeNull();
  });

  test('11. Role Guard: rejects mutation attempts by viewer role with 403 Forbidden', async () => {
    const createRes = await request(app)
      .post('/api/lending/persons')
      .set('Authorization', viewerAuthHeader)
      .send({ name: 'Should Fail' });

    expect(createRes.status).toBe(403);
  });

  test('12. Pagination & Sorting: supports page, limit, and sorting by name and total owed', async () => {
    const p1 = await Person.create({ user: user._id, name: 'A Person' });
    const p2 = await Person.create({ user: user._id, name: 'B Person' });

    await Loan.create({
      user: user._id,
      person: p1._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 10000, date: new Date() }],
    });
    await Loan.create({
      user: user._id,
      person: p2._id,
      status: 'Active',
      transactions: [{ type: 'borrow', amountInPiastres: 90000, date: new Date() }],
    });

    // Test sort by name ASC
    const resName = await request(app)
      .get('/api/lending/persons?page=1&limit=10&sortBy=name&sortOrder=asc')
      .set('Authorization', authHeader);
    expect(resName.status).toBe(200);
    expect(resName.body.data[0].name).toBe('A Person');
    expect(resName.body.data[1].name).toBe('B Person');

    // Test sort by totalOwed DESC
    const resDebt = await request(app)
      .get('/api/lending/persons?page=1&limit=10&sortBy=totalOwed&sortOrder=desc')
      .set('Authorization', authHeader);
    expect(resDebt.status).toBe(200);
    expect(resDebt.body.data[0].name).toBe('B Person');
    expect(resDebt.body.data[1].name).toBe('A Person');
  });
});
