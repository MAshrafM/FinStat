// frontend/src/pages/analytics/PurchasingPowerChart.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getPurchasingPower } from '../../services/goldService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './PurchasingPowerChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PurchasingPowerChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricMode, setMetricMode] = useState('gold'); // 'gold' | 'usd' | 'egp'
  const [timeframe, setTimeframe] = useState('90D'); // '30D' | '90D' | '1Y' | 'ALL'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPurchasingPower();
      setData(res.data || res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load purchasing power analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter timeline based on selected timeframe
  const filteredTimeline = useMemo(() => {
    if (!data?.timeline || data.timeline.length === 0) return [];
    const timeline = [...data.timeline];
    switch (timeframe) {
      case '30D':
        return timeline.slice(-30);
      case '90D':
        return timeline.slice(-90);
      case '1Y':
        return timeline.slice(-365);
      case 'ALL':
      default:
        return timeline;
    }
  }, [data?.timeline, timeframe]);

  // Compute percentage trajectory delta over selected timeframe
  const trajectoryDelta = useMemo(() => {
    if (filteredTimeline.length < 2) return 0;
    const firstPoint = filteredTimeline[0];
    const lastPoint = filteredTimeline[filteredTimeline.length - 1];

    let startVal = 0;
    let endVal = 0;
    if (metricMode === 'gold') {
      startVal = firstPoint.purchasingPowerGoldGrams || 0;
      endVal = lastPoint.purchasingPowerGoldGrams || 0;
    } else if (metricMode === 'usd') {
      startVal = firstPoint.purchasingPowerUsd || 0;
      endVal = lastPoint.purchasingPowerUsd || 0;
    } else {
      startVal = firstPoint.netWorthEgp || 0;
      endVal = lastPoint.netWorthEgp || 0;
    }

    if (startVal === 0) return 0;
    return Number((((endVal - startVal) / startVal) * 100).toFixed(2));
  }, [filteredTimeline, metricMode]);

  // Chart configuration
  const chartData = useMemo(() => {
    const labels = filteredTimeline.map((item) =>
      item.date ? formatDate(item.date) : ''
    );

    let datasetConfig = {};
    if (metricMode === 'gold') {
      datasetConfig = {
        label: 'Purchasing Power in 24K Gold (Grams)',
        data: filteredTimeline.map((i) => i.purchasingPowerGoldGrams),
        borderColor: '#E5A93C',
        backgroundColor: 'rgba(229, 169, 60, 0.15)',
        pointBackgroundColor: '#E5A93C',
        fill: true,
      };
    } else if (metricMode === 'usd') {
      datasetConfig = {
        label: 'Purchasing Power in USD ($)',
        data: filteredTimeline.map((i) => i.purchasingPowerUsd),
        borderColor: '#2ECC71',
        backgroundColor: 'rgba(46, 204, 113, 0.15)',
        pointBackgroundColor: '#2ECC71',
        fill: true,
      };
    } else {
      datasetConfig = {
        label: 'Nominal Net Worth (EGP)',
        data: filteredTimeline.map((i) => i.netWorthEgp),
        borderColor: '#3498DB',
        backgroundColor: 'rgba(52, 152, 219, 0.15)',
        pointBackgroundColor: '#3498DB',
        fill: true,
      };
    }

    return {
      labels,
      datasets: [
        {
          ...datasetConfig,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: filteredTimeline.length > 30 ? 1 : 3,
        },
      ],
    };
  }, [filteredTimeline, metricMode]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#E2E8F0', font: { size: 12 } },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            if (metricMode === 'gold') {
              return ` 24K Gold: ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })} g`;
            } else if (metricMode === 'usd') {
              return ` USD Value: ${formatCurrency(val)}`;
            }
            return ` Net Worth: EGP ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94A3B8',
          callback: (value) => {
            if (metricMode === 'gold') return `${value}g`;
            if (metricMode === 'usd') return `$${Number(value).toLocaleString()}`;
            return `EGP ${Number(value).toLocaleString()}`;
          },
        },
      },
    },
  }), [metricMode]);

  if (loading) {
    return (
      <div className="purchasing-power-container" data-testid="loading-state">
        <div className="analytics-header">
          <h2>Multi-Currency Purchasing Power & Gold Analytics</h2>
          <p>Loading real-time market feeds and historical net worth projections...</p>
        </div>
        <div className="analytics-skeleton-grid">
          <div className="analytics-card skeleton"></div>
          <div className="analytics-card skeleton"></div>
          <div className="analytics-card skeleton"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchasing-power-container">
        <div className="analytics-error-banner" role="alert">
          <h3>Failed to Load Analytics</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  const current = data?.current || {};
  const currencyHoldings = data?.currencyHoldings || [];
  const hasNoData = (current.netWorthEgp || 0) === 0 && currencyHoldings.length === 0;

  return (
    <div className="purchasing-power-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h2>Multi-Currency Purchasing Power & Gold Analytics</h2>
          <p className="analytics-subtitle">
            Inflation-adjusted net worth tracking in physical 24K gold and US Dollars
          </p>
        </div>
        <div className="feed-badges">
          <span className={`badge ${current.goldPriceStatus === 'stale' ? 'badge-stale' : 'badge-live'}`}>
            Gold: {current.goldPriceSource || 'live'}
          </span>
          <span className={`badge ${current.usdRateStatus === 'stale' ? 'badge-stale' : 'badge-live'}`}>
            Forex: {current.forexSource || 'CIB'}
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="analytics-kpi-grid">
        {/* Nominal Net Worth Card */}
        <div className="analytics-card">
          <span className="card-label">Nominal Net Worth</span>
          <div className="card-primary-value">
            EGP {Number(current.netWorthEgp || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="card-sub-info">
            Liquid ledger cash + invested portfolios
          </span>
        </div>

        {/* 24K Gold Grams Card */}
        <div className="analytics-card highlight-gold">
          <span className="card-label">24K Gold Equivalent</span>
          <div className="card-primary-value">
            {Number(current.purchasingPowerGoldGrams || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g
          </div>
          <span className="card-sub-info">
            At EGP {Number(current.goldPrice24k || 0).toLocaleString()} / gram (24K)
          </span>
        </div>

        {/* USD Equivalent Card */}
        <div className="analytics-card highlight-usd">
          <span className="card-label">USD Purchasing Power</span>
          <div className="card-primary-value">
            {formatCurrency(current.purchasingPowerUsd || 0)}
          </div>
          <span className="card-sub-info">
            Exchange rate: 1 USD = EGP {Number(current.usdRate || 0).toFixed(2)}
          </span>
        </div>

        {/* Real Purchasing Power Trajectory */}
        <div className="analytics-card">
          <span className="card-label">{timeframe} Real Trajectory</span>
          <div className={`card-primary-value ${trajectoryDelta >= 0 ? 'text-green' : 'text-red'}`}>
            {trajectoryDelta >= 0 ? `+${trajectoryDelta}%` : `${trajectoryDelta}%`}
          </div>
          <span className="card-sub-info">
            Change in {metricMode === 'gold' ? '24K gold grams' : metricMode === 'usd' ? 'USD value' : 'nominal EGP'}
          </span>
        </div>
      </div>

      {/* Chart Section with Metric Toggle */}
      <div className="analytics-chart-section">
        <div className="chart-controls-bar">
          <div className="metric-toggle-group" role="group" aria-label="Metric Toggle">
            <button
              type="button"
              className={`toggle-btn ${metricMode === 'gold' ? 'active' : ''}`}
              onClick={() => setMetricMode('gold')}
            >
              Gold Grams (24K)
            </button>
            <button
              type="button"
              className={`toggle-btn ${metricMode === 'usd' ? 'active' : ''}`}
              onClick={() => setMetricMode('usd')}
            >
              USD ($)
            </button>
            <button
              type="button"
              className={`toggle-btn ${metricMode === 'egp' ? 'active' : ''}`}
              onClick={() => setMetricMode('egp')}
            >
              Nominal EGP
            </button>
          </div>

          <div className="timeframe-group" role="group" aria-label="Timeframe Selection">
            {['30D', '90D', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-canvas-wrapper" style={{ height: 350 }}>
          {filteredTimeline.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="chart-empty-state">
              <p>No historical exchange rate snapshots available to plot timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mark-to-Market Foreign Currency Holdings (GAP-014) */}
      <div className="currency-holdings-section">
        <div className="section-header">
          <h3>Foreign Currency Mark-to-Market Valuations</h3>
          <span className="section-note">Live revaluation against central exchange rate</span>
        </div>

        {currencyHoldings.length === 0 ? (
          <div className="currency-empty-state">
            <p>No active foreign currency holdings recorded. Add positions in the Currency Log to view mark-to-market returns.</p>
          </div>
        ) : (
          <div className="currency-table-wrapper">
            <table className="currency-mtm-table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Units Held</th>
                  <th>Purchase Rate</th>
                  <th>Current Rate</th>
                  <th>Cost Basis</th>
                  <th>Market Value (EGP)</th>
                  <th>Market Value (USD)</th>
                  <th>Unrealized Return</th>
                </tr>
              </thead>
              <tbody>
                {currencyHoldings.map((pos) => {
                  const isPositive = (pos.unrealizedGainLossEgp || 0) >= 0;
                  return (
                    <tr key={pos._id || pos.currencyCode}>
                      <td>
                        <span className="currency-pill">{pos.currencyCode}</span>
                        <span className="currency-name">{pos.name}</span>
                      </td>
                      <td>{Number(pos.amount || 0).toLocaleString()}</td>
                      <td>EGP {Number(pos.purchaseRate || 0).toFixed(2)}</td>
                      <td>EGP {Number(pos.currentRate || 0).toFixed(2)}</td>
                      <td>EGP {Number(pos.costBasisEgp || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>EGP {Number(pos.currentValueEgp || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>{formatCurrency(pos.currentValueUsd || 0)}</td>
                      <td>
                        <span className={`return-badge ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : ''}
                          EGP {Number(pos.unrealizedGainLossEgp || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          {' '}({isPositive ? '+' : ''}{pos.unrealizedGainLossPercentage}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasNoData && (
        <div className="empty-portfolio-notice">
          <p>Your portfolio has no active assets or cash logs recorded. Purchasing power will calculate automatically once assets are logged.</p>
        </div>
      )}
    </div>
  );
};

export default PurchasingPowerChart;
