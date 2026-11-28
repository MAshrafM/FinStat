// frontend/src/pages/credit-cards/__tests__/CreditCardPage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CreditCardPage from '../CreditCardPage';
import * as creditCardService from '../../../services/creditCardService';
import * as currencyService from '../../../services/currencyService';
import * as AuthContext from '../../../context/AuthContext';
import * as CreditContext from '../../../context/CreditContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/creditCardService');
jest.mock('../../../services/currencyService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), addToast: jest.fn() }),
}));

const MOCK_CARDS = [
  { _id: 'card-1', name: 'CIB Titanium', bank: 'CIB', limit: 50000, billingCycleDay: 15 },
];

const MOCK_SUMMARY = {
  cardDetails: MOCK_CARDS[0],
  availableLimit: 41000,
  outstandingBalance: 9000,
  amountDueThisMonth: 3500,
  minimumPaymentDue: 500,
};

const MOCK_DUE = [
  {
    _id: 'tx-1',
    description: 'Carrefour Hypermarket',
    amountDue: 3500,
    type: 'Purchase',
    status: 'Due',
    date: '2026-01-10T00:00:00.000Z',
  },
];

const MOCK_HISTORY = [
  {
    _id: 'tx-1',
    description: 'Carrefour Hypermarket',
    amount: 3500,
    paidAmount: 0,
    amountDue: 3500,
    type: 'Purchase',
    status: 'Due',
    date: '2026-01-10T00:00:00.000Z',
  },
  {
    _id: 'tx-2',
    description: 'AWS Cloud Hosting',
    amount: 5050,
    paidAmount: 5050,
    amountDue: 0,
    foreignAmount: 100,
    currency: 'USD',
    type: 'Purchase',
    status: 'Paid',
    date: '2026-01-05T00:00:00.000Z',
  },
];

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/credit-cards']}>
      <CreditCardPage />
    </MemoryRouter>
  );

