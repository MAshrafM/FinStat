// backend/tests/integration/paycheckTimezoneNormalization.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Paycheck = require('../../models/Paycheck');

jest.setTimeout(60000);

describe('Step 4B.2: [MF-DEF-004] Paycheck UTC Midday Timezone Normalization & Period Sync', () => {
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
      username: 'tz_paycheck_user',
      email: 'tz_user@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  it('normalizes payDate to 12:00:00.000Z and keeps paycheck in the target calendar month', async () => {
    // User in Cairo logs on 2026-05-01
    const res = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-05',
        payDate: '2026-05-01',
        disbursementType: 'Regular',
        grossSalary: 50000,
        netPay: 40000,
      });

    expect(res.status).toBe(201);
    expect(res.body.payDate).toBe('2026-05-01T12:00:00.000Z');
    expect(res.body.date).toBe('2026-05-01T12:00:00.000Z');

    // Verify regex query matches 2026-05
    const listRes = await request(app)
      .get('/api/paychecks?period=2026-05')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0]._id).toBe(res.body._id);
  });

  it('rejects mismatched period and payDate via Zod validation', async () => {
    const res = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-04', // Mismatch with payDate month 05
        payDate: '2026-05-01',
        disbursementType: 'Regular',
        grossSalary: 50000,
        netPay: 40000,
      });

    expect(res.status).toBe(400);
    const errText = JSON.stringify(res.body);
    expect(errText).toMatch(/Period \(2026-04\) must match payDate calendar month \(2026-05\)/i);
  });

  it('recalculates chronological YTD gross across years when payDate is updated across year boundaries', async () => {
    // 1. Create paycheck in 2025-12
    const pc1 = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2025-12',
        payDate: '2025-12-25',
        disbursementType: 'Regular',
        grossSalary: 30000,
        netPay: 25000,
      });
    expect(pc1.status).toBe(201);

    // 2. Create paycheck in 2026-01
    const pc2 = await request(app)
      .post('/api/paychecks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-01',
        payDate: '2026-01-25',
        disbursementType: 'Regular',
        grossSalary: 40000,
        netPay: 32000,
      });
    expect(pc2.status).toBe(201);
    expect(pc2.body.priorYtdGross).toBe(0);
    expect(pc2.body.cumulativeYtdGross).toBe(40000);

    // 3. Move pc1 into 2026-02
    const updateRes = await request(app)
      .put(`/api/paychecks/${pc1.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2026-02',
        payDate: '2026-02-15',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.payDate).toBe('2026-02-15T12:00:00.000Z');

    // 4. In 2026, pc2 (Jan 25) should have prior 0, cumulative 40000
    // and pc1 (Feb 15) should now have prior 40000, cumulative 70000!
    const movedPc = await Paycheck.findById(pc1.body._id);
    expect(movedPc.priorYtdGross).toBe(40000);
    expect(movedPc.cumulativeYtdGross).toBe(70000);
  });
});
