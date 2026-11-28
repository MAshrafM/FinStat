// frontend/src/pages/lending/__tests__/PersonDetailPage.test.js
/* eslint-disable testing-library/no-container, testing-library/no-node-access */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PersonDetailPage from '../PersonDetailPage';
import LoanDetailPage from '../LoanDetailPage';
import * as lendingService from '../../../services/lendingService';

expect.extend(toHaveNoViolations);

const mockNavigate = jest.fn();

jest.mock('../../../services/lendingService');
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'p1' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const MOCK_PERSON = {
  _id: 'p1',
  name: 'Ahmed Samir',
  note: 'Work colleague',
};

const MOCK_LOANS = [
  {
    _id: 'l1',
    person: { _id: 'p1', name: 'Ahmed Samir' },
    status: 'Active',
    notes: 'Car repair',
    createdAt: '2026-01-10T10:00:00.000Z',
    totalBorrowedInPiastres: 500000,
    totalRepaidInPiastres: 100000,
    balanceInPiastres: 400000,
    transactions: [
      { _id: 't1', type: 'borrow', amountInPiastres: 500000, runningBalanceInPiastres: 500000, date: '2026-01-10T10:00:00.000Z', note: 'Initial' },
      { _id: 't2', type: 'repay', amountInPiastres: 100000, runningBalanceInPiastres: 400000, date: '2026-01-12T10:00:00.000Z', note: 'Part' },
    ],
  },
];

describe('Phase 9C PersonDetailPage & LoanDetailPage Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lendingService.getPersonById.mockResolvedValue({
      success: true,
      data: {
        person: MOCK_PERSON,
        loans: MOCK_LOANS,
        aggregate: {
          totalOutstandingInPiastres: 400000,
          totalWrittenOffInPiastres: 0,
          writtenOffCount: 0,
          activeLoanCount: 1,
        },
      },
    });
    lendingService.createLoan.mockResolvedValue({ success: true, data: { _id: 'l2' } });
    lendingService.updatePerson.mockResolvedValue({ success: true, data: MOCK_PERSON });
    lendingService.deletePerson.mockResolvedValue({ success: true });
    lendingService.getLoanById.mockResolvedValue({ success: true, data: MOCK_LOANS[0] });
    lendingService.updateLoan.mockResolvedValue({ success: true, data: { ...MOCK_LOANS[0], status: 'WrittenOff' } });
    lendingService.deleteLoan.mockResolvedValue({ success: true });
  });

  test('renders PersonDetailPage summary banner, creates new loan, and passes jest-axe with 0 [style]', async () => {
    const { container } = render(<PersonDetailPage />);
    expect(await screen.findByText('Ahmed Samir')).toBeInTheDocument();
    expect(screen.getByText(/Ahmed Samir currently owes you/i)).toBeInTheDocument();
    expect(container.querySelectorAll('[style]').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: /\+ New Loan for Ahmed Samir/i }));
    fireEvent.change(screen.getByLabelText(/Initial Loan Amount \(EGP\)/i), { target: { value: '2500' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Loan/i }));

    await waitFor(() => {
      expect(lendingService.createLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          person: 'p1',
          initialAmountInPiastres: 250000,
        })
      );
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('toggles WrittenOff via danger ConfirmModal and reactivates via primary ConfirmModal', async () => {
    const { unmount: unmountFirst } = render(<LoanDetailPage />);
    const writeOffBtn = await screen.findByRole('button', { name: /Mark as Written Off/i });
    fireEvent.click(writeOffBtn);
    const confirmBtn = screen.getByRole('button', { name: /Write Off Loan/i });
    expect(confirmBtn).toHaveClass('confirm-modal-btn-danger');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(lendingService.updateLoan).toHaveBeenCalledWith('p1', { status: 'WrittenOff' });
    });
    unmountFirst();

    lendingService.getLoanById.mockResolvedValue({
      success: true,
      data: { ...MOCK_LOANS[0], status: 'WrittenOff' },
    });
    const { unmount } = render(<LoanDetailPage />);
    const reactivateTrigger = await screen.findByRole('button', { name: /Re-activate Loan/i });
    fireEvent.click(reactivateTrigger);
    const reactivateConfirm = screen.getByRole('button', { name: /^Re-activate$/i });
    expect(reactivateConfirm).toHaveClass('confirm-modal-btn-primary');
    unmount();
  });

  test('deletes entire loan via ConfirmModal', async () => {
    render(<LoanDetailPage />);
    const deleteLoanBtn = await screen.findByRole('button', { name: /Delete Loan/i });
    fireEvent.click(deleteLoanBtn);
    const confirmDelete = screen.getAllByRole('button', { name: /Delete Loan/i }).pop();
    fireEvent.click(confirmDelete);

    await waitFor(() => {
      expect(lendingService.deleteLoan).toHaveBeenCalledWith('p1');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/lending');
  });
});
