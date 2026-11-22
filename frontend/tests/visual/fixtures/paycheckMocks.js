// frontend/tests/visual/fixtures/paycheckMocks.js
/**
 * Mock paycheck and payroll profile data fixture for visual regression and a11y test suites.
 * UI Phase 5E: Populates payroll routes with representative multi-year,
 * multi-disbursement, multi-component, history, and simulation records.
 */

const MOCK_PAYCHECKS = [
  {
    _id: 'pc-visual-1',
    period: '2025-01',
    month: '2025-01',
    amount: 11950,
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
    month: '2025-01',
    amount: 4500,
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
    month: '2024-12',
    amount: 9000,
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
    month: '2024-11',
    amount: 11200,
    disbursementType: 'Regular',
    netPay: 11200,
    grossSalary: 14000,
    payDate: '2024-11-25T12:00:00.000Z',
    insuranceDetails: { actualEmployeeShare: 1400 },
    taxDetails: { actualTax: 1400 },
    type: 'Prepaid',
  },
];

const MOCK_PROFILE = {
  _id: 'prof-visual-1',
  name: 'Ahmed Hassan',
  title: 'Principal Software Engineer',
  position: 'Core Architecture',
  year: 2026,
  effectiveDate: '2026-01-01T00:00:00.000Z',
  monthlyGrossEstimate: 50000,
  components: [
    { name: 'Basic Salary', category: 'basic', type: 'fixed', value: 35000, calculationBasis: 'gross', isTaxable: true, isInsurable: true, isActive: true },
    { name: 'Housing Allowance', category: 'allowance', type: 'fixed', value: 10000, calculationBasis: 'gross', isTaxable: true, isInsurable: false, isActive: true },
    { name: 'Transport Allowance', category: 'allowance', type: 'fixed', value: 5000, calculationBasis: 'gross', isTaxable: false, isInsurable: false, isActive: true },
  ],
  salaryHistory: [
    {
      _id: 'hist-visual-1',
      effectiveDate: '2026-01-01T00:00:00.000Z',
      basicSalary: 35000,
      basicProduction: 5000,
      variables: 3000,
      environment: 2000,
      meal: 1500,
      shift: 1000,
      supervising: 2500,
      others: 1000,
      prepaid: 0,
      bonds: 500,
    },
    {
      _id: 'hist-visual-2',
      effectiveDate: '2025-01-01T00:00:00.000Z',
      basicSalary: 30000,
      basicProduction: 4000,
      variables: 2500,
      environment: 2000,
      meal: 1200,
      shift: 800,
      supervising: 2000,
      others: 500,
      prepaid: 0,
      bonds: 0,
    },
  ],
};

const MOCK_SIMULATION = {
  success: true,
  appliedYear: 2024,
  isFallbackConfig: false,
  effectiveTaxRate: 14.42,
  marginalTaxRate: 20,
  netToGrossRatio: 81.57,
  monthly: {
    grossSalary: 35000,
    employeeSI: 1386,
    personalExemption: 1666.67,
    netTaxableBase: 31947.33,
    incomeTax: 5046.83,
    martyrsFund: 17.5,
    totalDeductions: 6450.33,
    netPay: 28549.67,
    employerSI: 2362.5,
    totalEmployerCost: 37362.5,
  },
  annual: {
    grossSalary: 420000,
    employeeSI: 16632,
    personalExemption: 20000,
    netTaxableBase: 383368,
    incomeTax: 60562,
    martyrsFund: 210,
    totalDeductions: 77404,
    netPay: 342596,
    employerSI: 28350,
    totalEmployerCost: 448350,
  },
  deductions: {
    socialInsurance: {
      employeeRate: 11,
      minCap: 2000,
      maxCap: 12600,
      isCapped: true,
      employeeMonthly: 1386,
      employerMonthly: 2362.5,
    },
    personalExemption: {
      annual: 20000,
      monthly: 1666.67,
    },
    martyrsFund: {
      rate: 0.0005,
      monthly: 17.5,
      annual: 210,
    },
  },
  bracketSlices: [
    { level: 1, bracket: '0 to 40,000', rate: 0, taxableAmount: 40000, tax: 0, isMatched: true },
    { level: 2, bracket: '40,001 to 55,000', rate: 10, taxableAmount: 15000, tax: 1500, isMatched: true },
    { level: 3, bracket: '55,001 to 70,000', rate: 15, taxableAmount: 15000, tax: 2250, isMatched: true },
    { level: 4, bracket: '70,001 to 200,000', rate: 17.5, taxableAmount: 130000, tax: 22750, isMatched: true },
  ],
};

async function setupPaycheckMocks(page, routeSlug = '') {
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
      body: JSON.stringify(MOCK_PAYCHECKS),
    });
  });

  await page.route('**/api/salary-profiles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/salary/profile**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // Only mock /api/salary-profile for Phase 5E routes to preserve Phase 5D paycheck form baselines
  if (
    routeSlug.startsWith('salary-profile-') ||
    routeSlug === 'analysis-payroll' ||
    routeSlug === 'salary-simulator'
  ) {
    await page.route(/\/api\/salary-profile($|\?)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PROFILE),
      });
    });
  }

  await page.route('**/api/tax-brackets/simulate**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: MOCK_SIMULATION }),
    });
  });

  await page.route('**/api/users/profile**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ salaryDeductionConfig: {} }),
    });
  });

  await page.route('**/api/paychecks/preview**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        netPay: 12000,
        grossSalary: 15000,
        expectedTax: 1500,
        expectedInsurance: 1500,
        martyrsFund: 0,
        customDeductions: 0,
      }),
    });
  });

  await page.route('**/api/paychecks/1**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        _id: '1',
        period: '2025-01',
        disbursementType: 'Regular',
        grossSalary: 15000,
        netPay: 12000,
        payDate: '2025-01-25T12:00:00.000Z',
        type: 'Cash',
      }),
    });
  });
}

module.exports = { MOCK_PAYCHECKS, MOCK_PROFILE, MOCK_SIMULATION, setupPaycheckMocks };
