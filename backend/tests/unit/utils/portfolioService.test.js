// backend/tests/unit/utils/portfolioService.test.js
const portfolioService = require('../../../utils/portfolioService');
const marketPriceService = require('../../../utils/marketPriceService');
const Trade = require('../../../models/Trade');
const MutualFundTrade = require('../../../models/MutualFundTrade');
const Gold = require('../../../models/Gold');
const Certificate = require('../../../models/Certificate');
const Currency = require('../../../models/Currency');
const RealEstate = require('../../../models/RealEstate');

jest.mock('../../../utils/marketPriceService');
jest.mock('../../../models/Trade');
jest.mock('../../../models/MutualFundTrade');
jest.mock('../../../models/Gold');
jest.mock('../../../models/Certificate');
jest.mock('../../../models/Currency');
jest.mock('../../../models/RealEstate');

describe('PortfolioService (Multi-Asset Aggregation & Caching)', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    portfolioService.invalidatePortfolioCache();

    // Default mocks for models
    RealEstate.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
      then: (resolve) => resolve([]),
      [Symbol.iterator]: [][Symbol.iterator].bind([]),
    });
    RealEstate.aggregate.mockResolvedValue([]);

    // Default mocks for price service
    marketPriceService.getStockPrices.mockResolvedValue({
      data: [{ symbol: 'COMI', price: 90.0 }],
      isLive: true,
      isStale: false,
      timestamp: Date.now(),
    });
    marketPriceService.getGoldPrices.mockResolvedValue({
      data: { '24': 4100, '21': 3600, '18': 3085 },
      isLive: true,
      isStale: false,
      timestamp: Date.now(),
    });
    marketPriceService.getCurrencyRates.mockResolvedValue({
      data: [{ currencyID: 'USD', buyRate: 48.5, sellRate: 48.6 }],
      isLive: true,
      isStale: false,
      timestamp: Date.now(),
    });
    marketPriceService.getFundPrice.mockResolvedValue({
      data: { rows: [{ name: 'AZ-Opportunity MF', price: 50.0 }] },
      isLive: true,
      isStale: false,
      timestamp: Date.now(),
    });
  });

  describe('calculateAssetAllocation', () => {
    it('should correctly calculate invested and current percentage weights', () => {
      const mockHoldings = [
        { assetType: 'Stock', totalCost: 10000, currentValue: 12000 },
        { assetType: 'Gold', totalCost: 10000, currentValue: 8000 },
      ];

      const result = portfolioService.calculateAssetAllocation(mockHoldings);
      expect(result.totalInvested).toBe(20000);
      expect(result.totalCurrentValue).toBe(20000);
      expect(result.allocations).toHaveLength(2);

      const stockAlloc = result.allocations.find((a) => a.assetType === 'Stock');
      expect(stockAlloc.investedPercentage).toBe(50.0);
      expect(stockAlloc.currentPercentage).toBe(60.0);
    });
  });

  describe('getAllHoldings', () => {
    it('should aggregate holdings across multiple asset classes with live status', async () => {
      Trade.aggregate.mockResolvedValueOnce([
        {
          _id: { broker: 'Thndr', stockCode: 'COMI', iteration: 1 },
          totalSharesBought: 100,
          totalSharesSold: 0,
          totalSharesDividend: 0,
          currentShares: 100,
          avgBuyPrice: 80.0,
          totalBuyValue: 8000,
          totalSellValue: 0,
          totalFees: 50,
        },
      ]);

      MutualFundTrade.aggregate.mockResolvedValueOnce([
        {
          _id: { code: 'AZO', name: 'AZ-Opportunity MF' },
          currentUnits: 200,
          netInvested: 9000,
        },
      ]);

      Gold.aggregate.mockResolvedValueOnce([
        {
          _id: 24,
          totalWeight: 10,
          totalPaid: 38000,
        },
      ]);

      Certificate.find.mockResolvedValueOnce([
        {
          _id: 'cert1',
          name: 'Platinum 3Y',
          amount: 50000,
          interest: 19.0,
          period: 36,
          startDate: new Date('2023-01-01'),
        },
      ]);

      Currency.aggregate.mockResolvedValueOnce([
        {
          _id: 'Dollar',
          totalAmount: 1000,
          totalPrice: 47000,
        },
      ]);

      RealEstate.find.mockResolvedValueOnce([
        {
          _id: 're_mock_1',
          name: 'Apartment New Cairo',
          type: 'Residential',
          area: 120,
          purchasePrice: 1500000,
          currentValuation: 2200000,
          status: 'Owned',
        },
      ]);

      const holdings = await portfolioService.getAllHoldings(mockUserId);
      expect(holdings.length).toBeGreaterThanOrEqual(5);

      const stockHolding = holdings.find((h) => h.assetType === 'Stock');
      expect(stockHolding.symbol).toBe('COMI');
      expect(stockHolding.currentPrice).toBe(90.0);
      expect(stockHolding.currentValue).toBe(9000);
      expect(stockHolding.unrealizedPnL).toBe(1000);
      expect(stockHolding.priceStatus).toBe('live');

      const goldHolding = holdings.find((h) => h.assetType === 'Gold');
      expect(goldHolding.currentValue).toBe(41000);
      expect(goldHolding.priceStatus).toBe('live');

      const certHolding = holdings.find((h) => h.assetType === 'Certificate');
      expect(certHolding.priceStatus).toBe('fixed');

      const reHolding = holdings.find((h) => h.assetType === 'Real Estate');
      expect(reHolding.priceStatus).toBe('manual');
    });
  });

  describe('getPortfolioSummary & Invalidation', () => {
    it('should calculate summary and cache the result', async () => {
      Trade.aggregate.mockResolvedValue([]);
      MutualFundTrade.aggregate.mockResolvedValue([]);
      Gold.aggregate.mockResolvedValue([]);
      Certificate.find.mockImplementation(() => {
        const query = Promise.resolve([]);
        query.select = jest.fn().mockResolvedValue([]);
        return query;
      });
      Currency.aggregate.mockResolvedValue([]);
      Trade.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      MutualFundTrade.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      Gold.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
      Currency.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

      const summary1 = await portfolioService.getPortfolioSummary(mockUserId);
      expect(summary1.isCached).toBe(false);

      const summary2 = await portfolioService.getPortfolioSummary(mockUserId);
      expect(summary2.isCached).toBe(true);

      // Invalidate cache
      portfolioService.invalidatePortfolioCache(mockUserId);
      const summary3 = await portfolioService.getPortfolioSummary(mockUserId);
      expect(summary3.isCached).toBe(false);
    });
  });

  describe('calculateAssetAllocation with stockTopUps', () => {
    it('should use stockTopUps for Stock invested capital when provided', () => {
      const mockHoldings = [
        {
          assetType: 'Stock',
          totalCost: 5000,
          currentValue: 7000,
        },
        {
          assetType: 'Gold',
          totalCost: 10000,
          currentValue: 12000,
        },
      ];

      const result = portfolioService.calculateAssetAllocation(mockHoldings, { stockTopUps: 15000 });
      const stockAlloc = result.allocations.find((a) => a.assetType === 'Stock');

      expect(stockAlloc.investedAmount).toBe(15000);
      expect(result.totalInvested).toBe(25000); // 15000 (Stock Top Up) + 10000 (Gold)
    });
  });
});
