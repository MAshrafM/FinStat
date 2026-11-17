// frontend/src/pages/expenditure/__tests__/BudgetsPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetsPage from '../BudgetsPage';
import * as budgetService from '../../../services/budgetService';
import { expectNoA11yViolations } from '../../../../tests/a11y/expectNoA11yViolations';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/expenditures/budgets' }),
}), { virtual: true });

jest.mock('../../../services/budgetService', () => ({
  getBudgetProgress: jest.fn(),
  createBudget: jest.fn(),
  updateBudget: jest.fn(),
  deleteBudget: jest.fn(),
}));

let mockCanModifyValue = true;
jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: mockCanModifyValue,
    isViewer: !mockCanModifyValue,
    isAdmin: mockCanModifyValue,
  }),
  useAuth: () => ({ user: { role: mockCanModifyValue ? 'admin' : 'viewer' } }),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), addToast: jest.fn() }),
}));

describe('UI Phase 4C: BudgetsPage Unit & Accessibility Tests', () => {
  const mockBudgetsProgress = [
    {
      budgetId: 'b1',
      category: 'Groceries',
      period: 'monthly',
      year: 2026,
      month: 11,
      budgetedAmount: 5000,
      spentAmount: 3200,
      remainingAmount: 1800,
      percentageUsed: 64,
      alertThreshold: 80,
      alertStatus: 'status-ok',
      budget: {
        _id: 'b1',
        category: 'Groceries',
        period: 'monthly',
        year: 2026,
        month: 11,
        amount: 5000,
        alertThreshold: 80,
      },
    },
    {
      budgetId: 'b2',
      category: 'Dining Out',
      period: 'monthly',
      year: 2026,
      month: 11,
      budgetedAmount: 2000,
      spentAmount: 2200,
      remainingAmount: -200,
      percentageUsed: 110,
      alertThreshold: 80,
      alertStatus: 'status-danger',
      budget: {
        _id: 'b2',
        category: 'Dining Out',
        period: 'monthly',
        year: 2026,
        month: 11,
        amount: 2000,
        alertThreshold: 80,
      },
    },
  ];

  const mockPrevBudgetsProgress = [
    {
      budgetId: 'b-prev-1',
      category: 'Groceries',
      period: 'monthly',
      year: 2026,
      month: 10,
      budgetedAmount: 5000,
      spentAmount: 4800,
      remainingAmount: 200,
      percentageUsed: 96,
      alertThreshold: 80,
      alertStatus: 'status-warn',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModifyValue = true;
    budgetService.getBudgetProgress.mockImplementation((filter) => {
      if (filter?.month === 10) {
        return Promise.resolve(mockPrevBudgetsProgress);
      }
      return Promise.resolve(mockBudgetsProgress);
    });
  });

  const renderComponent = () => {
    return render(<BudgetsPage />);
  };

  test('1. Renders PageHeader, subnav, KPI cards, and filter controls', async () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Budget vs. Actual Tracker', level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('set-budget-btn')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-allocated')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-spent')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-remaining-balance')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-burn-rate')).toBeInTheDocument();

    expect(await screen.findByTestId('budget-card-Groceries')).toBeInTheDocument();
    expect(screen.getByTestId('budget-card-Dining Out')).toBeInTheDocument();
  });

  test('2. Renders EmptyState when budgetsProgress is empty', async () => {
    budgetService.getBudgetProgress.mockResolvedValue([]);
    renderComponent();

    expect(await screen.findByText('No budgets found for this period')).toBeInTheDocument();
    expect(screen.getByTestId('empty-set-budget-btn')).toBeInTheDocument();
  });

  test('3. Renders Previous Month outcome table and badges', async () => {
    renderComponent();
    expect(await screen.findByTestId('budget-outcome-table')).toBeInTheDocument();
    expect(screen.getAllByText('Within Budget').length).toBeGreaterThanOrEqual(1);
  });

  test('4. Opens create budget modal and cancels cleanly', async () => {
    renderComponent();
    expect(await screen.findByTestId('budget-card-Groceries')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('set-budget-btn'));
    expect(screen.getByRole('heading', { name: 'Set Category Budget', level: 2 })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { name: 'Set Category Budget', level: 2 })).not.toBeInTheDocument();
  });

  test('5. Passes WCAG 2.1 AA accessibility audit with expectNoA11yViolations', async () => {
    const { container } = renderComponent();
    expect(await screen.findByTestId('budget-card-Groceries')).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });
});
