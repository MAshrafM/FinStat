// frontend/src/pages/credit-cards/__tests__/DebtPayoffPage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import DebtPayoffPage from '../DebtPayoffPage';
import * as debtPayoffService from '../../../services/debtPayoffService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/debtPayoffService', () => ({
  calculatePayoff: jest.fn(),
  savePlan: jest.fn(),
  getSavedPlans: jest.fn(),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: jest.fn(),
}));

jest.mock('../../../components/common/ProtectedAction', () => ({ children }) => <>{children}</>);

const MOCK_RESULT = {
  strategy: 'snowball',
  monthlyBudget: 2000,
  cards: [
    {
      cardId: 'card-1',
      name: 'CIB Titanium',
      balanceInPiastres: 900000,
      minimumPaymentInPiastres: 45000,
      apr: 24,
    },
  ],
  monthsToPayoff: 10,
  projectedPayoffDate: '2026-11-15T00:00:00.000Z',
  totalInterestPaidInPiastres: 269145,
  totalInterestSavedInPiastres: 142855,
  schedule: [
    {
      month: 1,
      cardName: 'CIB Titanium',
      paymentInPiastres: 155000,
      interestChargedInPiastres: 21000,
      remainingBalanceInPiastres: 766000,
    },
  ],
  comparison: {
    snowball: { monthsToPayoff: 10, totalInterestPaidInPiastres: 269145 },
    avalanche: { monthsToPayoff: 10, totalInterestPaidInPiastres: 258412 },
    minimumOnly: { monthsToPayoff: 18, totalInterestPaidInPiastres: 412000 },
  },
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/credit-cards/debt-payoff']}>
      <DebtPayoffPage />
    </MemoryRouter>
  );

describe('DebtPayoffPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AuthContext.useCanModify.mockReturnValue({ canModify: true, isViewer: false });
    debtPayoffService.getSavedPlans.mockResolvedValue([]);
    debtPayoffService.calculatePayoff.mockResolvedValue(MOCK_RESULT);
    debtPayoffService.savePlan.mockResolvedValue({ _id: 'plan-1' });
  });

  test('renders KPIs, strategy toggle, comparison table, schedule, and zero inline styles', async () => {
    const { container } = renderPage();
    expect(await screen.findByText('Strategy Comparison vs. Minimum Baseline')).toBeInTheDocument();

    const snowballBtn = screen.getByRole('button', { name: /Debt Snowball/i });
    const avalancheBtn = screen.getByRole('button', { name: /Debt Avalanche/i });
    expect(snowballBtn).toHaveAttribute('aria-pressed', 'true');
    expect(avalancheBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(avalancheBtn);
    await waitFor(() =>
      expect(debtPayoffService.calculatePayoff).toHaveBeenCalledWith({
        strategy: 'avalanche',
        monthlyBudget: 2000,
      })
    );

    fireEvent.click(await screen.findByRole('button', { name: /Show All 10 Months/i }));
    expect(screen.getAllByText('Month 1').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelectorAll('[style]').length).toBe(0);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('blocks savePlan for viewer role via scoped useCanModify destructuring (I4)', async () => {
    AuthContext.useCanModify.mockReturnValue({ canModify: false, isViewer: true });
    renderPage();
    const saveBtn = await screen.findByRole('button', { name: /Save As Active Plan/i });
    fireEvent.click(saveBtn);
    expect(debtPayoffService.savePlan).not.toHaveBeenCalled();
  });

  test('allows saving active plan when canModify is true', async () => {
    renderPage();
    const saveBtn = await screen.findByRole('button', { name: /Save As Active Plan/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(debtPayoffService.savePlan).toHaveBeenCalledTimes(1));
  });
});
