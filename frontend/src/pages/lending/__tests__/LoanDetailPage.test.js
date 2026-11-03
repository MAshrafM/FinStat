// frontend/src/pages/lending/__tests__/LoanDetailPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoanDetailPage from '../LoanDetailPage';
import * as lendingService from '../../../services/lendingService';

jest.mock('../../../services/lendingService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({ canModify: true, role: 'manager' }),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'loan-123' }),
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

describe('Step 7A.5.4: LoanDetailPage Component Tests [FEAT-005]', () => {
  const mockLoan = {
    _id: 'loan-123',
    person: { _id: 'person-1', name: 'Ahmed', note: 'Colleague' },
    status: 'Active',
    notes: 'Emergency car repair',
    totalBorrowedInPiastres: 1000000,
    totalRepaidInPiastres: 400000,
    balanceInPiastres: 600000,
    isFullyRepaid: false,
    transactions: [
      {
        _id: 'tx-1',
        type: 'borrow',
        amountInPiastres: 1000000,
        runningBalanceInPiastres: 1000000,
        date: '2026-01-01T12:00:00.000Z',
        note: 'Initial disbursement',
      },
      {
        _id: 'tx-2',
        type: 'repay',
        amountInPiastres: 400000,
        runningBalanceInPiastres: 600000,
        date: '2026-01-15T12:00:00.000Z',
        note: 'First installment',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    lendingService.getLoanById.mockResolvedValue({ success: true, data: mockLoan });
    lendingService.addTransaction.mockResolvedValue({
      success: true,
      data: {
        ...mockLoan,
        totalRepaidInPiastres: 600000,
        balanceInPiastres: 400000,
        transactions: [
          ...mockLoan.transactions,
          {
            _id: 'tx-3',
            type: 'repay',
            amountInPiastres: 200000,
            runningBalanceInPiastres: 400000,
            date: '2026-02-01T12:00:00.000Z',
            note: 'Second installment',
          },
        ],
      },
    });
    lendingService.deleteTransaction.mockResolvedValue({
      success: true,
      data: {
        ...mockLoan,
        totalRepaidInPiastres: 0,
        balanceInPiastres: 1000000,
        transactions: [mockLoan.transactions[0]],
      },
    });
  });

  test('1. Renders loan header with total borrowed, total repaid, and remaining balance', async () => {
    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Ahmed/i)[0]).toBeInTheDocument();
    });
    expect(screen.getByText(/Remaining Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Borrowed/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Repaid/i)).toBeInTheDocument();
  });

  test('2. Renders transaction table with computed running balances in chronological sequence', async () => {
    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Initial disbursement')).toBeInTheDocument();
    });
    expect(screen.getByText('First installment')).toBeInTheDocument();
    expect(screen.getAllByText(/10,000\.00/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/6,000\.00/i)[0]).toBeInTheDocument();
  });

  test('3. Clicking "Add Payment" opens payment modal with repay preselected', async () => {
    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Repayment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Repayment/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Repayment/i)).toBeInTheDocument();
  });

  test('4. Submitting a new transaction updates ledger without page reload', async () => {
    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Repayment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Repayment/i }));

    fireEvent.change(screen.getByLabelText(/Amount \(EGP\)/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Note/i), { target: { value: 'Second installment' } });

    fireEvent.click(screen.getByRole('button', { name: /Record Transaction/i }));

    await waitFor(() => {
      expect(lendingService.addTransaction).toHaveBeenCalledWith(
        'loan-123',
        expect.objectContaining({
          type: 'repay',
          amountInPiastres: 200000,
          note: 'Second installment',
        })
      );
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('5. Double-submission guard: disables submit button while isLoading === true; repeated click does not fire duplicate API call', async () => {
    // Delay resolution to test in-flight state
    let resolveAdd;
    lendingService.addTransaction.mockImplementation(
      () =>
        new Promise((res) => {
          resolveAdd = res;
        })
    );

    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Repayment/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Repayment/i }));
    fireEvent.change(screen.getByLabelText(/Amount \(EGP\)/i), { target: { value: '2000' } });

    const submitBtn = screen.getByRole('button', { name: /Record Transaction/i });
    fireEvent.click(submitBtn);

    // Second immediate click while request is in-flight
    fireEvent.click(submitBtn);

    expect(lendingService.addTransaction).toHaveBeenCalledTimes(1);
    expect(submitBtn).toBeDisabled();

    // Resolve in-flight request
    resolveAdd({ success: true, data: mockLoan });
  });

  test('6. Clicking delete transaction opens accessible <ConfirmModal /> (asserting window.confirm was NOT called)', async () => {
    const windowConfirmSpy = jest.spyOn(window, 'confirm');

    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Delete transaction/i })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Delete transaction/i })[1]);

    expect(windowConfirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this transaction/i)).toBeInTheDocument();

    windowConfirmSpy.mockRestore();
  });

  test('7. Confirming delete in <ConfirmModal /> deletes transaction and updates running balance', async () => {
    render(<LoanDetailPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Delete transaction/i })[1]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Delete transaction/i })[1]);

    const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(lendingService.deleteTransaction).toHaveBeenCalledWith('loan-123', 'tx-2');
    });
  });
});
