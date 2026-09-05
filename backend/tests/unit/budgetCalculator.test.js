// backend/tests/unit/budgetCalculator.test.js
const { getDateRange } = require('../../utils/budgetCalculator');

describe('budgetCalculator Utility Tests', () => {
  test('getDateRange calculates exact monthly boundary', () => {
    const { startDate, endDate } = getDateRange('monthly', 2026, 2);
    expect(startDate.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(endDate.toISOString()).toBe('2026-02-28T23:59:59.999Z');
  });

  test('getDateRange calculates exact quarterly boundaries', () => {
    // Q1: Jan 1 to Mar 31
    const q1 = getDateRange('quarterly', 2026, null, 1);
    expect(q1.startDate.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(q1.endDate.toISOString()).toBe('2026-03-31T23:59:59.999Z');

    // Q3: Jul 1 to Sep 30
    const q3 = getDateRange('quarterly', 2026, null, 3);
    expect(q3.startDate.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(q3.endDate.toISOString()).toBe('2026-09-30T23:59:59.999Z');
  });

  test('getDateRange calculates exact yearly boundary', () => {
    const { startDate, endDate } = getDateRange('yearly', 2026);
    expect(startDate.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(endDate.toISOString()).toBe('2026-12-31T23:59:59.999Z');
  });
});
