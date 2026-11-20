// frontend/tests/visual/fixtures/paycheckMocks.js
/**
 * Mock paycheck data fixture for visual regression and a11y test suites.
 * UI Phase 5B: Populates /salary/paychecks with representative multi-year,
 * multi-disbursement, and multi-component records.
 */

const MOCK_PAYCHECKS = [
  {
    _id: 'pc-visual-1',
    period: '2025-01',
    disbursementType: 'Regular',
    netPay: 11950,
    grossSalary: 15000,
    payDate: '2025-01-25T12:00:00.000Z',
    insuranceDetails: { actualEmployeeShare: 1500 },
    taxDetails: { actualTax: 1500 },
    martyrsFund: 50,
    type: 'Cash',
    note: 'January standard payroll',
  },
  {
    _id: 'pc-visual-2',
    period: '2025-01',
    disbursementType: 'Sector Bonus',
    netPay: 4500,
    grossSalary: 5000,
    payDate: '2025-01-25T12:00:00.000Z',
    taxDetails: { actualTax: 500 },
    type: 'Cash',
    multiplier: 1,
  },
  {
    _id: 'pc-visual-3',
    period: '2024-12',
    disbursementType: 'End of Year Bonus',
    netPay: 9000,
    grossSalary: 10000,
    payDate: '2024-12-28T12:00:00.000Z',
    taxDetails: { actualTax: 1000 },
    type: 'Cash',
    note: 'Annual performance award',
  },
  {
    _id: 'pc-visual-4',
    period: '2024-11',
    disbursementType: 'Regular',
    netPay: 11200,
    grossSalary: 14000,
    payDate: '2024-11-25T12:00:00.000Z',
    insuranceDetails: { actualEmployeeShare: 1400 },
    taxDetails: { actualTax: 1400 },
    type: 'Prepaid',
  },
];

async function setupPaycheckMocks(page) {
  await page.route('**/api/paychecks/all**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAYCHECKS),
    });
  });

  await page.route('**/api/paychecks?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: MOCK_PAYCHECKS,
        total: MOCK_PAYCHECKS.length,
        totalPages: 1,
        page: 1,
      }),
    });
  });

  await page.route('**/api/paychecks', async (route) => {
    if (route.request().url().includes('?')) return;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: MOCK_PAYCHECKS,
        total: MOCK_PAYCHECKS.length,
        totalPages: 1,
        page: 1,
      }),
    });
  });
}

module.exports = { MOCK_PAYCHECKS, setupPaycheckMocks };
