/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/gold/__tests__/GoldLogPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import GoldLogPage from '../GoldLogPage';
import * as goldService from '../../../services/goldService';
import * as AuthContext from '../../../context/AuthContext';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/goldService');

const mockNotify = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockNotify, addToast: mockNotify }),
}));

const mockLogs = [
  {
    _id: 'gold-1',
    date: '2026-01-14T10:30:00Z',
    item: 'Gold Ring 22K',
    seller: 'Cairo Gold House',
    karat: 22,
    weight: 2,
    price: 100,
    paid: 220,
    status: 'sold',
    sellingPrice: 130,
    sellingDate: '2026-06-01T00:00:00Z',
    sourceAccount: 'Bank',
    destinationAccount: 'Cash',
  },
  {
    _id: 'gold-2',
    date: '2026-01-10T09:00:00Z',
    item: '24K Bullion Bar',
    seller: 'Dahab Zaman',
    karat: 24,
    weight: 5,
    price: 200,
    paid: 1010,
    status: 'hold',
    sourceAccount: 'Cash',
    destinationAccount: 'Cash',
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
      <GoldLogPage />
    </MemoryRouter>
  );
};

describe('GoldLogPage Component (Phase 8A)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goldService.getGoldLogs.mockResolvedValue({
      data: mockLogs,
      totalPages: 1,
      currentPage: 1,
    });
    goldService.deleteGoldLog.mockResolvedValue({ success: true });
  });

  test('1. renders the 13-column dense table with every field', async () => {
    renderComponent();
    const table = await screen.findByRole('table');

    expect(within(table).getAllByRole('columnheader').length).toBe(13);
    expect(within(table).getByRole('columnheader', { name: /Date/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Karat/i })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: /Gain/i })).toBeInTheDocument();
    expect(within(table).getByText('Gold Ring 22K')).toBeInTheDocument();
    expect(within(table).getByText('by Cairo Gold House')).toBeInTheDocument();
    expect(within(table).getByText('14/01/2026')).toBeInTheDocument();
    expect(within(table).getByText('2.0000g')).toBeInTheDocument();
    expect(within(table).getByText('Hold')).toBeInTheDocument();
    expect(within(table).getByText('Sold')).toBeInTheDocument();
  });

  test('2. All/Hold/Sold filters call the service and expose the active state', async () => {
    renderComponent();
    await screen.findByRole('table');

    expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'all', 'date', 'desc');

    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));

    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'hold', 'date', 'desc');
    });
    expect(screen.getByText('Showing hold gold entries only')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hold' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    await waitFor(() => {
      expect(screen.queryByText('Showing hold gold entries only')).not.toBeInTheDocument();
    });
  });

  test('3. sortable headers toggle aria-sort for date, karat, and weight', async () => {
    renderComponent();
    await screen.findByRole('table');

    fireEvent.click(screen.getByRole('button', { name: /Date/i }));

    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'all', 'date', 'asc');
    });
    expect(screen.getByRole('button', { name: /Date/i }).closest('th')).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /Date/i }));
    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'all', 'date', 'desc');
    });

    fireEvent.click(screen.getByRole('button', { name: /Karat/i }));
    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'all', 'karat', 'asc');
    });

    fireEvent.click(screen.getByRole('button', { name: /Weight/i }));
    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(1, 'all', 'weight', 'asc');
    });
  });

  test('4. pagination requests the selected page', async () => {
    goldService.getGoldLogs.mockImplementation((page) =>
      Promise.resolve({ data: mockLogs, totalPages: 2, currentPage: page })
    );

    const { container } = renderComponent();
    await screen.findByRole('table');
    expect(container.querySelector('.pagination-container span')).toHaveTextContent('Page 1 of 2');

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(goldService.getGoldLogs).toHaveBeenLastCalledWith(2, 'all', 'date', 'desc');
    });
    await waitFor(() => {
      expect(container.querySelector('.pagination-container span')).toHaveTextContent('Page 2 of 2');
    });
  });

  test('5. renders the loading table skeleton', () => {
    goldService.getGoldLogs.mockReturnValue(new Promise(() => {}));

    renderComponent();

    expect(screen.getByText('Loading gold transactions...')).toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('fs-loading--table');
  });

  test('6. renders the empty state card', async () => {
    goldService.getGoldLogs.mockResolvedValue({ data: [], totalPages: 1, currentPage: 1 });

    renderComponent();

    expect(await screen.findByText('No gold transactions')).toBeInTheDocument();
    expect(screen.getByText(/Record your first purchase/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('7. renders a fetch-failure alert with the error message', async () => {
    goldService.getGoldLogs.mockRejectedValue(new Error('network down'));

    renderComponent();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Unable to load transactions');
    expect(alert).toHaveTextContent('network down');
  });

  test('8. delete flow: open, cancel, confirm success, and confirm failure', async () => {
    renderComponent();
    await screen.findByRole('table');

    const openDelete = () => fireEvent.click(
      screen.getAllByLabelText('Delete gold log for Gold Ring 22K')[0]
    );

    openDelete();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(goldService.deleteGoldLog).not.toHaveBeenCalled();

    openDelete();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(goldService.deleteGoldLog).toHaveBeenCalledWith('gold-1');
    });
    expect(mockNotify).toHaveBeenCalledWith('Gold log deleted successfully', 'success');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    mockNotify.mockClear();
    goldService.deleteGoldLog.mockRejectedValueOnce(new Error('cannot delete'));
    openDelete();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('Failed to delete gold log', 'error');
    });
  });

  test('9. view-only mode disables row actions and the Add CTA', async () => {
    renderComponent(false);
    await screen.findByRole('table');

    const deleteButtons = screen.getAllByLabelText('Delete gold log for Gold Ring 22K');
    deleteButtons.forEach((button) => {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    const editLinks = screen.getAllByLabelText('Edit gold log for Gold Ring 22K');
    editLinks.forEach((link) => {
      expect(link).toHaveAttribute('aria-disabled', 'true');
      expect(link).toHaveAttribute('tabindex', '-1');
    });

    expect(screen.getByRole('link', { name: /Add Gold Entry/i })).toHaveAttribute('aria-disabled', 'true');
  });

  test('10. D19 card expander exposes every field at 390px', async () => {
    window.innerWidth = 390;
    renderComponent();
    await screen.findByRole('table');

    const expanders = screen.getAllByLabelText('Expand gold log details');
    expect(expanders.length).toBe(mockLogs.length);

    const card = expanders[0].closest('article');
    fireEvent.click(expanders[0]);

    const drawer = within(card).getByText('Date').closest('.gold-card-expanded');
    expect(drawer).not.toBeNull();
    [
      'Date', 'Item', 'Karat', 'Weight', 'Price/g', 'Price', 'Paid',
      'Taxes/Fees', 'Cost/g', 'Selling Price', 'Gain', 'Status',
    ].forEach((label) => {
      expect(within(drawer).getAllByText(label).length).toBeGreaterThan(0);
    });
    expect(screen.getByLabelText('Collapse gold log details')).toBeInTheDocument();

    expect(document.querySelector('.gold-page-container').getAttribute('style')).toBeNull();
    expect(document.documentElement.getAttribute('style')).toBeNull();
  });

  test('11. I3 math preserves totalPrice, taxes, feesPerGram, and gain', async () => {
    const { container } = renderComponent();
    await screen.findByRole('table');

    expect(screen.getAllByText('$200.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$10.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+$60.00').length).toBeGreaterThan(0);

    const delta = container.querySelector('.gold-table .fs-delta--positive');
    expect(delta).not.toBeNull();
    expect(delta.textContent).toContain('Gain');
  });

  test('12. passes a jest-axe accessibility audit with zero critical/serious violations', async () => {
    const { container } = renderComponent();
    await screen.findByRole('table');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
