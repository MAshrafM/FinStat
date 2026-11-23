// frontend/tests/visual/fixtures/rebalancingMocks.js
/**
 * Mock rebalancing and advisory fixtures for visual regression and a11y tests.
 * Phase 6B: deterministic allocation targets, current weights, and suggested trades.
 */

const MOCK_REBALANCING_DATA = {
  totalPortfolioValue: 582400,
  allocations: [
    {
      assetType: 'stocks',
      currentValue: 245000,
      currentPercentage: 42.1,
      targetPercentage: 40.0,
    },
    {
      assetType: 'gold',
      currentValue: 78000,
      currentPercentage: 13.4,
      targetPercentage: 20.0,
    },
    {
      assetType: 'mutualFunds',
      currentValue: 51000,
      currentPercentage: 8.8,
      targetPercentage: 20.0,
    },
    {
      assetType: 'certificates',
      currentValue: 32400,
      currentPercentage: 5.6,
      targetPercentage: 10.0,
    },
    {
      assetType: 'cash',
      currentValue: 18000,
      currentPercentage: 3.1,
      targetPercentage: 10.0,
    },
  ],
  target: {
    name: 'Balanced Growth Strategy',
    excludeRealEstate: true,
    targets: [
      { assetType: 'stocks', percentage: 40 },
      { assetType: 'gold', percentage: 20 },
      { assetType: 'mutualFunds', percentage: 20 },
      { assetType: 'certificates', percentage: 10 },
      { assetType: 'cash', percentage: 10 },
    ],
  },
  suggestions: [
    {
      assetType: 'gold',
      action: 'Buy',
      amount: 38480,
      currentPercentage: 13.4,
      targetPercentage: 20.0,
      description: 'Under-allocated by 6.6%. Acquire EGP 38,480 worth of gold bullion.',
    },
    {
      assetType: 'mutualFunds',
      action: 'Buy',
      amount: 65480,
      currentPercentage: 8.8,
      targetPercentage: 20.0,
      description: 'Under-allocated by 11.2%. Invest EGP 65,480 in index mutual funds.',
    },
    {
      assetType: 'stocks',
      action: 'Sell',
      amount: 12040,
      currentPercentage: 42.1,
      targetPercentage: 40.0,
      description: 'Over-allocated by 2.1%. Trim equities by EGP 12,040.',
    },
    {
      assetType: 'certificates',
      action: 'Hold',
      amount: 0,
      currentPercentage: 5.6,
      targetPercentage: 10.0,
      description: 'Certificate maturity pending; held within tolerance.',
    },
  ],
};

async function setupRebalancingMocks(page) {
  await page.route('**/api/portfolio/rebalancing**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: MOCK_REBALANCING_DATA,
      }),
    });
  });
}

module.exports = {
  MOCK_REBALANCING_DATA,
  setupRebalancingMocks,
};
