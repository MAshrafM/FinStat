// frontend/tests/visual/fixtures/tradesMocks.js
/**
 * Deterministic API mock fixtures for Stock Trading subsystem.
 * Phase 7A: Trade Log, Add Trade, Edit Trade, Trade Summary.
 */

const MOCK_TRADES = [
  {
    _id: 'trade-001',
    date: '2026-01-14T10:30:00Z',
    broker: 'Thndr',
    type: 'Buy',
    stockCode: 'COMI.CA',
    shares: 200,
    price: 82.50,
    fees: 25.00,
    totalValue: 16525.00,
    iteration: 1,
  },
  {
    _id: 'trade-002',
    date: '2026-01-12T14:15:00Z',
    broker: 'EFG',
    type: 'Sell',
    stockCode: 'FWRY.CA',
    shares: 1000,
    price: 9.80,
    fees: 18.50,
    totalValue: 9781.50,
    iteration: 2,
  },
  {
    _id: 'trade-003',
    date: '2026-01-08T09:00:00Z',
    broker: 'Thndr',
    type: 'TopUp',
    stockCode: null,
    shares: null,
    price: null,
    fees: 0,
    totalValue: 50000.00,
    iteration: null,
  },
  {
    _id: 'trade-004',
    date: '2026-01-05T11:45:00Z',
    broker: 'Thndr',
    type: 'Dividend',
    stockCode: 'EAST.CA',
    shares: 0,
    price: 0,
    fees: 0,
    totalValue: 1250.00,
    iteration: null,
  },
];

const MOCK_SINGLE_TRADE = {
  _id: '1',
  date: '2026-01-10T10:00:00Z',
  broker: 'Thndr',
  type: 'Buy',
  stockCode: 'COMI.CA',
  shares: 350,
  price: 78.20,
  fees: 32.00,
  totalValue: 27402.00,
  iteration: 1,
};

const MOCK_OPEN_POSITIONS = [
  {
    _id: { stockCode: 'COMI.CA', broker: 'Thndr', iteration: 1 },
    currentShares: 500,
    averageBuyPrice: 75.50,
    avgPrice: 75.50,
    adjustedAvgPrice: 75.80,
    netBreakEvenPrice: 75.80,
    totDeals: 37750,
    netCashFlow: 37750,
    realizedPL: 37750,
    totalRealizedReturn: 0,
    unrealizedPL: 3500,
    breakEvenPrice: 75.80,
    netBreakEven: 75.80,
    breakEvenTarget: 90.96,
    targetPrice: 90.60,
    targetSell: 90.96,
    totalValueNow: 41250,
    changeNow: 9.27,
    totalFees: 65,
    tradeCount: 3,
    firstTradeDate: '2025-11-10T00:00:00Z',
    lastTradeDate: '2026-01-14T00:00:00Z',
  },
  {
    _id: { stockCode: 'FWRY.CA', broker: 'EFG', iteration: 2 },
    currentShares: 1500,
    averageBuyPrice: 8.20,
    avgPrice: 8.20,
    adjustedAvgPrice: 8.25,
    netBreakEvenPrice: -500,
    totDeals: 12300,
    netCashFlow: 12300,
    realizedPL: 12300,
    totalRealizedReturn: 0,
    unrealizedPL: 2400,
    breakEvenPrice: 8.25,
    netBreakEven: -500,
    breakEvenTarget: 9.90,
    targetPrice: 9.84,
    targetSell: 9.90,
    totalValueNow: 14700,
    changeNow: 19.51,
    totalFees: 45,
    tradeCount: 4,
    firstTradeDate: '2025-10-01T00:00:00Z',
    lastTradeDate: '2026-01-12T00:00:00Z',
  },
];

const MOCK_CLOSED_POSITIONS = [
  {
    _id: { stockCode: 'EAST.CA', broker: 'Thndr', iteration: 1 },
    currentShares: 0,
    tradingPL: 4850,
    dividendIncome: 1250,
    totalRealizedReturn: 6100,
    profitPercentage: 15.25,
    sellingPrice: 32.50,
    totalBuyValue: 40000,
    totalSellValue: 44850,
    totalFees: 120,
    tradeCount: 6,
    firstTradeDate: '2025-06-15T00:00:00Z',
    lastTradeDate: '2025-12-20T00:00:00Z',
  },
];

const MOCK_MARKET_PRICES = [
  { stockCode: 'COMI.CA', price: 82.50 },
  { stockCode: 'FWRY.CA', price: 9.80 },
  { stockCode: 'EAST.CA', price: 33.10 },
];

const MOCK_SUMMARY_METRICS = {
  netDeposits: 150000,
  totalTrades: 12,
  totalTradesNow: 55950,
  walletBalance: 42350,
  realizedProfit: 6100,
  totalProfitNow: 11500,
  brokerMetrics: {
    Thndr: {
      netDeposits: 100000,
      totalTradesNow: 41250,
      walletBalance: 28500,
      profitPercentage: 12.45,
    },
    EFG: {
      netDeposits: 50000,
      totalTradesNow: 14700,
      walletBalance: 13850,
      profitPercentage: 8.15,
    },
  },
};

async function setupTradesMocks(page, routeSlug) {
  await page.route(/\/api\/trades/, async (route) => {
    const origin = route.request().headers().origin || 'http://localhost:3000';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-auth-token, Authorization',
    };

    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }

    const url = route.request().url();

    if (url.includes('/api/trades/summary')) {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify([...MOCK_OPEN_POSITIONS, ...MOCK_CLOSED_POSITIONS]),
      });
    }

    if (url.includes('/api/trades/market-prices')) {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MARKET_PRICES),
      });
    }

    if (url.includes('/api/trades/all')) {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TRADES),
      });
    }

    if (/\/api\/trades\/1(\?.*)?$/.test(url)) {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SINGLE_TRADE),
      });
    }

    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_TRADES,
          totalPages: 1,
          totalCount: MOCK_TRADES.length,
        }),
      });
    }

    return route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

module.exports = {
  MOCK_TRADES,
  MOCK_SINGLE_TRADE,
  MOCK_OPEN_POSITIONS,
  MOCK_CLOSED_POSITIONS,
  MOCK_MARKET_PRICES,
  MOCK_SUMMARY_METRICS,
  setupTradesMocks,
};
