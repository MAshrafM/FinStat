// backend/tests/integration/recurringBillsApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Expenditure = require('../../models/Expenditure');
const RecurringBill = require('../../models/RecurringBill');

jest.setTimeout(60000);

describe('Step 7C.1a: [FEAT-005, GAP-009] Recurring Bills & Scheduler API Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
    await Expenditure.init();
    await RecurringBill.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await Expenditure.init();
    await RecurringBill.init();

    const manager = await createUserWithToken({ role: 'manager', username: 'bill_mgr' });
    managerUser = manager.user;
    managerAuth = manager.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'bill_view', managedBy: managerUser._id });
    viewerUser = viewer.user;
    viewerAuth = viewer.authHeader;

    const other = await createUserWithToken({ role: 'manager', username: 'bill_other' });
    otherUser = other.user;
    otherAuth = other.authHeader;
  });

  describe('1. CRUD Operations & Data Integrity', () => {
    it('1. POST /api/expenditures/bills creates bill with normalized UTC midday date and accurate piastres', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', managerAuth)
        .send({
          name: 'Home Fiber Internet',
          category: 'Utilities',
          amount: 650.5,
          frequency: 'monthly',
          dueDay: 15,
          nextDueDate: '2026-11-15',
          paymentMethod: 'Bank',
          notes: 'WE Telecom Egypt',
        });

      expect(res.status).toBe(201);
      expect(res.body.bill).toBeDefined();
      expect(res.body.bill.name).toBe('Home Fiber Internet');
      expect(res.body.bill.amount).toBe(650.5);
      expect(res.body.bill.amountInPiastres).toBe(65050);
      expect(res.body.bill.dueDay).toBe(15);
      expect(res.body.bill.paymentMethod).toBe('Bank');
      expect(new Date(res.body.bill.nextDueDate).toISOString()).toContain('2026-11-15T12:00:00.000Z');
    });

    it('2. GET /api/expenditures/bills returns active recurring bills for current user', async () => {
      await RecurringBill.create({
        user: managerUser._id,
        name: 'Gym Membership',
        category: 'Health & Fitness',
        amount: 500,
        amountInPiastres: 50000,
        dueDay: 1,
        nextDueDate: new Date('2026-12-01T12:00:00.000Z'),
        paymentMethod: 'Cash',
      });

      const res = await request(app)
        .get('/api/expenditures/bills')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.bills).toHaveLength(1);
      expect(res.body.bills[0].name).toBe('Gym Membership');
    });

    it('3. GET /api/expenditures/bills/upcoming returns bills due within 3 days; excludes bills due in 10 days', async () => {
      const now = new Date();
      const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      await RecurringBill.create({
        user: managerUser._id,
        name: 'Due in 2 days',
        category: 'Utilities',
        amount: 300,
        amountInPiastres: 30000,
        dueDay: in2Days.getUTCDate(),
        nextDueDate: in2Days,
        paymentMethod: 'Bank',
        isActive: true,
      });

      await RecurringBill.create({
        user: managerUser._id,
        name: 'Due in 10 days',
        category: 'Subscriptions',
        amount: 200,
        amountInPiastres: 20000,
        dueDay: in10Days.getUTCDate(),
        nextDueDate: in10Days,
        paymentMethod: 'Bank',
        isActive: true,
      });

      const res = await request(app)
        .get('/api/expenditures/bills/upcoming?days=3')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.bills).toHaveLength(1);
      expect(res.body.bills[0].name).toBe('Due in 2 days');
      expect(res.body.upcomingCount).toBe(1);
      expect(res.body.totalDue).toBe(300);
    });

    it('4. GET /api/expenditures/bills/upcoming excludes inactive (isActive: false) bills from upcoming alerts', async () => {
      const in1Day = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await RecurringBill.create({
        user: managerUser._id,
        name: 'Paused Bill',
        category: 'Utilities',
        amount: 400,
        amountInPiastres: 40000,
        dueDay: in1Day.getUTCDate(),
        nextDueDate: in1Day,
        paymentMethod: 'Bank',
        isActive: false,
      });

      const res = await request(app)
        .get('/api/expenditures/bills/upcoming')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.bills).toHaveLength(0);
      expect(res.body.upcomingCount).toBe(0);
    });

    it('5. PUT /api/expenditures/bills/:id updates bill amounts, frequency, and recalculates piastres', async () => {
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Spotify',
        category: 'Subscriptions',
        amount: 90,
        amountInPiastres: 9000,
        dueDay: 5,
        nextDueDate: new Date('2026-11-05T12:00:00.000Z'),
        paymentMethod: 'Prepaid',
      });

      const res = await request(app)
        .put(`/api/expenditures/bills/${bill._id}`)
        .set('Authorization', managerAuth)
        .send({
          amount: 110,
          frequency: 'monthly',
        });

      expect(res.status).toBe(200);
      expect(res.body.bill.amount).toBe(110);
      expect(res.body.bill.amountInPiastres).toBe(11000);
    });

    it('6. DELETE /api/expenditures/bills/:id soft deletes bill and hides from active list', async () => {
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Newspaper',
        category: 'Subscriptions',
        amount: 50,
        amountInPiastres: 5000,
        dueDay: 1,
        nextDueDate: new Date('2026-12-01T12:00:00.000Z'),
        paymentMethod: 'Cash',
      });

      const delRes = await request(app)
        .delete(`/api/expenditures/bills/${bill._id}`)
        .set('Authorization', managerAuth);

      expect(delRes.status).toBe(200);

      const listRes = await request(app)
        .get('/api/expenditures/bills')
        .set('Authorization', managerAuth);

      expect(listRes.body.bills).toHaveLength(0);
    });
  });

  describe('2. Validation & Boundary Enforcement', () => {
    it('7. rejects negative amounts (amount: -100) with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', managerAuth)
        .send({
          name: 'Invalid Negative',
          category: 'Utilities',
          amount: -100,
          nextDueDate: '2026-12-01',
          dueDay: 1,
        });

      expect(res.status).toBe(400);
    });

    it('8. rejects invalid frequency (frequency: biweekly) with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', managerAuth)
        .send({
          name: 'Invalid Freq',
          category: 'Utilities',
          amount: 200,
          frequency: 'biweekly',
          nextDueDate: '2026-12-01',
          dueDay: 1,
        });

      expect(res.status).toBe(400);
    });

    it('9. rejects invalid payment method (paymentMethod: Crypto) with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', managerAuth)
        .send({
          name: 'Invalid Account',
          category: 'Utilities',
          amount: 200,
          paymentMethod: 'Crypto',
          nextDueDate: '2026-12-01',
          dueDay: 1,
        });

      expect(res.status).toBe(400);
    });

    it('10. clamps dueDay to [1, 31] with HTTP 400 on out-of-range value', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', managerAuth)
        .send({
          name: 'Invalid Due Day',
          category: 'Utilities',
          amount: 200,
          dueDay: 35,
          nextDueDate: '2026-12-01',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Multi-Tenant IDOR Protection', () => {
    let userABill;

    beforeEach(async () => {
      userABill = await RecurringBill.create({
        user: managerUser._id,
        name: 'User A Secret Bill',
        category: 'Confidential',
        amount: 1000,
        amountInPiastres: 100000,
        dueDay: 10,
        nextDueDate: new Date('2026-11-10T12:00:00.000Z'),
        paymentMethod: 'Bank',
      });
    });

    it('11. returns HTTP 404 when User B views User A bill (GET /:id)', async () => {
      const res = await request(app)
        .get(`/api/expenditures/bills/${userABill._id}`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(404);
    });

    it('12. returns HTTP 404 when User B updates User A bill (PUT /:id)', async () => {
      const res = await request(app)
        .put(`/api/expenditures/bills/${userABill._id}`)
        .set('Authorization', otherAuth)
        .send({ amount: 999 });

      expect(res.status).toBe(404);
    });

    it('13. returns HTTP 404 when User B deletes User A bill (DELETE /:id)', async () => {
      const res = await request(app)
        .delete(`/api/expenditures/bills/${userABill._id}`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(404);
    });

    it('14. returns HTTP 404 when User B attempts to pay User A bill (POST /:id/pay)', async () => {
      const res = await request(app)
        .post(`/api/expenditures/bills/${userABill._id}/pay`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(404);
    });
  });

  describe('4. Role Access Control (Viewer Role)', () => {
    let targetBill;

    beforeEach(async () => {
      targetBill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Viewer Target Bill',
        category: 'Utilities',
        amount: 300,
        amountInPiastres: 30000,
        dueDay: 12,
        nextDueDate: new Date('2026-11-12T12:00:00.000Z'),
        paymentMethod: 'Bank',
      });
    });

    it('15. rejects viewer role on POST /api/expenditures/bills with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/expenditures/bills')
        .set('Authorization', viewerAuth)
        .send({
          name: 'Viewer Bill',
          category: 'Utilities',
          amount: 100,
          dueDay: 5,
          nextDueDate: '2026-12-05',
        });

      expect(res.status).toBe(403);
    });

    it('16. rejects viewer role on PUT /api/expenditures/bills/:id with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/expenditures/bills/${targetBill._id}`)
        .set('Authorization', viewerAuth)
        .send({ amount: 350 });

      expect(res.status).toBe(403);
    });

    it('17. rejects viewer role on DELETE /api/expenditures/bills/:id with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/expenditures/bills/${targetBill._id}`)
        .set('Authorization', viewerAuth);

      expect(res.status).toBe(403);
    });

    it('18. rejects viewer role on POST /api/expenditures/bills/:id/pay with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/expenditures/bills/${targetBill._id}/pay`)
        .set('Authorization', viewerAuth);

      expect(res.status).toBe(403);
    });
  });

  describe('5. Atomic Bill Payment, Report Alignment & Clamping Logic', () => {
    it('19. creates Expenditure with transactionType: W, autoGenerated: false, and isRecurring: true [🔴-2]', async () => {
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Electricity Bill',
        category: 'Utilities',
        amount: 750,
        amountInPiastres: 75000,
        dueDay: 20,
        nextDueDate: new Date('2026-11-20T12:00:00.000Z'),
        paymentMethod: 'Bank',
      });

      const res = await request(app)
        .post(`/api/expenditures/bills/${bill._id}/pay`)
        .set('Authorization', managerAuth)
        .send({ paymentDate: '2026-11-18' });

      expect(res.status).toBe(200);
      expect(res.body.expenditure).toBeDefined();

      const createdExp = await Expenditure.findById(res.body.expenditure._id);
      expect(createdExp).not.toBeNull();
      expect(createdExp.transactionType).toBe('W');
      expect(createdExp.autoGenerated).toBe(false);
      expect(createdExp.bridgeDirection).toBeNull();
      expect(createdExp.isRecurring).toBe(true);
      expect(createdExp.linkedRecurringBillId.toString()).toBe(bill._id.toString());
      expect(createdExp.categories).toEqual(['Utilities']);
      expect(createdExp.transactionValue).toBe(750);
      expect(createdExp.transactionValueInPiastres).toBe(75000);
    });

    it('20. advances nextDueDate with day-of-month clamping and unclamping (Jan 31 -> Feb 28 -> Mar 31) [🟡-5]', async () => {
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Month-End Rent',
        category: 'Housing',
        amount: 5000,
        amountInPiastres: 500000,
        frequency: 'monthly',
        dueDay: 31,
        nextDueDate: new Date('2026-01-31T12:00:00.000Z'),
        paymentMethod: 'Bank',
      });

      // Pay Jan 31 -> should clamp to Feb 28
      const res1 = await request(app)
        .post(`/api/expenditures/bills/${bill._id}/pay`)
        .set('Authorization', managerAuth)
        .send({ paymentDate: '2026-01-31' });

      expect(res1.status).toBe(200);
      expect(new Date(res1.body.bill.nextDueDate).toISOString()).toContain('2026-02-28');

      // Pay Feb 28 -> should unclamp back to Mar 31
      const res2 = await request(app)
        .post(`/api/expenditures/bills/${bill._id}/pay`)
        .set('Authorization', managerAuth)
        .send({ paymentDate: '2026-02-28' });

      expect(res2.status).toBe(200);
      expect(new Date(res2.body.bill.nextDueDate).toISOString()).toContain('2026-03-31');
    });

    it('21. debit balance is properly propagated to subsequent expenditure records [🟡-15]', async () => {
      // Create initial seed expenditure establishing 10,000 EGP bank balance
      await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2026-11-01',
          transactionValue: 10000,
          paymentMethod: 'Bank',
          transactionType: 'T', // Top-up
          categories: ['Other'],
          description: 'Seed Balance',
        });

      // Subsequent transaction on Nov 10
      const subRes = await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2026-11-10',
          transactionValue: 500,
          paymentMethod: 'Bank',
          transactionType: 'W',
          categories: ['Food & Dining'],
          description: 'Lunch',
        });

      const initialSubExp = await Expenditure.findById(subRes.body._id);
      expect(initialSubExp.runningBalances.bank).toBe(9500);

      // Create bill and pay it retroactively on Nov 5 (between seed and Nov 10)
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Water Utility',
        category: 'Utilities',
        amount: 1000,
        amountInPiastres: 100000,
        dueDay: 5,
        nextDueDate: new Date('2026-11-05T12:00:00.000Z'),
        paymentMethod: 'Bank',
      });

      const payRes = await request(app)
        .post(`/api/expenditures/bills/${bill._id}/pay`)
        .set('Authorization', managerAuth)
        .send({ paymentDate: '2026-11-05' });

      expect(payRes.status).toBe(200);

      // Verify that subsequent Nov 10 transaction balance decreased from 9500 to 8500
      const updatedSubExp = await Expenditure.findById(subRes.body._id);
      expect(updatedSubExp.runningBalances.bank).toBe(8500);
      expect(updatedSubExp.runningBalancesInPiastres.bank).toBe(850000);
    });

    it('22. bulk-deleting a bill-payment expenditure succeeds; bill template retains lastExpenditureId pointing to soft-deleted record [🟡-13]', async () => {
      const bill = await RecurringBill.create({
        user: managerUser._id,
        name: 'Netflix Subscription',
        category: 'Subscriptions',
        amount: 250,
        amountInPiastres: 25000,
        dueDay: 1,
        nextDueDate: new Date('2026-11-01T12:00:00.000Z'),
        paymentMethod: 'Prepaid',
      });

      const payRes = await request(app)
        .post(`/api/expenditures/bills/${bill._id}/pay`)
        .set('Authorization', managerAuth);

      const paidExpId = payRes.body.expenditure._id;

      // Bulk delete the bill payment expenditure
      const bulkRes = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', managerAuth)
        .send({ ids: [paidExpId] });

      expect(bulkRes.status).toBe(200);
      expect(bulkRes.body.deletedCount).toBe(1);

      // The expenditure is soft-deleted
      const deletedExp = await Expenditure.findOne({ _id: paidExpId, deletedAt: { $ne: null } });
      expect(deletedExp).not.toBeNull();

      // The bill template remains active with lastExpenditureId still pointing to it
      const refreshedBill = await RecurringBill.findById(bill._id);
      expect(refreshedBill.lastExpenditureId.toString()).toBe(paidExpId.toString());
      expect(refreshedBill.deletedAt).toBeNull();
    });
  });
});
