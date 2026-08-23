// backend/tests/unit/ledgerHelpers.test.js
const {
  normalizeAccount,
  mapAccountFields,
  calculateSignedDelta,
  calculateSignedDeltas,
} = require('../../utils/ledgerHelpers');
const { BadRequestError } = require('../../utils/errors');

describe('Ledger Helpers (Unit Tests)', () => {
  describe('normalizeAccount', () => {
    it('should normalize valid account names regardless of case', () => {
      expect(normalizeAccount('Bank')).toBe('bank');
      expect(normalizeAccount('CASH')).toBe('cash');
      expect(normalizeAccount('prepaid')).toBe('prepaid');
      expect(normalizeAccount('  Bank  ')).toBe('bank');
    });

    it('should throw BadRequestError for invalid account names', () => {
      expect(() => normalizeAccount('Crypto')).toThrow(BadRequestError);
      expect(() => normalizeAccount('')).toThrow(BadRequestError);
      expect(() => normalizeAccount(null)).toThrow(BadRequestError);
    });
  });

  describe('mapAccountFields', () => {
    it('should assign value to bank and zero out cash and prepaid', () => {
      const result = mapAccountFields('Bank', 1500);
      expect(result).toEqual({ bank: 1500, cash: 0, prepaid: 0 });
    });

    it('should assign value to cash and zero out bank and prepaid', () => {
      const result = mapAccountFields('Cash', 400);
      expect(result).toEqual({ bank: 0, cash: 400, prepaid: 0 });
    });

    it('should assign value to prepaid and zero out bank and cash', () => {
      const result = mapAccountFields('Prepaid', 250);
      expect(result).toEqual({ bank: 0, cash: 0, prepaid: 250 });
    });
  });

  describe('calculateSignedDeltas', () => {
    it('should calculate inter-account transfer deltas using logBankOp and logCashOp', () => {
      const result = calculateSignedDeltas({
        transactionType: 'na',
        transactionValue: 500,
        logBankOp: '-',
        logCashOp: '+',
        logPrepaidOp: 'none',
      });
      expect(result).toEqual([
        { account: 'bank', delta: -500, deltaInPiastres: -50000 },
        { account: 'cash', delta: 500, deltaInPiastres: 50000 },
      ]);
    });

    it('should calculate transfer deltas using fromAccount and toAccount', () => {
      const result = calculateSignedDeltas({
        transactionType: 'na',
        transactionValue: 300,
        fromAccount: 'Bank',
        toAccount: 'Prepaid',
      });
      expect(result).toEqual([
        { account: 'bank', delta: -300, deltaInPiastres: -30000 },
        { account: 'prepaid', delta: 300, deltaInPiastres: 30000 },
      ]);
    });

    it('should calculate single account delta for Topup', () => {
      const result = calculateSignedDeltas({
        transactionType: 'T',
        paymentMethod: 'Bank',
        transactionValue: 1000,
      });
      expect(result).toEqual([{ account: 'bank', delta: 1000, deltaInPiastres: 100000 }]);
    });
  });
});
