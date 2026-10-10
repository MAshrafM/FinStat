// frontend/src/pages/currency/CurrencyDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrencyById, getRateHistory, deleteCurrency } from '../../services/currencyService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
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
import '../certificates/CertificateDetail.css';

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

const CurrencyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currency, setCurrency] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('30'); // '7', '30', '90', '180', 'all'
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCurrencyById(id);
      setCurrency(data);

      const code = data.currencyCode || data.name;
      const history = await getRateHistory({ currencyCode: code, limit: 100 });
      setRateHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Failed to load currency details:', err);
      showToast(err.response?.data?.message || 'Currency holding not found', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this currency holding?')) {
      try {
        await deleteCurrency(id);
        showToast('Currency holding deleted successfully', 'success');
        navigate('/currency');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete holding', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading foreign currency details...</p>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="page-container">
        <h2>Currency Position Not Found</h2>
        <Link to="/currency" className="action-button">Return to Currency Wallet</Link>
      </div>
    );
  }

  const code = currency.currencyCode || currency.name;
  const amount = Number(currency.amount || 0);
  const purchaseRate = Number(currency.purchaseRate || (amount > 0 ? currency.price / amount : 0));
  const currentRate = Number(currency.currentRate || purchaseRate);
  const costBasis = Number(currency.costBasis || (currency.priceInPiastres ? currency.priceInPiastres / 100 : currency.price || 0));
  const currentVal = Number(currency.currentValue || (amount * currentRate));
  const gainLoss = Number(currency.unrealizedGainLoss ?? (currentVal - costBasis));
  const gainLossPct = Number(currency.gainLossPercentage ?? (costBasis > 0 ? (gainLoss / costBasis) * 100 : 0));

  const renderHealthBadge = () => {
    if (currency.rateSource === 'manual') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dbeafe', color: '#1d4ed8', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
          <FaUserEdit /> Manual Override
        </span>
      );
    }
    if (currency.isStale || currency.rateSource === 'fallback') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
          <FaExclamationCircle /> Stale Rate (> 24h)
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
        <FaCheckCircle /> Live Market Rate
      </span>
    );
  };

  // Filter historical data for chart based on timeframe
  const filteredHistory = [...rateHistory].reverse().filter((item, idx, arr) => {
    if (timeframe === 'all') return true;
    const daysLimit = parseInt(timeframe, 10);
    return idx >= arr.length - daysLimit;
  });

  const chartLabels = filteredHistory.map(h => (h.date ? new Date(h.date).toISOString().split('T')[0] : ''));
  const chartValues = filteredHistory.map(h => h.rate || (h.rates ? h.rates[code] : null));

  // If no history exists yet, generate base point
  if (chartLabels.length === 0) {
    chartLabels.push(new Date().toISOString().split('T')[0]);
    chartValues.push(currentRate);
  }

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: `${code} Exchange Rate (EGP)`,
        data: chartValues,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        borderWidth: 3,
        tension: 0.25,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#0284c7',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { weight: '600', size: 12 }, color: '#374151' },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `1 ${code} = ${Number(ctx.parsed.y).toFixed(3)} EGP`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value} EGP`,
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="page-container">
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <Link to="/currency" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
          <FaArrowLeft /> Back to Foreign Currency
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={`/currency/edit/${currency._id}`}
            className="action-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}
          >
            <FaEdit /> Edit
          </Link>
          <button
            onClick={handleDelete}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#ffffff' }}>
                {currency.name} ({code})
              </h1>
              {renderHealthBadge()}
            </div>
            <p style={{ margin: '8px 0 0 0', opacity: 0.85, fontSize: '15px' }}>
              Current Exchange Rate: <strong style={{ color: '#38bdf8' }}>1 {code} = {currentRate.toFixed(2)} EGP</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>Last Revaluation</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>
              {currency.lastRevaluationDate ? formatDate(currency.lastRevaluationDate) : formatDate(currency.date)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Amount Held */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><FaDollarSign /></div>
          <div>
            <div className="metric-label">Amount Held</div>
            <div className="metric-value">{amount.toLocaleString()} {code}</div>
            <div className="metric-sub">Foreign currency units</div>
          </div>
        </div>

        {/* Purchase Rate */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#f1f5f9', color: '#475569' }}><FaExchangeAlt /></div>
          <div>
            <div className="metric-label">Purchase Rate</div>
            <div className="metric-value">{purchaseRate.toFixed(2)} EGP</div>
            <div className="metric-sub">Acquisition rate per unit</div>
          </div>
        </div>

        {/* Current Rate */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#047857' }}><FaCoins /></div>
          <div>
            <div className="metric-label">Current Rate</div>
            <div className="metric-value" style={{ color: '#059669' }}>{currentRate.toFixed(2)} EGP</div>
            <div className="metric-sub">CIB / Revaluation price</div>
          </div>
        </div>

        {/* Cost Basis */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#f8fafc', color: '#334155' }}><FaCoins /></div>
          <div>
            <div className="metric-label">Total Cost Basis</div>
            <div className="metric-value">{formatCurrency(costBasis)}</div>
            <div className="metric-sub">Total purchase price</div>
          </div>
        </div>

        {/* Current Value */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}><FaCoins /></div>
          <div>
            <div className="metric-label">Current Value (EGP)</div>
            <div className="metric-value" style={{ color: '#1d4ed8' }}>{formatCurrency(currentVal)}</div>
            <div className="metric-sub">At current market rate</div>
          </div>
        </div>

        {/* Unrealized Gain / Loss */}
        <div className="metric-box" style={{ border: gainLoss >= 0 ? '2px solid #86efac' : '2px solid #fca5a5' }}>
          <div className="metric-icon" style={{ background: gainLoss >= 0 ? '#dcfce7' : '#fee2e2', color: gainLoss >= 0 ? '#15803d' : '#b91c1c' }}>
            <FaChartLine />
          </div>
          <div>
            <div className="metric-label">Unrealized Gain / Loss</div>
            <div className="metric-value" style={{ color: gainLoss >= 0 ? '#16a34a' : '#dc2626' }}>
              {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
            </div>
            <div className="metric-sub" style={{ fontWeight: '600', color: gainLoss >= 0 ? '#16a34a' : '#dc2626' }}>
              {gainLossPct >= 0 ? '+' : ''}{gainLossPct.toFixed(2)}% net change
            </div>
          </div>
        </div>
      </div>

      {/* Historical Exchange Rate Chart */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#111827' }}>
              {code} Exchange Rate History
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Historical daily snapshots recorded from CIB exchange feeds.
            </p>
          </div>

          {/* Timeframe Filters */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: '7', label: '1W' },
              { id: '30', label: '1M' },
              { id: '90', label: '3M' },
              { id: '180', label: '6M' },
              { id: 'all', label: 'All' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeframe(tab.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: timeframe === tab.id ? '2px solid #0284c7' : '1px solid #e5e7eb',
                  background: timeframe === tab.id ? '#f0f9ff' : '#ffffff',
                  color: timeframe === tab.id ? '#0369a1' : '#4b5563',
                  fontWeight: timeframe === tab.id ? '700' : '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '320px', position: 'relative' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default CurrencyDetailPage;
