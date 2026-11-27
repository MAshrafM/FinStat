// frontend/src/pages/currency/CurrencyDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrencyById, getRateHistory, deleteCurrency } from '../../services/currencyService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Badge, Delta, Loading } from '../../components/ui';
import {
  ariaLabel,
  baseChartOptions,
  getChartPalette,
  withAlpha,
} from '../../styles/chartTheme';
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
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaDollarSign,
  FaChartLine,
  FaCoins,
  FaExchangeAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserEdit,
} from 'react-icons/fa';
import './Currency.css';

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

const TIMEFRAME_TABS = [
  { id: '7', label: '1W' },
  { id: '30', label: '1M' },
  { id: '90', label: '3M' },
  { id: '180', label: '6M' },
  { id: 'all', label: 'All' },
];

const getPnlDeltaProps = (value) => {
  if (value > 0) return { tone: 'positive', sign: 'positive', label: 'Gain' };
  if (value < 0) return { tone: 'negative', sign: 'negative', label: 'Loss' };
  return { tone: 'neutral', sign: 'none', label: 'No change' };
};

const formatSignedPct = (pct) => {
  const num = Number(pct) || 0;
  if (num > 0) return `+${num.toFixed(2)}%`;
  if (num < 0) return `\u2212${Math.abs(num).toFixed(2)}%`;
  return '0.00%';
};

const CurrencyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currency, setCurrency] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('30'); // '7', '30', '90', '180', 'all'
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const palette = useMemo(() => getChartPalette(), []);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await getCurrencyById(id);
      setCurrency(data);

      if (data) {
        const currCode = data.currencyCode || data.name;
        try {
          const history = await getRateHistory({ currencyCode: currCode, limit: 100 });
          setRateHistory(Array.isArray(history) ? history : []);
        } catch (histErr) {
          console.error('Failed to load currency rate history:', histErr);
          setRateHistory([]);
        }
      } else {
        setRateHistory([]);
      }
    } catch (err) {
      console.error('Failed to load currency details:', err);
      const message = err.response?.data?.message || 'Currency holding not found';
      setFetchError(message);
      setCurrency(null);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCurrency(id);
      showToast('Currency holding deleted successfully', 'success');
      setShowDeleteModal(false);
      navigate('/currency');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete holding', 'error');
    }
  };

  const code = currency ? (currency.currencyCode || currency.name) : 'USD';
  const amount = Number(currency?.amount || 0);
  const purchaseRate = Number(currency?.purchaseRate || (amount > 0 ? (currency?.price || 0) / amount : 0));
  const currentRate = Number(currency?.currentRate || purchaseRate);
  const costBasis = Number(
    currency?.costBasis || (currency?.priceInPiastres ? currency.priceInPiastres / 100 : currency?.price || 0)
  );
  const currentVal = Number(currency?.currentValue || (amount * currentRate));
  const gainLoss = Number(currency?.unrealizedGainLoss ?? (currentVal - costBasis));
  const gainLossPct = Number(currency?.gainLossPercentage ?? (costBasis > 0 ? (gainLoss / costBasis) * 100 : 0));

  const chartPoints = useMemo(() => {
    if (!currency) return [];
    const filteredHistory = [...rateHistory].reverse().filter((_, idx, arr) => {
      if (timeframe === 'all') return true;
      const daysLimit = parseInt(timeframe, 10);
      return idx >= arr.length - daysLimit;
    });

    const points = filteredHistory.map((h) => ({
      date: h.date ? new Date(h.date).toISOString().split('T')[0] : '',
      rate: h.rate ?? (h.rates ? h.rates[code] : null),
    }));

    if (points.length === 0) {
      points.push({
        date: new Date().toISOString().split('T')[0],
        rate: currentRate,
      });
    }

    return points;
  }, [currency, rateHistory, timeframe, code, currentRate]);

  const chartLabels = useMemo(() => chartPoints.map((pt) => pt.date), [chartPoints]);
  const chartValues = useMemo(() => chartPoints.map((pt) => pt.rate), [chartPoints]);

  const chartData = useMemo(() => ({
    labels: chartLabels,
    datasets: [
      {
        label: `${code} Exchange Rate (EGP)`,
        data: chartValues,
        borderColor: palette.grey4,
        backgroundColor: withAlpha(palette.grey4, 0.12),
        borderWidth: 2.5,
        tension: 0.25,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: palette.grey4,
      },
    ],
  }), [code, chartLabels, chartValues, palette]);

  const chartOptions = useMemo(() => {
    const base = baseChartOptions();
    return {
      ...base,
      layout: {
        padding: { top: 24, right: 16 },
      },
      plugins: {
        ...base.plugins,
        legend: {
          ...base.plugins?.legend,
          display: true,
          position: 'top',
          labels: {
            ...base.plugins?.legend?.labels,
            color: palette.text2,
            font: {
              family: 'IBM Plex Sans, -apple-system, sans-serif',
              weight: '600',
              size: 12,
            },
          },
        },
        tooltip: {
          ...base.plugins?.tooltip,
          callbacks: {
            label: (ctx) => `1 ${code} = ${Number(ctx.parsed.y).toFixed(3)} EGP`,
          },
        },
      },
      scales: {
        ...base.scales,
        y: {
          ...base.scales?.y,
          grace: '25%',
          ticks: {
            ...base.scales?.y?.ticks,
            callback: (value) => `${Number(value).toFixed(2)} EGP`,
          },
        },
        x: {
          ...base.scales?.x,
          grid: { display: false },
          ticks: {
            ...base.scales?.x?.ticks,
            maxTicksLimit: 7,
          },
        },
      },
    };
  }, [palette, code]);

  const currLastPointLabelPlugin = useMemo(() => ({
    id: 'currLastPointLabelPlugin',
    afterDatasetsDraw(chart) {
      const datasets = chart?.data?.datasets || [];
      const ctx = chart?.ctx;
      const chartArea = chart?.chartArea;
      if (!datasets.length || !ctx || !chartArea) return;

      const data = datasets[0]?.data || [];
      let lastIdx = -1;
      for (let i = data.length - 1; i >= 0; i -= 1) {
        if (typeof data[i] === 'number' && !Number.isNaN(data[i])) {
          lastIdx = i;
          break;
        }
      }
      if (lastIdx === -1) return;

      const meta = chart.getDatasetMeta ? chart.getDatasetMeta(0) : null;
      const pt = meta?.data?.[lastIdx];
      if (!pt) return;

      let localMinY = pt.y;
      for (let j = Math.max(0, lastIdx - 8); j <= lastIdx; j += 1) {
        const candidate = meta?.data?.[j];
        if (candidate && typeof candidate.y === 'number' && candidate.y < localMinY) {
          localMinY = candidate.y;
        }
      }

      const text = `${code}: ${Number(data[lastIdx]).toFixed(2)} EGP`;
      ctx.save();
      ctx.font = '600 11px IBM Plex Sans, -apple-system, sans-serif';
      ctx.fillStyle = palette.text2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const x = Math.min(pt.x, chartArea.right - 4);
      const y = Math.max(chartArea.top + 14, localMinY - 10);
      ctx.fillText(text, x, y);
      ctx.restore();
    },
  }), [code, palette]);

  if (loading) {
    return (
      <div className="page-container curr-page-container curr-detail-page">
        <Loading variant="card" text="Loading foreign currency details..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container curr-page-container curr-detail-page">
        <div className="curr-detail-top-bar">
          <Link to="/currency" className="curr-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
          </Link>
        </div>
        <div className="curr-error-card" role="alert">
          <h2>Unable to Load Currency Holding</h2>
          <p>{fetchError}</p>
          <div className="curr-error-actions">
            <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchDetails}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="page-container curr-page-container curr-detail-page">
        <div className="curr-detail-top-bar">
          <Link to="/currency" className="curr-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
          </Link>
        </div>
        <div className="curr-empty-card">
          <h2>Currency Position Not Found</h2>
          <p>The requested foreign currency holding could not be found.</p>
          <div className="curr-error-actions">
            <Link to="/currency" className="fs-btn fs-btn-secondary">
              Return to Currency Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderHealthBadge = () => {
    if (currency.rateSource === 'manual') {
      return (
        <Badge tone="neutral" className="curr-health-badge">
          <FaUserEdit aria-hidden="true" /> Manual Override
        </Badge>
      );
    }
    if (currency.isStale || currency.rateSource === 'fallback') {
      return (
        <Badge tone="neutral" className="curr-health-badge">
          <FaExclamationCircle aria-hidden="true" /> Stale Rate (&gt; 24h)
        </Badge>
      );
    }
    return (
      <Badge tone="neutral" className="curr-health-badge">
        <FaCheckCircle aria-hidden="true" /> Live Market Rate
      </Badge>
    );
  };

  const validPoints = chartPoints.filter((pt) => typeof pt.rate === 'number' && !Number.isNaN(pt.rate));
  const latestPoint = validPoints[validPoints.length - 1];
  const firstPoint = validPoints[0];
  const chartSummary = latestPoint
    ? `Showing ${chartPoints.length} point(s) from ${firstPoint.date} (${Number(firstPoint.rate).toFixed(2)} EGP) to ${latestPoint.date} (${Number(latestPoint.rate).toFixed(2)} EGP).`
    : `Current rate: 1 ${code} = ${currentRate.toFixed(2)} EGP.`;

  const chartAriaLabel = ariaLabel(
    `${code} Exchange Rate History (EGP)`,
    validPoints.slice(-4).map((pt) => `${pt.date}: ${Number(pt.rate).toFixed(2)} EGP`)
  );

  const reversedTablePoints = [...chartPoints].reverse();

  return (
    <div className="page-container curr-page-container curr-detail-page">
      <div className="curr-detail-top-bar">
        <Link to="/currency" className="curr-back-link">
          <FaArrowLeft aria-hidden="true" /> Back to Foreign Currency
        </Link>
        <div className="curr-detail-actions">
          <Link
            to={`/currency/edit/${currency._id}`}
            className="fs-btn fs-btn-primary"
          >
            <FaEdit aria-hidden="true" /> Edit
          </Link>
          <button
            type="button"
            className="fs-btn fs-btn-secondary curr-btn-danger-outline"
            onClick={handleDelete}
          >
            <FaTrash aria-hidden="true" /> Delete
          </button>
        </div>
      </div>

      <section className="curr-detail-hero" aria-label="Currency Position Summary">
        <div className="curr-detail-hero-row">
          <div>
            <div className="curr-detail-hero-title-wrap">
              <h1>
                {currency.name} ({code})
              </h1>
              {renderHealthBadge()}
            </div>
            <p className="curr-detail-hero-meta">
              Current Exchange Rate:{' '}
              <strong className="fs-num">1 {code} = {currentRate.toFixed(2)} EGP</strong>
            </p>
          </div>
          <div className="curr-detail-hero-reval">
            <span className="curr-detail-reval-label">Last Revaluation</span>
            <span className="curr-detail-reval-date">
              {currency.lastRevaluationDate ? formatDate(currency.lastRevaluationDate) : formatDate(currency.date)}
            </span>
          </div>
        </div>
      </section>

      <section className="curr-metrics-grid" aria-label="Position Key Metrics">
        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaDollarSign /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Amount Held</span>
            <span className="curr-kpi-value fs-num">{amount.toLocaleString()} {code}</span>
            <span className="curr-kpi-sub">Foreign currency units</span>
          </div>
        </div>

        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaExchangeAlt /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Purchase Rate</span>
            <span className="curr-kpi-value fs-num">{purchaseRate.toFixed(2)} EGP</span>
            <span className="curr-kpi-sub">Acquisition rate per unit</span>
          </div>
        </div>

        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaCoins /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Current Rate</span>
            <span className="curr-kpi-value fs-num">{currentRate.toFixed(2)} EGP</span>
            <span className="curr-kpi-sub">CIB / Revaluation price</span>
          </div>
        </div>

        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaCoins /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Total Cost Basis</span>
            <span className="curr-kpi-value fs-num">{formatCurrency(costBasis)}</span>
            <span className="curr-kpi-sub">Total purchase price</span>
          </div>
        </div>

        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaCoins /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Current Value (EGP)</span>
            <span className="curr-kpi-value fs-num">{formatCurrency(currentVal)}</span>
            <span className="curr-kpi-sub">At current market rate</span>
          </div>
        </div>

        <div className="curr-metric-tile">
          <div className="curr-metric-icon" aria-hidden="true"><FaChartLine /></div>
          <div className="curr-metric-body">
            <span className="curr-kpi-label">Unrealized Gain / Loss</span>
            <span className="curr-kpi-value fs-num">
              <Delta
                value={formatCurrency(Math.abs(gainLoss))}
                {...getPnlDeltaProps(gainLoss)}
              />
            </span>
            <span className="curr-kpi-sub fs-num">{formatSignedPct(gainLossPct)} net change</span>
          </div>
        </div>
      </section>

      <section className="curr-chart-card" aria-label={`${code} Exchange Rate History`}>
        <div className="curr-chart-header">
          <div>
            <h2 className="curr-chart-title">{code} Exchange Rate History</h2>
            <p className="curr-chart-subtitle">
              Historical daily snapshots recorded from CIB exchange feeds.
            </p>
          </div>

          <div
            className="curr-timeframe-group"
            role="group"
            aria-label="Exchange rate chart timeframe"
          >
            {TIMEFRAME_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="curr-timeframe-btn"
                aria-pressed={timeframe === tab.id}
                onClick={() => setTimeframe(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="curr-chart-canvas-wrapper"
          role="img"
          aria-label={chartAriaLabel}
          data-plugin-ids="currLastPointLabelPlugin"
        >
          <Line
            data={chartData}
            options={chartOptions}
            plugins={[currLastPointLabelPlugin]}
            aria-label={chartAriaLabel}
          />
        </div>

        <p className="curr-chart-summary" data-testid="curr-chart-summary">
          {chartSummary}
        </p>

        <details className="curr-history-details">
          <summary>View {code} exchange rate history table ({chartPoints.length} entries)</summary>
          <table className="curr-history-table" data-testid="curr-rate-history-table">
            <caption>Historical {code} exchange rates in EGP</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" className="curr-th-num">Rate (EGP)</th>
              </tr>
            </thead>
            <tbody>
              {reversedTablePoints.map((pt) => (
                <tr key={pt.date}>
                  <td data-label="Date">{pt.date}</td>
                  <td className="curr-td-num fs-num" data-label="Rate (EGP)">
                    {pt.rate !== null && pt.rate !== undefined ? `${Number(pt.rate).toFixed(2)} EGP` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        <div className="curr-history-mobile-cards" data-testid="curr-history-mobile-cards">
          {reversedTablePoints.slice(0, 10).map((pt) => (
            <div key={pt.date} className="curr-mobile-card">
              <div className="curr-card-compact-row">
                <span className="curr-card-detail-label">{pt.date}</span>
                <span className="curr-card-value fs-num">
                  {pt.rate !== null && pt.rate !== undefined ? `${Number(pt.rate).toFixed(2)} EGP` : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Currency Holding"
        message="Are you sure you want to delete this currency holding?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default CurrencyDetailPage;
