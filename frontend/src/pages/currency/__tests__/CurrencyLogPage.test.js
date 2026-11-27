/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/currency/__tests__/CurrencyLogPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CurrencyLogPage from '../CurrencyLogPage';
import * as currencyService from '../../../services/currencyService';
import * as AuthContext from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/formatters';

jest.mock('react-router-dom', () => {
  return require('../../../../node_modules/react-router/dist/development/index.js');
}, { virtual: true });

expect.extend(toHaveNoViolations);

jest.mock('../../../services/currencyService');

const mockShowToast = jest.fn();
jest.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast, addToast: mockShowToast }),
}));

const sampleHoldings = [
  {
    _id: 'curr-1',
    name: 'Dollar',
    currencyCode: 'USD',
    amount: 2000,
    price: 96000,
    costBasis: 96000,
    purchaseRate: 48.0,
    currentRate: 50.5,
    currentValue: 101000,
    unrealizedGainLoss: 5000,
    gainLossPercentage: 5.21,
    rateSource: 'CIB',
    isStale: false,
    date: '2025-11-01T00:00:00.000Z',
    lastRevaluationDate: '2026-01-15T08:00:00.000Z',
  },
  {
    _id: 'curr-2',
    name: 'Euro',
    currencyCode: 'EUR',
    amount: 1000,
    price: 55000,
    costBasis: 55000,
    purchaseRate: 55.0,
    currentRate: 52.5,
    currentValue: 52500,
    unrealizedGainLoss: -2500,
    gainLossPercentage: -4.55,
    rateSource: 'fallback',
    isStale: true,
    date: '2025-10-15T00:00:00.000Z',
    lastRevaluationDate: '2026-01-12T08:00:00.000Z',
  },
  {
    _id: 'curr-3',
    name: 'Pound',
    currencyCode: 'GBP',
    amount: 500,
    price: 31500,
    costBasis: 31500,
    purchaseRate: 63.0,
    currentRate: 63.0,
    currentValue: 31500,
    unrealizedGainLoss: 0,
    gainLossPercentage: 0,
    rateSource: 'manual',
    isStale: false,
    date: '2025-12-01T00:00:00.000Z',
    lastRevaluationDate: '2026-01-15T08:00:00.000Z',
  },
];

