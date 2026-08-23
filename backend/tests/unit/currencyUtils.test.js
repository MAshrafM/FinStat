// backend/tests/unit/currencyUtils.test.js
const { toPiastres, fromPiastres } = require('../../utils/currencyUtils');

describe('Currency Utility Functions (Unit Tests)', () => {
  describe('toPiastres', () => {
    it('should convert standard positive EGP amounts to integer piastres', () => {
      expect(toPiastres(1)).toBe(100);
      expect(toPiastres(10.5)).toBe(1050);
      expect(toPiastres(100.25)).toBe(10025);
      expect(toPiastres(999.99)).toBe(99999);
    });

    it('should properly handle floating point precision artifacts (e.g. 19.99 * 100)', () => {
      expect(toPiastres(19.99)).toBe(1999);
      expect(toPiastres(29.95)).toBe(2995);
      expect(toPiastres(0.07)).toBe(7);
      expect(toPiastres(0.57)).toBe(57);
    });

    it('should convert negative EGP amounts correctly', () => {
      expect(toPiastres(-50.25)).toBe(-5025);
      expect(toPiastres(-0.01)).toBe(-1);
    });

    it('should handle string inputs containing numeric values', () => {
      expect(toPiastres('123.45')).toBe(12345);
      expect(toPiastres('0')).toBe(0);
      expect(toPiastres('-45.50')).toBe(-4550);
    });

    it('should return 0 for null, undefined, empty string, or non-numeric strings', () => {
      expect(toPiastres(null)).toBe(0);
      expect(toPiastres(undefined)).toBe(0);
      expect(toPiastres('')).toBe(0);
      expect(toPiastres('invalid-number')).toBe(0);
      expect(toPiastres(NaN)).toBe(0);
    });
  });

  describe('fromPiastres', () => {
    it('should convert integer piastres back to EGP decimal number', () => {
      expect(fromPiastres(100)).toBe(1);
      expect(fromPiastres(1050)).toBe(10.5);
      expect(fromPiastres(10025)).toBe(100.25);
      expect(fromPiastres(99999)).toBe(999.99);
    });

    it('should convert negative piastres correctly', () => {
      expect(fromPiastres(-5025)).toBe(-50.25);
      expect(fromPiastres(-1)).toBe(-0.01);
    });

    it('should handle string piastres inputs', () => {
      expect(fromPiastres('12345')).toBe(123.45);
      expect(fromPiastres('0')).toBe(0);
    });

    it('should return 0 for null, undefined, empty string, or non-numeric strings', () => {
      expect(fromPiastres(null)).toBe(0);
      expect(fromPiastres(undefined)).toBe(0);
      expect(fromPiastres('')).toBe(0);
      expect(fromPiastres('invalid-number')).toBe(0);
      expect(fromPiastres(NaN)).toBe(0);
    });
  });
});
