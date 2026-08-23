// backend/tests/integration/expenditureLedger.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Expenditure = require('../../models/Expenditure');

jest.setTimeout(60000);

describe('Expenditure Ledger Running Balances & Backdating (Integration Tests)', () => {
  let testUser, viewerUser;
  let userToken, viewerToken;

  beforeAll(async () => {
    await connectDB();

    const testUsernames = ['ledger_test_user', 'ledger_test_viewer'];
    const existingUsers = await User.find({ username: { $in: testUsernames } });
    const existingIds = existingUsers.map((u) => u._id);
    if (existingIds.length > 0) {
      await Expenditure.deleteMany({ user: { $in: existingIds } });
      await User.deleteMany({ _id: { $in: existingIds } });
    }

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    testUser = await User.create({
      username: 'ledger_test_user',
      email: 'ledger_user@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    viewerUser = await User.create({
      username: 'ledger_test_viewer',
      email: 'ledger_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: testUser._id,
    });

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    userToken = jwt.sign(
      {
        user: {
          id: testUser._id.toString(),
          role: testUser.role,
          effectiveUserId: testUser._id.toString(),
          canModify: true,
        },
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      {
        user: {
          id: viewerUser._id.toString(),
          role: viewerUser.role,
          effectiveUserId: testUser._id.toString(),
          canModify: false,
        },
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser?._id) {
      await Expenditure.deleteMany({ user: testUser._id });
      await User.deleteMany({ _id: { $in: [testUser._id, viewerUser._id] } });
    }
    await mongoose.connection.close();
  });

  describe('Backdated Insertions & Propagation', () => {
    let day1Id, day3Id, backdatedDay2Id;

    it('1. Create Day 1 (+1000 Bank) and Day 3 (+500 Bank)', async () => {
      // Day 1
      const res1 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-01T10:00:00.000Z',
          transactionValue: 1000,
          transactionType: 'T',
          paymentMethod: 'Bank',
          description: 'Day 1 Initial Bank Topup',
        });

      expect(res1.statusCode).toBe(201);
      expect(res1.body.runningBalances.bank).toBe(1000);
      expect(res1.body.runningBalances.cash).toBe(0);
      expect(res1.body.runningBalances.prepaid).toBe(0);
      day1Id = res1.body._id;

      // Day 3
      const res3 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-03T10:00:00.000Z',
          transactionValue: 500,
          transactionType: 'T',
          paymentMethod: 'Bank',
          description: 'Day 3 Bank Topup',
        });

      expect(res3.statusCode).toBe(201);
      expect(res3.body.runningBalances.bank).toBe(1500);
      day3Id = res3.body._id;
    });

    it('2. Backdate Day 2 (-200 Bank Withdrawal) -> adjusts Day 3 Bank balance automatically', async () => {
      // Day 2 Withdrawal
      const res2 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-02T10:00:00.000Z',
          transactionValue: 200,
          transactionType: 'W',
          paymentMethod: 'Bank',
          description: 'Day 2 Bank Withdrawal',
        });

      expect(res2.statusCode).toBe(201);
      expect(res2.body.runningBalances.bank).toBe(800); // 1000 - 200
      backdatedDay2Id = res2.body._id;

      // Check Day 3 record in DB -> should now be 1300 (1500 - 200)
      const day3Doc = await Expenditure.findById(day3Id);
      expect(day3Doc.runningBalances.bank).toBe(1300);
      expect(day3Doc.bank).toBe(1300);
    });

    it('3. Insert Cash and Prepaid backdated transactions affecting only their respective accounts', async () => {
      // Add Cash on Day 1 (+500 Cash)
      await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-01T11:00:00.000Z',
          transactionValue: 500,
          transactionType: 'T',
          paymentMethod: 'Cash',
        });

      // Add Prepaid on Day 3 (+200 Prepaid)
      const preRes = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-03T11:00:00.000Z',
          transactionValue: 200,
          transactionType: 'T',
          paymentMethod: 'Prepaid',
        });

      expect(preRes.body.runningBalances.prepaid).toBe(200);
      expect(preRes.body.runningBalances.bank).toBe(1300);
      expect(preRes.body.runningBalances.cash).toBe(500);

      // Backdate Day 2 Cash Withdrawal (-100 Cash)
      const cashRes = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-02T12:00:00.000Z',
          transactionValue: 100,
          transactionType: 'W',
          paymentMethod: 'Cash',
        });

      expect(cashRes.body.runningBalances.cash).toBe(400); // 500 - 100

      // Verify Day 3 Prepaid record has updated Cash balance (400) while Bank (1300) and Prepaid (200) stay intact
      const updatedPreDoc = await Expenditure.findById(preRes.body._id);
      expect(updatedPreDoc.runningBalances.cash).toBe(400);
      expect(updatedPreDoc.runningBalances.bank).toBe(1300);
      expect(updatedPreDoc.runningBalances.prepaid).toBe(200);
    });

    it('4. Create Log / Transfer transaction (na) moving money from Bank to Cash', async () => {
      // Transfer $300 from Bank to Cash on Day 4
      const transferRes = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-04T10:00:00.000Z',
          transactionValue: 300,
          transactionType: 'na',
          logBankOp: '-',
          logCashOp: '+',
          logPrepaidOp: 'none',
          description: 'Transfer 300 from Bank to Cash',
        });

      expect(transferRes.statusCode).toBe(201);
      // Preceding balances on Day 3: Bank 1300, Cash 400, Prepaid 200
      // After transfer: Bank 1000, Cash 700, Prepaid 200
      expect(transferRes.body.runningBalances.bank).toBe(1000);
      expect(transferRes.body.runningBalances.cash).toBe(700);
      expect(transferRes.body.runningBalances.prepaid).toBe(200);
    });
  });

  describe('Updates & Balance Propagation', () => {
    let testDocId;

    beforeEach(async () => {
      await Expenditure.deleteMany({ user: testUser._id });

      // Create sequence:
      // Day 1: +1000 Bank
      await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-01T10:00:00.000Z',
          transactionValue: 1000,
          transactionType: 'T',
          paymentMethod: 'Bank',
        });

      // Day 2: -300 Bank
      const res2 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-02T10:00:00.000Z',
          transactionValue: 300,
          transactionType: 'W',
          paymentMethod: 'Bank',
        });
      testDocId = res2.body._id;

      // Day 3: -100 Bank
      await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-08-03T10:00:00.000Z',
          transactionValue: 100,
          transactionType: 'W',
          paymentMethod: 'Bank',
        });
    });

    it('Update Amount: changing past withdrawal from 300 to 500 adjusts future balances by -200', async () => {
      const updateRes = await request(app)
        .put(`/api/expenditures/${testDocId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          transactionValue: 500,
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.runningBalances.bank).toBe(500); // 1000 - 500

      // Check latest expenditure
      const latest = await request(app)
        .get('/api/expenditures/latest')
        .set('Authorization', `Bearer ${userToken}`);

      expect(latest.body.runningBalances.bank).toBe(400); // was 600, now 1000 - 500 - 100 = 400
    });

    it('Update Account/PaymentMethod: changing Bank withdrawal to Cash withdrawal adjusts both accounts', async () => {
      const updateRes = await request(app)
        .put(`/api/expenditures/${testDocId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentMethod: 'Cash',
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.runningBalances.bank).toBe(1000); // Bank reverted from 700 back to 1000
      expect(updateRes.body.runningBalances.cash).toBe(-300); // Cash is now -300

      const latest = await request(app)
        .get('/api/expenditures/latest')
        .set('Authorization', `Bearer ${userToken}`);

      expect(latest.body.runningBalances.bank).toBe(900); // 1000 - 100 on Day 3
      expect(latest.body.runningBalances.cash).toBe(-300);
    });

    it('Delete Past Record: deleting past withdrawal reverts balance reduction on future records', async () => {
      const delRes = await request(app)
        .delete(`/api/expenditures/${testDocId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.statusCode).toBe(200);

      const latest = await request(app)
        .get('/api/expenditures/latest')
        .set('Authorization', `Bearer ${userToken}`);

      expect(latest.body.runningBalances.bank).toBe(900); // 1000 - 100 (300 withdrawal removed)
    });
  });

  describe('Viewer Permissions Enforcement', () => {
    it('Viewer cannot create an expenditure', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          date: '2026-08-01T10:00:00.000Z',
          transactionValue: 500,
          transactionType: 'T',
          paymentMethod: 'Bank',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Viewers have read-only access');
    });
  });
});
