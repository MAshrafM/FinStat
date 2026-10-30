// frontend/src/config/dashboardActions.js
// Central catalog of dashboard launcher actions. Keeping this in one place
// lets the hero, quick-launch grid and command palette stay in sync.
import {
  FaRegListAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaChartPie,
  FaGem,
  FaHome,
  FaUniversity,
  FaExchangeAlt,
  FaUserTie,
  FaMagic,
  FaChartBar,
  FaCalendarAlt,
  FaBookOpen,
  FaBook,
  FaBalanceScale,
  FaBullseye,
  FaRedo,
  FaCreditCard,
  FaPassport,
  FaBuilding,
  FaCompass,
} from 'react-icons/fa';

export const CREATE_ACTION_GROUPS = [
  {
    id: 'income',
    label: 'Income & payroll',
    tone: 'emerald',
    actions: [
      {
        key: 'paycheck',
        label: 'Log Paycheck',
        description: 'Record a new salary payment',
        path: '/salary/paychecks/new',
        icon: FaRegListAlt,
      },
      {
        key: 'salary',
        label: 'Update Salary',
        description: 'Adjust your salary profile',
        path: '/salary-profile/update',
        icon: FaUserTie,
      },
      {
        key: 'certificate',
        label: 'Add Certificate',
        description: 'Track a fixed-income deposit',
        path: '/certificates/new',
        icon: FaUniversity,
      },
      {
        key: 'currency',
        label: 'Add Currency',
        description: 'Add to your forex wallet',
        path: '/currency/new',
        icon: FaExchangeAlt,
      },
    ],
  },
  {
    id: 'spending',
    label: 'Spending',
    tone: 'rose',
    actions: [
      {
        key: 'expense',
        label: 'Add Expense',
        description: 'Log a day-to-day transaction',
        path: '/expenditures/new',
        icon: FaMoneyBillWave,
      },
      {
        key: 'recurring',
        label: 'Review Recurring',
        description: 'Confirm detected subscriptions',
        path: '/expenditures/recurring',
        icon: FaRedo,
      },
      {
        key: 'budget',
        label: 'Set Budgets',
        description: 'Plan spending by category',
        path: '/expenditures/budgets',
        icon: FaBullseye,
      },
    ],
  },
  {
    id: 'investments',
    label: 'Investments',
    tone: 'sky',
    actions: [
      {
        key: 'trade',
        label: 'New Trade',
        description: 'Buy, sell or record a dividend',
        path: '/trades/add',
        icon: FaChartLine,
      },
      {
        key: 'fund',
        label: 'Add Mutual Fund',
        description: 'Log a fund purchase',
        path: '/mutual-funds/new',
        icon: FaChartPie,
      },
      {
        key: 'gold',
        label: 'Add Gold',
        description: 'Record a gold purchase',
        path: '/gold-wallet/new',
        icon: FaGem,
      },
      {
        key: 'corporate-action',
        label: 'Corporate Action',
        description: 'Splits, bonuses and consolidations',
        path: '/corporate-actions/wizard',
        icon: FaMagic,
      },
    ],
  },
  {
    id: 'assets',
    label: 'Assets & property',
    tone: 'violet',
    actions: [
      {
        key: 'property',
        label: 'Add Property',
        description: 'Track a new real-estate asset',
        path: '/real-estate/new',
        icon: FaHome,
      },
    ],
  },
];

export const EXPLORE_ACTION_GROUPS = [
  {
    id: 'overview',
    label: 'Portfolio overview',
    tone: 'sky',
    actions: [
      {
        key: 'portfolio',
        label: 'Portfolio Analytics',
        description: 'Unified holdings and performance',
        path: '/portfolio',
        icon: FaChartPie,
      },
      {
        key: 'allocation',
        label: 'Asset Allocation',
        description: 'Weights, drift and rebalancing',
        path: '/portfolio/rebalancing',
        icon: FaCompass,
      },
      {
        key: 'certificates',
        label: 'Bank Certificates',
        description: 'Fixed-income deposits',
        path: '/certificates',
        icon: FaUniversity,
      },
      {
        key: 'currency',
        label: 'Currency Wallet',
        description: 'Foreign-currency holdings',
        path: '/currency',
        icon: FaPassport,
      },
      {
        key: 'property',
        label: 'Real Estate',
        description: 'Property portfolio and valuation',
        path: '/real-estate',
        icon: FaBuilding,
      },
    ],
  },
  {
    id: 'insights',
    label: 'Reports & insights',
    tone: 'violet',
    actions: [
      {
        key: 'payroll',
        label: 'Payroll Analytics',
        description: 'Income across calendar & fiscal cycles',
        path: '/analysis/payroll',
        icon: FaCalendarAlt,
      },
      {
        key: 'spending',
        label: 'Spending Analysis',
        description: 'Where your money goes',
        path: '/expenditure-analysis',
        icon: FaChartBar,
      },
      {
        key: 'budgets',
        label: 'Budget Tracker',
        description: 'Budget vs. actual by category',
        path: '/expenditures/budgets',
        icon: FaBullseye,
      },
      {
        key: 'trade-summary',
        label: 'Trade Summary',
        description: 'Aggregated trading results',
        path: '/trade-summary',
        icon: FaBookOpen,
      },
      {
        key: 'fund-summary',
        label: 'Fund Summary',
        description: 'Performance of your mutual funds',
        path: '/mutual-funds/summary',
        icon: FaBook,
      },
      {
        key: 'gold-summary',
        label: 'Gold Summary',
        description: 'Gold holdings and returns',
        path: '/gold-wallet/summary',
        icon: FaBalanceScale,
      },
      {
        key: 'recurring',
        label: 'Recurring Scanner',
        description: 'Subscriptions and repeat charges',
        path: '/expenditures/recurring',
        icon: FaRedo,
      },
      {
        key: 'credit',
        label: 'Credit & Debt',
        description: 'Statements, payoff and reconciliation',
        path: '/credit-cards',
        icon: FaCreditCard,
      },
    ],
  },
];

// The eight actions surfaced directly on the dashboard.
export const QUICK_LAUNCH_KEYS = [
  'paycheck',
  'expense',
  'trade',
  'fund',
  'gold',
  'property',
  'certificate',
  'currency',
];

export const QUICK_LAUNCH_ACTIONS = CREATE_ACTION_GROUPS
  .flatMap((group) => group.actions.map((action) => ({ ...action, tone: group.tone })))
  .filter((action) => QUICK_LAUNCH_KEYS.includes(action.key));

export const EXPLORE_LINKS = EXPLORE_ACTION_GROUPS.flatMap((group) =>
  group.actions.map((action) => ({ ...action, tone: group.tone }))
);
