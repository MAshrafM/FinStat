// frontend/tests/visual/fixtures/goldMocks.js
/**
 * Deterministic API mock fixtures for the Gold Wallet subsystem.
 * Phase 8A: Gold Log, Add/Edit forms, Holdings Summary, Purchasing Power.
 */

const MOCK_GOLD_LOGS = [
  {
    _id: 'gold-1',
    date: '2026-01-14T10:30:00Z',
    item: 'Gold Ring 22K',
    seller: 'Cairo Gold House',
    karat: 22,
    weight: 2,
    price: 100,
    paid: 220,
    status: 'sold',
    sellingPrice: 130,
    sellingDate: '2026-06-01T00:00:00Z',
    sourceAccount: 'Bank',
    destinationAccount: 'Cash',
  },
  {
    _id: 'gold-2',
    date: '2026-01-10T09:00:00Z',
    item: '24K Bullion Bar',
    seller: 'Dahab Zaman',
    karat: 24,
    weight: 5,
    price: 200,
    paid: 1010,
    status: 'hold',
    sourceAccount: 'Cash',
    destinationAccount: 'Cash',
  },
  {
    _id: 'gold-3',
    date: '2026-01-08T14:15:00Z',
    item: '18K Chain',
    seller: 'Local Dealer',
    karat: 18,
    weight: 3.5,
    price: 90,
    paid: 322,
    status: 'hold',
    sourceAccount: 'Bank',
    destinationAccount: 'Cash',
  },
];

const MOCK_GOLD_SINGLE = {
  ...MOCK_GOLD_LOGS[0],
  _id: '1',
};

const MOCK_GOLD_SUMMARY = [
  {
    karat: 24,
    totalWeight: 10,
    totalPaid: 1000,
    status: 'hold',
  },
  {
    karat: 22,
    totalWeight: 5,
    totalPaid: 500,
    status: 'hold',
  },
  {
    karat: 18,
    totalWeight: 3,
    totalPaid: 300,
    totalSellingPrice: 360,
    avgHoldingDays: 90,
    status: 'sold',
  },
];

const MOCK_GOLD_PRICES = {
  24: 120,
  22: 110,
  18: 90,
};

const MOCK_PURCHASING_POWER = {
  success: true,
  current: {
    netWorthEgp: 1250000.5,
    goldPrice24k: 4200,
    usdRate: 48.65,
    purchasingPowerGoldGrams: 297.62,
    purchasingPowerUsd: 25693.74,
    goldPriceStatus: 'live',
    goldPriceSource: 'dahabzaman-live',
    usdRateStatus: 'live',
    forexSource: 'CIB',
  },
  timeline: [
    {
      date: '2025-10-15T00:00:00.000Z',
      usdRate: 47.8,
      goldPrice24k: 3800,
      purchasingPowerGoldGrams: 280.1,
      purchasingPowerUsd: 22450.25,
      netWorthEgp: 1070000,
    },
    {
      date: '2025-11-15T00:00:00.000Z',
      usdRate: 48.1,
      goldPrice24k: 3950,
      purchasingPowerGoldGrams: 288.4,
      purchasingPowerUsd: 23880.5,
      netWorthEgp: 1150000,
    },
    {
      date: '2025-12-15T00:00:00.000Z',
      usdRate: 48.35,
      goldPrice24k: 4100,
      purchasingPowerGoldGrams: 293.75,
      purchasingPowerUsd: 24890.75,
      netWorthEgp: 1210000,
    },
    {
      date: '2026-01-15T00:00:00.000Z',
      usdRate: 48.65,
      goldPrice24k: 4200,
      purchasingPowerGoldGrams: 297.62,
      purchasingPowerUsd: 25693.74,
      netWorthEgp: 1250000.5,
    },
  ],
  currencyHoldings: [
    {
      _id: 'curr_1',
      name: 'US Dollars',
      currencyCode: 'USD',
      amount: 5000,
      purchaseRate: 40.5,
      currentRate: 48.65,
      costBasisEgp: 202500,
      currentValueEgp: 243250,
      currentValueUsd: 5000,
      unrealizedGainLossEgp: 40750,
      unrealizedGainLossPercentage: 20.12,
    },
    {
      _id: 'curr_2',
      name: 'Euro',
      currencyCode: 'EUR',
      amount: 2000,
      purchaseRate: 52.1,
      currentRate: 54.2,
      costBasisEgp: 104200,
      currentValueEgp: 108400,
      currentValueUsd: 2228.16,
      unrealizedGainLossEgp: 4200,
      unrealizedGainLossPercentage: 4.03,
    },
  ],
};

/**
 * Intercept and fulfill gold API calls deterministically.
 * @param {import('@playwright/test').Page} page
 * @param {string} [routeSlug]
 */
async function setupGoldMocks(page, routeSlug) {
  await page.route(/\/api\/golds(?:\/|\?|$)/, async (route) => {
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

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      return fulfillJson(200, { success: true });
    }

    if (url.includes('/golds/purchasing-power')) {
      return fulfillJson(200, MOCK_PURCHASING_POWER);
    }

    if (url.includes('/golds/summary')) {
      return fulfillJson(200, MOCK_GOLD_SUMMARY);
    }

    if (url.includes('/golds/price')) {
      return fulfillJson(200, MOCK_GOLD_PRICES);
    }

    if (/\/api\/golds\/1(?:\?.*)?$/.test(url)) {
      return fulfillJson(200, MOCK_GOLD_SINGLE);
    }

    if (url.includes('/golds/')) {
      const id = decodeURIComponent(url.split('/golds/')[1].split('?')[0]);
      const match = MOCK_GOLD_LOGS.find((log) => log._id === id);
      return fulfillJson(200, match || MOCK_GOLD_SINGLE);
    }

    const parsed = new URL(url);
    const status = parsed.searchParams.get('status') || 'all';
    const pageNumber = Number(parsed.searchParams.get('page') || '1');
    const sortBy = parsed.searchParams.get('sortBy') || 'date';
    const descending = parsed.searchParams.get('sortOrder') !== 'asc';
    const filtered = status === 'all'
      ? [...MOCK_GOLD_LOGS]
      : MOCK_GOLD_LOGS.filter((log) => log.status === status);
    filtered.sort((a, b) => {
      const valueA = sortBy === 'karat' || sortBy === 'weight' ? Number(a[sortBy]) : new Date(a.date).getTime();
      const valueB = sortBy === 'karat' || sortBy === 'weight' ? Number(b[sortBy]) : new Date(b.date).getTime();
      return descending ? valueB - valueA : valueA - valueB;
    });

    return fulfillJson(200, {
      data: filtered,
      totalPages: 1,
      currentPage: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
      totalCount: filtered.length,
      routeSlug: routeSlug || null,
    });
  });
}

module.exports = {
  MOCK_GOLD_LOGS,
  MOCK_GOLD_SINGLE,
  MOCK_GOLD_SUMMARY,
  MOCK_GOLD_PRICES,
  MOCK_PURCHASING_POWER,
  setupGoldMocks,
};
