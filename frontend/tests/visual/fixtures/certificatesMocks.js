// frontend/tests/visual/fixtures/certificatesMocks.js
/**
 * Deterministic Playwright network mocks for Phase 8B (/certificates) & Phase 8C (/certificates/:id, /new, /edit/:id).
 * Keeps GET /api/certificates (MOCK_CERTIFICATES) byte-identical for Phase 8B while supporting detail & accrual routes.
 */

const MOCK_CERTIFICATES = [
  {
    _id: 'cert-1',
    name: 'NBE Platinum 20%',
    amount: 100000,
    interest: 20,
    period: 12,
    payoutInterval: 'monthly',
    startDate: '2025-07-15T00:00:00.000Z',
    maturityDate: '2026-07-15T00:00:00.000Z',
    daysRemaining: 181,
    displayStatus: 'active',
    status: 'active',
    accruedInterest: 10000,
    periodicInterest: 1666.67,
    isPayoutDue: true,
    nextDuePayoutDate: '2026-01-15T00:00:00.000Z',
  },
  {
    _id: 'cert-2',
    name: 'Banque Misr 18.5%',
    amount: 50000,
    interest: 18.5,
    period: 12,
    payoutInterval: 'quarterly',
    startDate: '2025-02-01T00:00:00.000Z',
    maturityDate: '2026-02-01T00:00:00.000Z',
    daysRemaining: 17,
    displayStatus: 'maturing_soon',
    status: 'active',
    accruedInterest: 8800,
    periodicInterest: 2312.5,
    isPayoutDue: false,
  },
  {
    _id: 'cert-3',
    name: 'CIB Future Yield',
    amount: 75000,
    interest: 22,
    period: 24,
    payoutInterval: 'monthly',
    startDate: '2026-02-15T00:00:00.000Z',
    maturityDate: '2028-02-15T00:00:00.000Z',
    daysRemaining: 761,
    displayStatus: 'future',
    status: 'active',
    isPayoutDue: false,
  },
  {
    _id: 'cert-4',
    name: 'QNB Matured Bond',
    amount: 40000,
    interest: 16,
    period: 12,
    payoutInterval: 'semi-annual',
    startDate: '2024-01-01T00:00:00.000Z',
    maturityDate: '2025-01-01T00:00:00.000Z',
    daysRemaining: 0,
    displayStatus: 'matured',
    status: 'matured',
    accruedInterest: 6400,
    periodicInterest: 3200,
    isPayoutDue: false,
  },
  {
    _id: 'cert-5',
    name: 'AAIB Early Liquidated',
    amount: 30000,
    interest: 15,
    period: 12,
    payoutInterval: 'monthly',
    startDate: '2025-03-01T00:00:00.000Z',
    maturityDate: '2026-03-01T00:00:00.000Z',
    daysRemaining: 45,
    displayStatus: 'withdrawn',
    status: 'withdrawn',
    accruedInterest: 3100,
    isPayoutDue: false,
  },
];

const MOCK_CERTIFICATE_DETAIL = {
  _id: '1',
  name: 'NBE Platinum 20%',
  amount: 100000,
  interest: 20,
  period: 12,
  payoutInterval: 'monthly',
  startDate: '2025-07-15T00:00:00.000Z',
  lastPayoutDate: '2025-12-15T00:00:00.000Z',
  maturityDate: '2026-07-15T00:00:00.000Z',
  daysRemaining: 181,
  daysElapsed: 184,
  displayStatus: 'active',
  status: 'active',
  accruedInterest: 10000,
  totalInterestEarned: 15000,
  periodicInterest: 1666.67,
  isPayoutDue: true,
  nextDuePayoutDate: '2026-01-15T00:00:00.000Z',
  nextPayoutDate: '2026-02-15T00:00:00.000Z',
  sourceAccount: 'Bank',
  autoReinvest: false,
  trajectory: {
    labels: ['Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jul 2026'],
    actualSeries: [1667, 3333, 5000, 6667, 10000, null],
    projectedSeries: [1667, 3333, 5000, 6667, 8333, 20000],
  },
};

const MOCK_CERTIFICATE_ACCRUED = {
  accruedInterest: 10000,
  daysElapsed: 184,
  nextPayoutDate: '2026-02-15T00:00:00.000Z',
  totalEarned: 15000,
};

/**
 * Intercept and fulfill /api/certificates API calls deterministically.
 * @param {import('@playwright/test').Page} page
 */
async function setupCertificatesMocks(page) {
  await page.route(/\/api\/certificates(?:\/|\?|$)/, async (route) => {
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

    if (method === 'POST' && url.includes('/payout-due')) {
      return fulfillJson(200, {
        message: 'Processed 1 due payout(s) totaling 1666.67 EGP',
        processedCount: 1,
        totalDisbursedEgp: 1666.67,
      });
    }

    if (method === 'POST' && url.includes('/payout')) {
      return fulfillJson(200, { message: 'Interest payout processed successfully!' });
    }

    if (method === 'POST' && url.includes('/withdraw')) {
      return fulfillJson(200, { message: 'Certificate marked as withdrawn' });
    }

    if (method === 'DELETE') {
      return fulfillJson(200, { message: 'Certificate deleted successfully' });
    }

    if (method === 'POST' || method === 'PUT') {
      return fulfillJson(200, { success: true });
    }

    // Explicit GET ordering: /accrued-interest -> exact /:id detail -> exact /api/certificates list
    if (method === 'GET' && url.includes('/accrued-interest')) {
      return fulfillJson(200, MOCK_CERTIFICATE_ACCRUED);
    }

    if (method === 'GET' && /\/api\/certificates\/[^/?]+(?:\?.*)?$/.test(url)) {
      return fulfillJson(200, MOCK_CERTIFICATE_DETAIL);
    }

    return fulfillJson(200, MOCK_CERTIFICATES);
  });
}

module.exports = {
  MOCK_CERTIFICATES,
  MOCK_CERTIFICATE_DETAIL,
  MOCK_CERTIFICATE_ACCRUED,
  setupCertificatesMocks,
};