describe('Phase 8D — CurrencyLogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: true,
      isViewer: false,
      isAdmin: true,
      isManager: false,
      role: 'admin',
    });
    currencyService.getCurrency.mockResolvedValue(sampleHoldings);
    currencyService.revalueCurrency.mockResolvedValue({
      message: 'Revalued 3 holdings',
      holdings: sampleHoldings,
    });
    currencyService.deleteCurrency.mockResolvedValue({ message: 'Deleted' });
  });

  it('1. renders canonical Loading table skeleton before data resolves', () => {
    currencyService.getCurrency.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    expect(container.querySelector('.curr-page-container.curr-log-page')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('2. renders 4 graphite KPI tiles with exact cost basis, current valuation, Delta P&L, and holdings count', async () => {
    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    expect(screen.getByText('Total Cost Basis')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(182500))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(185000))).toBeInTheDocument();

    const kpiSection = screen.getByRole('region', { name: 'Forex Portfolio Overview' });
    expect(within(kpiSection).getByText(formatCurrency(2500), { exact: false })).toBeInTheDocument();
    expect(within(kpiSection).getByText('Gain')).toBeInTheDocument();
    expect(within(kpiSection).getByText('3')).toBeInTheDocument();
  });

  it('3. renders Live, Stale, and Manual rate statuses as neutral fs-badge chips without inline emojis or semantic tone classes', async () => {
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const table = container.querySelector('.curr-table');
    const badges = table.querySelectorAll('.fs-badge');
    expect(badges).toHaveLength(3);
    badges.forEach((badge) => {
      expect(badge).not.toHaveClass('fs-badge--positive', 'fs-badge--negative', 'fs-badge--warning');
      const icon = badge.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
    expect(within(table).getByText('Live')).toBeInTheDocument();
    expect(within(table).getByText('Stale')).toBeInTheDocument();
    expect(within(table).getByText('Manual')).toBeInTheDocument();
  });

  it('4. renders right-aligned .fs-num numeric columns and Delta labels Gain, Loss, and No change', async () => {
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const table = container.querySelector('.curr-table');
    const numHeaders = table.querySelectorAll('th.curr-th-num');
    const numCells = table.querySelectorAll('td.curr-td-num.fs-num');
    expect(numHeaders).toHaveLength(5);
    expect(numCells).toHaveLength(15);

    expect(within(table).getByText('Gain')).toBeInTheDocument();
    expect(within(table).getByText('Loss')).toBeInTheDocument();
    expect(within(table).getByText('No change')).toBeInTheDocument();
  });

  it('5. renders underlined .curr-name-link and single .fs-btn-primary (Add Currency); Revalue Now is secondary', async () => {
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const primaryButtons = container.querySelectorAll('.fs-btn-primary');
    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toHaveTextContent(/Add Currency/i);

    const revalueBtn = screen.getByRole('button', { name: /Revalue Now/i });
    expect(revalueBtn).toHaveClass('fs-btn-secondary');

    const link = within(container.querySelector('.curr-table')).getByRole('link', { name: 'Dollar (USD)' });
    expect(link).toHaveClass('curr-name-link');
    expect(link).toHaveAttribute('href', '/currency/curr-1');
  });

  it('6. triggers revalueCurrency, shows loading label while pending, and updates list + toast', async () => {
    let resolveRevalue;
    currencyService.revalueCurrency.mockReturnValue(
      new Promise((resolve) => {
        resolveRevalue = resolve;
      })
    );

    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const revalueBtn = screen.getByRole('button', { name: /Revalue Now/i });
    fireEvent.click(revalueBtn);

    expect(screen.getByRole('button', { name: /Revaluing/i })).toBeDisabled();
    resolveRevalue({ message: 'Forex holdings revalued', holdings: sampleHoldings });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Forex holdings revalued', 'success');
    });
    expect(screen.getByRole('button', { name: /Revalue Now/i })).not.toBeDisabled();
  });

  it('7. handles revalueCurrency rejection with error toast and re-enables button', async () => {
    currencyService.revalueCurrency.mockRejectedValue({
      response: { data: { message: 'Forex feed unavailable' } },
    });

    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    fireEvent.click(screen.getByRole('button', { name: /Revalue Now/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Forex feed unavailable', 'error');
    });
    expect(screen.getByRole('button', { name: /Revalue Now/i })).not.toBeDisabled();
  });

  it('8. opens ConfirmModal via accessible Delete button and deletes holding on confirm', async () => {
    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Dollar (USD)' });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete Currency Entry')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(currencyService.deleteCurrency).toHaveBeenCalledWith('curr-1');
    });
    expect(mockShowToast).toHaveBeenCalledWith('Currency entry deleted successfully', 'success');
  });

  it('9. renders D19 compact-expand mobile cards and reveals full details and actions on click', async () => {
    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const mobileList = screen.getByTestId('currency-mobile-cards');
    const expander = within(mobileList).getByRole('button', { name: 'Show details for Dollar (USD)' });
    expect(expander).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expander);
    expect(within(mobileList).getByRole('button', { name: 'Hide details for Dollar (USD)' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(within(mobileList).getByText('Purchase Rate')).toBeInTheDocument();
    expect(within(mobileList).getByText('48.00 EGP')).toBeInTheDocument();
    expect(within(mobileList).getByRole('link', { name: /View Details/i })).toHaveAttribute('href', '/currency/curr-1');
  });

  it('10. viewer role disables Revalue Now, Add Currency, Edit, and Delete via ProtectedAction', async () => {
    jest.spyOn(AuthContext, 'useCanModify').mockReturnValue({
      canModify: false,
      isViewer: true,
      isAdmin: false,
      isManager: false,
      role: 'viewer',
    });

    render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const revalueBtn = screen.getByRole('button', { name: /Revalue Now/i });
    expect(revalueBtn).toBeDisabled();
    fireEvent.click(revalueBtn);
    expect(currencyService.revalueCurrency).not.toHaveBeenCalled();

    const addLink = screen.getByRole('link', { name: /Add Currency/i });
    expect(addLink).toHaveAttribute('aria-disabled', 'true');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete Dollar (USD)' });
    expect(deleteButtons[0]).toBeDisabled();
  });

  it('11. renders .curr-error-card with Retry button on getCurrency rejection while keeping header visible', async () => {
    currencyService.getCurrency
      .mockRejectedValueOnce({ response: { data: { message: 'Service down' } } })
      .mockResolvedValueOnce(sampleHoldings);

    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Unable to Load Currency Holdings');
    expect(screen.getByText('Foreign Currency Wallet')).toBeInTheDocument();
    expect(container.querySelector('.curr-error-card')).toHaveAttribute('role', 'alert');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    const links = await screen.findAllByText('Dollar (USD)');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('12. renders .curr-empty-card when getCurrency returns an empty array', async () => {
    currencyService.getCurrency.mockResolvedValue([]);
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('No Foreign Currency Holdings Found');
    expect(container.querySelector('.curr-empty-card')).toBeInTheDocument();
  });

  it('13. purges all inline [style] attributes across desktop and expanded mobile views', async () => {
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const mobileList = screen.getByTestId('currency-mobile-cards');
    fireEvent.click(within(mobileList).getByRole('button', { name: 'Show details for Dollar (USD)' }));
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('14. passes jest-axe accessibility checks with zero critical or serious violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <CurrencyLogPage />
      </MemoryRouter>
    );

    await screen.findByText('Foreign Currency Wallet');
    const results = await axe(container);
    const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(severe).toEqual([]);
  });
});
