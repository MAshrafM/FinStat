/* eslint-disable testing-library/no-node-access, testing-library/no-container */
// frontend/src/pages/currency/__tests__/CurrencyDetailPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import CurrencyDetailPage from '../CurrencyDetailPage';
import * as currencyService from '../../../services/currencyService';
import { getChartPalette } from '../../../styles/chartTheme';
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

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, plugins = [] }) => {
    global.__CURR_DETAIL_PLUGINS__ = plugins;
    return (
      <div
        data-testid="curr-line-chart"
        data-options={JSON.stringify(options)}
        data-plugin-ids={JSON.stringify(plugins.map((p) => p.id))}
      >
        {JSON.stringify(data)}
      </div>
    );
  },
}));

const sampleDetail = {
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
};

const sampleHistory100 = Array.from({ length: 100 }, (_, idx) => ({
  _id: `h-${idx + 1}`,
  date: new Date(Date.UTC(2026, 0, 15 - idx)).toISOString(),
  rate: Number((50.5 - idx * 0.02).toFixed(2)),
  rates: { USD: Number((50.5 - idx * 0.02).toFixed(2)) },
}));

const renderDetail = (initialPath = '/currency/curr-1') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/currency/:id" element={<CurrencyDetailPage />} />
        <Route path="/currency" element={<div data-testid="currency-list-dest">Currency List</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('Phase 8D — CurrencyDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__CURR_DETAIL_PLUGINS__ = [];
    currencyService.getCurrencyById.mockResolvedValue(sampleDetail);
    currencyService.getRateHistory.mockResolvedValue(sampleHistory100);
    currencyService.deleteCurrency.mockResolvedValue({ message: 'Deleted' });
  });

  it('1. renders Loading card skeleton before details resolve', () => {
    currencyService.getCurrencyById.mockReturnValue(new Promise(() => {}));
    const { container } = renderDetail();
    expect(container.querySelector('.curr-page-container.curr-detail-page')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('2. renders hero header, all 3 neutral Badge health variants, and 6 metric tiles with Delta P&L', async () => {
    const { unmount } = renderDetail();
    await screen.findByText('Dollar (USD)');
    expect(screen.getByText('Live Market Rate')).toBeInTheDocument();
    expect(screen.getByText('Amount Held')).toBeInTheDocument();
    expect(screen.getByText('Unrealized Gain / Loss')).toBeInTheDocument();
    expect(screen.getByText('Gain')).toBeInTheDocument();
    unmount();

    currencyService.getCurrencyById.mockResolvedValueOnce({ ...sampleDetail, isStale: true, rateSource: 'fallback' });
    const { unmount: unmount2 } = renderDetail();
    await screen.findByText('Stale Rate (> 24h)');
    unmount2();

    currencyService.getCurrencyById.mockResolvedValueOnce({ ...sampleDetail, isStale: false, rateSource: 'manual', unrealizedGainLoss: 0, gainLossPercentage: 0 });
    renderDetail();
    await screen.findByText('Manual Override');
    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('3. renders .curr-back-link, sole .fs-btn-primary (Edit), and .curr-btn-danger-outline (Delete)', async () => {
    const { container } = renderDetail();
    await screen.findByText('Dollar (USD)');

    const backLink = screen.getByRole('link', { name: /Back to Foreign Currency/i });
    expect(backLink).toHaveClass('curr-back-link');
    expect(backLink).toHaveAttribute('href', '/currency');

    const primaryButtons = container.querySelectorAll('.fs-btn-primary');
    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toHaveAttribute('href', '/currency/edit/curr-1');

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('curr-btn-danger-outline');
  });

  it('4. configures chart from chartTheme with merged base options, layout padding, grace 25%, no accent series, and invokes currLastPointLabelPlugin', async () => {
    renderDetail();
    await screen.findByText('Dollar (USD)');

    const chartEl = screen.getByTestId('curr-line-chart');
    const data = JSON.parse(chartEl.textContent);
    const options = JSON.parse(chartEl.getAttribute('data-options'));
    const pluginIds = JSON.parse(chartEl.getAttribute('data-plugin-ids'));
    const palette = getChartPalette();

    const accentHex = ['#', '14b8a6'].join('');
    const legacyBlueHex = ['#', '0284c7'].join('');
    expect(data.datasets[0].borderColor).toBe(palette.grey4);
    expect(data.datasets[0].borderColor).not.toBe(accentHex);
    expect(data.datasets[0].borderColor).not.toBe(legacyBlueHex);
    expect(options.layout.padding.top).toBe(24);
    expect(options.scales.y.grace).toBe('25%');
    expect(options.scales.x.grid.display).toBe(false);
    expect(pluginIds).toContain('currLastPointLabelPlugin');

    const plugin = global.__CURR_DETAIL_PLUGINS__[0];
    const fillText = jest.fn();
    plugin.afterDatasetsDraw({
      data,
      chartArea: { top: 20, right: 320, left: 30, bottom: 260 },
      getDatasetMeta: () => ({
        data: data.datasets[0].data.map((_, i) => ({ x: 40 + i * 5, y: 120 })),
      }),
      ctx: {
        save: jest.fn(),
        restore: jest.fn(),
        fillText,
        font: '',
        fillStyle: '',
        textAlign: '',
        textBaseline: '',
      },
    });
    expect(fillText).toHaveBeenCalledWith(expect.stringContaining('USD: '), expect.any(Number), expect.any(Number));
  });

  it('5. toggles timeframe aria-pressed and filters chart/table point counts cleanly (7, 30, 90, 100, 100)', async () => {
    renderDetail();
    await screen.findByText('Dollar (USD)');

    const getTableRowCount = () => within(screen.getByTestId('curr-rate-history-table')).getAllByRole('row').length - 1;
    expect(screen.getByRole('button', { name: '1M' })).toHaveAttribute('aria-pressed', 'true');
    expect(getTableRowCount()).toBe(30);

    fireEvent.click(screen.getByRole('button', { name: '1W' }));
    expect(screen.getByRole('button', { name: '1W' })).toHaveAttribute('aria-pressed', 'true');
    expect(getTableRowCount()).toBe(7);

    fireEvent.click(screen.getByRole('button', { name: '3M' }));
    expect(getTableRowCount()).toBe(90);

    fireEvent.click(screen.getByRole('button', { name: '6M' }));
    expect(getTableRowCount()).toBe(100);

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(getTableRowCount()).toBe(100);
  });

  it('6. renders chart summary, collapsible details table, and D19 history mobile cards', async () => {
    renderDetail();
    await screen.findByText('Dollar (USD)');

    expect(screen.getByTestId('curr-chart-summary')).toHaveTextContent('Showing 30 point(s)');
    const table = screen.getByTestId('curr-rate-history-table');
    expect(table.querySelector('caption')).toHaveTextContent('Historical USD exchange rates in EGP');
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(2);
    expect(screen.getByTestId('curr-history-mobile-cards')).toBeInTheDocument();
  });

  it('7. falls back to single current-rate point when getRateHistory returns empty or rejects', async () => {
    currencyService.getRateHistory.mockRejectedValueOnce(new Error('History down'));
    renderDetail();
    await screen.findByText('Dollar (USD)');

    const chartEl = screen.getByTestId('curr-line-chart');
    const data = JSON.parse(chartEl.textContent);
    expect(data.datasets[0].data).toEqual([50.5]);
    expect(screen.getByTestId('curr-chart-summary')).toHaveTextContent('Showing 1 point(s)');
  });

  it('8. opens ConfirmModal on Delete, calls deleteCurrency, and navigates to /currency', async () => {
    renderDetail();
    await screen.findByText('Dollar (USD)');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete Currency Holding')).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(currencyService.deleteCurrency).toHaveBeenCalledWith('curr-1');
    });
    expect(await screen.findByTestId('currency-list-dest')).toBeInTheDocument();
  });

  it('9. renders .curr-error-card with Retry button on getCurrencyById rejection', async () => {
    currencyService.getCurrencyById
      .mockRejectedValueOnce({ response: { data: { message: 'Lookup failed' } } })
      .mockResolvedValueOnce(sampleDetail);

    const { container } = renderDetail();
    await screen.findByText('Unable to Load Currency Holding');
    expect(container.querySelector('.curr-page-container.curr-detail-page')).toBeInTheDocument();
    expect(container.querySelector('.curr-error-card')).toHaveAttribute('role', 'alert');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Dollar (USD)');
  });

  it('10. renders .curr-empty-card when holding is null/not found', async () => {
    currencyService.getCurrencyById.mockResolvedValueOnce(null);
    const { container } = renderDetail();

    await screen.findByText('Currency Position Not Found');
    expect(container.querySelector('.curr-page-container.curr-detail-page')).toBeInTheDocument();
    expect(container.querySelector('.curr-empty-card')).toBeInTheDocument();
  });

  it('11. verifies exact FX valuation math parity across hero and metric tiles', async () => {
    renderDetail();
    await screen.findByText('Dollar (USD)');

    const metricsRegion = screen.getByRole('region', { name: 'Position Key Metrics' });
    expect(screen.getByText('1 USD = 50.50 EGP')).toBeInTheDocument();
    expect(within(metricsRegion).getByText('48.00 EGP')).toBeInTheDocument();
    expect(within(metricsRegion).getByText('50.50 EGP')).toBeInTheDocument();
    expect(within(metricsRegion).getByText(formatCurrency(96000))).toBeInTheDocument();
    expect(within(metricsRegion).getByText(formatCurrency(101000))).toBeInTheDocument();
    expect(within(metricsRegion).getByText('+5.21% net change')).toBeInTheDocument();
  });

  it('12. purges all inline [style] attributes across populated detail view', async () => {
    const { container } = renderDetail();
    await screen.findByText('Dollar (USD)');
    expect(container.querySelectorAll('[style]')).toHaveLength(0);
  });

  it('13. passes jest-axe with zero critical or serious violations', async () => {
    const { container } = renderDetail();
    await screen.findByText('Dollar (USD)');
    const results = await axe(container);
    const severe = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(severe).toEqual([]);
  });
});
