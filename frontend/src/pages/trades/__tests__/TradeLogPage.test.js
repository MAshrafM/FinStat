// frontend/src/pages/trades/__tests__/TradeLogPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import TradeLogPage from '../TradeLogPage';
import * as tradeService from '../../../services/tradeService';
import apiClient from '../../../services/apiClient';
import { ToastProvider } from '../../../context/ToastContext';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/tradeService');
jest.mock('../../../services/apiClient');

const mockTrades = [
  {
    _id: 'trade-1',
    date: '2026-01-14T10:00:00Z',
    broker: 'Thndr',
    type: 'Buy',
    stockCode: 'COMI.CA',
    shares: 200,
    price: 82.50,
    fees: 25.00,
    totalValue: 16525.00,
  },
  {
    _id: 'trade-2',
    date: '2026-01-12T14:00:00Z',
    broker: 'EFG',
    type: 'Sell',
    stockCode: 'FWRY.CA',
    shares: 500,
    price: 9.80,
    fees: 15.00,
    totalValue: 4885.00,
  },
];

const renderComponent = () => {
  jest.spyOn(AuthContext, 'useAuth').mockReturnValue({
    isViewOnly: false,
    user: { role: 'admin', username: 'admin' },
  });
  jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
    canModify: true,
  });

  return render(
    <ToastProvider>
      <MemoryRouter>
        <TradeLogPage />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('TradeLogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tradeService.getTrades.mockResolvedValue({
      data: mockTrades,
      totalPages: 1,
    });
  });

  test('1. renders page header and action buttons', async () => {
    renderComponent();
    expect(screen.getByText('Stock Trade Log')).toBeInTheDocument();
    expect(screen.getByText(/Corporate Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Trade/i)).toBeInTheDocument();
  });

  test('2. renders trade table rows when loaded', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });
    expect(screen.getByText('FWRY.CA')).toBeInTheDocument();
  });

  test('3. renders empty state placeholder when no trades exist', async () => {
    tradeService.getTrades.mockResolvedValueOnce({ data: [], totalPages: 1 });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/No stock trade records found/i)).toBeInTheDocument();
    });
  });

  test('4. filters trades by broker when filter button is clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });

    const thndrBtn = screen.getByRole('button', { name: /^Thndr$/i });
    fireEvent.click(thndrBtn);

    await waitFor(() => {
      expect(tradeService.getTrades).toHaveBeenCalledWith(1, 'Thndr', '');
    });
  });

  test('5. updates search term on search input change', async () => {
    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search Stock Code/i);
    fireEvent.change(searchInput, { target: { value: 'COMI' } });

    await waitFor(() => {
      expect(tradeService.getTrades).toHaveBeenCalledWith(1, null, 'COMI');
    }, { timeout: 1000 });
  });

  test('6. toggles sort order when column header is clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });

    const stockHeader = screen.getByRole('columnheader', { name: /Stock/i });
    fireEvent.click(stockHeader);
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  test('7. opens delete confirmation modal on clicking delete icon', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Delete trade/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/Are you sure you want to delete this trade/i)).toBeInTheDocument();
  });

  test('8. calls deleteTrade API on confirm deletion', async () => {
    tradeService.deleteTrade.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Delete trade/i);
    fireEvent.click(deleteButtons[0]);

    const modal = screen.getByTestId('confirm-modal-content');
    const confirmBtn = within(modal).getByRole('button', { name: /^Delete Trade$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(tradeService.deleteTrade).toHaveBeenCalledWith('trade-1');
    });
  });

  test('9. restores deleted trade on undo toast click', async () => {
    tradeService.deleteTrade.mockResolvedValueOnce({});
    apiClient.post.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Delete trade/i);
    fireEvent.click(deleteButtons[0]);

    const modal = screen.getByTestId('confirm-modal-content');
    const confirmBtn = within(modal).getByRole('button', { name: /^Delete Trade$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/Undo/i)).toBeInTheDocument();
    });

    const undoBtn = screen.getByText(/Undo/i);
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  test('10. has 0 accessibility violations with jest-axe', async () => {
    const { container } = renderComponent();
    await waitFor(() => {
      expect(screen.getByText('COMI.CA')).toBeInTheDocument();
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
