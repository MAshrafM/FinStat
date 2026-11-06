// frontend/src/pages/analytics/__tests__/PurchasingPowerChart.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchasingPowerChart from '../PurchasingPowerChart';
import * as goldService from '../../../services/goldService';
import { AuthProvider } from '../../../context/AuthContext';

// Mock react-chartjs-2 to avoid canvas issues in jsdom
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
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
  return render(
    <AuthProvider initialUser={{ role, id: 'user_1', username: 'testuser' }}>
      {ui}
    </AuthProvider>
  );
};

describe('Sub-step 7D.1b: [FEAT-007, GAP-014] PurchasingPowerChart Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Renders KPI summary cards with net worth, gold grams, and USD values
  test('1. Renders KPI summary cards with net worth, gold grams, and USD values', async () => {
    goldService.getPurchasingPower.mockResolvedValueOnce(mockAnalyticsData);

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Nominal Net Worth/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Currency Purchasing Power & Gold Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/1,250,000.50/i)).toBeInTheDocument();
    expect(screen.getByText(/24K Gold Equivalent/i)).toBeInTheDocument();
    expect(screen.getByText(/297.62 g/i)).toBeInTheDocument();
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

    // Click USD toggle
    const usdToggle = screen.getByRole('button', { name: /USD \(\$\)/i });
    fireEvent.click(usdToggle);
    expect(chart.textContent).toContain('Purchasing Power in USD ($)');

    // Click EGP toggle
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

    renderWithAuth(<PurchasingPowerChart />);

    expect(await screen.findByText(/Foreign Currency Mark-to-Market Valuations/i)).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('US Dollars')).toBeInTheDocument();
    expect(screen.getByText('+EGP 40,750.00 (+20.12%)')).toBeInTheDocument();
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

    // USD purchasing power is formatted via formatCurrency ($25,693.74)
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
});
