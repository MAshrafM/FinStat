/* eslint-disable testing-library/no-node-access */
// frontend/src/pages/mutual-funds/__tests__/MutualFundLogPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import MutualFundLogPage from '../MutualFundLogPage';
import * as mutualFundService from '../../../services/mutualFundService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/mutualFundService');

const mockNotify = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockNotify, addToast: mockNotify }),
}));

const mockTrades = [
  {
    _id: 'mf-1',
    date: '2026-01-14T10:30:00Z',
    name: 'AZ Opportunity Fund',
    code: 'AZO',
    type: 'Buy',
    units: 120,
    price: 48.5,
    fees: 25,
    totalValue: 5845,
  },
  {
    _id: 'mf-2',
    date: '2026-01-12T14:15:00Z',
    name: 'Misr Equity Fund',
    code: 'MEF01',
    type: 'Sell',
    units: 60,
    price: 100,
    fees: 15,
    totalValue: 5985,
  },
  {
    _id: 'mf-3',
    date: '2026-01-10T09:00:00Z',
    name: 'AZ Opportunity Fund',
    code: 'AZO',
    type: 'Coupon',
    units: 100,
    price: 250,
    fees: 0,
    totalValue: 250,
  },
];

const renderComponent = (canModify = true) => {
  jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
    canModify,
    isViewer: !canModify,
    isAdmin: canModify,
    isManager: canModify,
    role: canModify ? 'admin' : 'viewer',
  });

  return render(
    <MemoryRouter>
      <MutualFundLogPage />
    </MemoryRouter>
  );
};

describe('MutualFundLogPage Component (Phase 7C)', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mutualFundService.getMutualFundTrades.mockResolvedValue({
      data: mockTrades,
      totalPages: 1,
      currentPage: 1,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('1. Renders the dense table with deterministic trades', async () => {
    renderComponent();

    const table = await screen.findByRole('table');

    expect(within(table).getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Name / Code' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Type' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Units' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Total Value' })).toBeInTheDocument();

    expect(within(table).getAllByText('AZ Opportunity Fund').length).toBeGreaterThan(0);
    expect(within(table).getByText('MEF01')).toBeInTheDocument();
    expect(within(table).getByText('14/01/2026')).toBeInTheDocument();
    expect(within(table).getByText('$5,845.00')).toBeInTheDocument();
    expect(within(table).getByText('$5,985.00')).toBeInTheDocument();
  });

  test('2. All/type filter switching updates the query and shows the active-filter note', async () => {
    renderComponent();

    await screen.findByRole('table');
    expect(mutualFundService.getMutualFundTrades).toHaveBeenLastCalledWith(1, 'all');

    fireEvent.click(screen.getByRole('button', { name: 'Sell' }));

    await waitFor(() => {
      expect(mutualFundService.getMutualFundTrades).toHaveBeenLastCalledWith(1, 'Sell');
    });
    expect(screen.getByText('Showing Sell transactions only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sell' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'All Types' }));

    await waitFor(() => {
      expect(screen.queryByText('Showing Sell transactions only')).not.toBeInTheDocument();
    });
    expect(mutualFundService.getMutualFundTrades).toHaveBeenLastCalledWith(1, 'all');
  });

  test('3. Shows the loading table skeleton while fetching', () => {
    mutualFundService.getMutualFundTrades.mockReturnValue(new Promise(() => {}));

    renderComponent();

    expect(screen.getByText('Loading mutual fund transactions...')).toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('fs-loading--table');
  });

  test('4. Shows the empty state card when no transactions exist', async () => {
    mutualFundService.getMutualFundTrades.mockResolvedValue({
      data: [],
      totalPages: 1,
      currentPage: 1,
    });

    renderComponent();

    expect(await screen.findByText('No mutual fund transactions')).toBeInTheDocument();
    expect(
      screen.getByText(/Record your first fund purchase, sale, or coupon/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('5. Shows a fetch-failure error card with role="alert"', async () => {
    mutualFundService.getMutualFundTrades.mockRejectedValue(new Error('network down'));

    renderComponent();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Unable to load transactions');
    expect(alert).toHaveTextContent('Failed to load mutual fund transactions.');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('6. Wires pagination controls to the next page request', async () => {
    mutualFundService.getMutualFundTrades.mockImplementation((page) =>
      Promise.resolve({ data: mockTrades, totalPages: 2, currentPage: page })
    );

    renderComponent();

    await screen.findByRole('table');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(mutualFundService.getMutualFundTrades).toHaveBeenLastCalledWith(2, 'all');
    });
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  test('7. Opens and cancels the delete confirmation modal', async () => {
    renderComponent();

    await screen.findByRole('table');

    fireEvent.click(screen.getAllByLabelText('Delete transaction for AZO')[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Mutual Fund Transaction')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('8. Confirming delete calls the service, shows a success toast, and closes the modal', async () => {
    mutualFundService.deleteTrade.mockResolvedValue({ success: true });

    renderComponent();

    await screen.findByRole('table');

    fireEvent.click(screen.getAllByLabelText('Delete transaction for AZO')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mutualFundService.deleteTrade).toHaveBeenCalledWith('mf-1');
    });
    expect(mockNotify).toHaveBeenCalledWith('Mutual fund transaction deleted', 'success');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('9. Delete failure surfaces an error toast', async () => {
    mutualFundService.deleteTrade.mockRejectedValue(new Error('cannot delete'));

    renderComponent();

    await screen.findByRole('table');

    fireEvent.click(screen.getAllByLabelText('Delete transaction for AZO')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('Failed to delete transaction', 'error');
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test('10. Read-only mode disables row delete actions and marks edit links inert', async () => {
    renderComponent(false);

    await screen.findByRole('table');

    const deleteButtons = screen.getAllByLabelText('Delete transaction for AZO');
    expect(deleteButtons.length).toBeGreaterThan(0);
    deleteButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-disabled', 'true');
    });

    const editLinks = screen.getAllByLabelText('Edit transaction for AZO');
    expect(editLinks.length).toBeGreaterThan(0);
    editLinks.forEach((link) => {
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });

    expect(screen.getByRole('link', { name: /Add Fund Trade/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('11. D19 mobile card expander toggles the compact detail drawer', async () => {
    renderComponent();

    await screen.findByRole('table');

    const expanders = screen.getAllByLabelText('Expand transaction details');
    expect(expanders.length).toBe(mockTrades.length);

    const card = expanders[0].closest('article');
    expect(card).not.toBeNull();
    expect(within(card).queryByText('Date')).not.toBeInTheDocument();

    fireEvent.click(expanders[0]);

    expect(screen.getByLabelText('Collapse transaction details')).toBeInTheDocument();
    expect(within(card).getByText('Date')).toBeInTheDocument();
    expect(within(card).getByText('Units')).toBeInTheDocument();
    expect(within(card).getByText('Price')).toBeInTheDocument();
    expect(within(card).getByText('Fees')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Collapse transaction details'));

    expect(within(card).queryByText('Date')).not.toBeInTheDocument();
  });

  test('12. Passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = renderComponent();

    await screen.findByRole('table');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
