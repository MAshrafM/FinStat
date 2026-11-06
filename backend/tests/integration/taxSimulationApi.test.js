// backend/tests/integration/taxSimulationApi.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../helpers/testDbReplSet');
const { createUserWithToken } = require('../helpers/authFixtures');
const app = require('../../server');
const TaxBracket = require('../../models/TaxBracket');
const SocialInsurance = require('../../models/SocialInsurance');
const { defaultTaxBrackets, defaultSocialInsurance } = require('../../utils/seedTaxAndInsurance');

jest.setTimeout(60000);

describe('Step 7D.2a: [FEAT-008] Interactive Egyptian Statutory Tax Modeler API Integration Tests', () => {
  let managerUser;
  let managerAuth;
  let viewerUser;
  let viewerAuth;

  beforeAll(async () => {
    await connect();
    await TaxBracket.init();
    await SocialInsurance.init();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Seed Manager
    const m = await createUserWithToken({ role: 'manager', username: 'tax_sim_mgr' });
    managerUser = m.user;
    managerAuth = m.authHeader;

    // Seed Viewer
    const v = await createUserWithToken({
      role: 'viewer',
      username: 'tax_sim_viewer',
      managedBy: managerUser._id,
    });
    viewerUser = v.user;
    viewerAuth = v.authHeader;

    // Seed active 2024 and 2026 TaxBracket and SocialInsurance configurations
    const tax2024 = defaultTaxBrackets.find((t) => t.year === 2024) || defaultTaxBrackets[0];
    const si2024 = defaultSocialInsurance.find((s) => s.year === 2024) || defaultSocialInsurance[0];
    const tax2026 = defaultTaxBrackets.find((t) => t.year === 2026) || defaultTaxBrackets[0];
    const si2026 = defaultSocialInsurance.find((s) => s.year === 2026) || defaultSocialInsurance[0];

    await TaxBracket.create([
      {
        country: 'Egypt',
        year: 2024,
        brackets: tax2024.brackets,
        personalExemption: 20000,
        isActive: true,
      },
      {
        country: 'Egypt',
        year: 2026,
        brackets: tax2026.brackets,
        personalExemption: 20000,
        isActive: true,
      },
    ]);

    await SocialInsurance.create([
      {
        country: 'Egypt',
        year: 2024,
        employeeShare: 11,
        employerShare: 18.75,
        minInsurableIncome: si2024.minInsurableIncome || 2000,
        maxInsurableIncome: si2024.maxInsurableIncome || 12600,
        isActive: true,
      },
      {
        country: 'Egypt',
        year: 2026,
        employeeShare: 11,
        employerShare: 18.75,
        minInsurableIncome: si2026.minInsurableIncome || 2700,
        maxInsurableIncome: si2026.maxInsurableIncome || 16700,
        isActive: true,
      },
    ]);
  });

  // Test 1: HTTP 200 and complete schema output
  it('1. POST /api/tax-brackets/simulate returns HTTP 200 with structured simulation payload', async () => {
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 35000, year: 2026 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.appliedYear).toBe(2026);
    expect(res.body.isFallbackConfig).toBe(false);
    expect(res.body.monthly).toBeDefined();
    expect(res.body.monthly.grossSalary).toBe(35000);
    expect(res.body.monthly.netPay).toBeGreaterThan(0);
    expect(res.body.monthly.employeeSI).toBeGreaterThan(0);
    expect(res.body.monthly.incomeTax).toBeGreaterThan(0);
    expect(res.body.monthly.martyrsFund).toBeGreaterThan(0);
    expect(res.body.annual).toBeDefined();
    expect(res.body.annual.grossSalary).toBe(420000);
    expect(Array.isArray(res.body.bracketSlices)).toBe(true);
    expect(res.body.bracketSlices.length).toBeGreaterThan(0);
  });

  // Test 2: ZERO database writes verified via spies and count assertions (🟡-2, 🟡-C)
  it('2. Confirms ZERO database writes occurred during simulation via comprehensive spies', async () => {
    const taxBracketSaveSpy = jest.spyOn(TaxBracket.prototype, 'save');
    const taxBracketCreateSpy = jest.spyOn(TaxBracket, 'create');
    const taxBracketUpdateOneSpy = jest.spyOn(TaxBracket, 'updateOne');
    const taxBracketUpdateManySpy = jest.spyOn(TaxBracket, 'updateMany');
    const taxBracketFindOneAndUpdateSpy = jest.spyOn(TaxBracket, 'findOneAndUpdate');
    const taxBracketDeleteOneSpy = jest.spyOn(TaxBracket, 'deleteOne');
    const taxBracketDeleteManySpy = jest.spyOn(TaxBracket, 'deleteMany');
    const taxBracketBulkWriteSpy = jest.spyOn(TaxBracket, 'bulkWrite');

    const siSaveSpy = jest.spyOn(SocialInsurance.prototype, 'save');
    const siCreateSpy = jest.spyOn(SocialInsurance, 'create');
    const siUpdateOneSpy = jest.spyOn(SocialInsurance, 'updateOne');
    const siFindOneAndUpdateSpy = jest.spyOn(SocialInsurance, 'findOneAndUpdate');

    const countBeforeTax = await TaxBracket.countDocuments();
    const countBeforeSI = await SocialInsurance.countDocuments();

    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 50000 });

    expect(res.status).toBe(200);

    // Assert static & prototype spies were never called
    expect(taxBracketSaveSpy).not.toHaveBeenCalled();
    expect(taxBracketCreateSpy).not.toHaveBeenCalled();
    expect(taxBracketUpdateOneSpy).not.toHaveBeenCalled();
    expect(taxBracketUpdateManySpy).not.toHaveBeenCalled();
    expect(taxBracketFindOneAndUpdateSpy).not.toHaveBeenCalled();
    expect(taxBracketDeleteOneSpy).not.toHaveBeenCalled();
    expect(taxBracketDeleteManySpy).not.toHaveBeenCalled();
    expect(taxBracketBulkWriteSpy).not.toHaveBeenCalled();

    expect(siSaveSpy).not.toHaveBeenCalled();
    expect(siCreateSpy).not.toHaveBeenCalled();
    expect(siUpdateOneSpy).not.toHaveBeenCalled();
    expect(siFindOneAndUpdateSpy).not.toHaveBeenCalled();

    // Assert exact document counts before and after
    const countAfterTax = await TaxBracket.countDocuments();
    const countAfterSI = await SocialInsurance.countDocuments();
    expect(countAfterTax).toBe(countBeforeTax);
    expect(countAfterSI).toBe(countBeforeSI);

    taxBracketSaveSpy.mockRestore();
    taxBracketCreateSpy.mockRestore();
    taxBracketUpdateOneSpy.mockRestore();
    taxBracketUpdateManySpy.mockRestore();
    taxBracketFindOneAndUpdateSpy.mockRestore();
    taxBracketDeleteOneSpy.mockRestore();
    taxBracketDeleteManySpy.mockRestore();
    taxBracketBulkWriteSpy.mockRestore();
    siSaveSpy.mockRestore();
    siCreateSpy.mockRestore();
    siUpdateOneSpy.mockRestore();
    siFindOneAndUpdateSpy.mockRestore();
  });

  // Test 3: Correctly calculates Social Insurance 11% deduction subject to caps
  it('3. Correctly calculates Law 148/2019 Social Insurance 11% deduction subject to caps', async () => {
    // Gross: 50,000 EGP. 2024 Cap: 12,600 EGP.
    // Employee contribution = 12,600 * 11% = 1,386 EGP.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 50000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.monthly.employeeSI).toBe(1386);
    expect(res.body.deductions.socialInsurance.cappedBase).toBe(12600);
    expect(res.body.deductions.socialInsurance.isCapped).toBe(true);
  });

  // Test 4: Correctly applies 20,000 EGP statutory personal exemption
  it('4. Correctly applies statutory personal exemption before progressive tax slicing', async () => {
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2024 });

    expect(res.status).toBe(200);
    // Annual Gross = 180,000. Annual SI = 1,386 * 12 = 16,632. Exemption = 20,000.
    // Annual Net Taxable Base = 180,000 - 16,632 - 20,000 = 143,368.
    expect(res.body.annual.netTaxableBase).toBe(143368);
    expect(res.body.deductions.personalExemption.annual).toBe(20000);
  });

  // Test 5: Accurately calculates progressive tax slices across Law 175/2023 brackets
  it('5. Accurately calculates progressive tax slices across Law 175/2023 brackets', async () => {
    // 15,000 gross salary DoD vector from Phase 4C/5B:
    // Net base: 143,368.
    // Tier 1: 40,000 @ 0% = 0.
    // Tier 2: 15,000 @ 10% = 1,500.
    // Tier 3: 15,000 @ 15% = 2,250.
    // Tier 4: (143,368 - 70,000) = 73,368 @ 20% = 14,673.60.
    // Total annual tax = 18,423.60. Monthly tax = 1,535.30.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.annual.incomeTax).toBeCloseTo(18423.6, 2);
    expect(res.body.monthly.incomeTax).toBeCloseTo(1535.3, 2);
    expect(res.body.effectiveTaxRate).toBeCloseTo(10.24, 2); // 18,423.6 / 180,000 = 10.235%
  });

  // Test 6: Correctly calculates Martyrs' Families Fund (0.05% of gross)
  it('6. Correctly calculates Martyrs Families Fund (0.05% of gross)', async () => {
    // 15,000 * 0.0005 = 7.50 EGP
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.monthly.martyrsFund).toBe(7.5);
    expect(res.body.annual.martyrsFund).toBe(90);
  });

  // Test 7: Computes accurate monthly net take-home pay and net-to-gross ratio
  it('7. Computes accurate monthly net take-home pay and net-to-gross ratio', async () => {
    // Gross: 15,000. SI: 1,386. Tax: 1,535.30. Martyrs: 7.50.
    // Net Pay = 15,000 - 1,386 - 1,535.30 - 7.50 = 12,071.20 EGP.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.monthly.netPay).toBeCloseTo(12071.2, 2);
    expect(res.body.netToGrossRatio).toBeCloseTo(80.47, 2); // 12,071.20 / 15,000 = 80.47%
  });

  // Test 8: Accurately calculates employer social insurance contribution (18.75%)
  it('8. Accurately calculates employer social insurance contribution (18.75%) and total cost', async () => {
    // Capped insurable: 12,600. Employer SI: 12,600 * 18.75% = 2,362.50 EGP.
    // Total employer cost = 15,000 + 2,362.50 = 17,362.50 EGP.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.monthly.employerSI).toBe(2362.5);
    expect(res.body.monthly.totalEmployerCost).toBe(17362.5);
  });

  // Test 9: Handles minimum wage / low income below exemption threshold
  it('9. Handles low income below exemption threshold (0 tax, clamped SI)', async () => {
    // 1,500 EGP/mo. Clamped to 2,000 min cap for 2024.
    // Employee SI = 2,000 * 11% = 220 EGP.
    // Annual Gross = 18,000. Less than 20,000 exemption -> Net taxable = 0 -> Tax = 0.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 1500, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.monthly.employeeSI).toBe(220);
    expect(res.body.monthly.incomeTax).toBe(0);
    expect(res.body.annual.incomeTax).toBe(0);
    expect(res.body.effectiveTaxRate).toBe(0);
    expect(res.body.monthly.netPay).toBeCloseTo(1500 - 220 - 0.75, 2);
  });

  // Test 10: Handles high-income salary (> 1,200,000 EGP/yr) triggering highest 27.5% bracket (🟡-1, 🟢-1)
  it('10. Handles high-income salary (> 1,200,000 EGP/yr) triggering highest 27.5% bracket with unbounded ceiling', async () => {
    // 150,000 EGP/mo executive vector from egyptianStatutoryPayroll.test.js:
    // Annual Gross = 1,800,000. Annual SI = 16,632. Exemption = 20,000. Net Base = 1,763,368.
    // Annual Tax = 429,676.20 EGP. Monthly Tax = 35,806.35 EGP.
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 150000, year: 2024 });

    expect(res.status).toBe(200);
    expect(res.body.annual.incomeTax).toBeCloseTo(429676.2, 2);
    expect(res.body.monthly.incomeTax).toBeCloseTo(35806.35, 2);
    expect(res.body.marginalTaxRate).toBe(27.5);
    // Bracket level 7 is matched and active
    const topSlice = res.body.bracketSlices.find((b) => b.level === 7);
    expect(topSlice).toBeDefined();
    expect(topSlice.isMatched).toBe(true);
    expect(topSlice.taxableAmount).toBeCloseTo(563368, 2);
  });

  // Test 11: Rejects invalid gross salary with HTTP 400 Bad Request
  it('11. Rejects invalid gross salary (<= 0 or non-numeric) with HTTP 400 Bad Request', async () => {
    const resNegative = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: -5000 });

    expect(resNegative.status).toBe(400);

    const resZero = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 0 });

    expect(resZero.status).toBe(400);

    const resNaN = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 'invalid' });

    expect(resNaN.status).toBe(400);
  });

  // Test 12: Non-admin viewers with canModify: false can successfully execute simulations (🔴-6)
  it('12. Non-admin viewers with canModify: false can successfully execute simulations', async () => {
    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', viewerAuth)
      .send({ grossSalary: 25000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.monthly.grossSalary).toBe(25000);
  });

  // Test 13: Gracefully handles unseeded DB by using embedded defaults (🟡-4, 🟢-8)
  it('13. Gracefully handles unseeded DB year by using embedded statutory defaults and tracking metadata', async () => {
    // Delete all DB configurations
    await TaxBracket.deleteMany({});
    await SocialInsurance.deleteMany({});

    const res = await request(app)
      .post('/api/tax-brackets/simulate')
      .set('Authorization', managerAuth)
      .send({ grossSalary: 15000, year: 2030 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isFallbackConfig).toBe(true);
    expect(res.body.appliedYear).toBe(2030);
    // Computes correctly using statutory embedded defaults
    expect(res.body.monthly.netPay).toBeGreaterThan(0);
    expect(res.body.monthly.incomeTax).toBeCloseTo(1535.3, 2);
  });
});

