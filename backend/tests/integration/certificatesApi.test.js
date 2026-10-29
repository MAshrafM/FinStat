// backend/tests/integration/certificatesApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDb');
const { createUserWithToken } = require('../helpers/authFixtures');
const User = require('../../models/User');
const Certificate = require('../../models/Certificate');

jest.setTimeout(60000);

describe('Step 5B.1b: [AUD-TEST-001] Certificates API Integration Tests', () => {
  let testManager;
  let managerToken;
  let testViewer;
  let viewerToken;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
    await clearDatabase();

    const mUsername = 'cert_test_manager';
    const vUsername = 'cert_test_viewer';

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testManager = await User.create({
      username: mUsername,
      email: 'cert_mgr@finstat.io',
      password: hashedPassword,
      role: 'manager',
    });

    testViewer = await User.create({
      username: vUsername,
      email: 'cert_viewer@finstat.io',
      password: hashedPassword,
      role: 'viewer',
      managedBy: testManager._id,
    });

    const jwtSecret = process.env.JWT_SECRET || 'Finstatsonic';
    managerToken = jwt.sign(
      { user: { id: testManager._id.toString(), role: testManager.role } },
      jwtSecret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { user: { id: testViewer._id.toString(), role: testViewer.role } },
      jwtSecret,
      { expiresIn: '1h' }
    );

    const other = await createUserWithToken({ role: 'manager', username: 'cert_other_mgr' });
    otherUser = other.user;
    otherAuth = other.authHeader;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  let createdCertId;

  describe('1. Baseline Phase 7 Financial Accrual Contracts (Preserved)', () => {
    test('POST /api/certificates creates certificate with Phase 7 fields', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Platinum 3Y Certificate',
          amount: 50000,
          interest: 19.5,
          period: 36,
          startDate: '2025-06-01T00:00:00.000Z',
          payoutInterval: 'monthly',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Platinum 3Y Certificate');
      expect(res.body.amountInPiastres).toBe(5000000);
      expect(res.body.payoutInterval).toBe('monthly');
      expect(res.body.maturityDate).toBeDefined();
      expect(typeof res.body.accruedInterestInPiastres).toBe('number');
      expect(res.body.accruedInterestInPiastres).toBeGreaterThan(0);
      createdCertId = res.body._id;
    });

    test('GET /api/certificates returns certificates enriched with live accrual and status', async () => {
      const res = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const cert = res.body.find((c) => c._id === createdCertId);
      expect(cert).toBeDefined();
      expect(cert.displayStatus).toBeDefined();
      expect(typeof cert.daysRemaining).toBe('number');
      expect(typeof cert.accruedInterest).toBe('number');
    });

    test('GET /api/certificates/:id returns certificate with dual-series trajectory', async () => {
      const res = await request(app)
        .get(`/api/certificates/${createdCertId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(createdCertId);
      expect(res.body.trajectory).toBeDefined();
      expect(Array.isArray(res.body.trajectory.labels)).toBe(true);
      expect(Array.isArray(res.body.trajectory.actualSeries)).toBe(true);
      expect(Array.isArray(res.body.trajectory.projectedSeries)).toBe(true);
    });

    test('GET /api/certificates/:id/accrued-interest returns dedicated live accrual data', async () => {
      const res = await request(app)
        .get(`/api/certificates/${createdCertId}/accrued-interest`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.certificateId).toBe(createdCertId);
      expect(res.body.principal).toBe(50000);
      expect(res.body.accruedInterestInPiastres).toBeGreaterThan(0);
      expect(res.body.nextPayoutDate).toBeDefined();
    });

    test('POST /api/certificates/:id/withdraw marks certificate as withdrawn', async () => {
      const res = await request(app)
        .post(`/api/certificates/${createdCertId}/withdraw`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          withdrawalReason: 'Early liquidation for emergency',
          confirmWithdrawal: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.certificate.status).toBe('withdrawn');
      expect(res.body.certificate.withdrawalDate).toBeDefined();
      expect(res.body.accrualAtWithdrawal).toBeDefined();
    });

    test('Viewer is rejected from withdrawing a certificate (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${createdCertId}/withdraw`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          confirmWithdrawal: true,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Additive Coverage: Update, Soft Delete, Filtering & Clamped Maturity', () => {
    let activeCertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Gold 1Y Certificate',
          amount: 20000,
          interest: 15.0,
          period: 12,
          startDate: '2026-06-01T00:00:00.000Z',
          payoutInterval: 'monthly',
        });
      activeCertId = res.body._id;
    });

    it('PUT /api/certificates/:id updates principal amount and recalculates piastres and derived maturity date', async () => {
      const updateRes = await request(app)
        .put(`/api/certificates/${activeCertId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          amount: 30000,
          period: 24,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.amount).toBe(30000);
      expect(updateRes.body.amountInPiastres).toBe(3000000);
      expect(updateRes.body.period).toBe(24);
      expect(updateRes.body.maturityDate).toBe('2028-06-01T00:00:00.000Z');
    });

    it('DELETE /api/certificates/:id soft deletes certificate and hides from active list', async () => {
      const delRes = await request(app)
        .delete(`/api/certificates/${activeCertId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.msg).toMatch(/deleted successfully/i);

      const getRes = await request(app)
        .get(`/api/certificates/${activeCertId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(getRes.status).toBe(404);
    });

    it('rejects viewer role on PUT and DELETE with HTTP 403 Forbidden', async () => {
      const putRes = await request(app)
        .put(`/api/certificates/${activeCertId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 25000 });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/certificates/${activeCertId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(delRes.status).toBe(403);
    });

    it('clamps month-end date rollover accurately when computing derived maturity date (e.g. Nov 30 + 3 months -> Feb 28)', async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Clamped Quarter Certificate',
          amount: 10000,
          interest: 12.0,
          period: 3,
          startDate: '2024-11-30T00:00:00.000Z',
          payoutInterval: 'quarterly',
        });

      expect(res.status).toBe(201);
      expect(res.body.maturityDate).toBe('2025-02-28T00:00:00.000Z');
      expect(res.body.maturityDateDerived).toBe(true);
    });

    it('filters certificates by status query parameter (active vs withdrawn)', async () => {
      // activeCertId is active, createdCertId from baseline is withdrawn
      const activeQuery = await request(app)
        .get('/api/certificates?status=active')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(activeQuery.status).toBe(200);
      const hasActive = activeQuery.body.some((c) => c._id === activeCertId);
      expect(hasActive).toBe(true);

      const withdrawnQuery = await request(app)
        .get('/api/certificates?status=withdrawn')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(withdrawnQuery.status).toBe(200);
      const hasWithdrawn = withdrawnQuery.body.some((c) => c._id === createdCertId);
      expect(hasWithdrawn).toBe(true);
    });
  });

  describe('3. Multi-Tenant IDOR Protection', () => {
    let managerCertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/certificates')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Confidential Certificate',
          amount: 100000,
          interest: 20.0,
          period: 12,
          startDate: '2025-01-01T00:00:00.000Z',
          payoutInterval: 'annually',
        });
      managerCertId = res.body._id;
    });

    it('returns HTTP 404 when User B attempts to view User A certificate (GET /:id)', async () => {
      const res = await request(app)
        .get(`/api/certificates/${managerCertId}`)
        .set('Authorization', otherAuth);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns HTTP 404 when User B attempts to mutate User A certificate (PUT /:id)', async () => {
      const res = await request(app)
        .put(`/api/certificates/${managerCertId}`)
        .set('Authorization', otherAuth)
        .send({ amount: 150000 });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns HTTP 404 when User B attempts to delete User A certificate (DELETE /:id)', async () => {
      const res = await request(app)
        .delete(`/api/certificates/${managerCertId}`)
        .set('Authorization', otherAuth);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns HTTP 404 when User B attempts to withdraw User A certificate (POST /:id/withdraw)', async () => {
      const res = await request(app)
        .post(`/api/certificates/${managerCertId}/withdraw`)
        .set('Authorization', otherAuth)
        .send({ confirmWithdrawal: true });
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
