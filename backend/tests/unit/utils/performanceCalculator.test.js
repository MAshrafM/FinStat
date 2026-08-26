// backend/tests/unit/utils/performanceCalculator.test.js
const { calculateXIRR, calculateROI } = require('../../../utils/performanceCalculator');

describe('PerformanceCalculator (XIRR & ROI Financial Math Engine)', () => {
  describe('calculateXIRR', () => {
    it('should accurately calculate XIRR for standard annual cash flows', () => {
      // Invest 1000 on Jan 1, 2023, receive 1100 on Jan 1, 2024 (10% return over exactly 1 year)
      const cashFlows = [
        { amount: -1000, date: new Date('2023-01-01T00:00:00Z') },
        { amount: 1100, date: new Date('2024-01-01T00:00:00Z') },
      ];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeCloseTo(10.0, 1);
      expect(result.message).toBeNull();
    });

    it('should accurately calculate XIRR for multi-period irregular cash flows', () => {
      const cashFlows = [
        { amount: -10000, date: new Date('2023-01-01') },
        { amount: -5000, date: new Date('2023-06-01') },
        { amount: 2000, date: new Date('2023-09-01') },
        { amount: 16000, date: new Date('2024-01-01') },
      ];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeGreaterThan(0);
      expect(result.xirr).toBeCloseTo(24.64, 1);
      expect(result.message).toBeNull();
    });

    it('should return null with message when cash flows are all negative (no valuation / return)', () => {
      const cashFlows = [
        { amount: -1000, date: new Date('2023-01-01') },
        { amount: -2000, date: new Date('2023-06-01') },
      ];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeNull();
      expect(result.message).toContain('both cash outflows');
    });

    it('should return null with message when there is only one transaction', () => {
      const cashFlows = [{ amount: -1000, date: new Date('2023-01-01') }];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeNull();
      expect(result.message).toContain('at least two transactions');
    });

    it('should return null when transaction dates are identical', () => {
      const cashFlows = [
        { amount: -1000, date: new Date('2023-01-01') },
        { amount: 1100, date: new Date('2023-01-01') },
      ];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeNull();
      expect(result.message).toContain('distinct dates');
    });

    it('should handle negative returns properly', () => {
      const cashFlows = [
        { amount: -1000, date: new Date('2023-01-01') },
        { amount: 800, date: new Date('2024-01-01') },
      ];

      const result = calculateXIRR(cashFlows);
      expect(result.xirr).toBeCloseTo(-20.0, 1);
    });
  });

  describe('calculateROI', () => {
    it('should calculate ROI and unrealized P&L properly', () => {
      const result = calculateROI(10000, 12500, 500);
      expect(result.unrealizedPnL).toBe(2500);
      expect(result.realizedPnL).toBe(500);
      expect(result.totalGain).toBe(3000);
      expect(result.roi).toBe(30.0);
    });

    it('should return 0 ROI when totalInvested is 0', () => {
      const result = calculateROI(0, 500, 0);
      expect(result.roi).toBe(0);
      expect(result.totalGain).toBe(500);
    });
  });
});
