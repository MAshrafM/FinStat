// backend/tests/unit/utils/certificateDateClamping.test.js
const {
  addMonthsClamped,
  calculateNextPayoutDate,
} = require('../../../utils/interestAccrual');

describe('Step 4B.1: [AUD-CORR-003] Certificate Month-Overflow Date Arithmetic', () => {
  describe('Failing test first: JavaScript Date overflow demonstration', () => {
    it('demonstrates that unpatched native JS setMonth overflows Nov 30 + 3 months into March 2nd', () => {
      const unpatchedDate = new Date('2024-11-30T00:00:00.000Z');
      unpatchedDate.setUTCMonth(unpatchedDate.getUTCMonth() + 3);
      // Month 10 (Nov) + 3 = Month 13 (Feb 2025). Day 30 overflows to March 2nd:
      expect(unpatchedDate.toISOString().slice(0, 10)).toBe('2025-03-02');
    });
  });

  describe('addMonthsClamped core arithmetic', () => {
    it('clamps 2024-11-30 + 3 months to 2025-02-28 (non-leap year)', () => {
      const start = new Date('2024-11-30T00:00:00.000Z');
      const maturity = addMonthsClamped(start, 3);
      expect(maturity.toISOString().slice(0, 10)).toBe('2025-02-28');
    });

    it('clamps 2023-11-30 + 3 months to 2024-02-29 in a leap year', () => {
      const start = new Date('2023-11-30T00:00:00.000Z');
      const maturity = addMonthsClamped(start, 3);
      expect(maturity.toISOString().slice(0, 10)).toBe('2024-02-29');
    });

    it('clamps 2025-01-31 + 1 month to 2025-02-28', () => {
      const start = new Date('2025-01-31T00:00:00.000Z');
      const maturity = addMonthsClamped(start, 1);
      expect(maturity.toISOString().slice(0, 10)).toBe('2025-02-28');
    });

    it('clamps 2025-03-31 + 1 month to 2025-04-30 (30-day month)', () => {
      const start = new Date('2025-03-31T00:00:00.000Z');
      const maturity = addMonthsClamped(start, 1);
      expect(maturity.toISOString().slice(0, 10)).toBe('2025-04-30');
    });

    it('preserves input date immutability', () => {
      const start = new Date('2024-11-30T00:00:00.000Z');
      const originalTime = start.getTime();
      const result = addMonthsClamped(start, 3);
      expect(start.getTime()).toBe(originalTime);
      expect(result).not.toBe(start);
    });

    it('throws TypeError for non-finite or invalid months', () => {
      const validDate = new Date('2024-11-30T00:00:00.000Z');
      expect(() => addMonthsClamped(validDate, null)).toThrow(TypeError);
      expect(() => addMonthsClamped(validDate, null)).toThrow('Months must be a finite number');
      expect(() => addMonthsClamped(validDate, 'abc')).toThrow(TypeError);
      expect(() => addMonthsClamped(validDate, undefined)).toThrow(TypeError);
      expect(() => addMonthsClamped(validDate, NaN)).toThrow(TypeError);
    });

    it('throws TypeError for invalid date inputs', () => {
      expect(() => addMonthsClamped(null, 3)).toThrow(TypeError);
      expect(() => addMonthsClamped('invalid-date', 3)).toThrow(TypeError);
      expect(() => addMonthsClamped('invalid-date', 3)).toThrow('Invalid date provided to addMonthsClamped');
    });
  });

  describe('calculateNextPayoutDate clamped forward-stepping', () => {
    it('preserves the month-end anchor day when rolling forward payouts', () => {
      const certificate = {
        startDate: '2025-01-31T00:00:00.000Z',
        payoutInterval: 'monthly',
        period: 12,
        amount: 10000,
        interest: 10,
      };

      // As of Jan 31, next payout is Feb 28
      const payout1 = calculateNextPayoutDate(certificate, new Date('2025-01-31T00:00:00.000Z'));
      expect(payout1.toISOString().slice(0, 10)).toBe('2025-02-28');

      // As of March 1, next payout is March 31 (recovers 31st anchor)
      const payout2 = calculateNextPayoutDate(certificate, new Date('2025-03-01T00:00:00.000Z'));
      expect(payout2.toISOString().slice(0, 10)).toBe('2025-03-31');
    });
  });

  describe('Certificate pre-save hook & maturityDateDerived guard', () => {
    const Certificate = require('../../../models/Certificate');

    it('computes clamped maturityDate when maturityDate is omitted on new Certificate', async () => {
      const cert = new Certificate({
        name: 'Auto-clamped cert',
        amount: 10000,
        interest: 15,
        period: 3,
        startDate: new Date('2024-11-30T00:00:00.000Z'),
        user: '507f1f77bcf86cd799439011',
      });

      // Trigger pre-save hook manually
      await new Promise((resolve) => cert.schema.s.hooks.execPre('save', cert, resolve));
      expect(cert.maturityDate.toISOString().slice(0, 10)).toBe('2025-02-28');
      expect(cert.maturityDateDerived).toBe(true);
    });

    it('preserves user-entered maturityDate through pre-save hook without overwriting', async () => {
      const customDate = new Date('2025-03-03T00:00:00.000Z');
      const cert = new Certificate({
        name: 'Bank custom date cert',
        amount: 10000,
        interest: 15,
        period: 3,
        startDate: new Date('2024-11-30T00:00:00.000Z'),
        maturityDate: customDate,
        maturityDateDerived: false,
        user: '507f1f77bcf86cd799439011',
      });

      await new Promise((resolve) => cert.schema.s.hooks.execPre('save', cert, resolve));
      expect(cert.maturityDate.toISOString().slice(0, 10)).toBe('2025-03-03');
      expect(cert.maturityDateDerived).toBe(false);
    });
  });

  describe('recomputeCertificateMaturity migration logic', () => {
    const { recomputeCertificateMaturity } = require('../../../scripts/recomputeCertificateMaturity');

    it('migrates buggy derived dates, fixes null maturity, and preserves manual custom dates with idempotency', async () => {
      const mockCertificates = [
        // 1. Legacy record with unpatched overflow bug (2025-03-02 instead of 2025-02-28)
        {
          _id: 'cert_buggy_legacy',
          startDate: new Date('2024-11-30T00:00:00.000Z'),
          period: 3,
          maturityDate: new Date('2025-03-02T00:00:00.000Z'),
          maturityDateDerived: undefined,
        },
        // 2. Legacy record with null maturityDate
        {
          _id: 'cert_null_legacy',
          startDate: new Date('2024-11-30T00:00:00.000Z'),
          period: 3,
          maturityDate: null,
          maturityDateDerived: undefined,
        },
        // 3. Legacy record with custom user-entered date (March 3)
        {
          _id: 'cert_manual_legacy',
          startDate: new Date('2024-11-30T00:00:00.000Z'),
          period: 3,
          maturityDate: new Date('2025-03-03T00:00:00.000Z'),
          maturityDateDerived: undefined,
        },
        // 4. Already correct record
        {
          _id: 'cert_already_correct',
          startDate: new Date('2024-11-30T00:00:00.000Z'),
          period: 3,
          maturityDate: new Date('2025-02-28T00:00:00.000Z'),
          maturityDateDerived: true,
        },
      ];

      const updates = {};
      const mockCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockCertificates),
        }),
        updateOne: jest.fn().mockImplementation((query, update) => {
          updates[query._id] = update.$set;
          const found = mockCertificates.find((c) => c._id === query._id);
          if (found) Object.assign(found, update.$set);
          return Promise.resolve({ matchedCount: 1, modifiedCount: 1 });
        }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      };

      // First run: executes migration
      const summary1 = await recomputeCertificateMaturity(mockDb);
      expect(summary1.updatedCount).toBe(2); // cert_buggy_legacy and cert_null_legacy
      expect(summary1.skippedManualCount).toBe(1); // cert_manual_legacy
      expect(summary1.skippedAlreadyCorrectCount).toBe(1); // cert_already_correct

      // Verify cert_buggy_legacy got clamped to Feb 28 and marked derived
      expect(updates.cert_buggy_legacy.maturityDate.toISOString().slice(0, 10)).toBe('2025-02-28');
      expect(updates.cert_buggy_legacy.maturityDateDerived).toBe(true);

      // Verify cert_null_legacy got computed to Feb 28 and marked derived
      expect(updates.cert_null_legacy.maturityDate.toISOString().slice(0, 10)).toBe('2025-02-28');
      expect(updates.cert_null_legacy.maturityDateDerived).toBe(true);

      // Verify cert_manual_legacy was preserved and marked maturityDateDerived: false
      expect(updates.cert_manual_legacy.maturityDateDerived).toBe(false);
      expect(updates.cert_manual_legacy.maturityDate).toBeUndefined(); // date was NOT changed!

      // Second run: verify idempotency
      const summary2 = await recomputeCertificateMaturity(mockDb);
      expect(summary2.updatedCount).toBe(0);
      expect(summary2.skippedAlreadyCorrectCount).toBe(3);
      expect(summary2.skippedManualCount).toBe(1);
    });
  });
});
