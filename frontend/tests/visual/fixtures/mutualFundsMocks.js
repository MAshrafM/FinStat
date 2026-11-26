// frontend/tests/visual/fixtures/mutualFundsMocks.js
/**
 * Deterministic API mock fixtures for the Mutual Funds subsystem.
 * Phase 7C: Mutual Fund Log, Add/Edit Transaction, Holdings Summary.
 */

const MOCK_MF_TRADES = [
  {
    _id: 'mf-001',
    date: '2026-01-14T10:30:00Z',
    name: 'AZ Opportunity Fund',
    code: 'AZO',
    type: 'Buy',
    units: 120,
    price: 48.5,
    fees: 25,
    totalValue: 5845,
    sourceAccount: 'Bank',
    destinationAccount: 'Bank',
    autoReinvest: false,
  },
  {
    _id: 'mf-002',
    date: '2026-01-12T14:15:00Z',
    name: 'Misr Equity Fund',
    code: 'MEF01',
    type: 'Buy',
    units: 60,
    price: 100,
    fees: 15,
    totalValue: 6015,
    sourceAccount: 'Bank',
    destinationAccount: 'Bank',
    autoReinvest: false,
  },
  {
    _id: 'mf-003',
    date: '2026-01-10T09:00:00Z',
    name: 'AZ Opportunity Fund',
    code: 'AZO',
    type: 'Sell',
    units: 20,
    price: 52.5,
    fees: 10,
    totalValue: 1040,
    sourceAccount: 'Bank',
    destinationAccount: 'Bank',
    autoReinvest: false,
  },
  {
    _id: 'mf-004',
    date: '2026-01-08T09:00:00Z',
    name: 'AZ Opportunity Fund',
    code: 'AZO',
    type: 'Coupon',
    units: 100,
    price: 250,
    fees: 0,
    totalValue: 250,
    sourceAccount: 'Bank',
    destinationAccount: 'Bank',
    autoReinvest: false,
  },
];

const MOCK_MF_SINGLE_TRADE = {
  ...MOCK_MF_TRADES[0],
  _id: '1',
};

const MOCK_MF_SUMMARY = [
  {
    _id: { name: 'AZ Opportunity Fund', code: 'AZO' },
    currentUnits: 250,
    averagePrice: 46.4,
    totalValue: 12500,
    totalCouponValue: 500,
  },
  {
    _id: { name: 'Misr Equity Fund', code: 'MEF01' },
    currentUnits: 100,
    averagePrice: 100,
    totalValue: 10000,
    totalCouponValue: 0,
  },
];

// Misr Equity Fund deliberately reports no usable price so the neutral
// "Price Unavailable" state is captured in the baseline gallery.
const MOCK_MF_PRICES = {
  'AZ Opportunity Fund': 52.5,
  'Misr Equity Fund': 0,
};

/**
 * Intercept and fulfill mutual fund API calls deterministically.
 * @param {import('@playwright/test').Page} page
 * @param {string} [routeSlug]
 */
async function setupMutualFundMocks(page, routeSlug) {
  await page.route(/\/api\/mutual-funds/, async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
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

    if (method === 'POST') {
      if (url.includes('/batch-prices')) {
        return fulfillJson(200, {
          prices: Object.entries(MOCK_MF_PRICES).map(([name, lastPrice]) => ({
            name,
            lastPrice,
          })),
        });
      }
      return fulfillJson(200, { success: true });
    }

    if (method === 'PUT' || method === 'DELETE') {
      return fulfillJson(200, { success: true });
    }

    if (url.includes('/mutual-funds/all')) {
      return fulfillJson(200, MOCK_MF_TRADES);
    }

    if (url.includes('/mutual-funds/summary')) {
      return fulfillJson(200, MOCK_MF_SUMMARY);
    }

    if (url.includes('/mutual-funds/code/')) {
      const code = decodeURIComponent(
        url.split('/mutual-funds/code/')[1].split('?')[0]
      );
      const match = MOCK_MF_TRADES.find((trade) => trade.code === code);
      return fulfillJson(200, match ? [{ name: match.name, code: match.code }] : []);
    }

    if (/\/api\/mutual-funds\/1(\?.*)?$/.test(url)) {
      return fulfillJson(200, MOCK_MF_SINGLE_TRADE);
    }

    if (url.includes('/mutual-funds/last-price')) {
      const parsed = new URL(url);
      const name = parsed.searchParams.get('name');
      const lastPrice = Object.prototype.hasOwnProperty.call(MOCK_MF_PRICES, name)
        ? MOCK_MF_PRICES[name]
        : 0;
      return fulfillJson(200, { name, lastPrice });
    }

    if (method === 'GET') {
      const parsed = new URL(url);
      const type = parsed.searchParams.get('type') || 'all';
      const page = Number(parsed.searchParams.get('page') || '1');
      const filtered =
        type === 'all'
          ? MOCK_MF_TRADES
          : MOCK_MF_TRADES.filter((trade) => trade.type === type);

      return fulfillJson(200, {
        data: filtered,
        totalPages: 1,
        currentPage: Number.isFinite(page) && page > 0 ? page : 1,
        totalCount: filtered.length,
        routeSlug: routeSlug || null,
      });
    }

    return fulfillJson(200, { success: true });
  });
}

module.exports = {
  MOCK_MF_TRADES,
  MOCK_MF_SINGLE_TRADE,
  MOCK_MF_SUMMARY,
  MOCK_MF_PRICES,
  setupMutualFundMocks,
};
