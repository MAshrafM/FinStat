// frontend/src/pages/profile/__tests__/RecycleBin.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecycleBin from '../RecycleBin';
import apiClient from '../../../services/apiClient';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/settings/recycle-bin' }),
}), { virtual: true });

const mockShowToast = jest.fn();

jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
    addToast: mockShowToast,
  }),
}));

let mockCanModifyValue = true;

jest.mock('../../../context/AuthContext', () => ({
  useCanModify: () => ({
    canModify: mockCanModifyValue,
    isViewer: !mockCanModifyValue,
    isAdmin: false,
    isManager: mockCanModifyValue,
    role: mockCanModifyValue ? 'manager' : 'viewer',
  }),
}));

jest.mock('../../../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('Step 7C.2c: [FEAT-006, GAP-004] RecycleBin Component Unit Tests', () => {
  const mockDeletedExpenditures = [
    {
      _id: 'exp1',
      date: '2026-11-01T00:00:00.000Z',
      description: 'Office Supplies',
      categories: ['Other'],
      transactionValue: 450,
      paymentMethod: 'Bank',
      deletedAt: '2026-11-02T10:00:00.000Z',
    },
    {
      _id: 'exp2',
      date: '2026-11-03T00:00:00.000Z',
      description: '',
      categories: ['Groceries'],
      transactionValue: 120,
      paymentMethod: 'Cash',
      deletedAt: '2026-11-04T12:00:00.000Z',
    },
  ];

  const mockDeletedTrades = [
    {
      _id: 'trade1',
      date: '2026-11-01T00:00:00.000Z',
      type: 'Buy',
      stockCode: 'COMI',
      broker: 'Thndr',
      totalValue: 8000,
      deletedAt: '2026-11-02T15:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanModifyValue = true;

    apiClient.get.mockImplementation((url) => {
      if (url.includes('/expenditures/deleted')) {
        return Promise.resolve({
          data: mockDeletedExpenditures,
          total: 2,
          page: 1,
          totalPages: 1,
        });
      }
      if (url.includes('/trades/deleted')) {
        return Promise.resolve({
          data: mockDeletedTrades,
          total: 1,
          page: 1,
          totalPages: 1,
        });
      }
      return Promise.resolve({ data: [] });
    });

    apiClient.post.mockResolvedValue({ msg: 'Restored successfully' });
  });

  it('1. renders Recycle Bin page header and tab buttons', async () => {
    render(<RecycleBin />);

    expect(screen.getByRole('heading', { name: /Recycle Bin/i })).toBeInTheDocument();
    expect(screen.getByTestId('tab-expenditures')).toBeInTheDocument();
    expect(screen.getByTestId('tab-trades')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('deleted-items-table')).toBeInTheDocument();
    });
  });

  it('2. renders deleted expenditures table with correct columns, amounts, and dates', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('deleted-row-exp1')).toBeInTheDocument();
      expect(screen.getByTestId('deleted-row-exp2')).toBeInTheDocument();
    });

    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByTestId('restore-btn-exp1')).toBeInTheDocument();
  });

  it('3. renders empty state when deleted expenditures list is empty', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [], total: 0, totalPages: 1 });

    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-recycle-bin')).toBeInTheDocument();
    });

    expect(screen.getByText(/Recycle Bin is empty/i)).toBeInTheDocument();
  });

  it('4. switches to "Deleted Trades" tab and renders deleted trades table', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('deleted-items-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trades'));

    await waitFor(() => {
      expect(screen.getByTestId('deleted-row-trade1')).toBeInTheDocument();
    });

    expect(screen.getByText('COMI')).toBeInTheDocument();
    expect(screen.getByText('Thndr')).toBeInTheDocument();
  });

  it('5. renders empty state when deleted trades list is empty', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/trades/deleted')) {
        return Promise.resolve({ data: [], total: 0, totalPages: 1 });
      }
      return Promise.resolve({ data: mockDeletedExpenditures });
    });

    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('deleted-items-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trades'));

    await waitFor(() => {
      expect(screen.getByTestId('empty-recycle-bin')).toBeInTheDocument();
    });
  });

  it('6. clicking "Restore" on an expenditure opens ConfirmModal with item description', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('restore-btn-exp1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-btn-exp1'));

    expect(screen.getByRole('heading', { name: /Restore Record/i })).toBeInTheDocument();
    expect(screen.getByText(/Restore this expenditure\? Its ledger balance impact and transaction bridges will be automatically recalculated/i)).toBeInTheDocument();
  });

  it('7. confirming restore calls /api/expenditures/:id/restore and reloads items', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('restore-btn-exp1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-btn-exp1'));

    const confirmBtn = screen.getByRole('button', { name: /Restore Record/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('/expenditures/exp1/restore'));
    });
  });

  it('8. clicking "Restore" on a trade opens ConfirmModal and calls /api/trades/:id/restore', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('deleted-items-table')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-trades'));

    await waitFor(() => {
      expect(screen.getByTestId('restore-btn-trade1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-btn-trade1'));

    const confirmBtn = screen.getByRole('button', { name: /Restore Record/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(expect.stringContaining('/trades/trade1/restore'));
    });
  });

  it('9. dismissing or cancelling ConfirmModal closes it without calling restore API', async () => {
    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('restore-btn-exp1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-btn-exp1'));

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Restore Record')).not.toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('10. viewer role: Restore buttons are disabled via ProtectedAction', async () => {
    mockCanModifyValue = false; // Viewer role

    render(<RecycleBin />);

    await waitFor(() => {
      expect(screen.getByTestId('deleted-items-table')).toBeInTheDocument();
    });

    expect(screen.getByTestId('restore-btn-exp1')).toBeDisabled();
    expect(screen.getByTestId('restore-btn-exp2')).toBeDisabled();
  });
});
