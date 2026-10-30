// backend/tests/integration/paychecksApi.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const Paycheck = require('../../models/Paycheck');
const SalaryProfile = require('../../models/SalaryProfile');

jest.setTimeout(60000);

describe('Step 5B.1a: [AUD-TEST-001] Paychecks API Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;
  let otherUser;
  let otherAuth;

  beforeAll(async () => {
    await connect();
    await Paycheck.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await Paycheck.init();

    const manager = await createUserWithToken({ role: 'manager', username: 'paycheck_mgr' });
    managerUser = manager.user;
    managerAuth = manager.authHeader;

    const viewer = await createUserWithToken({ role: 'viewer', username: 'paycheck_view', managedBy: managerUser._id });
    viewerUser = viewer.user;
    viewerAuth = viewer.authHeader;

    const other = await createUserWithToken({ role: 'manager', username: 'paycheck_other' });
    otherUser = other.user;
    otherAuth = other.authHeader;
  });

  describe('1. Statutory Preview Calculation (POST /api/paychecks/preview)', () => {
    it('calculates mid-wage earner (15,000 EGP gross, 2024) under Egyptian statutory progressive tax and social insurance', async () => {
      const res = await request(app)
        .post('/api/paychecks/preview')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-05',
          disbursementType: 'Regular',
          includeMartyrsFund: false,
          components: [
            { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.year).toBe(2024);
      expect(res.body.preview.grossSalary).toBe(15000);
      expect(res.body.preview.expectedInsurance).toBe(1386);
      expect(res.body.preview.expectedTax).toBeCloseTo(1535.30, 2);
      expect(res.body.preview.netPay).toBeCloseTo(12078.70, 2);
      expect(res.body.preview.totalDeductions).toBeCloseTo(2921.30, 2);
    });

    it('clamps low-wage earner (1,500 EGP gross) to 2,000 EGP minimum statutory insurable floor yielding 220 EGP insurance', async () => {
      const res = await request(app)
        .post('/api/paychecks/preview')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-05',
          disbursementType: 'Regular',
          components: [
            { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 1500, isTaxable: true, isInsurable: true },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.preview.insurableIncome).toBe(2000);
      expect(res.body.preview.expectedInsurance).toBe(220);
    });

    it('handles special disbursement types (Bond Distribution: tax-free & zero insurance; Basic Months: tax-only)', async () => {
      const bondRes = await request(app)
        .post('/api/paychecks/preview')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-05',
          disbursementType: 'Bond Distribution',
          unitRate: 10,
          multiplier: 500, // 5,000 EGP gross
          components: [],
          includeInsurance: false,
          includeTax: false,
          includeMartyrsFund: false,
        });

      expect(bondRes.status).toBe(200);
      expect(bondRes.body.preview.grossSalary).toBe(5000);
      expect(bondRes.body.preview.includeTax).toBe(false);
      expect(bondRes.body.preview.includeInsurance).toBe(false);
      expect(bondRes.body.preview.expectedTax).toBe(0);
      expect(bondRes.body.preview.expectedInsurance).toBe(0);
      expect(bondRes.body.preview.netPay).toBe(5000);

      const basicMonthsRes = await request(app)
        .post('/api/paychecks/preview')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-05',
          disbursementType: 'Basic Months',
          unitRate: 25000,
          multiplier: 2, // 50,000 EGP gross (lands in 10% tier above 40k threshold)
          components: [],
          includeInsurance: false,
        });

      expect(basicMonthsRes.status).toBe(200);
      expect(basicMonthsRes.body.preview.grossSalary).toBe(50000);
      expect(basicMonthsRes.body.preview.includeTax).toBe(true);
      expect(basicMonthsRes.body.preview.includeInsurance).toBe(false);
      expect(basicMonthsRes.body.preview.expectedInsurance).toBe(0);
      expect(basicMonthsRes.body.preview.expectedTax).toBeGreaterThan(0);
    });

    it('rejects invalid disbursement type with HTTP 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/paychecks/preview')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-05',
          disbursementType: 'UnsupportedType',
          components: [],
        });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Paycheck Creation, Piastres Conversion & Role Protection (POST /api/paychecks)', () => {
    it('creates a paycheck with normalized UTC midday date and accurate piastres conversions', async () => {
      const payload = {
        period: '2024-05',
        payDate: '2024-05-15',
        disbursementType: 'Regular',
        grossSalary: 15000,
        netPay: 12078.70,
        taxDeduction: 1535.30,
        insuranceDeduction: 1386,
        martyrsFund: 0,
        totalDeductions: 2921.30,
        components: [
          { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
        ],
      };

      const res = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.grossSalary).toBe(15000);
      expect(res.body.grossSalaryInPiastres).toBe(1500000);
      expect(res.body.netPay).toBe(12078.70);
      expect(res.body.netPayInPiastres).toBe(1207870);
      expect(res.body.insuranceDeductionInPiastres).toBe(138600);
      expect(res.body.taxDeductionInPiastres).toBe(153530);
      expect(res.body.payDate).toBe('2024-05-15T12:00:00.000Z');
      expect(res.body.priorYtdGross).toBe(0);
      expect(res.body.cumulativeYtdGross).toBe(15000);
    });

    it('rejects duplicate paycheck for identical period and disbursement type with HTTP 409 Conflict', async () => {
      const payload = {
        period: '2024-06',
        payDate: '2024-06-15',
        disbursementType: 'Regular',
        grossSalary: 15000,
        netPay: 12078.70,
      };

      const res1 = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send(payload);
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send(payload);

      expect(res2.status).toBe(409);
      expect(res2.body.message).toMatch(/already exists/i);
    });

    it('rejects viewer role attempting to create paycheck with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/paychecks')
        .set('Authorization', viewerAuth)
        .send({
          period: '2024-07',
          payDate: '2024-07-15',
          grossSalary: 10000,
          netPay: 8500,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/read-only access/i);
    });
  });

  describe('3. Chronological YTD Cascade (Phase 4A Regression Lock)', () => {
    it('automatically cascades priorYtdGross and cumulativeYtdGross chronologically when a retroactive record is inserted', async () => {
      // 1. Insert May 2026 paycheck
      const resMay = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({
          period: '2026-05',
          payDate: '2026-05-15',
          grossSalary: 50000,
          netPay: 40000,
        });
      expect(resMay.status).toBe(201);
      const mayId = resMay.body._id;
      expect(resMay.body.priorYtdGross).toBe(0);
      expect(resMay.body.cumulativeYtdGross).toBe(50000);

      // 2. Insert March 2026 paycheck retroactively
      const resMarch = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({
          period: '2026-03',
          payDate: '2026-03-15',
          grossSalary: 40000,
          netPay: 32000,
        });
      expect(resMarch.status).toBe(201);
      expect(resMarch.body.priorYtdGross).toBe(0);
      expect(resMarch.body.cumulativeYtdGross).toBe(40000);

      // 3. Refetch May 2026 paycheck — priorYtdGross must cascade to 40,000, cumulative to 90,000
      const refetchedMay = await request(app)
        .get(`/api/paychecks/${mayId}`)
        .set('Authorization', managerAuth);

      expect(refetchedMay.status).toBe(200);
      expect(refetchedMay.body.priorYtdGross).toBe(40000);
      expect(refetchedMay.body.cumulativeYtdGross).toBe(90000);
    });
  });

  describe('4. Retrieval & Listing (GET /api/paychecks, /all, /:id)', () => {
    // /all contract: deferred from 5C (AUD-PERF-004 followup — see CHANGELOG [Phase 5C]).
    // Maximum lifetime volume per user ~480 rows, below the 1,000 clamp threshold.
    // Tracked as CHANGELOG item 5C-followup-paychecks-all.
    it('returns unpaginated paychecks for current user via GET /api/paychecks/all', async () => {
      await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2024-01', payDate: '2024-01-15', grossSalary: 10000, netPay: 8500 });
      await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2024-02', payDate: '2024-02-15', grossSalary: 10000, netPay: 8500 });

      const res = await request(app)
        .get('/api/paychecks/all')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('returns paginated paychecks respecting filters via GET /api/paychecks', async () => {
      await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2023-12', payDate: '2023-12-15', grossSalary: 10000, netPay: 8500 });
      await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2024-01', payDate: '2024-01-15', grossSalary: 10000, netPay: 8500 });

      const res = await request(app)
        .get('/api/paychecks?page=1&limit=1&year=2024')
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data.length).toBe(1);
      expect(res.body.page).toBe(1);
    });

    it('populates salary profile on GET /api/paychecks/:id', async () => {
      const profile = await SalaryProfile.create({
        user: managerUser._id,
        name: 'Executive Profile',
        isDefault: true,
        basicSalary: 25000,
        components: [
          { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 25000, isTaxable: true, isInsurable: true },
        ],
      });

      const created = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({
          period: '2024-04',
          payDate: '2024-04-15',
          salaryProfile: profile._id.toString(),
          grossSalary: 25000,
          netPay: 20000,
        });

      const res = await request(app)
        .get(`/api/paychecks/${created.body._id}`)
        .set('Authorization', managerAuth);

      expect(res.status).toBe(200);
      expect(res.body.salaryProfile).toBeDefined();
      expect(res.body.salaryProfile.name).toBe('Executive Profile');
    });

    it('returns HTTP 404 when querying nonexistent paycheck ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/paychecks/${fakeId}`)
        .set('Authorization', managerAuth);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('5. Paycheck Update, Soft Delete & Restore (PUT /:id, DELETE /:id, POST /:id/restore)', () => {
    it('updates paycheck amounts, recomputes piastres, and cascades YTD adjustments', async () => {
      const created = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-01', payDate: '2025-01-15', grossSalary: 20000, netPay: 16000 });

      const updated = await request(app)
        .put(`/api/paychecks/${created.body._id}`)
        .set('Authorization', managerAuth)
        .send({
          grossSalary: 25000,
          netPay: 20000,
          notes: 'Annual increment applied',
        });

      expect(updated.status).toBe(200);
      expect(updated.body.grossSalary).toBe(25000);
      expect(updated.body.grossSalaryInPiastres).toBe(2500000);
      expect(updated.body.netPay).toBe(20000);
      expect(updated.body.netPayInPiastres).toBe(2000000);
      expect(updated.body.notes).toBe('Annual increment applied');
    });

    it('rejects viewer on PUT /:id and DELETE /:id with HTTP 403 Forbidden', async () => {
      const created = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-02', payDate: '2025-02-15', grossSalary: 20000, netPay: 16000 });

      const putRes = await request(app)
        .put(`/api/paychecks/${created.body._id}`)
        .set('Authorization', viewerAuth)
        .send({ grossSalary: 22000 });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/paychecks/${created.body._id}`)
        .set('Authorization', viewerAuth);
      expect(delRes.status).toBe(403);
    });

    it('soft deletes paycheck and recalculates subsequent chain', async () => {
      const pc1 = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-03', payDate: '2025-03-15', grossSalary: 10000, netPay: 8000 });

      const pc2 = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-04', payDate: '2025-04-15', grossSalary: 15000, netPay: 12000 });

      expect(pc2.body.priorYtdGross).toBe(10000);
      expect(pc2.body.cumulativeYtdGross).toBe(25000);

      // Soft delete pc1
      const delRes = await request(app)
        .delete(`/api/paychecks/${pc1.body._id}`)
        .set('Authorization', managerAuth);
      expect(delRes.status).toBe(200);

      // Refetch pc2: priorYtdGross should drop to 0, cumulative to 15000
      const refetchedPc2 = await request(app)
        .get(`/api/paychecks/${pc2.body._id}`)
        .set('Authorization', managerAuth);

      expect(refetchedPc2.status).toBe(200);
      expect(refetchedPc2.body.priorYtdGross).toBe(0);
      expect(refetchedPc2.body.cumulativeYtdGross).toBe(15000);
    });

    it('restores a soft-deleted paycheck via POST /:id/restore', async () => {
      const pc = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-05', payDate: '2025-05-15', grossSalary: 12000, netPay: 10000 });

      await request(app)
        .delete(`/api/paychecks/${pc.body._id}`)
        .set('Authorization', managerAuth);

      // Verify soft-deleted item is not in normal GET
      const getDeleted = await request(app)
        .get(`/api/paychecks/${pc.body._id}`)
        .set('Authorization', managerAuth);
      expect(getDeleted.status).toBe(404);

      // Restore
      const restoreRes = await request(app)
        .post(`/api/paychecks/${pc.body._id}/restore`)
        .set('Authorization', managerAuth);
      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.msg).toMatch(/restored successfully/i);

      // Verify accessible again
      const getRestored = await request(app)
        .get(`/api/paychecks/${pc.body._id}`)
        .set('Authorization', managerAuth);
      expect(getRestored.status).toBe(200);
    });
  });

  describe('6. Multi-Tenant IDOR Defense & Error Consistency (AUD-SEC-010)', () => {
    let userAPaycheckId;

    beforeEach(async () => {
      const pc = await request(app)
        .post('/api/paychecks')
        .set('Authorization', managerAuth)
        .send({ period: '2025-06', payDate: '2025-06-15', grossSalary: 18000, netPay: 14500 });
      userAPaycheckId = pc.body._id;
    });

    it('returns HTTP 404 when User B attempts to read User A paycheck (GET /:id)', async () => {
      const res = await request(app)
        .get(`/api/paychecks/${userAPaycheckId}`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns HTTP 403 when User B attempts to modify User A paycheck (PUT /:id) [AUD-SEC-010]', async () => {
      // Documenting AUD-SEC-010: paychecks.js lines 366-371 returns 403 Forbidden rather than 404
      const res = await request(app)
        .put(`/api/paychecks/${userAPaycheckId}`)
        .set('Authorization', otherAuth)
        .send({ grossSalary: 20000 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/User not authorized/i);
    });

    it('returns HTTP 403 when User B attempts to delete User A paycheck (DELETE /:id) [AUD-SEC-010]', async () => {
      // Documenting AUD-SEC-010: paychecks.js lines 456-461 returns 403 Forbidden rather than 404
      const res = await request(app)
        .delete(`/api/paychecks/${userAPaycheckId}`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/User not authorized/i);
    });

    it('returns HTTP 404 when User B attempts to restore User A paycheck (POST /:id/restore)', async () => {
      const res = await request(app)
        .post(`/api/paychecks/${userAPaycheckId}/restore`)
        .set('Authorization', otherAuth);

      expect(res.status).toBe(404);
    });
  });
});

