// backend/tests/unit/insuranceCalculator.test.js
const { calculateInsurance } = require('../../utils/insuranceCalculator');

describe('Social Insurance Calculator Utility', () => {
  const config = {
    employeeShare: 11, // 11%
    employerShare: 18.75, // 18.75%
    minInsurableIncome: 2000,
    maxInsurableIncome: 12600,
  };

  it('should return 0 contributions for 0 income', () => {
    const res = calculateInsurance(0, config);
    expect(res.employeeContribution).toBe(0);
    expect(res.employerContribution).toBe(0);
  });

  it('should apply normal percentage when income is within min and max caps', () => {
    // Income = 8000
    // Employee share = 8000 * 0.11 = 880
    // Employer share = 8000 * 0.1875 = 1500
    const res = calculateInsurance(8000, config);
    expect(res.cappedInsurableIncome).toBe(8000);
    expect(res.employeeContribution).toBe(880);
    expect(res.employerContribution).toBe(1500);
  });

  it('should floor to minInsurableIncome when income is below floor', () => {
    // Income = 1000 (below min 2000)
    // Capped = 2000
    // Employee share = 2000 * 0.11 = 220
    // Employer share = 2000 * 0.1875 = 375
    const res = calculateInsurance(1000, config);
    expect(res.cappedInsurableIncome).toBe(2000);
    expect(res.employeeContribution).toBe(220);
    expect(res.employerContribution).toBe(375);
  });

  it('should cap to maxInsurableIncome when income exceeds ceiling', () => {
    // Income = 20000 (above max 12600)
    // Capped = 12600
    // Employee share = 12600 * 0.11 = 1386
    // Employer share = 12600 * 0.1875 = 2362.5
    const res = calculateInsurance(20000, config);
    expect(res.insurableIncome).toBe(20000);
    expect(res.cappedInsurableIncome).toBe(12600);
    expect(res.employeeContribution).toBe(1386);
    expect(res.employerContribution).toBe(2362.5);
  });
});
