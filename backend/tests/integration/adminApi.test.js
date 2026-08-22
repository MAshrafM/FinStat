// backend/tests/integration/adminApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const LoginAudit = require('../../models/LoginAudit');

jest.setTimeout(30000);

describe('Admin User Management API (Integration Tests)', () => {
  let adminUser;
  let viewerUser;
  let adminToken;
  let viewerToken;

  beforeAll(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({
      username: { $in: ['admin_tester', 'viewer_tester', 'created_user_1', 'created_user_2'] },
    });
    await RefreshToken.deleteMany({});
    await LoginAudit.deleteMany({});

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    adminUser = await User.create({
      username: 'admin_tester',
      email: 'admin_tester@finstat.io',
      password: hashedPassword,
      role: 'admin',
    });

    viewerUser = await User.create({
      username: 'viewer_tester',
      email: 'viewer_tester@finstat.io',
      password: hashedPassword,
      role: 'viewer',
    });

    adminToken = jwt.sign(
      { user: { id: adminUser._id.toString(), role: 'admin', username: adminUser.username } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { user: { id: viewerUser._id.toString(), role: 'viewer', username: viewerUser.username } },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({
      username: { $in: ['admin_tester', 'viewer_tester', 'created_user_1', 'created_user_2'] },
    });
    await RefreshToken.deleteMany({});
    await LoginAudit.deleteMany({});
    await mongoose.disconnect();
  });

  describe('1. GET /api/admin/users', () => {
    it('should reject non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should return paginated list of users excluding current admin', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);

      // Current admin should NOT be in the returned list
      const selfInList = res.body.users.find((u) => u._id === adminUser._id.toString());
      expect(selfInList).toBeUndefined();

      // Viewer user should be in the returned list
      const viewerInList = res.body.users.find((u) => u.username === 'viewer_tester');
      expect(viewerInList).toBeDefined();
      expect(viewerInList.password).toBeUndefined();
      expect(viewerInList.totpSecret).toBeUndefined();
    });

    it('should search users by username or email', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=viewer_tester')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.users[0].username).toBe('viewer_tester');
    });
  });

  describe('2. POST /api/admin/users', () => {
    it('should reject non-admin users with 403', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          username: 'created_user_1',
          email: 'created1@finstat.io',
          password: 'Password123!',
          role: 'manager',
        });

      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to register a new user with specified role', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'created_user_1',
          email: 'created1@finstat.io',
          password: 'Password123!',
          role: 'manager',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('created_user_1');
      expect(res.body.user.email).toBe('created1@finstat.io');
      expect(res.body.user.role).toBe('manager');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate username with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'created_user_1',
          email: 'different_email@finstat.io',
          password: 'Password123!',
          role: 'viewer',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('already taken');
    });

    it('should reject duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'different_username',
          email: 'created1@finstat.io',
          password: 'Password123!',
          role: 'viewer',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('already in use');
    });
  });

  describe('3. DELETE /api/admin/users/:id', () => {
    let userToDelete;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      userToDelete = await User.create({
        username: 'created_user_2',
        email: 'created2@finstat.io',
        password: hashedPassword,
        role: 'viewer',
      });
    });

    it('should block admin from deleting their own account with 400 Bad Request', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('cannot delete their own account');
    });

    it('should allow admin to delete another user and log audit trail', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${userToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user is deleted from DB
      const found = await User.findById(userToDelete._id);
      expect(found).toBeNull();

      // Check audit log
      await new Promise((r) => setTimeout(r, 300));
      const audit = await LoginAudit.findOne({
        action: 'delete_user',
        targetUserId: userToDelete._id,
      });
      expect(audit).not.toBeNull();
      expect(audit.userId.toString()).toBe(adminUser._id.toString());
    });
  });
});
