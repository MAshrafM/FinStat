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

const MOCK_STATEMENT_CYCLES = {
  'card-1': {
    card: MOCK_CARDS[0],
    currentPeriod: {
      startDate: '2025-12-16T00:00:00.000Z',
      closeDate: '2026-01-15T00:00:00.000Z',
      endDate: '2026-01-15T00:00:00.000Z',
      dueDate: '2026-01-20T00:00:00.000Z',
      daysUntilClose: 4,
      daysUntilDue: 5,
      isOverdue: false,
    },
    cycles: [
      {
        startDate: '2025-12-16T00:00:00.000Z',
        closeDate: '2026-01-15T00:00:00.000Z',
        endDate: '2026-01-15T00:00:00.000Z',
      },
      {
        startDate: '2025-11-16T00:00:00.000Z',
        closeDate: '2025-12-15T00:00:00.000Z',
        endDate: '2025-12-15T00:00:00.000Z',
      },
    ],
    currentCycleData: {
      totalCharges: 21500,
      totalPayments: 9000,
      netCycleChange: 12500,
      transactions: [
        MOCK_TRANSACTIONS_BY_CARD['card-1'][0],
        MOCK_TRANSACTIONS_BY_CARD['card-2'][0],
      ],
      activeInstallments: [MOCK_TRANSACTIONS_BY_CARD['card-2'][0]],
      payments: [
        {
          _id: 'pay-1',
          date: '2026-01-08T00:00:00.000Z',
          amount: 9000,
          paymentSource: 'CIB Checking',
        },
      ],
    },
  },
  'card-2': {
    card: MOCK_CARDS[1],
    currentPeriod: {
      startDate: '2025-12-21T00:00:00.000Z',
      closeDate: '2026-01-20T00:00:00.000Z',
      endDate: '2026-01-20T00:00:00.000Z',
      dueDate: '2026-01-12T00:00:00.000Z',
      daysUntilClose: 5,
      daysUntilDue: -3,
      isOverdue: true,
    },
    cycles: [
      {
        startDate: '2025-12-21T00:00:00.000Z',
        closeDate: '2026-01-20T00:00:00.000Z',
        endDate: '2026-01-20T00:00:00.000Z',
      },
    ],
    currentCycleData: {
      totalCharges: 18000,
      totalPayments: 9000,
      netCycleChange: 9000,
      transactions: MOCK_TRANSACTIONS_BY_CARD['card-2'],
      activeInstallments: MOCK_TRANSACTIONS_BY_CARD['card-2'],
      payments: [],
    },
  },
  'card-3': {
    card: MOCK_CARDS[2],
    currentPeriod: {
      startDate: '2026-01-06T00:00:00.000Z',
      closeDate: '2026-02-05T00:00:00.000Z',
      endDate: '2026-02-05T00:00:00.000Z',
      dueDate: '2026-01-29T00:00:00.000Z',
      daysUntilClose: 21,
      daysUntilDue: 14,
      isOverdue: false,
    },
    cycles: [
      {
        startDate: '2026-01-06T00:00:00.000Z',
        closeDate: '2026-02-05T00:00:00.000Z',
        endDate: '2026-02-05T00:00:00.000Z',
      },
    ],
    currentCycleData: {
      totalCharges: 5050,
      totalPayments: 5050,
      netCycleChange: 0,
      transactions: MOCK_TRANSACTIONS_BY_CARD['card-3'],
      activeInstallments: [],
      payments: [],
    },
  },
};

const buildReconcileReport = (actualStatementBalance) => {
  const expectedBalance = 3500;
  const discrepancy = Number((actualStatementBalance - expectedBalance).toFixed(2));
  const isReconciled = Math.abs(discrepancy) < 0.01;
  return {
    isReconciled,
    discrepancy,
    analysis: isReconciled
      ? 'Statement matches logged charges and settlements.'
      : 'Bank statement differs from logged charges and settlements.',
    openingBalance: 0,
    totalTransactions: 3500,
    transactionCount: 1,
    totalPayments: 0,
    paymentCount: 0,
    expectedBalance,
    actualStatementBalance,
    transactions: MOCK_TRANSACTIONS_BY_CARD['card-1'],
    payments: [
      {
        _id: 'pay-1',
        date: '2026-01-08T00:00:00.000Z',
        paymentSource: 'CIB Checking',
        amount: 1500,
      },
    ],
  };
};

