// backend/tests/unit/splitValidator.test.js
const { validateSplits } = require('../../utils/splitValidator');

describe('splitValidator Utility Tests', () => {
  test('returns valid when splits is null, undefined, or empty array', () => {
    expect(validateSplits(100, null)).toEqual({ isValid: true, error: null });
    expect(validateSplits(100, undefined)).toEqual({ isValid: true, error: null });
    expect(validateSplits(100, [])).toEqual({ isValid: true, error: null });
  });

  test('validates accurately when sum of splits equals transaction value', () => {
    const splits = [
      { category: 'Groceries', amount: 60 },
      { category: 'Food & Dining', amount: 40 },
    ];
    const result = validateSplits(100, splits);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('validates floating point totals within 0.01 tolerance', () => {
    const splits = [
      { category: 'Groceries', amount: 33.33 },
      { category: 'Utilities', amount: 33.33 },
      { category: 'Other', amount: 33.34 },
    ];
    const result = validateSplits(100, splits);
    expect(result.isValid).toBe(true);
  });

  test('fails when sum of splits does not equal transaction value', () => {
    const splits = [
      { category: 'Groceries', amount: 50 },
      { category: 'Food & Dining', amount: 40 },
    ];
    const result = validateSplits(100, splits);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/must equal total transaction value/);
  });

  test('fails when split item has invalid category or negative amount', () => {
    expect(validateSplits(100, [{ category: '', amount: 100 }]).isValid).toBe(false);
    expect(validateSplits(100, [{ category: 'Food', amount: -50 }, { category: 'Food', amount: 150 }]).isValid).toBe(false);
  });
});
