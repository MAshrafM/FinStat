// backend/tests/unit/interestAccrual.test.js
const {
  calculateAccruedInterest,
  calculateNextPayoutDate,
  calculateTotalInterestEarned,
  generateAccrualTrajectory,
  deriveCertificateStatus,
} = require('../../utils/interestAccrual');

describe('Interest Accrual Engine (Unit Tests)', () => {
  const baseCertificate = {
    amount: 10000,
    interest: 18.25, // 18.25% annual
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    period: 12,
    payoutInterval: 'monthly',
    status: 'active',
  };

  describe('calculateAccruedInterest', () => {
    it('should calculate accrued interest accurately for 30 elapsed days', () => {
      const asOf = new Date('2026-01-31T00:00:00.000Z');
      const result = calculateAccruedInterest(baseCertificate, asOf);

      expect(result.daysElapsed).toBe(30);
      expect(result.dailyRate).toBeCloseTo((18.25 / 100) / 365, 6);
      // 10000 * (0.1825 / 365) * 30 = 150.00 EGP = 15000 piastres
      expect(result.accruedInterestInPiastres).toBe(15000);
      expect(result.accruedInterest).toBe(150);
    });

    it('should respect lastPayoutDate as the reference date when present', () => {
      const certWithPayout = {
        ...baseCertificate,
        lastPayoutDate: new Date('2026-03-01T00:00:00.000Z'),
      };
      const asOf = new Date('2026-03-11T00:00:00.000Z'); // 10 days later
      const result = calculateAccruedInterest(certWithPayout, asOf);

      expect(result.daysElapsed).toBe(10);
      // 10000 * (0.1825 / 365) * 10 = 50.00 EGP = 5000 piastres
      expect(result.accruedInterestInPiastres).toBe(5000);
    });

    it('should handle zero elapsed days gracefully', () => {
      const asOf = new Date('2026-01-01T00:00:00.000Z');
      const result = calculateAccruedInterest(baseCertificate, asOf);
      expect(result.daysElapsed).toBe(0);
      expect(result.accruedInterestInPiastres).toBe(0);
      expect(result.accruedInterest).toBe(0);
    });

    it('should freeze interest accrual at withdrawalDate for withdrawn certificates', () => {
      const withdrawnCert = {
        ...baseCertificate,
        status: 'withdrawn',
        withdrawalDate: new Date('2026-01-21T00:00:00.000Z'), // 20 days
      };
      const asOf = new Date('2026-06-01T00:00:00.000Z'); // Much later
      const result = calculateAccruedInterest(withdrawnCert, asOf);
      expect(result.daysElapsed).toBe(20);
      expect(result.accruedInterestInPiastres).toBe(10000);
    });
  });

  describe('calculateNextPayoutDate', () => {
    it('should compute the next monthly payout date', () => {
      const asOf = new Date('2026-01-15T00:00:00.000Z');
      const nextPayout = calculateNextPayoutDate(baseCertificate, asOf);
      expect(new Date(nextPayout).getUTCMonth()).toBe(1); // February
    });

    it('should compute the next quarterly payout date', () => {
      const quarterlyCert = { ...baseCertificate, payoutInterval: 'quarterly' };
      const asOf = new Date('2026-01-15T00:00:00.000Z');
      const nextPayout = calculateNextPayoutDate(quarterlyCert, asOf);
      expect(new Date(nextPayout).getUTCMonth()).toBe(3); // April (+3 months)
    });

    it('should compute the next annual payout date', () => {
      const annualCert = { ...baseCertificate, payoutInterval: 'annually' };
      const asOf = new Date('2026-01-15T00:00:00.000Z');
      const nextPayout = calculateNextPayoutDate(annualCert, asOf);
      expect(new Date(nextPayout).getUTCFullYear()).toBe(2027);
    });
  });

  describe('calculateTotalInterestEarned', () => {
    it('should combine historical paid interest and live accrued interest', () => {
      const cert = {
        ...baseCertificate,
        lastPayoutDate: new Date('2026-02-01T00:00:00.000Z'),
        totalInterestPaidInPiastres: 25000, // 250 EGP already paid
      };
      const asOf = new Date('2026-02-11T00:00:00.000Z'); // 10 days since payout = 50 EGP (5000 piastres)
      const totalResult = calculateTotalInterestEarned(cert, asOf);

      expect(totalResult.totalInterestPaidInPiastres).toBe(25000);
      expect(totalResult.accruedInterestInPiastres).toBe(5000);
      expect(totalResult.totalEarnedInPiastres).toBe(30000);
      expect(totalResult.totalEarned).toBe(300);
    });
  });

  describe('generateAccrualTrajectory', () => {
    it('should generate two series: solid actual points and dashed projected points', () => {
      const asOf = new Date('2026-06-01T00:00:00.000Z'); // Middle of 12m certificate
      const trajectory = generateAccrualTrajectory(baseCertificate, asOf);

      expect(trajectory.labels.length).toBeGreaterThan(0);
      expect(trajectory.actualSeries.length).toBe(trajectory.labels.length);
      expect(trajectory.projectedSeries.length).toBe(trajectory.labels.length);

      // Early points should have actual numeric values and null projected values
      expect(typeof trajectory.actualSeries[0]).toBe('number');
      // Later points near maturity should have projected values and null actual values
      const lastIdx = trajectory.labels.length - 1;
      expect(typeof trajectory.projectedSeries[lastIdx]).toBe('number');
      expect(trajectory.actualSeries[lastIdx]).toBeNull();
    });
  });

  describe('deriveCertificateStatus', () => {
    it('should return "withdrawn" if status is withdrawn', () => {
      expect(deriveCertificateStatus({ status: 'withdrawn' })).toBe('withdrawn');
    });

    it('should return "matured" if current date is past maturity date', () => {
      const cert = {
        startDate: new Date('2025-01-01'),
        period: 12,
        maturityDate: new Date('2026-01-01'),
      };
      const asOf = new Date('2026-05-01');
      expect(deriveCertificateStatus(cert, asOf)).toBe('matured');
    });

    it('should return "maturing_soon" if within 30 days of maturity', () => {
      const cert = {
        startDate: new Date('2025-06-01'),
        period: 12,
        maturityDate: new Date('2026-06-01'),
      };
      const asOf = new Date('2026-05-15'); // 17 days before maturity
      expect(deriveCertificateStatus(cert, asOf)).toBe('maturing_soon');
    });

    it('should return "active" if well before maturity and after start date', () => {
      const cert = {
        startDate: new Date('2026-01-01'),
        period: 12,
        maturityDate: new Date('2027-01-01'),
      };
      const asOf = new Date('2026-03-01');
      expect(deriveCertificateStatus(cert, asOf)).toBe('active');
    });

    it('should return "future" if start date has not arrived yet', () => {
      const cert = {
        startDate: new Date('2026-08-01'),
        period: 12,
        maturityDate: new Date('2027-08-01'),
      };
      const asOf = new Date('2026-03-01');
      expect(deriveCertificateStatus(cert, asOf)).toBe('future');
    });
  });
});
