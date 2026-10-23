// backend/tests/unit/installmentAmortization.test.js
const { calculateInstallmentSchedule } = require('../../utils/installmentAmortization');

describe('Step 4A.7: [GAP-015] Credit Card Installment Schedule Exact Amortization Math', () => {
  it('should amortize 10,000 EGP over 3 months with remainder on month 1 and zero penny drift', () => {
    const transaction = {
      date: new Date('2026-01-15'),
      amount: 10000,
      amountInPiastres: 1000000,
      paidAmount: 3333.34,
      paidAmountInPiastres: 333334, // 1 month paid
      installmentDetails: {
        months: 3,
        monthlyPrincipal: 3333.34,
        monthlyPrincipalInPiastres: 333334,
        cyclePaidInPiastres: 333334,
      },
    };

    const result = calculateInstallmentSchedule(transaction);

    // Month schedule exact breakdown
    expect(result.schedule.length).toBe(3);
    expect(result.schedule[0].amountInPiastres).toBe(333334);
    expect(result.schedule[0].amount).toBe(3333.34);
    expect(result.schedule[1].amountInPiastres).toBe(333333);
    expect(result.schedule[1].amount).toBe(3333.33);
    expect(result.schedule[2].amountInPiastres).toBe(333333);
    expect(result.schedule[2].amount).toBe(3333.33);

    // Sum of schedule equals total exactly
    const sumPiastres = result.schedule.reduce((acc, s) => acc + s.amountInPiastres, 0);
    expect(sumPiastres).toBe(1000000);

    // Remaining principal: 1,000,000 - 333,334 = 666,666 piastres (6,666.66 EGP)
    expect(result.remainingPrincipalInPiastres).toBe(666666);
    expect(result.remainingPrincipal).toBe(6666.66);

    // Term-based remaining months: 3 - 1 = 2 (no ceiling drift to 3)
    expect(result.monthsPaid).toBe(1);
    expect(result.remainingMonths).toBe(2);
    expect(result.isCycleSatisfied).toBe(true);
  });

  it('should safely handle falsy zero paid amounts without defaulting to NaN or total', () => {
    const transaction = {
      date: new Date('2026-02-01'),
      amountInPiastres: 600000, // 6,000 EGP
      paidAmountInPiastres: 0,
      installmentDetails: {
        months: 6,
        monthlyPrincipalInPiastres: 100000,
        cyclePaidInPiastres: 0,
      },
    };

    const result = calculateInstallmentSchedule(transaction);
    expect(result.remainingPrincipalInPiastres).toBe(600000);
    expect(result.remainingPrincipal).toBe(6000);
    expect(result.monthsPaid).toBe(0);
    expect(result.remainingMonths).toBe(6);
    expect(result.isCycleSatisfied).toBe(false);
  });
});
