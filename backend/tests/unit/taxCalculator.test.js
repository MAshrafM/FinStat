// backend/tests/unit/taxCalculator.test.js
const { calculateTax } = require('../../utils/taxCalculator');

describe('Company Cumulative YTD Gross Tax Calculator', () => {
  const egyptianBrackets = [
    { level: 1, from: 0, to: 40000, rate: 0 },
    { level: 2, from: 40000, to: 55000, rate: 10 },
    { level: 3, from: 55000, to: 70000, rate: 15 },
    { level: 4, from: 70000, to: 200000, rate: 20 },
    { level: 5, from: 200000, to: 400000, rate: 22.5 },
    { level: 6, from: 400000, to: 1200000, rate: 25 },
    { level: 7, from: 1200000, to: 1000000000, rate: 27.5 },
  ];

  it('should apply 0% rate at the start of the year when Cumulative YTD Gross <= 40,000 EGP', () => {
    // 1st paycheck of the year: Gross 20,000, Prior YTD = 0 => Cumulative = 20,000 (Falls in 0-40k @ 0%)
    const res1 = calculateTax(20000, egyptianBrackets, 0, { priorYtdGross: 0, grossSalary: 20000 });
    expect(res1.cumulativeYtdGross).toBe(20000);
    expect(res1.appliedRate).toBe(0);
    expect(res1.monthlyTax).toBe(0);

    // 2nd paycheck: Gross 20,000, Prior YTD = 20,000 => Cumulative = 40,000 (Falls in 0-40k @ 0%)
    const res2 = calculateTax(20000, egyptianBrackets, 0, { priorYtdGross: 20000, grossSalary: 20000 });
    expect(res2.cumulativeYtdGross).toBe(40000);
    expect(res2.appliedRate).toBe(0);
    expect(res2.monthlyTax).toBe(0);
  });

  it('should advance tax bracket rate as cumulative gross climbs through the year', () => {
    // 3rd paycheck: Gross 20,000, Prior YTD = 40,000 => Cumulative = 60,000 (Falls in 55,000 - 70,000 @ 15%)
    // Tax = 20,000 * 15% = 3,000 EGP
    const res3 = calculateTax(20000, egyptianBrackets, 0, { priorYtdGross: 40000, grossSalary: 20000 });
    expect(res3.cumulativeYtdGross).toBe(60000);
    expect(res3.appliedRate).toBe(15);
    expect(res3.monthlyTax).toBe(3000);

    // 4th paycheck: Gross 20,000, Prior YTD = 60,000 => Cumulative = 80,000 (Falls in 70,000 - 200,000 @ 20%)
    // Tax = 20,000 * 20% = 4,000 EGP
    const res4 = calculateTax(20000, egyptianBrackets, 0, { priorYtdGross: 60000, grossSalary: 20000 });
    expect(res4.cumulativeYtdGross).toBe(80000);
    expect(res4.appliedRate).toBe(20);
    expect(res4.monthlyTax).toBe(4000);

    // Mid-year after 200k gross: Prior YTD = 210,000, Paycheck Gross = 20,000 => Cumulative = 230,000 (200k-400k @ 22.5%)
    // Tax = 20,000 * 22.5% = 4,500 EGP
    const resMidYear = calculateTax(20000, egyptianBrackets, 0, { priorYtdGross: 210000, grossSalary: 20000 });
    expect(resMidYear.cumulativeYtdGross).toBe(230000);
    expect(resMidYear.appliedRate).toBe(22.5);
    expect(resMidYear.monthlyTax).toBe(4500);
  });

  it('should correctly handle tax-exempt disbursements (0% tax)', () => {
    const res = calculateTax(50000, egyptianBrackets, 0, {
      priorYtdGross: 100000,
      grossSalary: 50000,
      includeTax: false,
    });
    expect(res.appliedRate).toBe(0);
    expect(res.monthlyTax).toBe(0);
    expect(res.cumulativeYtdGross).toBe(150000);
  });
});
