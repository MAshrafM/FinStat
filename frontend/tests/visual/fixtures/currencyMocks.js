// frontend/tests/visual/fixtures/currencyMocks.js
/**
 * Deterministic Playwright network mocks for Phase 8D:
 *   /currency, /currency/:id, /currency/new, /currency/edit/:id
 */

const MOCK_CURRENCY_HOLDINGS = [
  {
    _id: '1',
    name: 'Dollar',
    currencyCode: 'USD',
    amount: 2000,
    price: 96000,
    costBasis: 96000,
    purchaseRate: 48.0,
    currentRate: 50.5,
    currentValue: 101000,
    unrealizedGainLoss: 5000,
    gainLossPercentage: 5.21,
    rateSource: 'CIB',
    isStale: false,
    sourceAccount: 'Bank',
    date: '2025-11-01T00:00:00.000Z',
    lastRevaluationDate: '2026-01-15T08:00:00.000Z',
  },
  {
    _id: '2',
    name: 'Euro',
    currencyCode: 'EUR',
    amount: 1000,
    price: 55000,
    costBasis: 55000,
    purchaseRate: 55.0,
    currentRate: 52.5,
    currentValue: 52500,
    unrealizedGainLoss: -2500,
    gainLossPercentage: -4.55,
    rateSource: 'fallback',
    isStale: true,
    sourceAccount: 'Cash',
    date: '2025-10-15T00:00:00.000Z',
    lastRevaluationDate: '2026-01-12T08:00:00.000Z',
  },
  {
    _id: '3',
    name: 'Pound',
    currencyCode: 'GBP',
    amount: 500,
    price: 31500,
    costBasis: 31500,
    purchaseRate: 63.0,
    currentRate: 63.0,
    currentValue: 31500,
    unrealizedGainLoss: 0,
    gainLossPercentage: 0,
    rateSource: 'manual',
    isStale: false,
    sourceAccount: 'Bank',
    date: '2025-12-01T00:00:00.000Z',
    lastRevaluationDate: '2026-01-15T08:00:00.000Z',
  },
];

const MOCK_CURRENCY_PRICES = [
  { currencyID: 'USD', buyRate: 50.3, sellRate: 50.5 },
  { currencyID: 'EUR', buyRate: 52.2, sellRate: 52.5 },
  { currencyID: 'GBP', buyRate: 62.7, sellRate: 63.0 },
  { currencyID: 'JPY', buyRate: 0.32, sellRate: 0.33 },
  { currencyID: 'SAR', buyRate: 13.4, sellRate: 13.46 },
];

const MOCK_CURRENCY_SUMMARY = [
  { _id: 'Dollar', totalAmount: 2000, totalCostBasis: 96000, currentPrice: 50.5 },
  { _id: 'Euro', totalAmount: 1000, totalCostBasis: 55000, currentPrice: 52.5 },
  { _id: 'Pound', totalAmount: 500, totalCostBasis: 31500, currentPrice: 63.0 },
];

// 100 deterministic daily snapshots in newest-first order ending 2026-01-15T00:00:00.000Z
const MOCK_RATE_HISTORY_100 = Array.from({ length: 100 }, (_, idx) => {
  const dateObj = new Date(Date.UTC(2026, 0, 15 - idx));
  const wave = Math.sin(idx * 0.2) * 0.35;
  const usdRate = Number((50.5 - idx * 0.02 + wave).toFixed(2));
  const eurRate = Number((usdRate + 2.0).toFixed(2));
  const gbpRate = Number((usdRate + 12.5).toFixed(2));
  const jpyRate = Number((usdRate / 153).toFixed(4));
  const sarRate = Number((usdRate / 3.75).toFixed(2));
  return {
    _id: `hist-${idx + 1}`,
    date: dateObj.toISOString(),
    baseCurrency: 'EGP',
    source: 'CIB',
    rates: {
      USD: usdRate,
      EUR: eurRate,
      GBP: gbpRate,
      JPY: jpyRate,
      SAR: sarRate,
    },
  };
});

async function setupCurrencyMocks(page) {
  await page.route(/\/api\/currency(?:\/|\?|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();
    const origin = request.headers().origin || 'http://localhost:3000';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-auth-token, Authorization',
    };

    const fulfillJson = (status, body) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }

    if (pathname.endsWith('/api/currency/rate-history')) {
      const rawLimit = parseInt(url.searchParams.get('limit'), 10);
      const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 30));
      const rawCode = url.searchParams.get('currencyCode');
      const currencyCode = rawCode ? rawCode.toUpperCase() : null;
      const sliced = MOCK_RATE_HISTORY_100.slice(0, limit).map((snap) => ({
        _id: snap._id,
        date: snap.date,
        baseCurrency: snap.baseCurrency,
        source: snap.source,
        rate: currencyCode ? (snap.rates[currencyCode] ?? null) : null,
        rates: snap.rates,
      }));
      return fulfillJson(200, sliced);
    }

    if (pathname.endsWith('/api/currency/summary')) {
      return fulfillJson(200, MOCK_CURRENCY_SUMMARY);
    }

    if (pathname.endsWith('/api/currency/price')) {
      return fulfillJson(200, MOCK_CURRENCY_PRICES);
    }

    if (pathname.endsWith('/api/currency/revalue') && method === 'POST') {
      return fulfillJson(200, {
        success: true,
        message: 'Successfully revalued 3 currency holding(s)',
        updated: 3,
        holdings: MOCK_CURRENCY_HOLDINGS,
      });
    }

    const detailMatch = pathname.match(/\/api\/currency\/([^/]+)$/);
    if (detailMatch) {
      const id = detailMatch[1];
      const found = MOCK_CURRENCY_HOLDINGS.find((h) => h._id === id) || MOCK_CURRENCY_HOLDINGS[0];
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return fulfillJson(200, { ...found, ...body });
      }
      if (method === 'DELETE') {
        return fulfillJson(200, { message: 'Currency holding deleted' });
      }
      return fulfillJson(200, found);
    }

    if (method === 'POST') {
      const body = request.postDataJSON() || {};
      return fulfillJson(201, { _id: '4', ...body });
    }

    return fulfillJson(200, MOCK_CURRENCY_HOLDINGS);
  });
}

module.exports = {
  MOCK_CURRENCY_HOLDINGS,
  MOCK_CURRENCY_PRICES,
  MOCK_CURRENCY_SUMMARY,
  MOCK_RATE_HISTORY_100,
  setupCurrencyMocks,
};
