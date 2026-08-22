// backend/tests/integration/roleHierarchy.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const LoginAudit = require('../../models/LoginAudit');
const Expenditure = require('../../models/Expenditure');
const Certificate = require('../../models/Certificate');
const Trade = require('../../models/Trade');

jest.setTimeout(30000);

describe('Role Hierarchy & Data Ownership (Integration Tests)', () => {
  let adminUser, managerUser, adminViewer, managerViewer;
  let adminToken, managerToken, adminViewerToken, managerViewerToken;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    const testUsernames = [
      'rh_admin',
      'rh_manager',
      'rh_admin_viewer',
      'rh_manager_viewer',
      'rh_created_mgr',
      'rh_created_vwr',
    ];
    const existingTestUsers = await User.find({ username: { $in: testUsernames } });
    const existingTestUserIds = existingTestUsers.map(u => u._id);
    if (existingTestUserIds.length > 0) {
      await Expenditure.deleteMany({ user: { $in: existingTestUserIds } });
      await Certificate.deleteMany({ user: { $in: existingTestUserIds } });
      await Trade.deleteMany({ user: { $in: existingTestUserIds } });
      await RefreshToken.deleteMany({ userId: { $in: existingTestUserIds } });
      await LoginAudit.deleteMany({ userId: { $in: existingTestUserIds } });
    }
    await User.deleteMany({ username: { $in: testUsernames } });

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create Admin
    adminUser = await User.create({
      username: 'rh_admin',
      email: 'rh_admin@finstat.io',
      password: hashedPassword,
      role: 'admin',
      managedBy: null,
    });

    // 2. Create Manager
    managerUser = await User.create({
      username: 'rh_manager',
      email: 'rh_manager@finstat.io',
      password: hashedPassword,
      role: 'manager',
      managedBy: null,
    });

    // 3. Create Viewer attached to Admin
    adminViewer = await User.create({
      username: 'rh_admin_viewer',
      email: 'rh_admin_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: adminUser._id,
    });

    // 4. Create Viewer attached to Manager
    managerViewer = await User.create({
      username: 'rh_manager_viewer',
      email: 'rh_manager_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: managerUser._id,
    });

    // Generate JWTs
    adminToken = jwt.sign(
      {
        user: {
          id: adminUser._id.toString(),
          role: 'admin',
          username: adminUser.username,
          managedBy: null,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    managerToken = jwt.sign(
      {
        user: {
          id: managerUser._id.toString(),
          role: 'manager',
          username: managerUser.username,
          managedBy: null,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminViewerToken = jwt.sign(
      {
        user: {
          id: adminViewer._id.toString(),
          role: 'viewer',
          username: adminViewer.username,
          managedBy: adminUser._id.toString(),
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    managerViewerToken = jwt.sign(
      {
        user: {
          id: managerViewer._id.toString(),
          role: 'viewer',
          username: managerViewer.username,
          managedBy: managerUser._id.toString(),
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    const testUsernames = [
      'rh_admin',
      'rh_manager',
      'rh_admin_viewer',
      'rh_manager_viewer',
      'rh_created_mgr',
      'rh_created_vwr',
    ];
    const testUsers = await User.find({ username: { $in: testUsernames } });
    const testUserIds = testUsers.map(u => u._id);
    if (testUserIds.length > 0) {
      await Expenditure.deleteMany({ user: { $in: testUserIds } });
      await Certificate.deleteMany({ user: { $in: testUserIds } });
      await Trade.deleteMany({ user: { $in: testUserIds } });
      await RefreshToken.deleteMany({ userId: { $in: testUserIds } });
      await LoginAudit.deleteMany({ userId: { $in: testUserIds } });
    }
    await User.deleteMany({ username: { $in: testUsernames } });
    await mongoose.disconnect();
  });

  describe('1. Data Scoping & Read Operations', () => {
    let adminExpId;
    let managerExpId;

    beforeAll(async () => {
      // Create an expenditure for Admin
      const exp1 = await Expenditure.create({
        date: new Date('2026-01-01'),
        transactionValue: 2500,
        transactionType: 'W',
        paymentMethod: 'Bank',
        categories: ['Office'],
        user: adminUser._id,
      });
      adminExpId = exp1._id.toString();

      // Create an expenditure for Manager
      const exp2 = await Expenditure.create({
        date: new Date('2026-01-02'),
        transactionValue: 1200,
        transactionType: 'W',
        paymentMethod: 'Cash',
        categories: ['Supplies'],
        user: managerUser._id,
      });
      managerExpId = exp2._id.toString();
    });

    it('Admin sees only Admin expenditures', async () => {
      const res = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(adminExpId);
    });

    it('Manager sees only Manager expenditures', async () => {
      const res = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(managerExpId);
    });

    it('Admin Viewer inherits and sees Admin expenditures', async () => {
      const res = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${adminViewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(adminExpId);
    });

    it('Manager Viewer inherits and sees Manager expenditures', async () => {
      const res = await request(app)
        .get('/api/expenditures')
        .set('Authorization', `Bearer ${managerViewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id.toString()).toBe(managerExpId);
    });
  });

  describe('2. Write / Mutation Protection for Viewers', () => {
    it('Viewer cannot create an expenditure (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${adminViewerToken}`)
        .send({
          date: '2026-01-05',
          transactionValue: 500,
          transactionType: 'W',
          paymentMethod: 'Cash',
          categories: ['Miscellaneous'],
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Viewers have read-only access');
    });

    it('Viewer cannot create a certificate (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerViewerToken}`)
        .send({
          name: 'Platinum Cert',
          period: 36,
          amount: 10000,
          interest: 18.5,
          startDate: '2026-01-01',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Viewers have read-only access');
    });

    it('Viewer cannot create a trade (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${adminViewerToken}`)
        .send({
          date: '2026-01-15',
          broker: 'Thndr',
          stockCode: 'COMI',
          type: 'Buy',
          price: 75.5,
          shares: 100,
          totalValue: 7550,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Viewers have read-only access');
    });

    it('Manager can create an expenditure successfully', async () => {
      const res = await request(app)
        .post('/api/expenditures')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2026-01-10',
          transactionValue: 800,
          transactionType: 'W',
          paymentMethod: 'Bank',
          categories: ['Travel'],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.toString()).toBe(managerUser._id.toString());
    });
  });

  describe('3. Admin User Management (Role Hierarchy)', () => {
    it('Admin listing users excludes active admin and shows managedBy info', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedIds = res.body.users.map((u) => u._id.toString());
      expect(returnedIds).not.toContain(adminUser._id.toString());
      expect(returnedIds).toContain(managerUser._id.toString());
      expect(returnedIds).toContain(adminViewer._id.toString());
      expect(returnedIds).toContain(managerViewer._id.toString());
    });

    it('Admin can create a new Manager', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'rh_created_mgr',
          email: 'rh_created_mgr@finstat.io',
          password: 'Password123!',
          role: 'manager',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('manager');
      expect(res.body.user.managedBy).toBeNull();
    });

    it('Admin creating a Viewer with invalid parentId fails (400 Bad Request)', async () => {
      const invalidParentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'rh_invalid_vwr',
          email: 'rh_invalid_vwr@finstat.io',
          password: 'Password123!',
          role: 'viewer',
          parentId: invalidParentId,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Parent must be an Admin or Manager');
    });

    it('Admin cannot delete their own account (400 Bad Request)', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Admins cannot delete their own account');
    });
  });

  describe('4. Manager User Management (Role Hierarchy)', () => {
    let createdViewerId;

    it('Manager listing users sees only Viewers attached to this Manager', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const returnedUsernames = res.body.users.map((u) => u.username);
      expect(returnedUsernames).toContain('rh_manager_viewer');
      expect(returnedUsernames).not.toContain('rh_admin_viewer');
      expect(returnedUsernames).not.toContain('rh_admin');
    });

    it('Manager creating a user is forced to Viewer attached to Manager', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          username: 'rh_created_vwr',
          email: 'rh_created_vwr@finstat.io',
          password: 'Password123!',
          role: 'admin', // Even if manager attempts to specify 'admin', it is forced to 'viewer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.role).toBe('viewer');
      expect(res.body.user.managedBy.toString()).toBe(managerUser._id.toString());
      createdViewerId = res.body.user._id;
    });

    it('Manager cannot delete an Admin or another Manager’s Viewer (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminViewer._id.toString()}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('You can only delete your own viewers');
    });

    it('Manager can delete their own Viewer successfully', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${createdViewerId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');

      const checkDb = await User.findById(createdViewerId);
      expect(checkDb).toBeNull();
    });
  });
});
