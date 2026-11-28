// frontend/tests/visual/fixtures/creditCardsMocks.js
/**
 * Deterministic Playwright network mocks for Phase 9A:
 *   /credit-cards ONLY (Phase 9B unthemed routes remain untouched).
 */

const MOCK_CARDS = [
  { _id: 'card-1', name: 'CIB Titanium', bank: 'CIB', limit: 50000, billingCycleDay: 15 },
  { _id: 'card-2', name: 'NBE Platinum', bank: 'NBE', limit: 20000, billingCycleDay: 20 },
  { _id: 'card-3', name: 'QNB Cashback', bank: 'QNB', limit: 10000, billingCycleDay: 5 },
];

const MOCK_UTILIZATION = {
  overallUtilization: 32.75,
  totalBalance: 26200,
  totalLimit: 80000,
  hasAlerts: true,
  cards: [
    {
      cardId: 'card-1',
      cardName: 'CIB Titanium',
      utilization: 18,
      currentBalance: 9000,
      limit: 50000,
      threshold: 30,
      isAlert: false,
    },
    {
      cardId: 'card-2',
      cardName: 'NBE Platinum',
      utilization: 45,
      currentBalance: 9000,
      limit: 20000,
      threshold: 30,
      isAlert: true,
    },
    {
      cardId: 'card-3',
      cardName: 'QNB Cashback',
      utilization: 82,
      currentBalance: 8200,
      limit: 10000,
      threshold: 30,
      isAlert: true,
    },
  ],
};

const MOCK_OVERALL_SUMMARY = {
  totalAvailable: 53800,
  totalOutstanding: 26200,
  totalDueThisMonth: 11200,
};

const MOCK_CARD_SUMMARIES = {
  'card-1': {
    cardDetails: MOCK_CARDS[0],
    availableLimit: 41000,
    outstandingBalance: 9000,
    amountDueThisMonth: 3500,
    minimumPaymentDue: 500,
  },
  'card-2': {
    cardDetails: MOCK_CARDS[1],
    availableLimit: 11000,
    outstandingBalance: 9000,
    amountDueThisMonth: 4200,
    minimumPaymentDue: 600,
  },
  'card-3': {
    cardDetails: MOCK_CARDS[2],
    availableLimit: 1800,
    outstandingBalance: 8200,
    amountDueThisMonth: 3500,
    minimumPaymentDue: 500,
  },
};

const MOCK_TRANSACTIONS_BY_CARD = {
  'card-1': [
    {
      _id: 'tx-1',
      card: 'card-1',
      description: 'Carrefour Hypermarket',
      category: 'Groceries',
      amount: 3500,
      paidAmount: 0,
      amountDue: 3500,
      currency: 'EGP',
      date: '2026-01-10T00:00:00.000Z',
      type: 'Purchase',
      status: 'Due',
    },
  ],
  'card-2': [
    {
      _id: 'tx-2',
      card: 'card-2',
      description: 'MacBook Pro Installment',
      category: 'Electronics',
      amount: 18000,
      paidAmount: 9000,
      amountDue: 3000,
      currency: 'EGP',
      date: '2025-10-15T00:00:00.000Z',
      type: 'Installment',
      status: 'Partial',
      monthlyPrincipal: 3000,
      cyclePaid: 0,
      installmentDetails: {
        months: 6,
        monthlyPrincipal: 3000,
        interest: 0,
      },
    },
  ],
  'card-3': [
    {
      _id: 'tx-3',
      card: 'card-3',
      description: 'AWS Cloud Hosting',
      category: 'Utilities',
      amount: 5050,
      foreignAmount: 100,
      exchangeRateSnapshot: 50.5,
      paidAmount: 5050,
      amountDue: 0,
      currency: 'USD',
      date: '2026-01-05T00:00:00.000Z',
      type: 'Purchase',
      status: 'Paid',
    },
  ],
};

const MOCK_CURRENCY_PRICES = [
  { currencyID: 'USD', buyRate: 50.3, sellRate: 50.5 },
  { currencyID: 'EUR', buyRate: 52.2, sellRate: 52.5 },
];

const getCorsHeaders = (request) => {
  const origin = request.headers().origin || 'http://localhost:3000';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
};

