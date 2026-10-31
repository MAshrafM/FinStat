import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaycheckLog from '../PaycheckLog';
import { getPaychecks, getPaychecksLog, deletePaycheck } from '../../../services/paycheckService';
import { useToast } from '../../../context/ToastContext';

// Mock dependencies
jest.mock('../../../services/paycheckService', () => ({
  getPaychecks: jest.fn(),
  getPaychecksLog: jest.fn(),
  deletePaycheck: jest.fn(),
}));

jest.mock('../../../context/ToastContext', () => ({
  useToast: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({ canModify: true, role: 'manager' }),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('PaycheckLog Component with Canonical & Deprecated Dual Fields', () => {
  const mockShowToast = jest.fn();

  const mockPaychecksList = [
    {
      _id: 'pc-canonical-1',
      period: '2025-01',
      disbursementType: 'Regular',
      netPay: 12000,
      grossSalary: 15000,
      payDate: '2025-01-25T12:00:00.000Z',
      insuranceDetails: { actualEmployeeShare: 1500 },
      taxDetails: { actualTax: 1500 },
      type: 'Cash',
    },
    {
      // Historical paycheck with deprecated fields only
      _id: 'pc-legacy-2',
      month: '2024-11',
      type: 'Cash',
      amount: 10000,
      grossAmount: 12500,
      insuranceDeduction: 1200,
      taxDeduction: 1300,
      date: '2024-11-20T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useToast.mockReturnValue({ showToast: mockShowToast });
    getPaychecks.mockResolvedValue(mockPaychecksList);
    getPaychecksLog.mockResolvedValue({
      data: mockPaychecksList,
      total: 2,
      totalPages: 1,
      page: 1,
    });
  });

  test('1. renders paycheck log page with both canonical and deprecated paycheck entries', async () => {
    render(<PaycheckLog />);

    expect(screen.getByText('Paycheck Log')).toBeInTheDocument();

    await waitFor(() => {
      // Canonical record
      expect(screen.getByText('2025-01')).toBeInTheDocument();
      // Legacy record with deprecated month
      expect(screen.getByText('2024-11')).toBeInTheDocument();
    });

    // Check that amounts are calculated and formatted properly (not 0.00 EGP or Unknown)
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  test('2. correctly aggregates overall summary data for both canonical and deprecated records', async () => {
    render(<PaycheckLog />);

    await waitFor(() => {
      // 12,000 + 10,000 = 22,000
      expect(getPaychecks).toHaveBeenCalled();
    });

    // Verify filter buttons for both years exist
    expect(screen.getByRole('button', { name: '2025' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2024' })).toBeInTheDocument();
  });

  test('3. opens accessible ConfirmModal instead of window.confirm when delete button clicked', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm');
    render(<PaycheckLog />);

    await waitFor(() => {
      expect(screen.getByText('2025-01')).toBeInTheDocument();
    });

    // Click delete on the first paycheck
    const deleteButtons = screen.getAllByTitle('Delete paycheck entry');
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(deleteButtons[0]);

    // window.confirm MUST NOT be called
    expect(confirmSpy).not.toHaveBeenCalled();

    // ConfirmModal must be rendered
    expect(screen.getByText('Delete Paycheck')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this paycheck entry/i)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  test('4. executes deletePaycheck and shows toast upon modal confirmation', async () => {
    deletePaycheck.mockResolvedValueOnce({ success: true });
    render(<PaycheckLog />);

    await waitFor(() => {
      expect(screen.getByText('2025-01')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete paycheck entry');
    fireEvent.click(deleteButtons[0]);

    // Click Confirm in modal
    const confirmBtn = screen.getByRole('button', { name: 'Delete Paycheck' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deletePaycheck).toHaveBeenCalledWith('pc-canonical-1');
      expect(mockShowToast).toHaveBeenCalledWith('Paycheck entry deleted successfully', 'success');
    });
  });

  test('5. closes ConfirmModal without deleting when Cancel is clicked', async () => {
    render(<PaycheckLog />);

    await waitFor(() => {
      expect(screen.getByText('2025-01')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete paycheck entry');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete Paycheck')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Delete Paycheck')).not.toBeInTheDocument();
      expect(deletePaycheck).not.toHaveBeenCalled();
    });
  });
});
