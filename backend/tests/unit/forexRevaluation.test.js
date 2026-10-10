// backend/tests/unit/forexRevaluation.test.js
const {
  normalizeCurrencyCode,
  revalueCurrencyHolding,
} = require('../../utils/forexRevaluation');

describe('Forex Revaluation Engine (Unit Tests)', () => {
  describe('normalizeCurrencyCode', () => {
    it('should map common colloquial names to ISO codes', () => {
      expect(normalizeCurrencyCode('Dollar')).toBe('USD');
      expect(normalizeCurrencyCode('Euro')).toBe('EUR');
      expect(normalizeCurrencyCode('Pound')).toBe('GBP');
      expect(normalizeCurrencyCode('Riyal')).toBe('SAR');
      expect(normalizeCurrencyCode('usd')).toBe('USD');
    });
  });

  describe('revalueCurrencyHolding', () => {
    it('should calculate current value and unrealized profit correctly', () => {
      const holding = {
        name: 'USD',
        amount: 1000,
        purchaseRate: 47.5,
        price: 47500,
        priceInPiastres: 4750000,
      };

      const latestRates = { USD: 49.5 };
      const updated = revalueCurrencyHolding(holding, latestRates, { rateSource: 'CIB', isStale: false });

      // Current Value = 1000 * 49.5 * 100 = 4,950,000 piastres
      expect(updated.currentRate).toBe(49.5);
      expect(updated.currentValueInPiastres).toBe(4950000);
      // Unrealized Profit = 4,950,000 - 4,750,000 = 200,000 piastres (2000 EGP)
      expect(updated.unrealizedForexGainLossInPiastres).toBe(200000);
      expect(updated.rateSource).toBe('CIB');
      expect(updated.isStale).toBe(false);
    });

    it('should calculate unrealized loss correctly when rate drops', () => {
      const holding = {
        name: 'EUR',
        currencyCode: 'EUR',
        amount: 500,
        purchaseRate: 53.0,
        price: 26500,
        priceInPiastres: 2650000,
      };

      const latestRates = { EUR: 51.0 };
      const updated = revalueCurrencyHolding(holding, latestRates, { rateSource: 'CIB', isStale: false });

      // Current Value = 500 * 51.0 * 100 = 2,550,000 piastres
      expect(updated.currentRate).toBe(51.0);
      expect(updated.currentValueInPiastres).toBe(2550000);
      // Unrealized Loss = 2,550,000 - 2,650,000 = -100,000 piastres (-1000 EGP)
      expect(updated.unrealizedForexGainLossInPiastres).toBe(-100000);
    });

    it('should mark holding as manual when manual override is provided', () => {
      const holding = {
        name: 'GBP',
        amount: 100,
        purchaseRate: 60.0,
        price: 6000,
        priceInPiastres: 600000,
      };

      const updated = revalueCurrencyHolding(holding, {}, { manualRate: 63.5 });
      expect(updated.currentRate).toBe(63.5);
      expect(updated.rateSource).toBe('manual');
      expect(updated.isStale).toBe(false);
      expect(updated.unrealizedForexGainLossInPiastres).toBe(35000); // +350 EGP
    });

    it('should mark holding as stale and fallback when rate is missing from live feed', () => {
      const holding = {
        name: 'KWD',
        amount: 100,
        purchaseRate: 155.0,
        currentRate: 155.0,
        price: 15500,
        priceInPiastres: 1550000,
      };

      const latestRates = { USD: 49.5 }; // KWD not in feed
      const updated = revalueCurrencyHolding(holding, latestRates, { rateSource: 'CIB', isStale: false });

      expect(updated.rateSource).toBe('fallback');
      expect(updated.isStale).toBe(true);
    });
  });
});
