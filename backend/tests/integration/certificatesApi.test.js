// backend/tests/integration/certificatesApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../../server');
const connectDB = require('../../config/db');
const User = require('../../models/User');
const Certificate = require('../../models/Certificate');

jest.setTimeout(60000);

describe('Certificates API Integration Tests (Phase 7)', () => {
  let testManager;
  let managerToken;
  let testViewer;
  let viewerToken;

  beforeAll(async () => {
    await connectDB();

    const mUsername = 'cert_test_manager';
    const vUsername = 'cert_test_viewer';
    await User.deleteMany({ username: { $in: [mUsername, vUsername] } });

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

    const jwtSecret = process.env.JWT_SECRET || 'secret';
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
  });

  afterAll(async () => {
    if (testManager) {
      await Certificate.deleteMany({ user: testManager._id });
      await User.deleteMany({ _id: { $in: [testManager._id, testViewer._id] } });
    }
    await mongoose.connection.close();
  });

  let createdCertId;

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
