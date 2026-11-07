// frontend/src/pages/dashboard/__tests__/DashboardSummary.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import DashboardSummary from '../../DashboardSummary';
import * as dashboardHook from '../useDashboardData';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Memoization render-count spies (Option A)
const mockHeroRenderSpy = jest.fn();
jest.mock('../NetWorthHero', () => {
  const Original = jest.requireActual('../NetWorthHero').default;
  return {
    __esModule: true,
    default: (props) => {
      mockHeroRenderSpy(props);
      return <Original {...props} />;
    },
  };
});

const mockHoldingsRenderSpy = jest.fn();
jest.mock('../HoldingsGrid', () => {
  const Original = jest.requireActual('../HoldingsGrid').default;
  return {
    __esModule: true,
    default: (props) => {
      mockHoldingsRenderSpy(props);
      return <Original {...props} />;
    },
  };
});

const mockReportsGridRenderSpy = jest.fn();
jest.mock('../ReportsGrid', () => {
  const Original = jest.requireActual('../ReportsGrid').default;
  return {
    __esModule: true,
    default: (props) => {
      mockReportsGridRenderSpy(props);
      return <Original {...props} />;
    },
  };
});

describe('Step 8B.1d: DashboardSummary Coordinator Integration Tests [AUD-ARCH-001]', () => {
  const mockDashboardData = {
    isLoading: false,
    error: null,
    user: { fullName: 'Mohamed Ashraf', username: 'mashraf' },
    canModify: true,
    calculations: {
      netWorth: 850000,
      totalGain: 150000,
      totalGainPct: 21.4,
      totalPaid: 700000,
      bankBalance: 50000,
      creditAvailable: 25000,
      creditOutstanding: 10000,
      totalCurrent: 860000,
      realEstates: [{ id: 're1' }],
    },
    assetMix: {
      list: [{ key: 'stocks', name: 'Stocks', current: 860000, color: '#34d399' }],
      total: 860000,
    },
    holdings: [
      { key: 'stocks', name: 'Stocks', current: 860000, invested: 700000, color: '#34d399', viewPath: '/trades' },
    ],
    budgetTotals: { budgeted: 10000, spent: 6000, pct: 60 },
    budgetProgressList: [
      { budgetId: 'b1', category: 'Food', budgetedAmount: 10000, spentAmount: 6000, percentageUsed: 60, alertStatus: 'green' },
    ],
    savingsForexSummary: {
      totalCertValue: 100000,
      activeCertCount: 1,
      totalForexValue: 20000,
      totalForexGainLoss: 2500,
      forexHoldingCount: 1,
    },
    activeAssetCount: 1,
    monthLabel: 'November 2026',
    dateLabel: 'Saturday, November 7',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(dashboardHook, 'default').mockReturnValue(mockDashboardData);
  });

  // Test 1: renders skeleton loading placeholders while useDashboardData returns isLoading true
  test('1. renders skeleton loading placeholders while useDashboardData returns isLoading true', () => {
    dashboardHook.default.mockReturnValueOnce({
      ...mockDashboardData,
      isLoading: true,
    });

    const { container } = render(<DashboardSummary />);
    expect(container.querySelector('.dashboard-loading')).toBeInTheDocument();
    expect(container.querySelectorAll('.dash-skeleton').length).toBeGreaterThan(0);
    expect(screen.getByText(/Building your financial overview/i)).toBeInTheDocument();
  });

  // Test 2: renders error alert banner with retry button when useDashboardData returns error
  test('2. renders error alert banner with retry button when useDashboardData returns error', () => {
    dashboardHook.default.mockReturnValueOnce({
      ...mockDashboardData,
      isLoading: false,
      error: 'Failed to aggregate accounts',
    });

    render(<DashboardSummary />);
    expect(screen.getByText('Unable to load your dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to aggregate accounts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  // Test 3: renders full dashboard assembly with all 10 canonical CSS container classes (asserts INV-8B-01) and passes callable onOpenLauncher to ReportsGrid
  test('3. renders full dashboard assembly with all 10 canonical CSS container classes (asserts INV-8B-01)', () => {
    const launcherSpy = jest.fn();
    const { container } = render(<DashboardSummary onOpenLauncher={launcherSpy} />);

    const canonicalClasses = [
      '.dash-content',
      '.dash-hero',
      '.dash-hero-card',
      '.dash-kpis',
      '.dash-launch-grid',
      '.dash-allocation',
      '.dash-holdings-grid',
      '.dash-two-col',
      '.dash-reports-grid',
      '.dash-footnote',
    ];

    canonicalClasses.forEach((cls) => {
      const el = container.querySelector(cls);
      expect(el).not.toBeNull();
    });

    // Asserts coordinator passes callable onOpenLauncher to child widgets and verifies invocation
    expect(mockReportsGridRenderSpy).toHaveBeenCalled();
    const lastProps = mockReportsGridRenderSpy.mock.calls[0][0];
    expect(typeof lastProps.onOpenLauncher).toBe('function');
    lastProps.onOpenLauncher('explore');
    expect(launcherSpy).toHaveBeenCalledWith('explore');
    expect(launcherSpy).toHaveBeenCalledTimes(1);
  });

  // Test 4: verifies memoization isolation: toggling donut mode does not trigger re-render of NetWorthHero or HoldingsGrid (asserts INV-8B-03 via module spy)
  test('4. verifies memoization isolation: toggling donut mode does not trigger re-render of NetWorthHero or HoldingsGrid (asserts INV-8B-03 via module spy)', () => {
    render(<DashboardSummary onOpenLauncher={jest.fn()} />);

    // Initial mount: both render once
    expect(mockHeroRenderSpy).toHaveBeenCalledTimes(1);
    expect(mockHoldingsRenderSpy).toHaveBeenCalledTimes(1);

    // Toggle Invested mode in AssetAllocationDonut
    const investedBtn = screen.getByRole('button', { name: /^invested$/i });
    fireEvent.click(investedBtn);

    // State change is internal to AssetAllocationDonut -> Hero and HoldingsGrid do not re-render!
    expect(mockHeroRenderSpy).toHaveBeenCalledTimes(1);
    expect(mockHoldingsRenderSpy).toHaveBeenCalledTimes(1);
  });

  // Test 5: verifies coordinator line count is strictly <= 120 lines via fs.readFileSync line count (asserts INV-8B-04)
  test('5. verifies coordinator line count is strictly <= 120 lines via fs.readFileSync line count (asserts INV-8B-04)', () => {
    const summaryFilePath = path.resolve(__dirname, '../../DashboardSummary.js');
    const content = fs.readFileSync(summaryFilePath, 'utf8');
    const lines = content.split('\n').length;

    expect(lines).toBeLessThanOrEqual(120);
  });

  // Test 6: verifies unhydrated context defaults prevent runtime exceptions on initial render (asserts KS-8B-02)
  test('6. verifies unhydrated context defaults prevent runtime exceptions on initial render (asserts KS-8B-02)', () => {
    dashboardHook.default.mockReturnValueOnce({
      isLoading: false,
      error: null,
      user: null,
      canModify: false,
      calculations: {},
      assetMix: { list: [], total: 0 },
      holdings: [],
      budgetTotals: { budgeted: 0, spent: 0, pct: 0 },
      budgetProgressList: [],
      savingsForexSummary: {},
      activeAssetCount: 0,
      monthLabel: 'November 2026',
      dateLabel: 'Saturday, November 7',
    });

    expect(() => render(<DashboardSummary />)).not.toThrow();
  });
});
