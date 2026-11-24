// frontend/tests/visual/fixtures/corporateActionsMocks.js
/**
 * Deterministic API mock fixtures for Corporate Actions subsystem.
 * Phase 7B: Corporate Actions Registry & Corporate Action Wizard.
 */

const { setupTradesMocks } = require('./tradesMocks');

const MOCK_CORPORATE_ACTIONS = [
  {
    _id: 'ca-001',
    stockCode: 'COMI',
    broker: 'Thndr',
    type: 'split',
    ratio: 2,
    effectiveDate: '2026-01-15T00:00:00.000Z',
    notes: '2:1 Stock Split approved by EGX',
  },
  {
    _id: 'ca-002',
    stockCode: 'AMOC',
    broker: 'Hermes',
    type: 'bonus',
    ratio: 0.1,
    effectiveDate: '2026-01-10T00:00:00.000Z',
    notes: '10% Bonus Share Distribution',
  },
];

/**
 * Intercept and fulfill corporate actions and related trading API calls deterministically.
 * @param {import('@playwright/test').Page} page
 */
async function setupCorporateActionsMocks(page) {
  // First set up trades mocks to ensure DataContext (open positions) is populated
  await setupTradesMocks(page);

  await page.route('**/api/corporate-actions**', async (route) => {
    const origin = route.request().headers().origin || 'http://localhost:3000';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, x-auth-token, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }

    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({
          data: MOCK_CORPORATE_ACTIONS,
          total: MOCK_CORPORATE_ACTIONS.length,
          page: 1,
          limit: 100,
        }),
      });
    }

    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Corporate action deleted' }),
      });
    }

    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: MOCK_CORPORATE_ACTIONS[0] }),
      });
    }

    return route.continue();
  });

  await page.route('**/api/trades/corporate-action/wizard**', async (route) => {
    const origin = route.request().headers().origin || 'http://localhost:3000';
    const headers = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, x-auth-token, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers });
    }

    return route.fulfill({
      status: 200,
      headers,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Corporate action wizard executed' }),
    });
  });
}

module.exports = {
  MOCK_CORPORATE_ACTIONS,
  setupCorporateActionsMocks,
};