async function setupCreditCardsMocks(page) {
  await page.route(/\/api\/currency\/price(?:\?|$)/, async (route) => {
    const request = route.request();
    const corsHeaders = getCorsHeaders(request);
    if (request.method().toUpperCase() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify(MOCK_CURRENCY_PRICES),
    });
  });

  await page.route(/\/api\/credit-cards(?:\/|\?|$)/, async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const corsHeaders = getCorsHeaders(request);

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url());
    const pathname = url.pathname;
    const fulfillJson = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(body),
      });

    // Ordered specific endpoints before parameterized routes
    if (method === 'GET' && /\/api\/credit-cards\/utilization\/?$/.test(pathname)) {
      return fulfillJson(MOCK_UTILIZATION);
    }
    if (method === 'GET' && /\/api\/credit-cards\/overall-summary\/?$/.test(pathname)) {
      return fulfillJson(MOCK_OVERALL_SUMMARY);
    }
    if (method === 'POST' && /\/api\/credit-cards\/payments\/full\/?$/.test(pathname)) {
      const body = request.postDataJSON() || {};
      return fulfillJson({ message: 'Full payment recorded', ...body });
    }
    if (method === 'POST' && /\/api\/credit-cards\/payments\/partial\/?$/.test(pathname)) {
      const body = request.postDataJSON() || {};
      return fulfillJson({ message: 'Partial payment recorded', ...body });
    }

    const dueMatch = pathname.match(/\/api\/credit-cards\/transactions\/due\/([^/]+)\/?$/);
    if (method === 'GET' && dueMatch) {
      const list = (MOCK_TRANSACTIONS_BY_CARD[dueMatch[1]] || []).filter((t) => t.status !== 'Paid');
      return fulfillJson(list);
    }

    const summaryMatch = pathname.match(/\/api\/credit-cards\/summary\/([^/]+)\/?$/);
    if (method === 'GET' && summaryMatch) {
      return fulfillJson(MOCK_CARD_SUMMARIES[summaryMatch[1]] || MOCK_CARD_SUMMARIES['card-1']);
    }

    if (/\/api\/credit-cards\/cards\/?$/.test(pathname)) {
      if (method === 'GET') return fulfillJson(MOCK_CARDS);
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ _id: 'new-card-id', ...body }, 201);
      }
    }

    const cardIdMatch = pathname.match(/\/api\/credit-cards\/cards\/([^/]+)\/?$/);
    if (cardIdMatch) {
      const body = request.postDataJSON() || {};
      if (method === 'PUT') return fulfillJson({ _id: cardIdMatch[1], ...body });
      if (method === 'DELETE') return fulfillJson({ message: 'Card deleted', id: cardIdMatch[1] });
    }

    if (/\/api\/credit-cards\/transactions\/?$/.test(pathname) && method === 'POST') {
      const body = request.postDataJSON() || {};
      return fulfillJson({ _id: 'new-tx-id', ...body }, 201);
    }

    const txMatch = pathname.match(/\/api\/credit-cards\/transactions\/([^/]+)\/?$/);
    if (txMatch) {
      if (method === 'GET') return fulfillJson(MOCK_TRANSACTIONS_BY_CARD[txMatch[1]] || []);
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ _id: txMatch[1], ...body });
      }
      if (method === 'DELETE') return fulfillJson({ message: 'Transaction deleted', id: txMatch[1] });
    }

    if (/\/api\/credit-cards\/payments\/?$/.test(pathname) && method === 'POST') {
      const body = request.postDataJSON() || {};
      return fulfillJson({ _id: 'new-pay-id', ...body }, 201);
    }

    const payMatch = pathname.match(/\/api\/credit-cards\/payments\/([^/]+)\/?$/);
    if (payMatch) {
      if (method === 'GET') return fulfillJson([]);
      if (method === 'DELETE') return fulfillJson({ message: 'Payment deleted', id: payMatch[1] });
    }

    return route.continue();
  });
}

module.exports = {
  MOCK_CARDS,
  MOCK_UTILIZATION,
  MOCK_OVERALL_SUMMARY,
  setupCreditCardsMocks,
};
