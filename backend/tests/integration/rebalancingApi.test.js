// backend/tests/integration/rebalancingApi.test.js
const express = require('express');
const request = require('supertest');

const mockUserId = '507f1f77bcf86cd799439011';

jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: mockUserId, role: 'manager' };
  req.effectiveUserId = mockUserId;
  req.canModify = true;
  next();
});

jest.mock('../../models/RebalancingTarget');
jest.mock('../../utils/portfolioService');
jest.mock('../../utils/rebalancingEngine');

const RebalancingTarget = require('../../models/RebalancingTarget');
const portfolioRouter = require('../../routes/portfolio');
const rebalancingEngine = require('../../utils/rebalancingEngine');
const { invalidatePortfolioCache } = require('../../utils/portfolioService');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/portfolio', portfolioRouter);
  return app;
};

describe('Rebalancing API Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/portfolio/rebalancing', () => {
    it('should return current allocation, user target, and trade suggestions', async () => {
      const mockTarget = {
        name: 'Growth Target',
        targets: [
          { assetType: 'stocks', percentage: 60 },
          { assetType: 'gold', percentage: 20 },
          { assetType: 'mutualFunds', percentage: 10 },
          { assetType: 'cash', percentage: 5 },
          { assetType: 'certificates', percentage: 5 },
        ],
        excludeRealEstate: true,
      };

      RebalancingTarget.findOne.mockResolvedValue(mockTarget);

      rebalancingEngine.getCurrentAllocation.mockResolvedValue({
        totalPortfolioValue: 200000,
        totalPortfolioValueInPiastres: 20000000,
        excludeRealEstate: true,
        allocations: [],
      });

      rebalancingEngine.generateRebalancingSuggestions.mockReturnValue({
        totalPortfolioValue: 200000,
        totalPortfolioValueInPiastres: 20000000,
        allocations: [],
        suggestions: [
          { assetType: 'stocks', action: 'Buy', amount: 15000, description: 'Under-allocated' },
        ],
      });

      const res = await request(app).get('/api/portfolio/rebalancing');

      expect(res.status).toBe(200);
      expect(res.body.totalPortfolioValue).toBe(200000);
      expect(res.body.suggestions).toHaveLength(1);
      expect(res.body.suggestions[0].action).toBe('Buy');
      expect(rebalancingEngine.getCurrentAllocation).toHaveBeenCalledWith(mockUserId, mockTarget, {
        forceRefresh: false,
      });
    });
  });

  describe('PUT /api/portfolio/rebalancing/target', () => {
    it('should update target when percentages sum to 100%', async () => {
      const payload = {
        name: 'Conservative Target',
        targets: [
          { assetType: 'stocks', percentage: 40 },
          { assetType: 'gold', percentage: 20 },
          { assetType: 'mutualFunds', percentage: 20 },
          { assetType: 'cash', percentage: 10 },
          { assetType: 'certificates', percentage: 10 },
        ],
        excludeRealEstate: true,
      };

      const mockDoc = {
        name: 'Old Target',
        targets: [],
        save: jest.fn().mockResolvedValue(true),
      };
      RebalancingTarget.findOne.mockResolvedValue(mockDoc);

      const res = await request(app)
        .put('/api/portfolio/rebalancing/target')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoc.save).toHaveBeenCalled();
      expect(invalidatePortfolioCache).toHaveBeenCalledWith(mockUserId);
    });

    it('should reject targets if percentages do not sum to 100%', async () => {
      const invalidPayload = {
        targets: [
          { assetType: 'stocks', percentage: 50 },
          { assetType: 'gold', percentage: 20 }, // sums to 70%
        ],
      };

      const res = await request(app)
        .put('/api/portfolio/rebalancing/target')
        .send(invalidPayload);

      expect(res.status).toBe(400);
    });
  });
});
