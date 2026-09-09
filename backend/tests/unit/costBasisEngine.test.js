// backend/tests/unit/costBasisEngine.test.js
const {
  calculateCostBasis,
  calculateRealizedGain,
  calculateCostBasisPerIteration,
} = require('../../utils/costBasisEngine');

describe('Cost-Basis Engine (FIFO, LIFO, Weighted Average & Iteration Awareness)', () => {
  const sampleTrades = [
    // Buy 100 shares @ 50 EGP (Total: 5000)
    {
      _id: 'trade_1',
      date: new Date('2024-01-01'),
      type: 'Buy',
      shares: 100,
      price: 50,
      totalValue: 5000,
      fees: 0,
      iteration: 1,
    },
    // Buy 100 shares @ 100 EGP (Total: 10000)
    {
      _id: 'trade_2',
      date: new Date('2024-01-15'),
      type: 'Buy',
      shares: 100,
      price: 100,
      totalValue: 10000,
      fees: 0,
      iteration: 1,
    },
    // Sell 50 shares @ 120 EGP (Total: 6000)
    {
      _id: 'trade_3',
      date: new Date('2024-02-01'),
      type: 'Sell',
      shares: 50,
      price: 120,
      totalValue: 6000,
      fees: 0,
      iteration: 1,
    },
  ];

  describe('FIFO Accounting', () => {
    it('should consume the oldest shares first for COGS and realized gain', () => {
      // 50 shares sold should come from Lot 1 (cost 50 EGP/share) -> COGS = 50 * 50 = 2500
      // Realized Gain = 6000 - 2500 = 3500
      const result = calculateCostBasis(sampleTrades, 'fifo');

      expect(result.method).toBe('fifo');
      expect(result.currentShares).toBe(150);
      expect(result.costOfSoldShares).toBe(2500);
      expect(result.tradingPL).toBe(3500);
      expect(result.totalRealizedReturn).toBe(3500);

      // Remaining lots: Lot 1 has 50 shares @ 50 EGP (2500), Lot 2 has 100 shares @ 100 EGP (10000) -> 12500
      expect(result.remainingCostBasis).toBe(12500);
    });
  });

  describe('LIFO Accounting', () => {
    it('should consume the newest shares first for COGS and realized gain', () => {
      // 50 shares sold should come from Lot 2 (cost 100 EGP/share) -> COGS = 50 * 100 = 5000
      // Realized Gain = 6000 - 5000 = 1000
      const result = calculateCostBasis(sampleTrades, 'lifo');

      expect(result.method).toBe('lifo');
      expect(result.currentShares).toBe(150);
      expect(result.costOfSoldShares).toBe(5000);
      expect(result.tradingPL).toBe(1000);
      expect(result.totalRealizedReturn).toBe(1000);

      // Remaining lots: Lot 1 has 100 shares @ 50 EGP (5000), Lot 2 has 50 shares @ 100 EGP (5000) -> 10000
      expect(result.remainingCostBasis).toBe(10000);
    });
  });

  describe('Weighted Average Accounting', () => {
    it('should use weighted average buy price for COGS and realized gain', () => {
      // Total bought = 200 shares for 15000 EGP -> Average price = 75 EGP/share
      // 50 shares sold @ 75 EGP -> COGS = 3750
      // Realized Gain = 6000 - 3750 = 2250
      const result = calculateCostBasis(sampleTrades, 'average');

      expect(result.method).toBe('average');
      expect(result.currentShares).toBe(150);
      expect(result.averageBuyPrice).toBe(75);
      expect(result.costOfSoldShares).toBe(3750);
      expect(result.tradingPL).toBe(2250);
      expect(result.totalRealizedReturn).toBe(2250);
      expect(result.remainingCostBasis).toBe(150 * 75); // 11250
    });
  });

  describe('Corporate Action Integration (Splits & Bonus Shares)', () => {
    it('should adjust lots when a Split transaction occurs', () => {
      const tradesWithSplit = [
        {
          date: new Date('2024-01-01'),
          type: 'Buy',
          shares: 100,
          price: 100,
          totalValue: 10000,
          iteration: 1,
        },
        // 2:1 Split
        {
          date: new Date('2024-01-10'),
          type: 'Split',
          splitRatio: 2,
          iteration: 1,
        },
        // Sell 100 shares post-split
        {
          date: new Date('2024-01-20'),
          type: 'Sell',
          shares: 100,
          price: 60,
          totalValue: 6000,
          iteration: 1,
        },
      ];

      const result = calculateCostBasis(tradesWithSplit, 'fifo');
      // Post-split, 100 original shares became 200 shares @ 50 EGP
      // Selling 100 shares costs 100 * 50 = 5000 EGP
      expect(result.costOfSoldShares).toBe(5000);
      expect(result.tradingPL).toBe(1000); // 6000 - 5000
      expect(result.currentShares).toBe(100);
      expect(result.remainingCostBasis).toBe(5000);
    });

    it('should handle bonus issue (Dividend in shares with 0 cost)', () => {
      const tradesWithBonus = [
        {
          date: new Date('2024-01-01'),
          type: 'Buy',
          shares: 100,
          price: 100,
          totalValue: 10000,
          iteration: 1,
        },
        {
          date: new Date('2024-01-10'),
          type: 'Dividend',
          shares: 20, // 20 bonus shares
          totalValue: 0,
          iteration: 1,
        },
      ];

      const result = calculateCostBasis(tradesWithBonus, 'average');
      expect(result.currentShares).toBe(120);
      expect(result.averageBuyPrice).toBe(100); // 10000 / 100
      expect(result.adjustedAvgPrice).toBeCloseTo(10000 / 120, 2); // diluted BE price: ~83.33
    });
  });

  describe('Iteration Awareness', () => {
    it('should separate calculations per iteration independently', () => {
      const multiIterationTrades = [
        // Iteration 1 (Closed position with profit)
        {
          date: new Date('2023-01-01'),
          type: 'Buy',
          shares: 50,
          price: 40,
          totalValue: 2000,
          iteration: 1,
        },
        {
          date: new Date('2023-02-01'),
          type: 'Sell',
          shares: 50,
          price: 60,
          totalValue: 3000,
          iteration: 1,
        },
        // Iteration 2 (Active position)
        {
          date: new Date('2023-03-01'),
          type: 'Buy',
          shares: 100,
          price: 80,
          totalValue: 8000,
          iteration: 2,
        },
      ];

      const results = calculateCostBasisPerIteration(multiIterationTrades, 'average');
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);

      const iter1 = results.get(1);
      expect(iter1.currentShares).toBe(0);
      expect(iter1.tradingPL).toBe(1000);

      const iter2 = results.get(2);
      expect(iter2.currentShares).toBe(100);
      expect(iter2.tradingPL).toBe(0);
      expect(iter2.averageBuyPrice).toBe(80);
    });
  });
});
