// backend/tests/unit/goldStandardizer.test.js
const {
  to24kEquivalentGrams,
  standardizeGoldHoldings,
} = require('../../utils/goldStandardizer');

describe('Gold Standardizer (24K Equivalent Weight & Standardized Valuation)', () => {
  describe('to24kEquivalentGrams', () => {
    it('should correctly standardize weights across karats to 24K equivalent grams', () => {
      // 24K: 10g * (24/24) = 10g
      expect(to24kEquivalentGrams(10, 24)).toBe(10);

      // 21K: 10g * (21/24) = 8.75g
      expect(to24kEquivalentGrams(10, 21)).toBe(8.75);

      // 18K: 10g * (18/24) = 7.5g
      expect(to24kEquivalentGrams(10, 18)).toBe(7.5);

      // 22K: 10g * (22/24) = 9.1667g
      expect(to24kEquivalentGrams(10, 22)).toBe(9.1667);

      // Edge cases: 0 weight
      expect(to24kEquivalentGrams(0, 24)).toBe(0);
    });
  });

  describe('standardizeGoldHoldings', () => {
    it('should enrich gold holdings and generate standardized valuation using official 24K spot price', () => {
      const mockHoldings = [
        {
          id: 'gold_24k',
          name: 'Gold 24K Bar',
          karat: 24,
          quantity: 10, // 10 grams
          totalCost: 40000,
        },
        {
          id: 'gold_21k',
          name: 'Gold 21K Coin',
          karat: 21,
          quantity: 10, // 10 grams -> 8.75g 24K equiv
          totalCost: 35000,
        },
      ];

      const mockPrices = {
        '24': 4200,
        '21': 3675,
      };

      const result = standardizeGoldHoldings(mockHoldings, mockPrices);

      expect(result.holdings).toHaveLength(2);

      // Item 1: 10g @ 4200 = 42000
      expect(result.holdings[0].equivalentGrams24k).toBe(10);
      expect(result.holdings[0].standardizedValue).toBe(42000);

      // Item 2: 8.75g @ 4200 = 36750
      expect(result.holdings[1].equivalentGrams24k).toBe(8.75);
      expect(result.holdings[1].standardizedValue).toBe(36750);

      // Summary
      expect(result.summary.totalActualWeight).toBe(20);
      expect(result.summary.totalEquivalentGrams24k).toBe(18.75);
      expect(result.summary.totalStandardizedValue).toBe(78750); // 42000 + 36750
      expect(result.summary.unrealizedStandardizedPnL).toBe(78750 - 75000); // 3750
    });
  });
});
