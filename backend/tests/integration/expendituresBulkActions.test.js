// backend/tests/integration/expendituresBulkActions.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Expenditure = require('../../models/Expenditure');

jest.setTimeout(60000);

describe('Step 6B.4: [GAP-008] Bulk Actions on Expenditures Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
    await Expenditure.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await Expenditure.init();

    const manager = await createUserWithToken({ role: 'manager', username: 'bulk_mgr' });
    managerUser = manager.user;
    managerAuth = manager.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'bulk_view', managedBy: managerUser._id });
    viewerUser = viewer.user;
    viewerAuth = viewer.authHeader;

    const other = await createUserWithToken({ role: 'manager', username: 'bulk_other' });
    otherUser = other.user;
    otherAuth = other.authHeader;
  });

  describe('1. Bulk Category Reassignment (POST /api/expenditures/bulk-category)', () => {
    it('updates category across multiple expenditures successfully', async () => {
      // Create 3 expenditures
      const e1 = await Expenditure.create({
        user: managerUser._id,
        date: new Date('2024-05-01'),
        bank: 1000,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        categories: ['Groceries'],
      });

      const e2 = await Expenditure.create({
        user: managerUser._id,
        date: new Date('2024-05-02'),
        bank: 900,
        cash: 0,
        prepaid: 0,
        transactionValue: 50,
        transactionType: 'W',
        categories: ['Entertainment'],
      });

      const res = await request(app)
        .post('/api/expenditures/bulk-category')
        .set('Authorization', managerAuth)
        .send({
          ids: [e1._id.toString(), e2._id.toString()],
          category: 'Utilities',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.modifiedCount).toBe(2);

      const updated1 = await Expenditure.findById(e1._id);
      const updated2 = await Expenditure.findById(e2._id);
      expect(updated1.categories).toEqual(['Utilities']);
      expect(updated2.categories).toEqual(['Utilities']);
    });

    it('caps update at 100 IDs with HTTP 400 when exceeded', async () => {
      const mockIds = Array.from({ length: 101 }, () => new mongoose.Types.ObjectId().toString());

      const res = await request(app)
        .post('/api/expenditures/bulk-category')
        .set('Authorization', managerAuth)
        .send({
          ids: mockIds,
          category: 'Shopping',
        });

      expect(res.status).toBe(400);
    });

    it('rejects viewer role with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/expenditures/bulk-category')
        .set('Authorization', viewerAuth)
        .send({
          ids: [new mongoose.Types.ObjectId().toString()],
          category: 'Shopping',
        });

      expect(res.status).toBe(403);
    });

    it('enforces multi-tenant boundary (does not update other user documents)', async () => {
      const otherExp = await Expenditure.create({
        user: otherUser._id,
        date: new Date('2024-05-01'),
        bank: 1000,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        categories: ['Groceries'],
      });

      const res = await request(app)
        .post('/api/expenditures/bulk-category')
        .set('Authorization', managerAuth)
        .send({
          ids: [otherExp._id.toString()],
          category: 'HackedCategory',
        });

      expect(res.status).toBe(200);
      expect(res.body.modifiedCount).toBe(0);

      const unchanged = await Expenditure.findById(otherExp._id);
      expect(unchanged.categories).toEqual(['Groceries']);
    });

    it('ignores soft-deleted documents during category update', async () => {
      const softDeleted = await Expenditure.create({
        user: managerUser._id,
        date: new Date('2024-05-01'),
        bank: 1000,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        categories: ['OldCategory'],
        deletedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/expenditures/bulk-category')
        .set('Authorization', managerAuth)
        .send({
          ids: [softDeleted._id.toString()],
          category: 'NewCategory',
        });

      expect(res.status).toBe(200);
      expect(res.body.modifiedCount).toBe(0);

      const unchanged = await Expenditure.findById(softDeleted._id);
      expect(unchanged.categories).toEqual(['OldCategory']);
    });
  });

  describe('2. Bulk Delete with Balance Reversion (POST /api/expenditures/bulk-delete)', () => {
    it('soft deletes multiple expenditures in single transaction', async () => {
      const e1 = await Expenditure.create({
        user: managerUser._id,
        date: new Date('2024-05-01'),
        bank: 1000,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        categories: ['Groceries'],
      });

      const e2 = await Expenditure.create({
        user: managerUser._id,
        date: new Date('2024-05-02'),
        bank: 900,
        cash: 0,
        prepaid: 0,
        transactionValue: 50,
        transactionType: 'W',
        categories: ['Snacks'],
      });

      const res = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', managerAuth)
        .send({
          ids: [e1._id.toString(), e2._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deletedCount).toBe(2);

      const d1 = await Expenditure.findById(e1._id);
      const d2 = await Expenditure.findById(e2._id);
      expect(d1.deletedAt).not.toBeNull();
      expect(d2.deletedAt).not.toBeNull();
    });

    it('correctly reverts balance impacts for subsequent chronological transactions', async () => {
      // 1. Initial deposit (TopUp) of 1000 EGP
      const r1 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-01',
          transactionValue: 1000,
          transactionType: 'T', // Topup into Bank: bank becomes 1000
          paymentMethod: 'Bank',
          categories: ['Salary'],
        });

      // 2. First withdrawal of 100 EGP
      const r2 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-02',
          transactionValue: 100,
          transactionType: 'W', // Bank withdraw: bank becomes 900
          paymentMethod: 'Bank',
          categories: ['Groceries'],
        });

      // 3. Second withdrawal of 50 EGP
      const r3 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-03',
          transactionValue: 50,
          transactionType: 'W', // Bank withdraw: bank becomes 850
          paymentMethod: 'Bank',
          categories: ['Transport'],
        });

      // 4. Future transaction of 20 EGP (that will remain)
      const r4 = await request(app)
        .post('/api/expenditures')
        .set('Authorization', managerAuth)
        .send({
          date: '2024-05-04',
          transactionValue: 20,
          transactionType: 'W', // Bank withdraw: bank becomes 830
          paymentMethod: 'Bank',
          categories: ['Coffee'],
        });

      const id2 = r2.body._id;
      const id3 = r3.body._id;
      const id4 = r4.body._id;

      // Verify r4 running bank balance before bulk deletion is 830
      const exp4Before = await Expenditure.findById(id4);
      expect(exp4Before.bank).toBe(830);

      // Bulk delete id2 and id3 (total 150 withdrawn will be reverted back: +100 + 50 = +150)
      const delRes = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', managerAuth)
        .send({
          ids: [id2, id3],
        });

      expect(delRes.status).toBe(200);
      expect(delRes.body.deletedCount).toBe(2);

      // Future log r4 running balance should now reflect reverted 150 (830 + 150 = 980)
      const exp4After = await Expenditure.findById(id4);
      expect(exp4After.bank).toBe(980);
    });

    it('caps delete at 50 IDs with HTTP 400 when exceeded', async () => {
      const mockIds = Array.from({ length: 51 }, () => new mongoose.Types.ObjectId().toString());

      const res = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', managerAuth)
        .send({
          ids: mockIds,
        });

      expect(res.status).toBe(400);
    });

    it('rejects viewer role with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', viewerAuth)
        .send({
          ids: [new mongoose.Types.ObjectId().toString()],
        });

      expect(res.status).toBe(403);
    });

    it('enforces multi-tenant boundary (does not delete other user documents)', async () => {
      const otherExp = await Expenditure.create({
        user: otherUser._id,
        date: new Date('2024-05-01'),
        bank: 1000,
        cash: 0,
        prepaid: 0,
        transactionValue: 100,
        transactionType: 'W',
        categories: ['OtherGroceries'],
      });

      const res = await request(app)
        .post('/api/expenditures/bulk-delete')
        .set('Authorization', managerAuth)
        .send({
          ids: [otherExp._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(0);

      const unchanged = await Expenditure.findById(otherExp._id);
      expect(unchanged.deletedAt).toBeNull();
    });
  });
});

