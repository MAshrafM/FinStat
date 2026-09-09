// backend/tests/unit/rebalancingEngine.test.js
const {
  generateRebalancingSuggestions,
  mapHoldingToRebalancingCategory,
} = require('../../utils/rebalancingEngine');

describe('Rebalancing Engine (Allocation & Trade Suggestions)', () => {
  describe('mapHoldingToRebalancingCategory', () => {
    it('should map various asset names to standardized buckets', () => {
      expect(mapHoldingToRebalancingCategory('Stock')).toBe('stocks');
      expect(mapHoldingToRebalancingCategory('Mutual Funds')).toBe('mutualFunds');
      expect(mapHoldingToRebalancingCategory('Gold')).toBe('gold');
      expect(mapHoldingToRebalancingCategory('Currency')).toBe('cash');
      expect(mapHoldingToRebalancingCategory('Certificate')).toBe('certificates');
      expect(mapHoldingToRebalancingCategory('Real Estate')).toBe('realEstate');
    });
  });

  describe('generateRebalancingSuggestions', () => {
    it('should calculate target values, deltas, and actionable buy/sell suggestions', () => {
      // Total portfolio = 100,000 EGP
      const mockCurrentAllocation = {
        totalPortfolioValue: 100000,
        totalPortfolioValueInPiastres: 10000000,
        allocations: [
          { assetType: 'stocks', currentValue: 70000, currentPercentage: 70 },
          { assetType: 'gold', currentValue: 10000, currentPercentage: 10 },
          { assetType: 'cash', currentValue: 20000, currentPercentage: 20 },
          { assetType: 'mutualFunds', currentValue: 0, currentPercentage: 0 },
          { assetType: 'certificates', currentValue: 0, currentPercentage: 0 },
        ],
      };

      // Desired Target: 50% Stocks, 30% Gold, 20% Cash
      const mockTarget = {
        targets: [
          { assetType: 'stocks', percentage: 50 },
          { assetType: 'gold', percentage: 30 },
          { assetType: 'cash', percentage: 20 },
          { assetType: 'mutualFunds', percentage: 0 },
          { assetType: 'certificates', percentage: 0 },
        ],
      };

      const result = generateRebalancingSuggestions(mockCurrentAllocation, mockTarget);

      expect(result.totalPortfolioValue).toBe(100000);
      expect(result.suggestions).toHaveLength(5);

      // Gold: target 30,000 (30%), current 10,000 -> Delta +20,000 -> Action 'Buy'
      const goldSuggestion = result.suggestions.find((s) => s.assetType === 'gold');
      expect(goldSuggestion.action).toBe('Buy');
      expect(goldSuggestion.amount).toBe(20000);
      expect(goldSuggestion.amountInPiastres).toBe(2000000);

      // Stocks: target 50,000 (50%), current 70,000 -> Delta -20,000 -> Action 'Sell'
      const stockSuggestion = result.suggestions.find((s) => s.assetType === 'stocks');
      expect(stockSuggestion.action).toBe('Sell');
      expect(stockSuggestion.amount).toBe(20000);

      // Cash: target 20,000 (20%), current 20,000 -> Delta 0 -> Action 'Hold'
      const cashSuggestion = result.suggestions.find((s) => s.assetType === 'cash');
      expect(cashSuggestion.action).toBe('Hold');
      expect(cashSuggestion.amount).toBe(0);
    });
  });
});
