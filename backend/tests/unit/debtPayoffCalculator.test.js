// backend/tests/unit/debtPayoffCalculator.test.js
const {
  calculateSnowball,
  calculateAvalanche,
  calculateMinimumOnly,
} = require('../../utils/debtPayoffCalculator');

describe('Debt Payoff Calculator (Unit Tests)', () => {
  const cards = [
    {
      cardId: 'card-1',
      cardName: 'Card A (High Interest)',
      balanceInPiastres: 500000, // 5,000 EGP
      minimumPaymentInPiastres: 25000, // 250 EGP
      apr: 24, // 24% APR
    },
    {
      cardId: 'card-2',
      cardName: 'Card B (Low Balance)',
      balanceInPiastres: 200000, // 2,000 EGP
      minimumPaymentInPiastres: 10000, // 100 EGP
      apr: 12, // 12% APR
    },
  ];

  const monthlyBudget = 100000; // 1,000 EGP / mo (100,000 piastres)

  it('should calculate snowball by targeting lowest balance first (Card B)', () => {
    const result = calculateSnowball(cards, monthlyBudget);
    expect(result.schedule.length).toBeGreaterThan(0);
    expect(result.monthsToPayoff).toBeGreaterThan(0);

    // First month extra payment goes to Card B (lower balance)
    const month1CardB = result.schedule.find((s) => s.month === 1 && s.cardId === 'card-2');
    const month1CardA = result.schedule.find((s) => s.month === 1 && s.cardId === 'card-1');

    expect(month1CardB.paymentInPiastres).toBeGreaterThan(month1CardA.paymentInPiastres);
  });

  it('should calculate avalanche by targeting highest APR first (Card A)', () => {
    const result = calculateAvalanche(cards, monthlyBudget);
    expect(result.schedule.length).toBeGreaterThan(0);

    // First month extra payment goes to Card A (24% APR)
    const month1CardA = result.schedule.find((s) => s.month === 1 && s.cardId === 'card-1');
    const month1CardB = result.schedule.find((s) => s.month === 1 && s.cardId === 'card-2');

    expect(month1CardA.paymentInPiastres).toBeGreaterThan(month1CardB.paymentInPiastres);
  });

  it('avalanche should result in equal or lower total interest compared to minimum-only', () => {
    const avalancheResult = calculateAvalanche(cards, monthlyBudget);
    const minResult = calculateMinimumOnly(cards);

    expect(avalancheResult.totalInterestPaidInPiastres).toBeLessThan(minResult.totalInterestPaidInPiastres);
    expect(avalancheResult.monthsToPayoff).toBeLessThan(minResult.monthsToPayoff);
  });
});
