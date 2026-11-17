// frontend/src/pages/expenditure/__tests__/RecurringSuggestionsPage.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RecurringSuggestionsPage from '../RecurringSuggestionsPage';
import * as recurringService from '../../../services/recurringSuggestionService';
import * as expenditureService from '../../../services/expenditureService';
import { expectNoA11yViolations } from '../../../../tests/a11y/expectNoA11yViolations';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/expenditures/recurring' }),
}), { virtual: true });

jest.mock('../../../services/recurringSuggestionService', () => ({
  getRecurringSuggestions: jest.fn(),
  triggerDetection: jest.fn(),
  acceptSuggestion: jest.fn(),
  rejectSuggestion: jest.fn(),
}));

jest.mock('../../../services/expenditureService', () => ({
  getRecurringExpenditures: jest.fn(),
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

describe('UI Phase 4C: RecurringSuggestionsPage Unit & Accessibility Tests', () => {
  const mockPending = [
    {
      _id: 'sug-1',
      description: 'Spotify Monthly Premium',
      amount: 150,
      category: 'Entertainment',
      frequency: 'monthly',
      confidenceScore: 92,
      detectedFrom: '2026-01-01T00:00:00.000Z',
      detectedTo: '2026-11-01T00:00:00.000Z',
    },
  ];

  const mockAccepted = [
    {
      _id: 'sug-2',
      description: 'Gym Membership',
      amount: 600,
      category: 'Health & Fitness',
      frequency: 'monthly',
      confidenceScore: 98,
      detectedFrom: '2026-01-01T00:00:00.000Z',
      detectedTo: '2026-11-01T00:00:00.000Z',
    },
  ];

  const mockHistory = [
    {
      _id: 'exp-1',
      date: '2026-11-05T00:00:00.000Z',
      description: 'Netflix subscription',
      transactionValue: 200,
      categories: ['Entertainment'],
      paymentMethod: 'Credit Card',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModifyValue = true;
    recurringService.getRecurringSuggestions.mockImplementation((page, limit, filter) => {
      if (filter?.isAccepted) {
        return Promise.resolve({ data: mockAccepted });
      }
      return Promise.resolve({ data: mockPending });
    });
    expenditureService.getRecurringExpenditures.mockResolvedValue({ data: mockHistory });
  });

  const renderComponent = () => {
    return render(<RecurringSuggestionsPage />);
  };

  test('1. Renders PageHeader, subnav, tabs, and action button', async () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: 'Recurring Expense Automation', level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('scan-patterns-btn')).toBeInTheDocument();

    expect(await screen.findByTestId('suggestion-card-sug-1')).toBeInTheDocument();
    expect(screen.getByText('Spotify Monthly Premium')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  test('2. Renders EmptyState when pending suggestions list is empty', async () => {
    recurringService.getRecurringSuggestions.mockImplementation((page, limit, filter) => {
      if (filter?.isAccepted) {
        return Promise.resolve({ data: mockAccepted });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();
    expect(await screen.findByText('No pending recurring suggestions')).toBeInTheDocument();
  });

  test('3. Switches between tabs cleanly', async () => {
    renderComponent();
    expect(await screen.findByTestId('suggestion-card-sug-1')).toBeInTheDocument();

    // Click Accepted tab
    fireEvent.click(screen.getByRole('tab', { name: /Accepted Recurrences/i }));
    expect(await screen.findByTestId('accepted-card-sug-2')).toBeInTheDocument();
    expect(screen.getByText('Gym Membership')).toBeInTheDocument();

    // Click History tab
    fireEvent.click(screen.getByRole('tab', { name: /Flagged Recurring Entries/i }));
    expect(await screen.findByTestId('recurring-history-table')).toBeInTheDocument();
    expect(screen.getAllByText('Netflix subscription').length).toBeGreaterThanOrEqual(1);
  });

  test('4. Opens accept modal and cancels', async () => {
    renderComponent();
    expect(await screen.findByTestId('suggestion-card-sug-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('accept-btn-sug-1'));
    expect(screen.getByRole('heading', { name: 'Confirm Recurring Expense', level: 2 })).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { name: 'Confirm Recurring Expense', level: 2 })).not.toBeInTheDocument();
  });

  test('5. Passes WCAG 2.1 AA accessibility audit with expectNoA11yViolations', async () => {
    const { container } = renderComponent();
    expect(await screen.findByTestId('suggestion-card-sug-1')).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });
});
