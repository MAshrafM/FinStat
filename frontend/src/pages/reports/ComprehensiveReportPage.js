// frontend/src/pages/reports/ComprehensiveReportPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import { getChartPalette, withAlpha } from '../../styles/chartTheme';
import { Button, Loading } from '../../components/ui';
import './ComprehensiveReport.css';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const HIGH_DPI_RATIO = 3;

export const chartCommonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: HIGH_DPI_RATIO,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 12,
        font: { size: 11 },
      },
    },
    tooltip: {
      padding: 10,
    },
  },
};

const ComprehensiveReportPage = () => {
  const { user } = useAuth();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [targetYear, setTargetYear] = useState(currentYear);
  const [rangePreset, setRangePreset] = useState('3Y'); // '1Y' | '3Y' | '5Y'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableYears = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 6; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const { startYear, endYear } = useMemo(() => {
    const end = Number(targetYear) || currentYear;
    if (rangePreset === '1Y') return { startYear: end, endYear: end };
    if (rangePreset === '5Y') return { startYear: end - 4, endYear: end };
    return { startYear: end - 2, endYear: end };
  }, [rangePreset, targetYear, currentYear]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(
        `/reports/comprehensive?startYear=${startYear}&endYear=${endYear}`
      );
      setReport(data);
    } catch (err) {
      console.error('Failed to load comprehensive report:', err);
      setError(err.message || 'Unable to load comprehensive report');
    } finally {
      setLoading(false);
    }
  }, [startYear, endYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
  };

  // 1. Net Worth / Monthly Cash Flow Chart
  const cashFlowChartData = useMemo(() => {
    if (!report?.payroll?.monthlyTrend && !report?.expenditures?.monthlyTrend) {
      return { labels: [], datasets: [] };
    }
    const palette = getChartPalette();
    const monthsSet = new Set([
      ...(report.payroll.monthlyTrend || []).map((m) => m.yearMonth),
      ...(report.expenditures.monthlyTrend || []).map((m) => m.yearMonth),
    ]);
    const sortedMonths = Array.from(monthsSet).sort();
    const incomeMap = new Map((report.payroll.monthlyTrend || []).map((m) => [m.yearMonth, m.netPay]));
    const expenseMap = new Map((report.expenditures.monthlyTrend || []).map((m) => [m.yearMonth, m.totalSpent]));

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Net Pay (Income)',
          data: sortedMonths.map((m) => incomeMap.get(m) || 0),
          borderColor: palette.positive,
          backgroundColor: withAlpha(palette.positive, 0.15),
          tension: 0.25,
          fill: true,
        },
        {
          label: 'Expenditures',
          data: sortedMonths.map((m) => expenseMap.get(m) || 0),
          borderColor: palette.negative,
          backgroundColor: withAlpha(palette.negative, 0.15),
          tension: 0.25,
          fill: true,
        },
      ],
    };
  }, [report]);

  // 2. Spend by Category Chart
  const categoryChartData = useMemo(() => {
    const list = report?.expenditures?.spendByCategory || [];
    const palette = getChartPalette();
    const colors = list.map((_, idx) => palette.greys[idx % palette.greys.length]);

    return {
      labels: list.map((c) => c.category),
      datasets: [
        {
          data: list.map((c) => c.totalSpent),
          backgroundColor: colors,
          borderColor: palette.surface,
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  // 3. Asset Allocation Doughnut Chart
  const assetAllocationData = useMemo(() => {
    const palette = getChartPalette();
    const inv = report?.investments || {};
    const curr = report?.currency || {};
    const liquidCash = report?.kpi?.liquidAssets || 0;

    const equities = inv.equities?.totalBuyValue || 0;
    const mutualFunds = inv.mutualFunds?.totalSubscriptions || 0;
    const certificates = inv.certificates?.totalPrincipalHeld || 0;
    const gold = inv.gold?.totalCost || 0;
    const realEstate = inv.realEstate?.currentMarketValue || 0;
    const forex = curr.totalForexValuationEGP || 0;
    const receivables = (report?.loans?.totalOutstanding || 0) / 100;

    // eslint-disable-next-line no-restricted-syntax -- 'Gold' is an asset domain category label, not a CSS color
    const labels = ['Equities', 'Mutual Funds', 'Certificates', 'Gold', 'Real Estate', 'Forex & Cash', 'Receivables'];
    const data = [equities, mutualFunds, certificates, gold, realEstate, forex + liquidCash, receivables];
    const colors = labels.map((_, idx) => palette.greys[idx % palette.greys.length]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: palette.surface,
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  if (loading) {
    return (
      <div className="fs-page comprehensive-report-page" data-testid="comprehensive-report-page">
        <header className="report-header">
          <div className="report-header-titles">
            <h1>Comprehensive Financial Report</h1>
            <div className="report-audit-meta">
              Loading report parameters…
            </div>
          </div>
        </header>
        <div className="report-loading">
          <Loading variant="card" text="Generating Consolidated Financial Report…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fs-page comprehensive-report-page" data-testid="comprehensive-report-page">
        <div className="report-error">
          <h3>Report Generation Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-print" onClick={fetchReport}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpi = report?.kpi || {};

  return (
    <div className="fs-page comprehensive-report-page" data-testid="comprehensive-report-page">
      {/* Header */}
      <header className="report-header">
        <div className="report-header-titles">
          <h1>Comprehensive Financial Report</h1>
          <div className="report-audit-meta">
            Generated: {report?.meta?.generatedAt ? new Date(report.meta.generatedAt).toUTCString() : new Date().toUTCString()}
            {user?.username ? ` by ${user.username}` : ''} | Period: {report?.meta?.startYear || startYear} – {report?.meta?.endYear || endYear}
          </div>
        </div>

        <div className="report-controls">
          <select
            className="year-select-dropdown"
            aria-label="Select Ending Year"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Ending in {yr}
              </option>
            ))}
          </select>

          <div className="year-range-selector" role="group" aria-label="Year range selector">
            <button
              type="button"
              className={`year-btn ${rangePreset === '1Y' ? 'active' : ''}`}
              onClick={() => setRangePreset('1Y')}
            >
              1 Year
            </button>
            <button
              type="button"
              className={`year-btn ${rangePreset === '3Y' ? 'active' : ''}`}
              onClick={() => setRangePreset('3Y')}
            >
              3 Years
            </button>
            <button
              type="button"
              className={`year-btn ${rangePreset === '5Y' ? 'active' : ''}`}
              onClick={() => setRangePreset('5Y')}
            >
              5 Years
            </button>
          </div>

          <Button
            variant="secondary"
            className="btn-print"
            onClick={handlePrint}
            icon={<span aria-hidden="true">🖨️</span>}
          >
            <span>Print / Export PDF</span>
          </Button>
        </div>
      </header>

      {/* KPI Ribbon */}
      <section className="report-kpi-grid">
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Net Worth</div>
          <div className="kpi-stat-value primary fs-num">{formatCurrency(kpi.netWorth || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Liquid Assets</div>
          <div className="kpi-stat-value fs-num">{formatCurrency(kpi.liquidAssets || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Invested Assets</div>
          <div className="kpi-stat-value fs-num">{formatCurrency(kpi.investedAssets || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Total Liabilities</div>
          <div className="kpi-stat-value fs-num">{formatCurrency(kpi.totalLiabilities || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Gross Income</div>
          <div className="kpi-stat-value fs-num">{formatCurrency(kpi.totalGrossIncome || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Total Outflows</div>
          <div className="kpi-stat-value fs-num">{formatCurrency(kpi.totalExpenses || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Capital Deployed</div>
          <div className="kpi-stat-value fs-num">
            {formatCurrency(kpi.totalCapitalDeployed || 0)}
          </div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Savings Rate</div>
          <div className="kpi-stat-value fs-num">{kpi.savingsRate || 0}%</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Total Receivables</div>
          <div className="kpi-stat-value fs-num">
            {formatCurrency((report?.loans?.totalOutstanding || 0) / 100)}
          </div>
        </div>
      </section>

      {/* Visual Analytics */}
      <section className="report-section">
        <h2 className="report-section-title">📊 Cash Flow &amp; Net Position</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card-title">Monthly Cash Flow Trend</h3>
            <div className="chart-wrapper">
              <Line data={cashFlowChartData} options={chartCommonOptions} aria-label="Monthly Cash Flow Trend line chart" />
            </div>
          </div>
          <div className="chart-card">
            <h3 className="chart-card-title">Asset Allocation Distribution</h3>
            <div className="chart-wrapper">
              <Doughnut data={assetAllocationData} options={chartCommonOptions} aria-label="Asset Allocation Distribution doughnut chart" />
            </div>
          </div>
        </div>
      </section>

      {/* Spending & Budget Breakdown */}
      <section className="report-section">
        <h2 className="report-section-title">🥧 Spending Breakdown &amp; Budget</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card-title">Top Expense Categories</h3>
            <div className="chart-wrapper">
              <Doughnut data={categoryChartData} options={chartCommonOptions} aria-label="Top Expense Categories doughnut chart" />
            </div>
          </div>
          <div className="report-table-card" tabIndex={0} role="region" aria-label="Spending and budget breakdown table">
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col" className="numeric">Monthly Target</th>
                  <th scope="col" className="numeric">Period Budget</th>
                  <th scope="col" className="numeric">Actual Spent</th>
                  <th scope="col" className="numeric">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {(report?.budget?.categories || []).length > 0 ? (
                  report.budget.categories.map((b) => (
                    <tr key={b.category}>
                      <td>{b.category}</td>
                      <td className="numeric fs-num">{formatCurrency(b.monthlyTarget !== undefined ? b.monthlyTarget : b.budgetedAmount)}</td>
                      <td className="numeric fs-num">{formatCurrency(b.budgetedAmount)}</td>
                      <td className="numeric fs-num">{formatCurrency(b.actualSpent)}</td>
                      <td className="numeric fs-num">{b.utilizationPercentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="numeric text-center">
                      No active budgets configured for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Payroll Ledger */}
      <section className="report-section report-section-break">
        <h2 className="report-section-title">📋 Payroll &amp; Statutory Deductions</h2>
        <div className="report-table-card" tabIndex={0} role="region" aria-label="Payroll and statutory deductions table">
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col" className="numeric">Gross Salary</th>
                <th scope="col" className="numeric">Income Tax</th>
                <th scope="col" className="numeric">Social Insurance</th>
                <th scope="col" className="numeric">Martyrs Fund</th>
                <th scope="col" className="numeric">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {(report?.payroll?.monthlyTrend || []).length > 0 ? (
                report.payroll.monthlyTrend.map((m) => (
                  <tr key={m.yearMonth}>
                    <td>{m.yearMonth}</td>
                    <td className="numeric fs-num">{formatCurrency(m.grossSalary)}</td>
                    <td className="numeric fs-num">{formatCurrency(m.tax)}</td>
                    <td className="numeric fs-num">{formatCurrency(m.insurance)}</td>
                    <td className="numeric fs-num">{formatCurrency(m.martyrsFund || 0)}</td>
                    <td className="numeric fs-num">{formatCurrency(m.netPay)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="numeric text-center">
                    No paycheck entries recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed Lending Ledger */}
      <section className="report-section report-section-break">
        <h2 className="report-section-title">🤝 Peer-to-Peer Loans &amp; Receivables</h2>
        <div className="report-table-card" tabIndex={0} role="region" aria-label="Peer-to-peer loans and receivables table">
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Top Debtor</th>
                <th scope="col" className="numeric">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody>
              {(report?.loans?.topDebtors || []).length > 0 ? (
                report.loans.topDebtors.map((d, idx) => (
                  <tr key={d.personId || idx}>
                    <td>{d.personName}</td>
                    <td className="numeric fs-num">{formatCurrency((d.balanceInPiastres || 0) / 100)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="numeric text-center">
                    No active debtors or loans recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ComprehensiveReportPage;
