// backend/tests/integration/authHardening.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const express = require('express');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const LoginAudit = require('../../models/LoginAudit');
const authorize = require('../../middleware/authorize');
const auth = require('../../middleware/auth');
const { encryptSecret } = require('../../utils/totpUtils');

jest.setTimeout(30000);

describe('Auth Hardening & Scalability Suite', () => {
  let testUser;
  let testPassword = 'Password123!';
  let adminUser;

  beforeAll(async () => {
    await connectDB();
    // Clean up test collections
    await User.deleteMany({ username: { $in: ['test_auth_user', 'test_admin_user'] } });
    await RefreshToken.deleteMany({});
    await LoginAudit.deleteMany({});

    const hashedPassword = await bcrypt.hash(testPassword, 10);

    testUser = await User.create({
      username: 'test_auth_user',
      password: hashedPassword,
      role: 'viewer',
    });

    adminUser = await User.create({
      username: 'test_admin_user',
      password: hashedPassword,
      role: 'admin',
    });
  });

  afterAll(async () => {
    await User.deleteMany({ username: { $in: ['test_auth_user', 'test_admin_user'] } });
    await RefreshToken.deleteMany({});
    await LoginAudit.deleteMany({});
    await mongoose.disconnect();
  });

  describe('1. Standard Login & Refresh Token Rotation', () => {
    let refreshTokenCookie;
    let initialAccessToken;

    it('should log in successfully without 2FA and receive token + HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_auth_user', password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('viewer');

      initialAccessToken = res.body.token;

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');

      // Verify RefreshToken record in DB
      const tokensInDb = await RefreshToken.find({ userId: testUser._id });
      expect(tokensInDb.length).toBeGreaterThan(0);
    });

    it('should rotate refresh token and issue new access token on POST /refresh', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.token).not.toBe(initialAccessToken);

      // Verify new cookie was set
      const newCookies = res.headers['set-cookie'];
      const newRefreshTokenCookie = newCookies.find((c) => c.startsWith('refreshToken='));
      expect(newRefreshTokenCookie).toBeDefined();

      // Check that old cookie now points to a revoked token
      const oldRevokedAttempt = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      // Reuse detection should trigger
      expect(oldRevokedAttempt.statusCode).toBe(401);
      expect(oldRevokedAttempt.body.message).toContain('Revoked refresh token reused');

      // All user tokens should now be revoked
      const allTokens = await RefreshToken.find({ userId: testUser._id, revoked: false });
      expect(allTokens.length).toBe(0);
    });
  });

  describe('2. Login Failures & Forensic Audit Logging', () => {
    it('should fail with invalid password and record attempted username in audit log', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_auth_user', password: 'WrongPassword!' });

      expect(res.statusCode).toBe(401);

      // Wait 100ms for async audit logger
      await new Promise((r) => setTimeout(r, 150));

      const audit = await LoginAudit.findOne({ attemptedUsername: 'test_auth_user', success: false });
      expect(audit).toBeDefined();
      expect(audit.attemptedUsername).toBe('test_auth_user');
      expect(audit.success).toBe(false);
    });

    it('should fail for non-existent user with userId: null and record attempted username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'unknown_ghost_user', password: 'AnyPassword' });

      expect(res.statusCode).toBe(401);

      await new Promise((r) => setTimeout(r, 150));

      const audit = await LoginAudit.findOne({ attemptedUsername: 'unknown_ghost_user' });
      expect(audit).toBeDefined();
      expect(audit.userId).toBeNull();
      expect(audit.attemptedUsername).toBe('unknown_ghost_user');
    });
  });

  describe('3. 2FA Setup, TOTP Verification & Backup Codes', () => {
    let authHeader;
    let setupSecret;
    let backupCodes;

    beforeAll(async () => {
      const token = jwt.sign(
        { user: { id: testUser._id.toString(), role: testUser.role } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      authHeader = `Bearer ${token}`;
    });

    it('should generate TOTP setup secret', async () => {
      const res = await request(app)
        .post('/api/auth/2fa/setup')
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(200);
      expect(res.body.secret).toBeDefined();
      expect(res.body.formattedSecret).toBeDefined();
      setupSecret = res.body.secret;
    });

    it('should verify setup code, enable 2FA, and return 10 backup codes', async () => {
      const currentCode = speakeasy.totp({
        secret: setupSecret,
        encoding: 'base32',
      });

      const res = await request(app)
        .post('/api/auth/2fa/verify-setup')
        .set('Authorization', authHeader)
        .send({ secret: setupSecret, code: currentCode });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.backupCodes).toHaveLength(10);
      backupCodes = res.body.backupCodes;

      // Verify User in DB
      const updatedUser = await User.findById(testUser._id).select('+totpSecret +backupCodes');
      expect(updatedUser.totpEnabled).toBe(true);
      expect(updatedUser.totpSecret).toBeDefined();
      expect(updatedUser.backupCodes).toHaveLength(10);
    });

    it('should require 2FA on login when totpEnabled is true', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_auth_user', password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.require2FA).toBe(true);
      expect(res.body.tempToken).toBeDefined();

      const tempToken = res.body.tempToken;

      // Step 2: Test invalid TOTP code
      const failRes = await request(app)
        .post('/api/auth/login/2fa')
        .send({ tempToken, code: '000000' });
      expect(failRes.statusCode).toBe(401);

      // Step 2: Test valid TOTP code
      const currentCode = speakeasy.totp({
        secret: setupSecret,
        encoding: 'base32',
      });

      const successRes = await request(app)
        .post('/api/auth/login/2fa')
        .send({ tempToken, code: currentCode });

      expect(successRes.statusCode).toBe(200);
      expect(successRes.body.token).toBeDefined();
      expect(successRes.body.user.totpEnabled).toBe(true);
    });

    it('should allow login with backup code and consume it', async () => {
      // Step 1: Login to get tempToken
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_auth_user', password: testPassword });

      const tempToken = loginRes.body.tempToken;
      const testCode = backupCodes[0];

      // Step 2: Login with first backup code
      const res = await request(app)
        .post('/api/auth/login/2fa')
        .send({ tempToken, backupCode: testCode });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();

      // Check that remaining backup codes in DB is 9
      const userAfter = await User.findById(testUser._id).select('+backupCodes');
      expect(userAfter.backupCodes).toHaveLength(9);

      // Re-attempting login with the SAME consumed backup code should fail
      const loginRes2 = await request(app)
        .post('/api/auth/login')
        .send({ username: 'test_auth_user', password: testPassword });

      const reuseRes = await request(app)
        .post('/api/auth/login/2fa')
        .send({ tempToken: loginRes2.body.tempToken, backupCode: testCode });

      expect(reuseRes.statusCode).toBe(401);
      expect(reuseRes.body.message).toContain('Invalid backup code');
    });

    it('should disable 2FA with password verification', async () => {
      const res = await request(app)
        .post('/api/auth/2fa/disable')
        .set('Authorization', authHeader)
        .send({ password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findById(testUser._id);
      expect(user.totpEnabled).toBe(false);
    });
  });

  describe('4. RBAC Authorize Middleware', () => {
    it('should block non-admin users from admin-only routes with 403', async () => {
      const viewerToken = jwt.sign(
        { user: { id: testUser._id.toString(), role: 'viewer' } },
        process.env.JWT_SECRET
      );

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/admin-only', auth, authorize(['admin']), (req, res) => res.json({ secret: 42 }));

      const res = await request(testApp)
        .get('/admin-only')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow admin users on admin-only routes with 200', async () => {
      const adminToken = jwt.sign(
        { user: { id: adminUser._id.toString(), role: 'admin' } },
        process.env.JWT_SECRET
      );

      const testApp = express();
      testApp.use(express.json());
      testApp.get('/admin-only', auth, authorize(['admin']), (req, res) => res.json({ secret: 42 }));

      const res = await request(testApp)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.secret).toBe(42);
    });
  });

  describe('5. Audit Logs Endpoint', () => {
    it('should return paginated audit logs for authenticated user', async () => {
      const token = jwt.sign(
        { user: { id: testUser._id.toString(), role: 'viewer' } },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get('/api/auth/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.page).toBe(1);
    });
  });
});
