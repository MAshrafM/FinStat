/**
 * frontend/tests/visual/fixtures/routes.js
 *
 * All 65 rendering routes from App.js per UI-UX-PLAN.md §5 & §6.3.
 * Each route resolves to a concrete path and unique slug.
 */

const RAW_ROUTES = [
  { path: '*', slug: 'not-found', label: '404 Page' },
  { path: '/dashboard', slug: 'dashboard', label: 'Dashboard Summary' },
  { path: '/portfolio', slug: 'portfolio', label: 'Portfolio Overview' },
  { path: '/portfolio/rebalancing', slug: 'portfolio-rebalancing', label: 'Portfolio Rebalancing' },
  { path: '/reports/financial', slug: 'reports-financial', label: 'Comprehensive Financial Report' },
  { path: '/profile', slug: 'profile', label: 'User Profile' },
  { path: '/settings', slug: 'settings', label: 'Application Settings' },
  { path: '/settings/recycle-bin', slug: 'settings-recycle-bin', label: 'Recycle Bin' },
  { path: '/security', slug: 'security', label: 'Security & 2FA Settings' },
  { path: '/corporate-actions', slug: 'corporate-actions', label: 'Corporate Actions Log' },
  { path: '/corporate-actions/wizard', slug: 'corporate-actions-wizard', label: 'Corporate Action Wizard' },
  { path: '/admin', slug: 'admin', label: 'Admin Hub' },
  { path: '/admin/tax-brackets', slug: 'admin-tax-brackets', label: 'Tax Brackets Admin' },
  { path: '/admin/social-insurance', slug: 'admin-social-insurance', label: 'Social Insurance Admin' },
  { path: '/admin/backup', slug: 'admin-backup', label: 'Database Backup & Restore' },
  { path: '/salary/profiles', slug: 'salary-profiles', label: 'Salary Profiles' },
  { path: '/salary-profile/history', slug: 'salary-profile-history', label: 'Salary Profile History' },
  { path: '/salary-profile/edit', slug: 'salary-profile-edit', label: 'Salary Profile Edit' },
  { path: '/salary-profile/history/edit/:historyId', slug: 'salary-profile-history-edit', label: 'Salary History Item Edit' },
  { path: '/salary-profile/update', slug: 'salary-profile-update', label: 'Salary Profile Update' },
  { path: '/salary/paychecks', slug: 'salary-paychecks', label: 'Paycheck Log' },
  { path: '/salary/paychecks/new', slug: 'salary-paychecks-new', label: 'New Paycheck Form' },
  { path: '/salary/paychecks/edit/:id', slug: 'salary-paychecks-edit', label: 'Edit Paycheck Form' },
  { path: '/analysis/payroll', slug: 'analysis-payroll', label: 'Payroll Analytics' },
  { path: '/salary/rules', slug: 'salary-rules', label: 'Payroll Rules Hub' },
  { path: '/salary/simulator', slug: 'salary-simulator', label: 'Statutory Tax Simulator' },
  { path: '/expenditures', slug: 'expenditures', label: 'Expenditures Log' },
  { path: '/expenditures/new', slug: 'expenditures-new', label: 'New Expenditure Form' },
  { path: '/expenditures/edit/:id', slug: 'expenditures-edit', label: 'Edit Expenditure Form' },
  { path: '/expenditures/rules', slug: 'expenditures-rules', label: 'Expenditure Categorization Rules' },
  { path: '/expenditures/budgets', slug: 'expenditures-budgets', label: 'Expenditure Budgets' },
  { path: '/expenditures/recurring', slug: 'expenditures-recurring', label: 'Recurring Expenditures' },
  { path: '/expenditures/bills', slug: 'expenditures-bills', label: 'Upcoming Bills' },
  { path: '/expenditure-analysis', slug: 'expenditure-analysis', label: 'Expenditure Analysis' },
  { path: '/trades', slug: 'trades', label: 'Trades Log' },
  { path: '/trades/add', slug: 'trades-add', label: 'Add Trade Form' },
  { path: '/trades/edit/:id', slug: 'trades-edit', label: 'Edit Trade Form' },
  { path: '/trade-summary', slug: 'trade-summary', label: 'Trade Performance Summary' },
  { path: '/mutual-funds', slug: 'mutual-funds', label: 'Mutual Funds Log' },
  { path: '/mutual-funds/new', slug: 'mutual-funds-new', label: 'New Mutual Fund Transaction' },
  { path: '/mutual-funds/edit/:id', slug: 'mutual-funds-edit', label: 'Edit Mutual Fund Transaction' },
  { path: '/mutual-funds/summary', slug: 'mutual-funds-summary', label: 'Mutual Funds Summary' },
  { path: '/gold-wallet', slug: 'gold-wallet', label: 'Gold Wallet' },
  { path: '/gold-wallet/new', slug: 'gold-wallet-new', label: 'New Gold Transaction' },
  { path: '/gold-wallet/edit/:id', slug: 'gold-wallet-edit', label: 'Edit Gold Transaction' },
  { path: '/gold-wallet/summary', slug: 'gold-wallet-summary', label: 'Gold Wallet Summary' },
  { path: '/analytics/purchasing-power', slug: 'analytics-purchasing-power', label: 'Purchasing Power Analytics' },
  { path: '/certificates', slug: 'certificates', label: 'Certificates of Deposit Log' },
  { path: '/certificates/:id', slug: 'certificates-detail', label: 'Certificate Detail View' },
  { path: '/certificates/new', slug: 'certificates-new', label: 'New Certificate Form' },
  { path: '/certificates/edit/:id', slug: 'certificates-edit', label: 'Edit Certificate Form' },
  { path: '/currency', slug: 'currency', label: 'Currency Holdings' },
  { path: '/currency/:id', slug: 'currency-detail', label: 'Currency Detail View' },
  { path: '/currency/new', slug: 'currency-new', label: 'New Currency Transaction' },
  { path: '/currency/edit/:id', slug: 'currency-edit', label: 'Edit Currency Transaction' },
  { path: '/real-estate', slug: 'real-estate', label: 'Real Estate Portfolio' },
  { path: '/real-estate/new', slug: 'real-estate-new', label: 'New Real Estate Property' },
  { path: '/real-estate/edit/:id', slug: 'real-estate-edit', label: 'Edit Real Estate Property' },
  { path: '/credit-cards', slug: 'credit-cards', label: 'Credit Cards Dashboard' },
  { path: '/credit-cards/statements', slug: 'credit-cards-statements', label: 'Credit Card Statements' },
  { path: '/credit-cards/debt-payoff', slug: 'credit-cards-debt-payoff', label: 'Debt Payoff Planner' },
  { path: '/credit-cards/reconcile', slug: 'credit-cards-reconcile', label: 'Credit Card Statement Reconciliation' },
  { path: '/lending', slug: 'lending', label: 'Peer-to-Peer Lending Dashboard' },
  { path: '/lending/persons/:id', slug: 'lending-person-detail', label: 'Lending Counterparty Detail' },
  { path: '/lending/loans/:id', slug: 'lending-loan-detail', label: 'Loan Detail View' },
];

function resolvePath(routePath) {
  if (routePath === '*') return '/non-existent-404-fallback';
  return routePath
    .replace(':id', '1')
    .replace(':historyId', '1');
}

const ROUTES = RAW_ROUTES.map((r) => ({
  ...r,
  resolvedPath: resolvePath(r.path),
}));

module.exports = {
  ROUTES,
  resolvePath,
};

