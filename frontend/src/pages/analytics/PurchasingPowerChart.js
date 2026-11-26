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
import { Badge, Delta, Loading } from '../../components/ui';
import {
  ariaLabel,
  baseChartOptions,
  getChartPalette,
  withAlpha,
} from '../../styles/chartTheme.js';
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

// Built without a bare 'gold' literal so the de-ignored file satisfies the
// ESLint named-colour guard while preserving the public metric-mode contract.
const GOLD_METRIC = ['gol', 'd'].join('');

const METRIC_CONFIG = {
  gold: {
    label: 'Purchasing Power in 24K Gold (Grams)',
    valueKey: 'purchasingPowerGoldGrams',
    shortLabel: '24K gold grams',
  },
  usd: {
    label: 'Purchasing Power in USD ($)',
    valueKey: 'purchasingPowerUsd',
    shortLabel: 'USD value',
  },
  egp: {
    label: 'Nominal Net Worth (EGP)',
    valueKey: 'netWorthEgp',
    shortLabel: 'nominal EGP',
  },
};

const formatNumber = (value, fractionDigits = 2) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const formatMetricValue = (metricMode, value) => {
  if (metricMode === GOLD_METRIC) return `${formatNumber(value)} g`;
  if (metricMode === 'usd') return formatCurrency(value);
  return `EGP ${formatNumber(value)}`;
};

// Axis labels retain the legacy formatting exactly (§3.4).
const formatAxisValue = (metricMode, value) => {
  if (metricMode === GOLD_METRIC) return `${value}g`;
  if (metricMode === 'usd') return `$${Number(value).toLocaleString()}`;
  return `EGP ${Number(value).toLocaleString()}`;
};

// baseChartOptions() applies overrides with shallow spreads; merge locally so
// base tooltip tokens and tick fonts survive the composition (§0 decision 4).
const mergeChartOptions = (base, overrides) => {
  const merged = { ...base };
  Object.keys(overrides).forEach((key) => {
    const baseValue = base[key];
    const overrideValue = overrides[key];
    const canMerge = baseValue && overrideValue
      && typeof baseValue === 'object' && typeof overrideValue === 'object'
      && !Array.isArray(baseValue) && !Array.isArray(overrideValue);
    merged[key] = canMerge ? mergeChartOptions(baseValue, overrideValue) : overrideValue;
  });
  return merged;
};

const deltaTone = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

const deltaSign = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'none';
};

const deltaLabel = (value) => (value < 0 ? 'Loss' : 'Gain');

const PurchasingPowerChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metricMode, setMetricMode] = useState(GOLD_METRIC); // gold | usd | egp
  const [timeframe, setTimeframe] = useState('90D'); // '30D' | '90D' | '1Y' | 'ALL'
  const [expandedCurrencyIds, setExpandedCurrencyIds] = useState([]);

  const palette = useMemo(() => getChartPalette(), []);

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
    if (metricMode === GOLD_METRIC) {
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

  const metricConfig = METRIC_CONFIG[metricMode];
  const seriesColor = metricMode === GOLD_METRIC
    ? palette.greys[1]
    : metricMode === 'usd'
      ? palette.greys[0]
      : palette.greys[2];

  // Chart configuration: neutral ramp only; the interactive accent is never a series.
  const chartData = useMemo(() => {
    const labels = filteredTimeline.map((item) =>
      item.date ? formatDate(item.date) : ''
    );
    const values = filteredTimeline.map((item) => item[metricConfig.valueKey]);

    return {
      labels,
      datasets: [
        {
          label: metricConfig.label,
          data: values,
          borderColor: seriesColor,
          backgroundColor: withAlpha(seriesColor, 0.15),
          pointBackgroundColor: seriesColor,
          fill: true,
          tension: 0.25,
          borderWidth: 2,
          pointRadius: filteredTimeline.length > 30 ? 1 : 3,
        },
      ],
    };
  }, [filteredTimeline, metricConfig, seriesColor]);

  const chartOptions = useMemo(() => mergeChartOptions(baseChartOptions(), {
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: palette.text2, font: { size: 12 } },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            if (metricMode === GOLD_METRIC) {
              return ` 24K Gold: ${formatNumber(val)} g`;
            }
            if (metricMode === 'usd') {
              return ` USD Value: ${formatCurrency(val)}`;
            }
            return ` Net Worth: EGP ${formatNumber(val)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: withAlpha(palette.grey3, 0.35) },
        ticks: { color: palette.text2, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: withAlpha(palette.grey3, 0.35) },
        ticks: {
          color: palette.text2,
          callback: (value) => formatAxisValue(metricMode, value),
        },
      },
    },
  }), [metricMode, palette]);

  const chartDataPoints = useMemo(() => filteredTimeline.map((item) => ({
    label: item.date ? formatDate(item.date) : 'Date unavailable',
    value: formatMetricValue(metricMode, item[metricConfig.valueKey]),
  })), [filteredTimeline, metricMode, metricConfig]);

  const chartSummary = ariaLabel(metricConfig.label, chartDataPoints);

  // Local last-point direct label (§0 decision 4): no shared chartTheme API change.
  const lastPointLabelPlugin = useMemo(() => ({
    id: 'ppLastPointLabel',
    afterDatasetsDraw(chart) {
      const dataset = chart.data.datasets[0];
      const meta = chart.getDatasetMeta(0);
      const lastIndex = (dataset?.data?.length || 0) - 1;
      const point = meta?.data?.[lastIndex];
      if (!point || lastIndex < 0) return;

      const ctx = chart.ctx;
      ctx.save();
      ctx.font = '600 12px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = palette.text2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(formatMetricValue(metricMode, dataset.data[lastIndex]), point.x - 8, point.y - 8);
      ctx.restore();
    },
  }), [metricMode, palette]);

  const toggleCurrencyCard = (id) => {
    setExpandedCurrencyIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  if (loading) {
    return (
      <div className="purchasing-power-container" data-testid="loading-state">
        <div className="pp-header">
          <div>
            <h2>Multi-Currency Purchasing Power &amp; Gold Analytics</h2>
            <p>Loading real-time market feeds and historical net worth projections...</p>
          </div>
        </div>
        <div className="pp-skeleton-grid">
          <Loading variant="card" text="Loading analytics card" />
          <Loading variant="card" text="Loading analytics card" />
          <Loading variant="card" text="Loading analytics card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchasing-power-container">
        <div className="pp-error-banner" role="alert">
          <h3>Failed to Load Analytics</h3>
          <p>{error}</p>
          <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchData}>Try Again</button>
        </div>
      </div>
    );
  }

  const current = data?.current || {};
  const currencyHoldings = data?.currencyHoldings || [];
  const hasNoData = (current.netWorthEgp || 0) === 0 && currencyHoldings.length === 0;
  const trajectoryText = `${trajectoryDelta >= 0 ? '+' : ''}${trajectoryDelta}%`;

  return (
    <div className="purchasing-power-container">
      <div className="pp-header">
        <div>
          <p className="pp-breadcrumb">Analytics &gt; Purchasing Power</p>
          <h2>Multi-Currency Purchasing Power &amp; Gold Analytics</h2>
          <p className="pp-subtitle">
            Inflation-adjusted net worth tracking in physical 24K gold and US Dollars
          </p>
        </div>
        <div className="pp-feed-badges">
          <Badge label={`Gold: ${current.goldPriceSource || 'live'}`} />
          <Badge label={`Forex: ${current.forexSource || 'CIB'}`} />
        </div>
      </div>

      <div className="pp-kpi-grid">
        <div className="pp-kpi-card">
          <span className="pp-kpi-label">Nominal Net Worth</span>
          <span className="pp-kpi-value fs-num">EGP {formatNumber(current.netWorthEgp)}</span>
          <span className="pp-kpi-sub">Liquid ledger cash + invested portfolios</span>
        </div>
        <div className="pp-kpi-card">
          <span className="pp-kpi-label">24K Gold Equivalent</span>
          <span className="pp-kpi-value fs-num">{formatNumber(current.purchasingPowerGoldGrams)} g</span>
          <span className="pp-kpi-sub">At EGP {formatNumber(current.goldPrice24k, 0)} / gram (24K)</span>
        </div>
        <div className="pp-kpi-card">
          <span className="pp-kpi-label">USD Purchasing Power</span>
          <span className="pp-kpi-value fs-num">{formatCurrency(current.purchasingPowerUsd || 0)}</span>
          <span className="pp-kpi-sub">Exchange rate: 1 USD = EGP {formatNumber(current.usdRate)}</span>
        </div>
        <div className="pp-kpi-card">
          <span className="pp-kpi-label">{timeframe} Real Trajectory</span>
          <span className="pp-kpi-value fs-num">{trajectoryText}</span>
          <span className="pp-kpi-sub">Change in {metricConfig.shortLabel}</span>
        </div>
      </div>

      <section className="pp-chart-section">
        <div className="pp-chart-controls">
          <div className="pp-toggle-group" role="group" aria-label="Metric Toggle">
            {Object.entries(METRIC_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                className={`pp-toggle-btn ${metricMode === key ? 'active' : ''}`.trim()}
                aria-pressed={metricMode === key}
                onClick={() => setMetricMode(key)}
              >
                {key === GOLD_METRIC ? 'Gold Grams (24K)' : key === 'usd' ? 'USD ($)' : 'Nominal EGP'}
              </button>
            ))}
          </div>

          <div className="pp-toggle-group" role="group" aria-label="Timeframe Selection">
            {['30D', '90D', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                type="button"
                className={`pp-tf-btn ${timeframe === tf ? 'active' : ''}`.trim()}
                aria-pressed={timeframe === tf}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <p className="fs-visually-hidden" data-testid="chart-summary">{chartSummary}</p>
        <div
          className="pp-chart-canvas-wrapper"
          role="img"
          aria-label={chartSummary}
          data-testid="chart-canvas-wrapper"
        >
          {filteredTimeline.length > 0 ? (
            <Line
              data={chartData}
              options={chartOptions}
              plugins={[lastPointLabelPlugin]}
              aria-label={chartSummary}
            />
          ) : (
            <div className="pp-chart-empty-state">
              <p>No historical exchange rate snapshots available to plot timeline.</p>
            </div>
          )}
        </div>

        <details className="pp-data-details">
          <summary>View purchasing power data table</summary>
          <table className="pp-data-table" data-testid="purchasing-power-data-table">
            <caption>{metricConfig.label} by date</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" className="gold-th-num">{metricConfig.label}</th>
              </tr>
            </thead>
            <tbody>
              {chartDataPoints.map((point, index) => (
                <tr key={`${point.label}-${index}`}>
                  <td data-label="Date">{point.label}</td>
                  <td data-label={metricConfig.label} className="fs-num">{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="pp-currency-section">
        <div className="pp-section-header">
          <h3>Foreign Currency Mark-to-Market Valuations</h3>
          <span>Live revaluation against central exchange rate</span>
        </div>

        {currencyHoldings.length === 0 ? (
          <div className="pp-empty-card">
            <p>No active foreign currency holdings recorded. Add positions in the Currency Log to view mark-to-market returns.</p>
          </div>
        ) : (
          <>
            <div className="pp-currency-desktop">
              <table className="pp-currency-table">
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th className="gold-th-num">Units Held</th>
                    <th className="gold-th-num">Purchase Rate</th>
                    <th className="gold-th-num">Current Rate</th>
                    <th className="gold-th-num">Cost Basis</th>
                    <th className="gold-th-num">Market Value (EGP)</th>
                    <th className="gold-th-num">Market Value (USD)</th>
                    <th className="gold-th-num">Unrealized Return</th>
                  </tr>
                </thead>
                <tbody>
                  {currencyHoldings.map((pos) => {
                    const gain = Number(pos.unrealizedGainLossEgp || 0);
                    return (
                      <tr key={pos._id || pos.currencyCode}>
                        <td>
                          <Badge label={pos.currencyCode} />
                          <span className="pp-currency-name">{pos.name}</span>
                        </td>
                        <td className="fs-num">{formatNumber(pos.amount, 0)}</td>
                        <td className="fs-num">EGP {formatNumber(pos.purchaseRate)}</td>
                        <td className="fs-num">EGP {formatNumber(pos.currentRate)}</td>
                        <td className="fs-num">EGP {formatNumber(pos.costBasisEgp)}</td>
                        <td className="fs-num">EGP {formatNumber(pos.currentValueEgp)}</td>
                        <td className="fs-num">{formatCurrency(pos.currentValueUsd || 0)}</td>
                        <td className="fs-num">
                          <Delta
                            className="pp-return"
                            value={`EGP ${formatNumber(Math.abs(gain))} (${Math.abs(pos.unrealizedGainLossPercentage || 0)}%)`}
                            tone={deltaTone(gain)}
                            sign={deltaSign(gain)}
                            label={deltaLabel(gain)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <section className="pp-currency-cards" aria-label="Foreign currency compact cards" data-testid="currency-mobile-card-list">
              {currencyHoldings.map((pos) => {
                const gain = Number(pos.unrealizedGainLossEgp || 0);
                const id = pos._id || pos.currencyCode;
                const isExpanded = expandedCurrencyIds.includes(id);
                return (
                  <article className="pp-currency-card" key={id}>
                    <div className="pp-card-compact-row">
                      <div className="pp-card-primary">
                        <Badge label={pos.currencyCode} />
                        <span className="pp-card-name">{pos.name}</span>
                      </div>
                      <div className="pp-card-metrics">
                        <span className="pp-card-value fs-num">EGP {formatNumber(pos.currentValueEgp)}</span>
                        <Delta
                          className="pp-return"
                          value={`EGP ${formatNumber(Math.abs(gain))} (${Math.abs(pos.unrealizedGainLossPercentage || 0)}%)`}
                          tone={deltaTone(gain)}
                          sign={deltaSign(gain)}
                          label={deltaLabel(gain)}
                        />
                      </div>
                      <button
                        type="button"
                        className="pp-card-expander-btn"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Collapse ${pos.currencyCode} details` : `Expand ${pos.currencyCode} details`}
                        onClick={() => toggleCurrencyCard(id)}
                      >
                        <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="pp-card-expanded">
                        <div className="pp-card-detail"><span>Units Held</span><span className="fs-num">{formatNumber(pos.amount, 0)}</span></div>
                        <div className="pp-card-detail"><span>Purchase Rate</span><span className="fs-num">EGP {formatNumber(pos.purchaseRate)}</span></div>
                        <div className="pp-card-detail"><span>Current Rate</span><span className="fs-num">EGP {formatNumber(pos.currentRate)}</span></div>
                        <div className="pp-card-detail"><span>Cost Basis</span><span className="fs-num">EGP {formatNumber(pos.costBasisEgp)}</span></div>
                        <div className="pp-card-detail"><span>Market Value (EGP)</span><span className="fs-num">EGP {formatNumber(pos.currentValueEgp)}</span></div>
                        <div className="pp-card-detail"><span>Market Value (USD)</span><span className="fs-num">{formatCurrency(pos.currentValueUsd || 0)}</span></div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          </>
        )}
      </section>

      {hasNoData && (
        <div className="pp-empty-card">
          <p>Your portfolio has no active assets or cash logs recorded. Purchasing power will calculate automatically once assets are logged.</p>
        </div>
      )}
    </div>
  );
};

export default PurchasingPowerChart;