const buildDebtPayoffResult = (strategy = 'snowball', monthlyBudget = 2000) => {
  const isAvalanche = strategy === 'avalanche';
  const monthsToPayoff = 10;
  const totalInterestPaidInPiastres = isAvalanche ? 258412 : 269145;
  const minOnlyInterest = 412000;
  const totalInterestSavedInPiastres = minOnlyInterest - totalInterestPaidInPiastres;
  return {
    strategy,
    monthlyBudget,
    monthlyBudgetInPiastres: Math.round(monthlyBudget * 100),
    cards: [
      {
        cardId: 'card-1',
        name: 'CIB Titanium',
        balanceInPiastres: 900000,
        minimumPaymentInPiastres: 45000,
        apr: 24,
      },
      {
        cardId: 'card-2',
        name: 'NBE Platinum',
        balanceInPiastres: 900000,
        minimumPaymentInPiastres: 45000,
        apr: 28,
      },
    ],
    monthsToPayoff,
    projectedPayoffDate: '2026-11-15T00:00:00.000Z',
    totalInterestPaidInPiastres,
    totalInterestSavedInPiastres,
    schedule: [
      {
        month: 1,
        cardName: isAvalanche ? 'NBE Platinum' : 'CIB Titanium',
        paymentInPiastres: 155000,
        interestChargedInPiastres: 21000,
        remainingBalanceInPiastres: 766000,
      },
      {
        month: 2,
        cardName: isAvalanche ? 'NBE Platinum' : 'CIB Titanium',
        paymentInPiastres: 155000,
        interestChargedInPiastres: 17800,
        remainingBalanceInPiastres: 628800,
      },
    ],
    comparison: {
      snowball: {
        monthsToPayoff: 10,
        totalInterestPaidInPiastres: 269145,
        projectedPayoffDate: '2026-11-15T00:00:00.000Z',
      },
      avalanche: {
        monthsToPayoff: 10,
        totalInterestPaidInPiastres: 258412,
        projectedPayoffDate: '2026-11-15T00:00:00.000Z',
      },
      minimumOnly: {
        monthsToPayoff: 18,
        totalInterestPaidInPiastres: minOnlyInterest,
        projectedPayoffDate: '2027-07-15T00:00:00.000Z',
      },
    },
  };
};

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

    const cycleMatch = pathname.match(/\/api\/credit-cards\/statement-cycles\/([^/]+)\/?$/);
    if (method === 'GET' && cycleMatch) {
      return fulfillJson(MOCK_STATEMENT_CYCLES[cycleMatch[1]] || MOCK_STATEMENT_CYCLES['card-1']);
    }

    const reconcileMatch = pathname.match(/\/api\/credit-cards\/reconcile\/([^/]+)\/?$/);
    if (method === 'POST' && reconcileMatch) {
      const body = request.postDataJSON() || {};
      const actual = Number(body.actualStatementBalance ?? 3950);
      return fulfillJson(buildReconcileReport(actual));
    }

    return route.continue();
  });

  await page.route(/\/api\/debt-payoff(?:\/|\?|$)/, async (route) => {
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

    if (method === 'POST' && /\/api\/debt-payoff\/calculate\/?$/.test(pathname)) {
      const body = request.postDataJSON() || {};
      return fulfillJson(buildDebtPayoffResult(body.strategy || 'snowball', body.monthlyBudget || 2000));
    }
    if (/\/api\/debt-payoff\/plans\/?$/.test(pathname)) {
      if (method === 'GET') return fulfillJson([]);
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        return fulfillJson({ _id: 'plan-1', ...body }, 201);
      }
    }
    if (method === 'DELETE' && /\/api\/debt-payoff\/plans\/([^/]+)\/?$/.test(pathname)) {
      return fulfillJson({ message: 'Plan deleted' });
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
