// backend/tests/unit/salaryCalculator.test.js
const { calculatePreview } = require('../../utils/salaryCalculator');

describe('Company Salary Calculator with Specialized Disbursement Types', () => {
  const egyptianTaxConfig2024 = {
    brackets: [
      { level: 1, from: 0, to: 40000, rate: 0 },
      { level: 2, from: 40000, to: 55000, rate: 10 },
      { level: 3, from: 55000, to: 70000, rate: 15 },
      { level: 4, from: 70000, to: 200000, rate: 20 },
      { level: 5, from: 200000, to: 400000, rate: 22.5 },
      { level: 6, from: 400000, to: 1200000, rate: 25 },
      { level: 7, from: 1200000, to: 1000000000, rate: 27.5 },
    ],
  };

  const egyptianInsuranceConfig2024 = {
    employeeShare: 11,
    employerShare: 18.75,
    minInsurableIncome: 2000,
    maxInsurableIncome: 12600,
  };

  it('should calculate Regular Monthly Paycheck with full tax, insurance, and martyrs fund', () => {
    const components = [
      { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000, isTaxable: true, isInsurable: true },
      { name: 'Allowance', category: 'allowance', type: 'fixed', value: 5000, isTaxable: true, isInsurable: true },
    ];

    // Prior YTD = 210,000 => Cumulative = 230,000 (200k-400k @ 22.5%)
    const result = calculatePreview(components, egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'Regular',
      priorYtdGross: 210000,
    });

    expect(result.grossSalary).toBe(20000);
    expect(result.cumulativeYtdGross).toBe(230000);
    expect(result.appliedTaxRate).toBe(22.5);
    expect(result.expectedTax).toBe(4500); // 20,000 * 22.5%
    expect(result.expectedInsurance).toBe(1386); // 12,600 * 11%
    expect(result.martyrsFund).toBe(10); // 20,000 * 0.05%
    expect(result.totalDeductions).toBe(5896);
    expect(result.netPay).toBe(14104);
  });

  it('should calculate Basic Months payout (Basic * Multiplier, Tax applied, 0 SI)', () => {
    const components = [
      { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 15000 },
      { name: 'Club Loan', category: 'deduction', type: 'fixed', value: 1000 },
    ];

    // Basic 15,000 * 2 months = 30,000 Gross. Prior YTD = 100,000 => Cumulative = 130,000 (70k-200k @ 20%)
    const result = calculatePreview(components, egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'Basic Months',
      multiplier: 2,
      unitRate: 15000,
      priorYtdGross: 100000,
    });

    expect(result.grossSalary).toBe(30000);
    expect(result.cumulativeYtdGross).toBe(130000);
    expect(result.appliedTaxRate).toBe(20);
    expect(result.expectedTax).toBe(6000); // 30,000 * 20%
    expect(result.expectedInsurance).toBe(0); // 0 SI
    expect(result.customDeductions).toBe(1000);
    expect(result.totalDeductions).toBe(7000); // 6,000 tax + 1,000 loan
    expect(result.netPay).toBe(23000); // 30,000 - 7,000
  });

  it('should calculate Basic Production payout (Production * Multiplier, Tax applied, 0 SI)', () => {
    const result = calculatePreview([], egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'Basic Production',
      multiplier: 1.5,
      unitRate: 10000,
      priorYtdGross: 200000,
    });

    // 10,000 * 1.5 = 15,000 Gross. Cumulative = 215,000 (22.5% bracket)
    expect(result.grossSalary).toBe(15000);
    expect(result.cumulativeYtdGross).toBe(215000);
    expect(result.appliedTaxRate).toBe(22.5);
    expect(result.expectedTax).toBe(3375); // 15,000 * 22.5%
    expect(result.expectedInsurance).toBe(0);
    expect(result.netPay).toBe(11625);
  });

  it('should calculate Bond Distribution (Rate * Bonds, 0 Tax, 0 SI)', () => {
    // 500 bonds @ 10 EGP = 5,000 Gross
    const result = calculatePreview([], egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'Bond Distribution',
      multiplier: 500,
      unitRate: 10,
      priorYtdGross: 150000,
    });

    expect(result.grossSalary).toBe(5000);
    expect(result.cumulativeYtdGross).toBe(155000);
    expect(result.appliedTaxRate).toBe(0);
    expect(result.expectedTax).toBe(0);
    expect(result.expectedInsurance).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.netPay).toBe(5000);
  });

  it('should calculate Sector / Individual Bonus & Surplus (Lump sum, Tax applied, 0 SI)', () => {
    const result = calculatePreview([], egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'Sector Bonus',
      unitRate: 25000,
      priorYtdGross: 80000,
    });

    // 25,000 Gross. Cumulative = 105,000 (20% bracket)
    expect(result.grossSalary).toBe(25000);
    expect(result.cumulativeYtdGross).toBe(105000);
    expect(result.appliedTaxRate).toBe(20);
    expect(result.expectedTax).toBe(5000);
    expect(result.expectedInsurance).toBe(0);
    expect(result.netPay).toBe(20000);
  });

  it('should calculate End of Year Bonus (Lump sum, 0 Tax, 0 SI, custom deductions allowed)', () => {
    const components = [
      { name: 'End of Year Payout', category: 'bonus', value: 40000 },
      { name: 'Year-end Charity / Loan', category: 'deduction', value: 2000 },
    ];

    const result = calculatePreview(components, egyptianTaxConfig2024, egyptianInsuranceConfig2024, {
      disbursementType: 'End of Year Bonus',
      unitRate: 40000,
      priorYtdGross: 300000,
    });

    expect(result.grossSalary).toBe(40000);
    expect(result.cumulativeYtdGross).toBe(340000);
    expect(result.expectedTax).toBe(0); // Tax-exempt
    expect(result.expectedInsurance).toBe(0);
    expect(result.customDeductions).toBe(2000);
    expect(result.totalDeductions).toBe(2000);
    expect(result.netPay).toBe(38000);
  });
});
