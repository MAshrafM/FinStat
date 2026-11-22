// frontend/tests/visual/fixtures/portfolioMocks.js
/**
 * Mock portfolio summary, holdings, and allocation fixtures for visual regression and a11y tests.
 * Governed by Phase 6A plan: supports deterministic multi-asset and >=7 category testing.
 */

const MOCK_PORTFOLIO_SUMMARY = {
  totalInvested: 450000,
  totalCurrentValue: 582400,
  totalPnL: 132400,
  unrealizedPnL: 118400,
  realizedPnL: 14000,
  roiPercentage: 29.42,
  xirr: 22.85,
  xirrMessage: 'Time-weighted annual rate based on dated transaction logs',
  holdingsCount: 7,
  priceHealth: 'live',
};

const MOCK_PORTFOLIO_ALLOCATIONS = [
  { assetType: 'Stock', investedAmount: 180000, currentValue: 245000, investedPercentage: 40.0, currentPercentage: 42.1, count: 2 },
  { assetType: 'Real Estate', investedAmount: 120000, currentValue: 155000, investedPercentage: 26.7, currentPercentage: 26.6, count: 1 },
  { assetType: 'Gold', investedAmount: 60000, currentValue: 78000, investedPercentage: 13.3, currentPercentage: 13.4, count: 1 },
  { assetType: 'Mutual Fund', investedAmount: 40000, currentValue: 51000, investedPercentage: 8.9, currentPercentage: 8.8, count: 1 },
  { assetType: 'Certificate', investedAmount: 30000, currentValue: 32400, investedPercentage: 6.7, currentPercentage: 5.6, count: 1 },
  { assetType: 'Currency', investedAmount: 12000, currentValue: 13000, investedPercentage: 2.7, currentPercentage: 2.2, count: 1 },
  { assetType: 'Cash', investedAmount: 5000, currentValue: 5000, investedPercentage: 1.1, currentPercentage: 0.9, count: 1 },
  { assetType: 'Commodities', investedAmount: 3000, currentValue: 3000, investedPercentage: 0.6, currentPercentage: 0.5, count: 1 },
];

const MOCK_PORTFOLIO_HOLDINGS = [
  {
    id: 'hold-1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    assetType: 'Stock',
    quantity: 150,
    unitLabel: 'shares',
    avgBuyPrice: 150,
    currentPrice: 190,
    totalCost: 22500,
    currentValue: 28500,
    unrealizedPnL: 6000,
    unrealizedPnLPercentage: 26.67,
    priceStatus: 'live',
    sourceUrl: '/trades',
  },
  {
    id: 'hold-2',
    name: 'Microsoft Corp.',
    symbol: 'MSFT',
    assetType: 'Stock',
    quantity: 100,
    unitLabel: 'shares',
    avgBuyPrice: 280,
    currentPrice: 390,
    totalCost: 28000,
    currentValue: 39000,
    unrealizedPnL: 11000,
    unrealizedPnLPercentage: 39.29,
    priceStatus: 'live',
    sourceUrl: '/trades',
  },
  {
    id: 'hold-3',
    name: 'Downtown Commercial Suite',
    symbol: 'RE-DWTN',
    assetType: 'Real Estate',
    quantity: 1,
    unitLabel: 'property',
    avgBuyPrice: 120000,
    currentPrice: 155000,
    totalCost: 120000,
    currentValue: 155000,
    unrealizedPnL: 35000,
    unrealizedPnLPercentage: 29.17,
    priceStatus: 'manual',
    sourceUrl: '/real-estate',
  },
  {
    id: 'hold-4',
    name: '24k Physical Bullion Bar',
    symbol: 'XAU-BAR',
    assetType: 'Gold',
    quantity: 25,
    unitLabel: 'oz',
    avgBuyPrice: 2400,
    currentPrice: 3120,
    totalCost: 60000,
    currentValue: 78000,
    unrealizedPnL: 18000,
    unrealizedPnLPercentage: 30.0,
    priceStatus: 'live',
    sourceUrl: '/gold-wallet/summary',
  },
  {
    id: 'hold-5',
    name: 'Vanguard 500 Index Fund',
    symbol: 'VFIAX',
    assetType: 'Mutual Fund',
    quantity: 80,
    unitLabel: 'units',
    avgBuyPrice: 500,
    currentPrice: 637.5,
    totalCost: 40000,
    currentValue: 51000,
    unrealizedPnL: 11000,
    unrealizedPnLPercentage: 27.5,
    priceStatus: 'stale',
    sourceUrl: '/mutual-funds/summary',
  },
  {
    id: 'hold-6',
    name: '3-Year Fixed Certificate of Deposit',
    symbol: 'CD-3YR',
    assetType: 'Certificate',
    quantity: 1,
    unitLabel: 'certificate',
    avgBuyPrice: 30000,
    currentPrice: 32400,
    totalCost: 30000,
    currentValue: 32400,
    unrealizedPnL: 2400,
    unrealizedPnLPercentage: 8.0,
    priceStatus: 'fixed',
    sourceUrl: '/certificates',
  },
  {
    id: 'hold-7',
    name: 'Euro Cash Reserve',
    symbol: 'EUR',
    assetType: 'Currency',
    quantity: 10000,
    unitLabel: 'EUR',
    avgBuyPrice: 1.2,
    currentPrice: 1.3,
    totalCost: 12000,
    currentValue: 13000,
    unrealizedPnL: 1000,
    unrealizedPnLPercentage: 8.33,
    priceStatus: 'live',
    sourceUrl: '/currency',
  },
];

async function setupPortfolioMocks(page) {
  // Summary endpoint with globbing
  await page.route('**/api/portfolio/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PORTFOLIO_SUMMARY),
    });
  });

  // Holdings endpoint with globbing
  await page.route('**/api/portfolio/holdings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: MOCK_PORTFOLIO_HOLDINGS,
        total: MOCK_PORTFOLIO_HOLDINGS.length,
      }),
    });
  });

  // Allocation endpoint with globbing
  await page.route('**/api/portfolio/allocation**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        allocations: MOCK_PORTFOLIO_ALLOCATIONS,
        totalInvested: MOCK_PORTFOLIO_SUMMARY.totalInvested,
        totalCurrentValue: MOCK_PORTFOLIO_SUMMARY.totalCurrentValue,
      }),
    });
  });
}

module.exports = {
  MOCK_PORTFOLIO_SUMMARY,
  MOCK_PORTFOLIO_ALLOCATIONS,
  MOCK_PORTFOLIO_HOLDINGS,
  setupPortfolioMocks,
};
