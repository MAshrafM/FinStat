// backend/tests/integration/portfolioApi.test.js
const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => (req, res, next) => {
  req.user = { id: '507f1f77bcf86cd799439011', role: 'manager' };
  req.effectiveUserId = '507f1f77bcf86cd799439011';
  req.canModify = true;
  next();
});

const portfolioRouter = require('../../routes/portfolio');
const portfolioService = require('../../utils/portfolioService');

jest.mock('../../utils/portfolioService');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/portfolio', portfolioRouter);
  return app;
};

describe('Portfolio API Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp('manager');
  });

  describe('GET /api/portfolio/summary', () => {
    it('should return portfolio summary metrics', async () => {
      const mockSummary = {
        totalInvested: 150000,
        totalCurrentValue: 185000,
        unrealizedPnL: 35000,
        realizedPnL: 5000,
        totalPnL: 40000,
        roiPercentage: 26.67,
        xirr: 22.45,
        xirrMessage: null,
        priceHealth: 'live',
        holdingsCount: 6,
        allocations: [],
      };

      portfolioService.getPortfolioSummary.mockResolvedValueOnce(mockSummary);

      const res = await request(app).get('/api/portfolio/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalInvested).toBe(150000);
      expect(res.body.totalCurrentValue).toBe(185000);
      expect(res.body.roiPercentage).toBe(26.67);
      expect(res.body.xirr).toBe(22.45);
      expect(portfolioService.getPortfolioSummary).toHaveBeenCalledWith('507f1f77bcf86cd799439011', {
        forceRefresh: false,
      });
    });
  });

  describe('GET /api/portfolio/holdings', () => {
    it('should return all holdings and support search filtering', async () => {
      const mockHoldings = [
        {
          id: 'stock_COMI',
          name: 'Commercial International Bank',
          symbol: 'COMI',
          assetType: 'Stock',
          category: 'Equities',
          totalCost: 10000,
          currentValue: 12000,
          priceStatus: 'live',
        },
        {
          id: 'gold_24k',
          name: 'Gold 24K',
          symbol: '24K Gold',
          assetType: 'Gold',
          category: 'Precious Metals',
          totalCost: 20000,
          currentValue: 22000,
          priceStatus: 'live',
        },
      ];

      portfolioService.getAllHoldings.mockResolvedValueOnce(mockHoldings);

      const res = await request(app).get('/api/portfolio/holdings?search=COMI');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].symbol).toBe('COMI');
    });

    it('should filter by assetType', async () => {
      const mockHoldings = [
        { id: 'stock_1', symbol: 'COMI', assetType: 'Stock', category: 'Equities' },
        { id: 'gold_1', symbol: 'Gold', assetType: 'Gold', category: 'Precious Metals' },
      ];

      portfolioService.getAllHoldings.mockResolvedValueOnce(mockHoldings);

      const res = await request(app).get('/api/portfolio/holdings?assetType=Gold');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].assetType).toBe('Gold');
    });
  });

  describe('GET /api/portfolio/allocation', () => {
    it('should return calculated asset allocation', async () => {
      portfolioService.getAllHoldings.mockResolvedValueOnce([]);
      portfolioService.calculateAssetAllocation.mockReturnValueOnce({
        allocations: [{ assetType: 'Stock', investedPercentage: 100, currentPercentage: 100 }],
        totalInvested: 10000,
        totalCurrentValue: 12000,
      });

      const res = await request(app).get('/api/portfolio/allocation');

      expect(res.status).toBe(200);
      expect(res.body.allocations).toHaveLength(1);
      expect(res.body.totalInvested).toBe(10000);
    });
  });

  describe('POST /api/portfolio/clear-cache', () => {
    it('should call invalidatePortfolioCache and return success message', async () => {
      const res = await request(app).post('/api/portfolio/clear-cache');

      expect(res.status).toBe(200);
      expect(res.body.msg).toContain('cleared successfully');
      expect(portfolioService.invalidatePortfolioCache).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
