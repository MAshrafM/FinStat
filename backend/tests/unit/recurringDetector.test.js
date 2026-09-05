// backend/tests/unit/recurringDetector.test.js
const { calculateMedian, inferFrequency } = require('../../utils/recurringDetector');

describe('recurringDetector Utility Tests', () => {
  test('calculateMedian handles odd and even sized arrays correctly', () => {
    expect(calculateMedian([30, 31, 29])).toBe(30);
    expect(calculateMedian([7, 8, 7, 7])).toBe(7);
    expect(calculateMedian([10, 20])).toBe(15);
    expect(calculateMedian([])).toBe(0);
  });

  test('inferFrequency identifies recurring intervals correctly', () => {
    expect(inferFrequency(1)).toBe('daily');
    expect(inferFrequency(7)).toBe('weekly');
    expect(inferFrequency(30)).toBe('monthly');
    expect(inferFrequency(91)).toBe('quarterly');
    expect(inferFrequency(365)).toBe('yearly');
    expect(inferFrequency(50)).toBeNull();
  });
});
