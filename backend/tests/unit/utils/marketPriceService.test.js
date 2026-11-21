// backend/tests/unit/utils/marketPriceService.test.js
const axios = require('axios');
const marketPriceService = require('../../../utils/marketPriceService');
const MarketPriceCache = require('../../../models/MarketPriceCache');

jest.mock('axios');
jest.mock('../../../models/MarketPriceCache');

describe('MarketPriceService (Resilient Pricing & Multi-Tier Caching)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    marketPriceService.clearMemoryCache();
  });

  describe('getStockPrices', () => {
    it('should return live stock prices and cache them on success', async () => {
      const mockStocks = [{ symbol: 'COMI', price: 85.5 }];
      axios.get.mockResolvedValueOnce({ data: mockStocks });
      MarketPriceCache.findOneAndUpdate.mockResolvedValueOnce({});

      const result = await marketPriceService.getStockPrices();
      expect(result.data).toEqual(mockStocks);
      expect(result.isLive).toBe(true);
      expect(result.isStale).toBe(false);

      // Subsequent call should hit in-memory cache without calling axios again
      const cachedResult = await marketPriceService.getStockPrices();
      expect(cachedResult.data).toEqual(mockStocks);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should fall back to MongoDB cache when live API fails', async () => {
      const fallbackStocks = [{ symbol: 'COMI', price: 82.0 }];
      axios.get.mockRejectedValueOnce(new Error('Mubasher API Down'));
      MarketPriceCache.findOne.mockResolvedValueOnce({
        key: 'stocks',
        data: fallbackStocks,
        updatedAt: new Date(Date.now() - 3600000),
      });

      const result = await marketPriceService.getStockPrices();
      expect(result.data).toEqual(fallbackStocks);
      expect(result.isLive).toBe(false);
      expect(result.isStale).toBe(true);
      expect(result.source).toBe('mongodb-cache');
    });

    it('should return safe empty array if both live API and fallback are unavailable', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network failure'));
      MarketPriceCache.findOne.mockResolvedValueOnce(null);

      const result = await marketPriceService.getStockPrices();
      expect(result.data).toEqual([]);
      expect(result.isStale).toBe(true);
    });
  });

  describe('getFundPrice', () => {
    it('should return live fund price data on success', async () => {
      const mockFund = { rows: [{ name: 'AZ-Opportunity MF', price: 45.2 }] };
      axios.get.mockResolvedValueOnce({ data: mockFund });

      const result = await marketPriceService.getFundPrice('AZ-Opportunity MF');
      expect(result.data).toEqual(mockFund);
      expect(result.isLive).toBe(true);
    });

    it('should handle invalid fund names gracefully', async () => {
      const result = await marketPriceService.getFundPrice('');
      expect(result.data).toBeNull();
      expect(result.source).toBe('invalid-name');
    });
  });

  describe('getGoldPrices', () => {
    it('should fetch from iSagha and parse 24, 21, 18 karat prices', async () => {
      const mockHtml = `
        <div>
          <span>ذهب عيار 24</span>
          <span data-testid="price-figure">6291.5</span>
          <span>عيار 21</span>
          <span data-testid="price-figure">5505</span>
          <span>عيار 18</span>
          <span data-testid="price-figure">4718.5</span>
        </div>
      `;
      axios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await marketPriceService.getGoldPrices();
      expect(result.data).toEqual({ '24': 6291.5, '21': 5505, '18': 4718.5 });
      expect(result.isLive).toBe(true);
      expect(result.source).toBe('isagha-live');
    });

    it('should fallback to spot gold + currency exchange rate calculation if iSagha fails', async () => {
      axios.get
        .mockRejectedValueOnce(new Error('iSagha down'))
        .mockResolvedValueOnce({ data: { price: 3500 } }) // gold-api XAU spot
        .mockResolvedValueOnce({ data: { rates: [{ currencyID: 'USD', sellRate: 50 }] } }); // CIB rate

      const result = await marketPriceService.getGoldPrices();
      expect(result.data['24']).toBeCloseTo(5626.37, 1);
      expect(result.data['21']).toBeCloseTo(4923.07, 1);
      expect(result.data['18']).toBeCloseTo(4219.78, 1);
      expect(result.isLive).toBe(true);
      expect(result.source).toBe('spot-calculated-live');
    });

    it('should fallback to DahabZaman legacy if prior tiers fail', async () => {
      axios.get
        .mockRejectedValueOnce(new Error('iSagha down'))
        .mockRejectedValueOnce(new Error('Spot down'))
        .mockResolvedValueOnce({
          data: {
            '1': { SellPrice: 4100 },
            '2': { SellPrice: 3600 },
            '3': { SellPrice: 3085 },
          },
        });

      const result = await marketPriceService.getGoldPrices();
      expect(result.data).toEqual({ '24': 4100, '21': 3600, '18': 3085 });
      expect(result.source).toBe('dahabzaman-live');
    });

    it('should fallback to DahabMasr if DahabZaman fails', async () => {
      axios.get
        .mockRejectedValueOnce(new Error('iSagha down'))
        .mockRejectedValueOnce(new Error('Spot down'))
        .mockRejectedValueOnce(new Error('DahabZaman 503'))
        .mockResolvedValueOnce({
          data: [{ LocalSellPrice24: 4090, Sell: 3590, LocalSellPrice18: 3075 }],
        });

      const result = await marketPriceService.getGoldPrices();
      expect(result.data).toEqual({ '24': 4090, '21': 3590, '18': 3075 });
      expect(result.source).toBe('dahabmasr-live');
    });

    it('should fallback to MongoDB cache if all live sources fail', async () => {
      axios.get
        .mockRejectedValueOnce(new Error('iSagha down'))
        .mockRejectedValueOnce(new Error('Spot down'))
        .mockRejectedValueOnce(new Error('DahabZaman down'))
        .mockRejectedValueOnce(new Error('DahabMasr down'));
      MarketPriceCache.findOne.mockResolvedValueOnce({
        key: 'gold',
        data: { '24': 4000, '21': 3500, '18': 3000 },
        updatedAt: new Date(Date.now() - 3600000),
      });

      const result = await marketPriceService.getGoldPrices();
      expect(result.data).toEqual({ '24': 4000, '21': 3500, '18': 3000 });
      expect(result.isStale).toBe(true);
      expect(result.source).toBe('mongodb-cache');
    });
  });

  describe('getCurrencyRates', () => {
    it('should return live CIB exchange rates', async () => {
      const mockRates = [{ currencyID: 'USD', buyRate: 48.5, sellRate: 48.6 }];
      axios.get.mockResolvedValueOnce({ data: { rates: mockRates } });

      const result = await marketPriceService.getCurrencyRates();
      expect(result.data).toEqual(mockRates);
      expect(result.isLive).toBe(true);
    });
  });
});
