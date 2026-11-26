/* eslint-disable testing-library/no-container, testing-library/no-node-access */
// frontend/src/pages/analytics/__tests__/PurchasingPowerChart.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PurchasingPowerChart from '../PurchasingPowerChart';
import * as goldService from '../../../services/goldService';
import { AuthProvider } from '../../../context/AuthContext';
import { getChartPalette } from '../../../styles/chartTheme.js';

// Mock react-chartjs-2 to avoid canvas issues in jsdom
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options, plugins = [] }) => {
    global.__PP_PLUGINS__ = plugins;
    return (
      <div
        data-testid="line-chart"
        data-options={JSON.stringify(options)}
        data-plugin-ids={JSON.stringify(plugins.map((plugin) => plugin.id))}
      >
        {JSON.stringify(data)}
      </div>
    );
  },
}));

jest.mock('../../../services/goldService');

const mockAnalyticsData = {
  success: true,
  current: {
    netWorthEgp: 1250000.5,
    goldPrice24k: 4200,
    usdRate: 48.65,
    purchasingPowerGoldGrams: 297.62,
    purchasingPowerUsd: 25693.74,
    goldPriceStatus: 'live',
    goldPriceSource: 'dahabzaman-live',
    usdRateStatus: 'live',
    forexSource: 'CIB',
  },
  timeline: [
    {
      date: '2026-08-01T00:00:00.000Z',
      usdRate: 48.1,
      goldPrice24k: 3850,
      purchasingPowerGoldGrams: 285.71,
      purchasingPowerUsd: 22869.02,
      netWorthEgp: 1100000,
    },
    {
      date: '2026-09-01T00:00:00.000Z',
      usdRate: 48.4,
      goldPrice24k: 4000,
      purchasingPowerGoldGrams: 290.0,
      purchasingPowerUsd: 24000.0,
      netWorthEgp: 1160000,
    },
    {
      date: '2026-10-01T00:00:00.000Z',
      usdRate: 48.65,
      goldPrice24k: 4200,
      purchasingPowerGoldGrams: 297.62,
      purchasingPowerUsd: 25693.74,
      netWorthEgp: 1250000.5,
    },
  ],
  currencyHoldings: [
    {
      _id: 'curr_1',
      name: 'US Dollars',
      currencyCode: 'USD',
      amount: 5000,
      purchaseRate: 40.5,
      currentRate: 48.65,
      costBasisEgp: 202500,
      currentValueEgp: 243250,
      currentValueUsd: 5000,
      unrealizedGainLossEgp: 40750,
      unrealizedGainLossPercentage: 20.12,
    },
  ],
};

