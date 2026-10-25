// backend/tests/unit/egyptianStatutoryPayroll.test.js
const { calculateInsurance } = require('../../utils/insuranceCalculator');
const { calculateTax, calculateProgressiveTax } = require('../../utils/taxCalculator');
const { calculatePreview } = require('../../utils/salaryCalculator');
const { defaultTaxBrackets, defaultSocialInsurance } = require('../../utils/seedTaxAndInsurance');

describe('Phase 4C: Egyptian Statutory Payroll Compliance', () => {
  // Pinned 2024 Statutory Configurations (Law 148/2019 & Law 175/2023)
  const statutoryInsurance2024 = defaultSocialInsurance.find(s => s.year === 2024);
  const statutoryTax2024 = defaultTaxBrackets.find(t => t.year === 2024);

  describe('Step 4C.1: [MF-DEF-006] Social Insurance Minimum Insurable Base Floor (Law 148/2019)', () => {
    it('T1: should clamp 1,500 EGP/mo low-wage earner to 2,000 EGP statutory floor (deducting 220 EGP, never 165 EGP)', () => {
      const res = calculateInsurance(1500, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(2000);
      expect(res.employeeContribution).toBe(220); // 2,000 * 11% = 220, NOT 1,500 * 11% = 165
      expect(res.employerContribution).toBe(375); // 2,000 * 18.75% = 375
    });

    it('T1-Fallback: should default to statutory 2,000 EGP floor when minInsurableIncome is omitted in config', () => {
      // Unpatched calculation with missing minInsurableIncome would produce 165 EGP
      const unconfiguredInsurance = { employeeShare: 11, employerShare: 18.75 };
      const res = calculateInsurance(1500, unconfiguredInsurance);
      expect(res.cappedInsurableIncome).toBe(2000);
      expect(res.employeeContribution).toBe(220);
    });

    it('T3: should evaluate 0 EGP contributions for 0 EGP income (no contribution from zero earnings)', () => {
      const res = calculateInsurance(0, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(0);
      expect(res.employeeContribution).toBe(0);
      expect(res.employerContribution).toBe(0);
    });

    it('T3.5: should clamp 500 EGP income to 2,000 EGP floor yielding 220 EGP employee contribution', () => {
      const res = calculateInsurance(500, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(2000);
      expect(res.employeeContribution).toBe(220);
    });

    it('T3.6: should clamp 1 EGP micro-wage to 2,000 EGP floor yielding 220 EGP employee contribution', () => {
      const res = calculateInsurance(1, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(2000);
      expect(res.employeeContribution).toBe(220);
    });

    it('T4: should match exactly 220 EGP employee contribution at exact 2,000 EGP floor boundary', () => {
      const res = calculateInsurance(2000, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(2000);
      expect(res.employeeContribution).toBe(220);
      expect(res.employerContribution).toBe(375);
    });

    it('T5: should match exactly 1,386 EGP employee contribution at exact 12,600 EGP ceiling boundary', () => {
      const res = calculateInsurance(12600, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(12600);
      expect(res.employeeContribution).toBe(1386);
      expect(res.employerContribution).toBe(2362.5);
    });

    it('T6: should cap 50,000 EGP high wage to 12,600 EGP ceiling yielding 1,386 EGP employee contribution', () => {
      const res = calculateInsurance(50000, statutoryInsurance2024);
      expect(res.cappedInsurableIncome).toBe(12600);
      expect(res.employeeContribution).toBe(1386);
    });

    it('calculatePreview: should clamp insurable income to statutory floor in full paycheck preview', () => {
      const components = [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 1500, isTaxable: true, isInsurable: true },
      ];

      const preview = calculatePreview(components, statutoryTax2024, statutoryInsurance2024, {
        disbursementType: 'Regular',
        includeInsurance: true,
      });

      expect(preview.grossSalary).toBe(1500);
      expect(preview.expectedInsurance).toBe(220); // Clamped to 2,000 * 11%
      expect(preview.insuranceDetails.cappedInsurableIncome).toBe(2000);
      expect(preview.insurableIncome).toBe(2000); // Insurable base reflects statutory clamped base
    });
  });

  describe('Step 4C.2: [MF-DEF-007] Statutory Tax Ordering & Progressive Slicing (Law 175/2023)', () => {
    it('T4.5: should calculate 0.00 EGP tax at exact 40,000 EGP Level 1 bracket capacity', () => {
      const res = calculateProgressiveTax(40000, statutoryTax2024.brackets);
      expect(res.annualTax).toBe(0);
      expect(res.monthlyTax).toBe(0);
      expect(res.bracketBreakdown[0].isMatched).toBe(true);
      expect(res.bracketBreakdown[0].taxableAmount).toBe(40000);
      expect(res.bracketBreakdown[1].isMatched).toBe(false);
      expect(res.bracketBreakdown[1].taxableAmount).toBe(0);
    });

    it('T4.6: should tax first pound above 40,000 EGP into Level 2 at 10% (40,001 EGP base -> 0.10 EGP tax)', () => {
      const res = calculateProgressiveTax(40001, statutoryTax2024.brackets);
      expect(res.annualTax).toBe(0.10);
      expect(res.bracketBreakdown[0].taxableAmount).toBe(40000);
      expect(res.bracketBreakdown[1].taxableAmount).toBe(1);
      expect(res.bracketBreakdown[1].tax).toBe(0.10);
      expect(res.bracketBreakdown[1].isMatched).toBe(true);
    });

    it('T7.5: should match 29,750.00 EGP annual tax at exact 200,000 EGP Level 4 bracket boundary', () => {
      // 0-40k @ 0% (0) + 15k @ 10% (1,500) + 15k @ 15% (2,250) + 130k @ 20% (26,000) = 29,750
      const res = calculateProgressiveTax(200000, statutoryTax2024.brackets);
      expect(res.annualTax).toBe(29750);
      expect(res.monthlyTax).toBeCloseTo(2479.17, 2);
      expect(res.bracketBreakdown[3].isMatched).toBe(true);
      expect(res.bracketBreakdown[3].taxableAmount).toBe(130000);
      expect(res.bracketBreakdown[4].isMatched).toBe(false);
      expect(res.bracketBreakdown[4].taxableAmount).toBe(0);
    });

    it('T8: should yield 0 EGP tax when personal exemption and SI exceed gross salary', () => {
      // 2,500/mo * 12 = 30k/yr. SI = 2,000 * 11% * 12 = 2,640/yr. Exemption = 20k.
      // Net base = 30k - 2.64k - 20k = 7,360 EGP (all within 0% tier)
      const res = calculateTax(2500, statutoryTax2024.brackets, statutoryTax2024.personalExemption, {
        annualInsuranceContribution: 2640,
        includeTax: true,
        includeMartyrsFund: false,
      });
      expect(res.annualTax).toBe(0);
      expect(res.monthlyTax).toBe(0);
    });

    it('T7: should calculate exact progressive tax for 150,000 EGP/mo top-bracket executive', () => {
      // Gross: 150,000/mo = 1,800,000/yr. SI capped at 12,600 * 11% * 12 = 16,632/yr.
      // Exemption = 20,000/yr. Net taxable base = 1,800,000 - 16,632 - 20,000 = 1,763,368/yr.
      // Tax tiers: 0 (40k) + 1.5k (15k) + 2.25k (15k) + 26k (130k) + 45k (200k) + 200k (800k) + 563,368 * 27.5% (154,926.20)
      // Total annual tax = 429,676.20 EGP. Monthly tax = 35,806.35 EGP.
      const res = calculateTax(150000, statutoryTax2024.brackets, statutoryTax2024.personalExemption, {
        annualInsuranceContribution: 16632,
        includeTax: true,
        includeMartyrsFund: false,
      });
      expect(res.annualTax).toBeCloseTo(429676.20, 2);
      expect(res.monthlyTax).toBeCloseTo(35806.35, 2);
    });

    it('T2 (DoD Vector): should compute mid-wage earner 15,000 EGP salary matching exactly 12,078.70 EGP net pay (martyrs fund false)', () => {
      // Gross: 15,000/mo (180,000/yr). SI: 12,600 * 11% = 1,386/mo (16,632/yr).
      // Personal Exemption: 20,000/yr.
      // Net Taxable Base: 180,000 - 16,632 - 20,000 = 143,368/yr.
      // Tier 1: 40k @ 0% = 0.
      // Tier 2: 15k @ 10% = 1,500.
      // Tier 3: 15k @ 15% = 2,250.
      // Tier 4: (143,368 - 70,000) = 73,368 @ 20% = 14,673.60.
      // Total Annual Tax: 18,423.60 EGP/yr.
      // Monthly Income Tax: 18,423.60 / 12 = 1,535.30 EGP/mo.
      // Monthly Net Pay: 15,000 - 1,386 - 1,535.30 = 12,078.70 EGP/mo.
      const components = [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
      ];

      const preview = calculatePreview(components, statutoryTax2024, statutoryInsurance2024, {
        disbursementType: 'Regular',
        includeInsurance: true,
        includeTax: true,
        includeMartyrsFund: false,
      });

      expect(preview.grossSalary).toBe(15000);
      expect(preview.expectedInsurance).toBe(1386);
      expect(preview.expectedTax).toBeCloseTo(1535.30, 2);
      expect(preview.netPay).toBeCloseTo(12078.70, 2);
    });

    it('T2.1: should compute mid-wage earner 15,000 EGP salary matching 12,071.20 EGP net pay when Martyrs Fund is included', () => {
      // Martyrs Fund = 15,000 * 0.05% = 7.50 EGP.
      // Net pay = 12,078.70 - 7.50 = 12,071.20 EGP.
      const components = [
        { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
      ];

      const preview = calculatePreview(components, statutoryTax2024, statutoryInsurance2024, {
        disbursementType: 'Regular',
        includeInsurance: true,
        includeTax: true,
        includeMartyrsFund: true,
      });

      expect(preview.grossSalary).toBe(15000);
      expect(preview.expectedInsurance).toBe(1386);
      expect(preview.martyrsFund).toBe(7.50);
      expect(preview.expectedTax).toBeCloseTo(1535.30, 2);
      expect(preview.netPay).toBeCloseTo(12071.20, 2);
    });
  });
});
