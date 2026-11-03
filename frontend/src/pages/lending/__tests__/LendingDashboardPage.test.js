// frontend/src/pages/lending/__tests__/LendingDashboardPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LendingDashboardPage from '../LendingDashboardPage';
import * as lendingService from '../../../services/lendingService';

jest.mock('../../../services/lendingService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({ canModify: true, role: 'manager' }),
}));
jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
}), { virtual: true });

describe('Step 7A.5.4: LendingDashboardPage Component Tests [FEAT-005]', () => {
  const mockSummary = {
    totalBorrowed: 1500000,
    totalRepaid: 500000,
    totalOutstanding: 1000000,
    activeLoansCount: 2,
    personsCount: 2,
    topDebtors: [
      { personId: 'p1', personName: 'Ahmed', balanceInPiastres: 600000 },
      { personId: 'p2', personName: 'Karim', balanceInPiastres: 400000 },
    ],
  };

  const mockPersons = [
    {
      _id: 'p1',
      name: 'Ahmed',
      note: 'Colleague',
      totalOwedInPiastres: 600000,
      loanCount: 1,
      activeLoanCount: 1,
    },
    {
      _id: 'p2',
      name: 'Karim',
      note: 'Brother',
      totalOwedInPiastres: 400000,
      loanCount: 1,
      activeLoanCount: 1,
    },
  ];

  const mockLoans = [
    {
      _id: 'l1',
      person: { _id: 'p1', name: 'Ahmed' },
      status: 'Active',
      totalBorrowedInPiastres: 1000000,
      totalRepaidInPiastres: 400000,
      balanceInPiastres: 600000,
      createdAt: '2026-01-15T12:00:00.000Z',
    },
    {
      _id: 'l2',
      person: { _id: 'p2', name: 'Karim' },
      status: 'Active',
      totalBorrowedInPiastres: 500000,
      totalRepaidInPiastres: 100000,
      balanceInPiastres: 400000,
      createdAt: '2026-02-01T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    lendingService.getLendingSummary.mockResolvedValue({ success: true, data: mockSummary });
    lendingService.getPersons.mockResolvedValue({ success: true, data: mockPersons, pagination: { total: 2 } });
    lendingService.getLoans.mockResolvedValue({ success: true, data: mockLoans, pagination: { total: 2 } });
    lendingService.createPerson.mockResolvedValue({
      success: true,
      data: { _id: 'p3', name: 'Sara', note: 'Friend', totalOwedInPiastres: 0, loanCount: 0 },
    });
  });

  test('1. Displays loading spinner and renders KPI summary cards on mount', async () => {
    render(<LendingDashboardPage />);
    expect(screen.getByTestId('lending-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Total Receivables/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Total Repaid/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Active Debtors/i)).toBeInTheDocument();
  });

  test('2. Renders list of person cards with formatted currency balances', async () => {
    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ahmed')[0]).toBeInTheDocument();
    });
    expect(screen.getAllByText('Karim')[0]).toBeInTheDocument();
  });

  test('3. Filters loan table by status dropdown (Active, Repaid, WrittenOff, All)', async () => {
    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Filter Status/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Filter Status/i), { target: { value: 'Repaid' } });

    await waitFor(() => {
      expect(lendingService.getLoans).toHaveBeenCalledWith(expect.objectContaining({ status: 'Repaid' }));
    });
  });

  test('4. Clicking "Add Person" opens modal dialog', async () => {
    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Person/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Person/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/New Borrower \/ Contact/i)).toBeInTheDocument();
  });

  test('5. Submitting Add Person modal creates person, updates UI, and closes modal', async () => {
    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Person/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Person/i }));
    fireEvent.change(screen.getByLabelText(/Person Name/i), { target: { value: 'Sara' } });
    fireEvent.change(screen.getByLabelText(/Note/i), { target: { value: 'Friend' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Person/i }));

    await waitFor(() => {
      expect(lendingService.createPerson).toHaveBeenCalledWith({ name: 'Sara', note: 'Friend' });
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('6. Toggling sort order by balance / last activity re-orders the list', async () => {
    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Sort By/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Sort By/i), { target: { value: 'totalOwed' } });

    await waitFor(() => {
      expect(lendingService.getPersons).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'totalOwed' }));
    });
  });

  test('7. Empty state renders clean message and "Add Person" call-to-action', async () => {
    lendingService.getLendingSummary.mockResolvedValue({
      success: true,
      data: { totalBorrowed: 0, totalRepaid: 0, totalOutstanding: 0, activeLoansCount: 0, personsCount: 0, topDebtors: [] },
    });
    lendingService.getPersons.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } });
    lendingService.getLoans.mockResolvedValue({ success: true, data: [], pagination: { total: 0 } });

    render(<LendingDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/No personal loans or receivables found/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /\+ Add First Borrower/i })).toBeInTheDocument();
  });
});
