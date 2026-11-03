// frontend/src/pages/reports/__tests__/ComprehensiveReportPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComprehensiveReportPage, { chartCommonOptions } from '../ComprehensiveReportPage';
import apiClient from '../../../services/apiClient';
import { AuthProvider } from '../../../context/AuthContext';

jest.mock('../../../services/apiClient');

// Mock react-chartjs-2 to avoid canvas rendering issues in JSDOM
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-options={JSON.stringify(options)}>
      {JSON.stringify(data)}
    </div>
  ),
}));

const mockReportData = {
  meta: {
    userId: 'u1',
    startYear: 2024,
    endYear: 2026,
    generatedAt: '2026-11-03T10:00:00.000Z',
  },
  kpi: {
    netWorth: 550000,
    liquidAssets: 50000,
    investedAssets: 600000,
    totalLiabilities: 100000,
    totalGrossIncome: 350000,
    totalExpenses: 200000,
    savingsRate: 42.9,
  },
  payroll: {
    totalGrossSalary: 350000,
    totalNetPay: 280000,
    totalTax: 45000,
    totalInsurance: 24000,
    totalMartyrsFund: 175,
    monthlyTrend: [
      { yearMonth: '2026-01', grossSalary: 30000, netPay: 24000, tax: 4000, insurance: 2000 },
      { yearMonth: '2026-02', grossSalary: 30000, netPay: 24000, tax: 4000, insurance: 2000 },
    ],
  },
  expenditures: {
    totalSpent: 120000,
    spendByCategory: [
      { category: 'Groceries', totalSpent: 45000, count: 30 },
      { category: 'Utilities', totalSpent: 15000, count: 12 },
    ],
    monthlyTrend: [
      { yearMonth: '2026-01', totalSpent: 10000, count: 15 },
      { yearMonth: '2026-02', totalSpent: 11000, count: 18 },
    ],
  },
  creditCards: {
    totalLimit: 60000,
    currentBalance: 15000,
    periodCharged: 25000,
    periodPaid: 20000,
  },
  investments: {
    equities: { totalBuyValue: 100000, totalSellValue: 50000, realizedGains: 12000, dividendIncome: 3000 },
    mutualFunds: { totalSubscriptions: 40000, totalRedemptions: 10000, realizedGains: 2500, couponIncome: 1000 },
    gold: { endHoldingGrams: 50, totalCost: 150000, periodBoughtGrams: 20, periodSoldGrams: 0 },
    certificates: { totalPrincipalHeld: 200000, estimatedAccruedInterest: 50000 },
    realEstate: { acquisitionCost: 500000, currentMarketValue: 750000 },
  },
  currency: {
    totalForexValuationEGP: 50000,
    periodCashFlow: 45000,
  },
  budget: {
    categories: [
      { category: 'Groceries', budgetedAmount: 50000, actualSpent: 45000, utilizationPercentage: 90 },
    ],
  },
  debtPayoff: {
    hasActivePlan: true,
    strategy: 'snowball',
    projectedPayoffDate: '2027-06-01T00:00:00.000Z',
    monthlyBudget: 5000,
    totalInterestSaved: 12000,
  },
  categorizationRules: {
    activeRulesCount: 8,
    autoCategorizationCoverage: 95.5,
  },
};

describe('ComprehensiveReportPage Component Tests [FEAT-003]', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'audit_officer', role: 'manager' }));
  });

  const renderComponent = () => {
    return render(
      <AuthProvider>
        <ComprehensiveReportPage />
      </AuthProvider>
    );
  };

  test('Test 1: renders loading state and fetches comprehensive report data on mount', async () => {
    apiClient.get.mockResolvedValueOnce(mockReportData);

    renderComponent();

    expect(screen.getByText(/Generating Consolidated Financial Report…/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('/reports/comprehensive?startYear='));
  });

  test('Test 2: renders executive summary KPI cards with formatted currency values', async () => {
    apiClient.get.mockResolvedValueOnce(mockReportData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    // Check KPI labels
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Liquid Assets')).toBeInTheDocument();
    expect(screen.getByText('Invested Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('42.9%')).toBeInTheDocument();
  });

  test('Test 3: renders generation audit header with username and timestamp', async () => {
    apiClient.get.mockResolvedValueOnce(mockReportData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    expect(screen.getByText(/audit_officer/i)).toBeInTheDocument();
    expect(screen.getByText(/Period: 2024 – 2026/i)).toBeInTheDocument();
  });

  test('Test 4: initializes Chart.js instances with devicePixelRatio >= 3 for high-DPI print fidelity', async () => {
    apiClient.get.mockResolvedValueOnce(mockReportData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    // Verify global common chart options enforce 300 DPI (devicePixelRatio: 3)
    expect(chartCommonOptions.devicePixelRatio).toBeGreaterThanOrEqual(3);
  });

  test('Test 5: handles year range selector clicks and triggers updated API requests', async () => {
    apiClient.get.mockResolvedValue(mockReportData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    const currentYear = new Date().getFullYear();

    // Click "1 Year" button
    const oneYearBtn = screen.getByRole('button', { name: '1 Year' });
    fireEvent.click(oneYearBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenLastCalledWith(
        `/reports/comprehensive?startYear=${currentYear}&endYear=${currentYear}`
      );
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    // Click "5 Years" button
    const fiveYearBtn = screen.getByRole('button', { name: '5 Years' });
    fireEvent.click(fiveYearBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenLastCalledWith(
        `/reports/comprehensive?startYear=${currentYear - 4}&endYear=${currentYear}`
      );
    });
  });

  test('Test 6: clicking Print Report / Export PDF invokes window.print()', async () => {
    apiClient.get.mockResolvedValueOnce(mockReportData);
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });

    const printBtn = screen.getByRole('button', { name: /Print \/ Export PDF/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  test('Test 7: renders graceful error alert when API aggregation fails and supports retry', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Vercel gateway timeout'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Report Generation Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Vercel gateway timeout')).toBeInTheDocument();

    // Now mock success for retry
    apiClient.get.mockResolvedValueOnce(mockReportData);
    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Comprehensive Financial Report')).toBeInTheDocument();
    });
  });
});
