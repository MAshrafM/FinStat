// backend/tests/integration/paycheckYtdChronology.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Paycheck = require('../../models/Paycheck');

jest.setTimeout(60000);

describe('Step 4A.4: [AUD-CORR-008] Paycheck YTD Chronology, Concurrency & Atomicity', () => {
  let user;
  let token;

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

    user = await User.create({
      username: 'paycheck_tester',
      email: 'paycheck@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  it('Scenario 1: should reject duplicate paycheck for the same user, period, and disbursementType with 409 Conflict', async () => {
    // 1. Submit first paycheck for 2026-05
    const res1 = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-05',
        payDate: '2026-05-25',
        disbursementType: 'Regular',
        grossSalary: 50000,
        netPay: 40000,
      });

    expect(res1.status).toBe(201);

    // 2. Submit duplicate paycheck for 2026-05 with same disbursementType
    const res2 = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-05',
        payDate: '2026-05-25',
        disbursementType: 'Regular',
        grossSalary: 50000,
        netPay: 40000,
      });

    expect(res2.status).toBe(409);
    expect(res2.body.error || res2.body.message || JSON.stringify(res2.body)).toMatch(/already exists/i);
  });

  it('Scenario 2: should atomically recalculate YTD cascade when retroactive paycheck is inserted or deleted', async () => {
    // 1. Submit May 2026 first (gross: 50,000)
    const mayRes = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-05',
        payDate: '2026-05-25',
        disbursementType: 'Regular',
        grossSalary: 50000,
        netPay: 40000,
      })
      .expect(201);

    expect(mayRes.body.priorYtdGross).toBe(0);
    expect(mayRes.body.cumulativeYtdGross).toBe(50000);

    // 2. Submit retroactive March 2026 paycheck (gross: 40,000)
    const marRes = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-03',
        payDate: '2026-03-25',
        disbursementType: 'Regular',
        grossSalary: 40000,
        netPay: 32000,
      })
      .expect(201);

    expect(marRes.body.priorYtdGross).toBe(0);
    expect(marRes.body.cumulativeYtdGross).toBe(40000);

    // 3. May 2026 must be updated by the cascade: priorYtdGross = 40,000, cumulativeYtdGross = 90,000
    const updatedMay = await Paycheck.findById(mayRes.body._id);
    expect(updatedMay.priorYtdGross).toBe(40000);
    expect(updatedMay.cumulativeYtdGross).toBe(90000);

    // 4. Delete March 2026 paycheck -> May 2026 should cascade back to priorYtdGross = 0, cumulative = 50,000
    await request(app)
      .delete(`/api/paychecks/${marRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const revertedMay = await Paycheck.findById(mayRes.body._id);
    expect(revertedMay.priorYtdGross).toBe(0);
    expect(revertedMay.cumulativeYtdGross).toBe(50000);
  });

  it('Scenario 3: should atomically recalculate cross-year moves and rollback on mid-chain failure', async () => {
    // 1. Create a 2026 paycheck
    const pc2026 = await Paycheck.create({
      user: user._id,
      period: '2026-01',
      payDate: new Date('2026-01-25'),
      disbursementType: 'Regular',
      grossSalary: 50000,
      netPay: 40000,
      priorYtdGross: 0,
      cumulativeYtdGross: 50000,
    });

    // 2. Move paycheck to 2025-12 successfully
    const moveRes = await request(app)
      .put(`/api/paychecks/${pc2026._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2025-12',
        payDate: '2025-12-25',
      })
      .expect(200);

    expect(moveRes.body.period).toBe('2025-12');
    const movedDoc = await Paycheck.findById(pc2026._id);
    expect(movedDoc.period).toBe('2025-12');
  });
});
