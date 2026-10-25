// backend/tests/integration/paycheckStatutoryPreview.test.js
const request = require('supertest');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { generateAccessToken } = require('../../utils/tokenUtils');
const app = require('../../server');
const User = require('../../models/User');
const Paycheck = require('../../models/Paycheck');

jest.setTimeout(60000);

describe('Step 4C.1 & 4C.2: [MF-DEF-006 / MF-DEF-007] Paycheck Statutory Preview API Integration', () => {
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
      username: 'statutory_preview_user',
      email: 'statutory_user@test.com',
      password: 'HashedPassword123!',
      role: 'manager',
    });
    token = generateAccessToken(user);
  });

  it('DoD 1: should return appliedConfig.minInsurableIncome: 2000 and personalExemption: 20000 for 2024', async () => {
    const res = await request(app)
      .post('/api/paychecks/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2024-05',
        disbursementType: 'Regular',
        components: [
          { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.year).toBe(2024);
    expect(res.body.appliedConfig).toBeDefined();
    expect(res.body.appliedConfig.minInsurableIncome).toBe(2000);
    expect(res.body.appliedConfig.personalExemption).toBe(20000);
    expect(res.body.appliedConfig.insuranceEmployeeShare).toBe(11);
    expect(res.body.appliedConfig.maxInsurableIncome).toBe(12600);
  });

  it('DoD 2: should clamp low-wage 1,500 EGP salary to 2,000 EGP statutory floor yielding 220 EGP insurance', async () => {
    const res = await request(app)
      .post('/api/paychecks/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2024-01',
        disbursementType: 'Regular',
        components: [
          { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 1500, isTaxable: true, isInsurable: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.preview.grossSalary).toBe(1500);
    expect(res.body.preview.insurableIncome).toBe(2000);
    expect(res.body.preview.expectedInsurance).toBe(220); // 2,000 * 11% = 220, never 165
  });

  it('DoD 3: should compute mid-wage 15,000 EGP salary matching 12,078.70 EGP net pay via progressive tax', async () => {
    const res = await request(app)
      .post('/api/paychecks/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2024-01',
        disbursementType: 'Regular',
        includeMartyrsFund: false,
        components: [
          { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.preview.grossSalary).toBe(15000);
    expect(res.body.preview.expectedInsurance).toBe(1386);
    expect(res.body.preview.expectedTax).toBeCloseTo(1535.30, 2);
    expect(res.body.preview.netPay).toBeCloseTo(12078.70, 2);
  });

  it('DoD 4: should reject invalid disbursementType with HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/paychecks/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        period: '2024-01',
        disbursementType: 'InvalidDisbursementType',
        components: [],
      });

    expect(res.status).toBe(400);
  });
});
