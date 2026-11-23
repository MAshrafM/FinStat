// frontend/tests/visual/fixtures/reportsMocks.js
/**
 * Mock comprehensive financial report fixtures for visual regression and a11y tests.
 * Phase 6B: multi-module consolidated financial report mock endpoints.
 */

const MOCK_COMPREHENSIVE_REPORT = {
  meta: {
    userId: 'u-visual-test',
    startYear: 2024,
    endYear: 2026,
    generatedAt: '2026-11-23T12:00:00.000Z',
  },
  kpi: {
    netWorth: 582400,
    liquidAssets: 68000,
    investedAssets: 514400,
    totalLiabilities: 45000,
    totalGrossIncome: 420000,
    totalExpenses: 215000,
    savingsRate: 48.8,
    totalCapitalDeployed: 125000,
  },
  payroll: {
    totalGrossSalary: 420000,
    totalNetPay: 336000,
    totalTax: 54000,
    totalInsurance: 28800,
    totalMartyrsFund: 210,
    monthlyTrend: [
      { yearMonth: '2026-01', grossSalary: 35000, netPay: 28000, tax: 4500, insurance: 2400, martyrsFund: 17.5 },
      { yearMonth: '2026-02', grossSalary: 35000, netPay: 28000, tax: 4500, insurance: 2400, martyrsFund: 17.5 },
      { yearMonth: '2026-03', grossSalary: 35000, netPay: 28000, tax: 4500, insurance: 2400, martyrsFund: 17.5 },
    ],
  },
  expenditures: {
    totalSpent: 215000,
    spendByCategory: [
      { category: 'Housing & Utilities', totalSpent: 75000, count: 18 },
      { category: 'Groceries & Household', totalSpent: 48000, count: 42 },
      { category: 'Transportation', totalSpent: 22000, count: 15 },
      { category: 'Healthcare', totalSpent: 18000, count: 8 },
      { category: 'Leisure & Dining', totalSpent: 16000, count: 24 },
    ],
    monthlyTrend: [
      { yearMonth: '2026-01', totalSpent: 18000, count: 28 },
      { yearMonth: '2026-02', totalSpent: 17500, count: 31 },
      { yearMonth: '2026-03', totalSpent: 19200, count: 34 },
    ],
  },
  investments: {
    equities: { totalBuyValue: 180000, totalSellValue: 45000, realizedGains: 18500, dividendIncome: 4200 },
    mutualFunds: { totalSubscriptions: 40000, totalRedemptions: 0, realizedGains: 3200, couponIncome: 1500 },
    gold: { endHoldingGrams: 50, totalCost: 78000, periodBoughtGrams: 10, periodSoldGrams: 0 },
    certificates: { totalPrincipalHeld: 32400, estimatedAccruedInterest: 6400 },
    realEstate: { acquisitionCost: 120000, currentMarketValue: 155000 },
  },
  currency: {
    totalForexValuationEGP: 18000,
    periodCashFlow: 15000,
  },
  budget: {
    categories: [
      { category: 'Housing & Utilities', monthlyTarget: 25000, budgetedAmount: 75000, actualSpent: 72000, utilizationPercentage: 96 },
      { category: 'Groceries & Household', monthlyTarget: 16000, budgetedAmount: 48000, actualSpent: 46500, utilizationPercentage: 97 },
      { category: 'Transportation', monthlyTarget: 8000, budgetedAmount: 24000, actualSpent: 22000, utilizationPercentage: 92 },
    ],
  },
  loans: {
    totalBorrowed: 0,
    totalRepaid: 2000000,
    totalOutstanding: 2500000,
    topDebtors: [
      { personId: 'deb-1', personName: 'Tarek Ibrahim', balanceInPiastres: 1500000 },
      { personId: 'deb-2', personName: 'Nour El-Din', balanceInPiastres: 1000000 },
    ],
  },
};

async function setupReportsMocks(page) {
  await page.route('**/api/reports/comprehensive**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_COMPREHENSIVE_REPORT),
    });
  });
}

module.exports = {
  MOCK_COMPREHENSIVE_REPORT,
  setupReportsMocks,
};