describe('CreditCardPage (Phase 9A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: true,
      isViewer: false,
      isAdmin: true,
      isManager: false,
      role: 'admin',
    });
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'admin', name: 'Admin User' },
      isAuthenticated: true,
      isAdmin: true,
    });
    jest.spyOn(CreditContext, 'useCreditData').mockReturnValue({
      creditCardsSummary: {
        totalAvailable: 41000,
        totalOutstanding: 9000,
        totalDueThisMonth: 3500,
      },
      refetchCreditSummary: jest.fn(),
    });

    creditCardService.getCards.mockResolvedValue(MOCK_CARDS);
    creditCardService.getCardSummary.mockResolvedValue(MOCK_SUMMARY);
    creditCardService.getDueTransactions.mockResolvedValue(MOCK_DUE);
    creditCardService.getTransactions.mockResolvedValue(MOCK_HISTORY);
    creditCardService.getUtilization.mockResolvedValue({
      overallUtilization: 18,
      totalBalance: 9000,
      totalLimit: 50000,
      hasAlerts: false,
      cards: [
        {
          cardId: 'card-1',
          cardName: 'CIB Titanium',
          utilization: 18,
          currentBalance: 9000,
          limit: 50000,
          threshold: 30,
          isAlert: false,
        },
      ],
    });
    creditCardService.makeFullPayment.mockResolvedValue({ message: 'Paid' });
    creditCardService.deleteTransaction.mockResolvedValue({ message: 'Deleted' });
    currencyService.getCurrencyPrice.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    creditCardService.getCards.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Loading credit card center/i)).toBeInTheDocument();
  });

  test('renders KPI summary strips, neutral badges, and tables with D19 mobile cards', async () => {
    const { container } = renderPage();

    expect(await screen.findByTestId('cc-due-mobile-cards')).toBeInTheDocument();
    expect(screen.getByText('Total Paid')).toBeInTheDocument();
    expect(screen.getByText('Total Available Credit')).toBeInTheDocument();
    expect(screen.getByTestId('cc-history-mobile-cards')).toBeInTheDocument();

    // Neutral status chips (no Due soon / Overdue / warning / negative badges)
    expect(screen.queryByText(/Due soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Overdue/i)).not.toBeInTheDocument();
    expect(container.querySelector('.fs-badge--warning')).toBeNull();
    expect(container.querySelector('.fs-badge--negative')).toBeNull();
  });

  test('switches card selector from All Cards to specific card', async () => {
    renderPage();
    await screen.findByTestId('cc-due-mobile-cards');

    fireEvent.change(screen.getByLabelText(/Select Card/i), { target: { value: 'card-1' } });
    await waitFor(() => {
      expect(creditCardService.getCardSummary).toHaveBeenCalledWith('card-1');
    });
  });

  test('expands D19 mobile cards cleanly', async () => {
    renderPage();
    await screen.findByTestId('cc-due-mobile-cards');

    const expandBtn = screen.getByRole('button', {
      name: /Show due details for Carrefour Hypermarket/i,
    });
    fireEvent.click(expandBtn);
    expect(
      screen.getByRole('button', { name: /Hide due details for Carrefour Hypermarket/i })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('opens Add New Card modal and Edit Card modal', async () => {
    renderPage();
    await screen.findByTestId('cc-due-mobile-cards');

    fireEvent.click(screen.getByRole('button', { name: /Add New Card/i }));
    expect(screen.getByText('Add New Credit Card')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    fireEvent.change(screen.getByLabelText(/Select Card/i), { target: { value: 'card-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Edit Card/i }));
    expect(screen.getByText('Edit Credit Card Details')).toBeInTheDocument();
  });

  test('opens ConfirmModal on full payment and delete', async () => {
    renderPage();
    await screen.findByTestId('cc-due-mobile-cards');

    const payBtns = screen.getAllByRole('button', { name: 'Pay Carrefour Hypermarket in full' });
    fireEvent.click(payBtns[0]);
    expect(screen.getByText('Mark as Fully Paid')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay Full' }));
    await waitFor(() => {
      expect(creditCardService.makeFullPayment).toHaveBeenCalled();
    });

    const delBtns = screen.getAllByRole('button', { name: 'Delete transaction Carrefour Hypermarket' });
    fireEvent.click(delBtns[0]);
    expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/i }));
    await waitFor(() => {
      expect(creditCardService.deleteTransaction).toHaveBeenCalledWith('tx-1');
    });
  });

  test('viewer role disables ProtectedAction and blocks all 4 useCanModify handler guards', async () => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: false,
      isViewer: true,
      isAdmin: false,
      isManager: false,
      role: 'viewer',
    });
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'viewer', name: 'Viewer User' },
      isAuthenticated: true,
      isAdmin: false,
    });

    renderPage();
    await screen.findByTestId('cc-due-mobile-cards');

    const payBtn = screen.getAllByRole('button', { name: 'Pay Carrefour Hypermarket in full' })[0];
    const partialBtn = screen.getAllByRole('button', {
      name: 'Make partial payment for Carrefour Hypermarket',
    })[0];
    const editBtn = screen.getAllByRole('button', { name: 'Edit transaction Carrefour Hypermarket' })[0];
    const delBtn = screen.getAllByRole('button', { name: 'Delete transaction Carrefour Hypermarket' })[0];

    expect(payBtn).toBeDisabled();
    expect(partialBtn).toBeDisabled();
    expect(editBtn).toBeDisabled();
    expect(delBtn).toBeDisabled();

    fireEvent.click(payBtn);
    fireEvent.click(partialBtn);
    fireEvent.click(editBtn);
    fireEvent.click(delBtn);

    expect(screen.queryByText('Mark as Fully Paid')).not.toBeInTheDocument();
    expect(screen.queryByText('Log Card Payment / Settlement')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Transaction')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument();
    expect(creditCardService.makeFullPayment).not.toHaveBeenCalled();
    expect(creditCardService.deleteTransaction).not.toHaveBeenCalled();
  });

  test('renders empty state when no cards exist', async () => {
    creditCardService.getCards.mockResolvedValueOnce([]);
    creditCardService.getUtilization.mockResolvedValueOnce({ cards: [] });
    renderPage();

    expect(await screen.findByText('No Credit Cards Found')).toBeInTheDocument();
  });

  test('renders fetch error card with Retry recovery', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    creditCardService.getCards.mockRejectedValueOnce(new Error('Network down'));

    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Network down/i);

    creditCardService.getCards.mockResolvedValueOnce(MOCK_CARDS);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(await screen.findByText('Due Transactions')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  test('renders zero inline [style] attributes', async () => {
    const { container } = renderPage();
    await screen.findByText('Credit Card Center');
    expect(container.querySelectorAll('[style]').length).toBe(0);
  });

  test('passes jest-axe with zero violations', async () => {
    const { container } = renderPage();
    await screen.findByText('Credit Card Center');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
