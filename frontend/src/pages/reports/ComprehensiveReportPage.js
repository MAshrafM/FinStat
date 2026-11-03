// frontend/src/pages/reports/ComprehensiveReportPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatters';
import './ComprehensiveReport.css';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  const [rangePreset, setRangePreset] = useState('3Y'); // '1Y' | '3Y' | '5Y'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const { startYear, endYear } = useMemo(() => {
    if (rangePreset === '1Y') return { startYear: currentYear, endYear: currentYear };
    if (rangePreset === '5Y') return { startYear: currentYear - 4, endYear: currentYear };
    return { startYear: currentYear - 2, endYear: currentYear };
  }, [rangePreset, currentYear]);

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
    const monthsSet = new Set([
      ...(report.payroll.monthlyTrend || []).map(m => m.yearMonth),
      ...(report.expenditures.monthlyTrend || []).map(m => m.yearMonth),
    ]);
    const sortedMonths = Array.from(monthsSet).sort();
    const incomeMap = new Map((report.payroll.monthlyTrend || []).map(m => [m.yearMonth, m.netPay]));
    const expenseMap = new Map((report.expenditures.monthlyTrend || []).map(m => [m.yearMonth, m.totalSpent]));

    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Net Pay (Income)',
          data: sortedMonths.map(m => incomeMap.get(m) || 0),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.25,
          fill: true,
        },
        {
          label: 'Expenditures',
          data: sortedMonths.map(m => expenseMap.get(m) || 0),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.25,
          fill: true,
        },
      ],
    };
  }, [report]);

  // 2. Spend by Category Chart
  const categoryChartData = useMemo(() => {
    const categories = report?.expenditures?.spendByCategory || [];
    const topCategories = categories.slice(0, 7);
    return {
      labels: topCategories.map(c => c.category),
      datasets: [
        {
          data: topCategories.map(c => c.totalSpent),
          backgroundColor: [
            '#2563eb',
            '#0d9488',
            '#f59e0b',
            '#ec4899',
            '#8b5cf6',
            '#10b981',
            '#64748b',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  // 3. Asset Allocation Chart
  const assetAllocationData = useMemo(() => {
    const inv = report?.investments || {};
    const equitiesVal = inv.equities?.totalBuyValue || 0;
    const mfVal = inv.mutualFunds?.totalSubscriptions || 0;
    const goldVal = inv.gold?.totalCost || 0;
    const certVal = inv.certificates?.totalPrincipalHeld || 0;
    const realEstateVal = inv.realEstate?.currentMarketValue || 0;
    const forexVal = report?.currency?.totalForexValuationEGP || 0;

    return {
      labels: ['Equities', 'Mutual Funds', 'Gold', 'Certificates', 'Real Estate', 'Forex'],
      datasets: [
        {
          data: [equitiesVal, mfVal, goldVal, certVal, realEstateVal, forexVal],
          backgroundColor: [
            '#3b82f6',
            '#6366f1',
            '#eab308',
            '#14b8a6',
            '#8b5cf6',
            '#06b6d4',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [report]);

  if (loading) {
    return (
      <div className="comprehensive-report-page">
        <div className="report-loading">
          <h2>Generating Consolidated Financial Report…</h2>
          <p>Aggregating records across all 12 modules.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comprehensive-report-page">
        <div className="report-error">
          <h2>Report Generation Error</h2>
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
    <div className="comprehensive-report-page">
      {/* Header */}
      <header className="report-header">
        <div className="report-header-titles">
          <h1>Comprehensive Financial Report</h1>
          <div className="report-audit-meta">
            Generated: {report?.meta?.generatedAt ? new Date(report.meta.generatedAt).toUTCString() : new Date().toUTCString()}
            {user?.username ? ` by ${user.username}` : ''} | Period: {startYear} – {endYear}
          </div>
        </div>

        <div className="report-controls">
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

          <button type="button" className="btn-print" onClick={handlePrint}>
            <span>🖨️</span> Print / Export PDF
          </button>
        </div>
      </header>

      {/* KPI Ribbon */}
      <section className="report-kpi-grid">
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Net Worth</div>
          <div className="kpi-stat-value primary">{formatCurrency(kpi.netWorth || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Liquid Assets</div>
          <div className="kpi-stat-value success">{formatCurrency(kpi.liquidAssets || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Invested Assets</div>
          <div className="kpi-stat-value">{formatCurrency(kpi.investedAssets || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Total Liabilities</div>
          <div className="kpi-stat-value danger">{formatCurrency(kpi.totalLiabilities || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Gross Income</div>
          <div className="kpi-stat-value">{formatCurrency(kpi.totalGrossIncome || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Total Outflows</div>
          <div className="kpi-stat-value">{formatCurrency(kpi.totalExpenses || 0)}</div>
        </div>
        <div className="kpi-stat-card">
          <div className="kpi-stat-label">Savings Rate</div>
          <div className="kpi-stat-value success">{kpi.savingsRate || 0}%</div>
        </div>
      </section>

      {/* Visual Analytics */}
      <section className="report-section">
        <h2 className="report-section-title">📊 Cash Flow & Net Position</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card-title">Monthly Cash Flow Trend</h3>
            <div className="chart-wrapper">
              <Line data={cashFlowChartData} options={chartCommonOptions} />
            </div>
          </div>
          <div className="chart-card">
            <h3 className="chart-card-title">Asset Allocation Distribution</h3>
            <div className="chart-wrapper">
              <Doughnut data={assetAllocationData} options={chartCommonOptions} />
            </div>
          </div>
        </div>
      </section>

      <section className="report-section">
        <h2 className="report-section-title">🥧 Spending Breakdown & Budget</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-card-title">Top Expense Categories</h3>
            <div className="chart-wrapper">
              <Doughnut data={categoryChartData} options={chartCommonOptions} />
            </div>
          </div>
          <div className="report-table-card">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="numeric">Budget</th>
                  <th className="numeric">Actual Spent</th>
                  <th className="numeric">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {(report?.budget?.categories || []).length > 0 ? (
                  report.budget.categories.map((b) => (
                    <tr key={b.category}>
                      <td>{b.category}</td>
                      <td className="numeric">{formatCurrency(b.budgetedAmount)}</td>
                      <td className="numeric">{formatCurrency(b.actualSpent)}</td>
                      <td className="numeric">{b.utilizationPercentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>
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
        <h2 className="report-section-title">📋 Payroll & Statutory Deductions</h2>
        <div className="report-table-card">
          <table className="report-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="numeric">Gross Salary</th>
                <th className="numeric">Income Tax</th>
                <th className="numeric">Social Insurance</th>
                <th className="numeric">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {(report?.payroll?.monthlyTrend || []).length > 0 ? (
                report.payroll.monthlyTrend.map((m) => (
                  <tr key={m.yearMonth}>
                    <td>{m.yearMonth}</td>
                    <td className="numeric">{formatCurrency(m.grossSalary)}</td>
                    <td className="numeric">{formatCurrency(m.tax)}</td>
                    <td className="numeric">{formatCurrency(m.insurance)}</td>
                    <td className="numeric">{formatCurrency(m.netPay)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                    No paycheck entries recorded in this period.
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