const renderWithAuth = (ui, { role = 'manager' } = {}) => {
  if (role) {
    window.localStorage.setItem('token', 'chart-test-token');
    window.localStorage.setItem('user', JSON.stringify({ role, id: 'user_1', username: 'testuser' }));
  }
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe('Sub-step 7D.1b: [FEAT-007, GAP-014] PurchasingPowerChart Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.__PP_PLUGINS__ = [];
    window.localStorage.clear();
  });

  // Test 1: Renders KPI summary cards with net worth, gold grams, and USD values
  test('1. Renders KPI summary cards with net worth, gold grams, and USD values', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Nominal Net Worth/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Currency Purchasing Power & Gold Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/1,250,000.50/i)).toBeInTheDocument();
    expect(screen.getByText(/24K Gold Equivalent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/297.62 g/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/USD Purchasing Power/i)).toBeInTheDocument();
  });

  // Test 2: Renders react-chartjs-2 line chart with historical data points
  test('2. Renders react-chartjs-2 line chart with historical data points', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    const chart = await screen.findByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    expect(chart.textContent).toContain('Purchasing Power in 24K Gold (Grams)');
  });

  // Test 3: Metric toggle swaps chart dataset between Gold Grams, USD, and EGP (🟢-2)
  test('3. Metric toggle swaps chart dataset between Gold Grams, USD, and EGP', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    const chart = await screen.findByTestId('line-chart');
    expect(chart.textContent).toContain('Purchasing Power in 24K Gold (Grams)');

    const usdToggle = screen.getByRole('button', { name: /USD \(\$\)/i });
    fireEvent.click(usdToggle);
    expect(chart.textContent).toContain('Purchasing Power in USD ($)');

    const egpToggle = screen.getByRole('button', { name: /Nominal EGP/i });
    fireEvent.click(egpToggle);
    expect(chart.textContent).toContain('Nominal Net Worth (EGP)');
  });

  // Test 4: Filters historical timeline when clicking timeframe selector buttons
  test('4. Filters historical timeline when clicking timeframe selector buttons', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    await screen.findByTestId('line-chart');

    const tf30d = screen.getByRole('button', { name: '30D' });
    fireEvent.click(tf30d);
    expect(tf30d).toHaveClass('active');

    const tf1y = screen.getByRole('button', { name: '1Y' });
    fireEvent.click(tf1y);
    expect(tf1y).toHaveClass('active');
  });

  // Test 5: Renders foreign currency mark-to-market table with unrealized gains/losses
  test('5. Renders foreign currency mark-to-market table with unrealized gains/losses', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    const { container } = renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Foreign Currency Mark-to-Market Valuations/i)).toBeInTheDocument();
    const currencyTable = container.querySelector('.pp-currency-table');
    expect(currencyTable).toHaveTextContent('USD');
    expect(currencyTable).toHaveTextContent('US Dollars');
    expect(currencyTable).toHaveTextContent('EGP 40,750.00 (20.12%)');
  });

  // Test 6: Renders empty state message when portfolio has no asset history
  test('6. Renders empty state message when portfolio has no asset history', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce({
      success: true,
      current: { netWorthEgp: 0, goldPrice24k: 0, usdRate: 0, purchasingPowerGoldGrams: 0, purchasingPowerUsd: 0 },
      timeline: [],
      currencyHoldings: [],
    });

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Your portfolio has no active assets or cash logs recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/No historical exchange rate snapshots available/i)).toBeInTheDocument();
    expect(screen.getByText(/No active foreign currency holdings recorded/i)).toBeInTheDocument();
  });

  // Test 7: Displays live price source badges and stale indicators
  test('7. Displays live price source badges and stale indicators when applicable', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce({
      ...mockAnalyticsData,
      current: {
        ...mockAnalyticsData.current,
        goldPriceStatus: 'stale',
        goldPriceSource: 'mongodb-cache',
        usdRateStatus: 'stale',
        forexSource: 'fallback',
      },
    });

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Gold: mongodb-cache/i)).toBeInTheDocument();
    expect(screen.getByText(/Forex: fallback/i)).toBeInTheDocument();
  });

  // Test 8: Handles API error gracefully by rendering an error banner without crashing
  test('8. Handles API error gracefully by rendering an error banner without crashing', async () => {
    goldService.getPurchasingPower.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to Load Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  // Test 9: Formats numbers using formatCurrency with thousands separators (🟡-8)
  test('9. Formats numbers using formatCurrency with thousands separators', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText('$25,693.74')).toBeInTheDocument();
  });

  // Test 10: Preserves accessibility attributes and chart canvas labels
  test('10. Preserves accessibility attributes and chart canvas labels', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    await screen.findByTestId('line-chart');
    expect(screen.getByRole('group', { name: /Metric Toggle/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Timeframe Selection/i })).toBeInTheDocument();
  });

  // Test 11: Viewer role can access the page without redirection (🟡-A)
  test('11. Viewer role can access the page without redirection', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />, { role: 'viewer' });

    expect(await screen.findByText(/24K Gold Equivalent/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Currency Purchasing Power & Gold Analytics/i)).toBeInTheDocument();
  });

  // Test 12: Series colours come from chartTheme; the interactive accent is never a series
  test('12. uses the chartTheme neutral palette with no hardcoded series colour', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);
    const chart = await screen.findByTestId('line-chart');
    const series = JSON.parse(chart.textContent).datasets[0];
    const options = JSON.parse(chart.getAttribute('data-options'));
    const palette = getChartPalette();

    expect(palette.greys).toContain(series.borderColor);
    expect(series.backgroundColor).toMatch(/^rgba/);
    expect(options.plugins.legend.labels.color).toBe(palette.text2);
    expect(chart.getAttribute('data-plugin-ids')).toContain('ppLastPointLabel');
  });

  // Test 13: Canvas wrapper and adjacent summary both use ariaLabel()
  test('13. exposes canvas aria-label and adjacent chart summary', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);
    await screen.findByTestId('line-chart');

    const summary = screen.getByTestId('chart-summary').textContent;
    expect(summary).toContain('Purchasing Power in 24K Gold (Grams) chart showing:');
    expect(summary).toContain('01/08/2026: 285.71 g');
    expect(screen.getByTestId('chart-canvas-wrapper')).toHaveAttribute('aria-label', summary);
  });

  // Test 14: Adjacent data-table alternative is available to assistive technology
  test('14. renders the adjacent data-table alternative', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);
    await screen.findByTestId('line-chart');

    const table = screen.getByTestId('purchasing-power-data-table');
    expect(table).toHaveAccessibleName('Purchasing Power in 24K Gold (Grams) by date');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(table).toHaveTextContent('01/10/2026');
    expect(table).toHaveTextContent('297.62 g');
  });

  // Test 15: Last-point direct label draws the formatted final metric value
  test('15. draws a last-point direct label without changing chartTheme', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);
    await screen.findByTestId('line-chart');

    const plugin = global.__PP_PLUGINS__.find((item) => item.id === 'ppLastPointLabel');
    expect(plugin).toBeDefined();

    const ctx = {
      save: jest.fn(),
      restore: jest.fn(),
      fillText: jest.fn(),
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
    };
    plugin.afterDatasetsDraw({
      ctx,
      data: { datasets: [{ data: [285.71, 290, 297.62] }] },
      getDatasetMeta: () => ({ data: [{ x: 10, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }] }),
    });

    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('297.62 g', 42, 52);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  // Test 16: Trajectory delta stays neutral, signed, and sign-only
  test('16. renders trajectoryDelta as a neutral signed figure', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    const { container } = renderWithAuth(<PurchasingPowerChart />);
    await screen.findByTestId('line-chart');

    const cards = Array.from(container.querySelectorAll('.pp-kpi-card'));
    const trajectory = cards.find((card) => card.textContent.includes('90D Real Trajectory'));
    expect(trajectory).toBeDefined();

    const value = trajectory.querySelector('.pp-kpi-value.fs-num');
    expect(value).toHaveTextContent('+4.17%');
    expect(value.className).not.toContain('fs-delta');
    expect(value.className).not.toMatch(/positive|negative|warning/);
  });
});
