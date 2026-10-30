// frontend/src/pages/DashboardSummary.js
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaBalanceScale,
  FaBullseye,
  FaChartLine,
  FaChartPie,
  FaChevronRight,
  FaCoins,
  FaCompass,
  FaExchangeAlt,
  FaGem,
  FaHome,
  FaLandmark,
  FaPiggyBank,
  FaPlus,
  FaUniversity,
  FaWallet,
} from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useGoldData } from '../context/GoldContext';
import { useMFData } from '../context/MFContext';
import { useCertData } from '../context/CertContext';
import { useCurrData } from '../context/CurrContext';
import { useBankData } from '../context/BankContext';
import { useCreditData } from '../context/CreditContext';
import { getRealEstates } from '../services/realEstateService';
import { getBudgetProgress } from '../services/budgetService';
import { getCertificates } from '../services/certificateService';
import { getCurrency } from '../services/currencyService';
import { QUICK_LAUNCH_ACTIONS, EXPLORE_LINKS } from '../config/dashboardActions';
import { formatCurrency } from '../utils/formatters';
import { normDiv } from '../utils/helper';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip);

const INIT_YEAR = 2022;
const CURRENT_YEAR = new Date().getFullYear();
const INVESTMENT_PERIOD = Math.max(CURRENT_YEAR - INIT_YEAR, 1);

const REPORT_KEYS = [
  'portfolio',
  'payroll',
  'spending',
  'trade-summary',
  'fund-summary',
  'gold-summary',
  'budgets',
  'credit',
];

const safeArray = (data) => (Array.isArray(data) ? data : []);
const safeNumber = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);
const safeObject = (obj) => (obj && typeof obj === 'object' ? obj : {});

const changeBetween = (current, base) => {
  if (!base || base <= 0) return null;
  return ((current - base) / base) * 100;
};

const formatSignedPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const DashboardSummary = ({ onOpenLauncher = () => {} }) => {
  const { user, canModify } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState(null);
  const [chartMode, setChartMode] = useState('current');
  const [budgetProgressList, setBudgetProgressList] = useState([]);
  const [savingsForexSummary, setSavingsForexSummary] = useState({
    totalCertValue: 0,
    activeCertCount: 0,
    totalForexValue: 0,
    totalForexGainLoss: 0,
    forexHoldingCount: 0,
  });

  const { summaryMetrics = {} } = useData();
  const { overallTotalPaid = 0, goldtotalNow = 0 } = useGoldData();
  const { overallTotals = {} } = useMFData();
  const { certificateSummary = {} } = useCertData();
  const { currencySummary = [] } = useCurrData();
  const { bankAccountData = {} } = useBankData();
  const { creditCardsSummary = {} } = useCreditData();
  const [realEstates, setRealEstates] = useState([]);

  useEffect(() => {
    let isMounted = true;

    getRealEstates({ status: 'Owned' })
      .then((data) => {
        if (isMounted) setRealEstates(data || []);
      })
      .catch((err) => console.error('Failed to load real estate for summary:', err));

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    getBudgetProgress({ period: 'monthly', year: currentYear, month: currentMonth })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : res?.data || [];
        setBudgetProgressList(list);
      })
      .catch(() => {
        if (isMounted) setBudgetProgressList([]);
      });

    Promise.all([getCertificates().catch(() => []), getCurrency().catch(() => [])])
      .then(([certsRes, currRes]) => {
        if (!isMounted) return;
        const certs = Array.isArray(certsRes) ? certsRes : certsRes?.data || [];
        const currs = Array.isArray(currRes) ? currRes : currRes?.data || [];

        const now = new Date();
        const activeCerts = certs.filter((cert) => {
          if (cert.status === 'withdrawn' || cert.status === 'matured') return false;
          if (
            cert.displayStatus === 'withdrawn' ||
            cert.displayStatus === 'matured' ||
            cert.displayStatus === 'future'
          ) {
            return false;
          }

          const start = cert.startDate ? new Date(cert.startDate) : null;
          if (start && now < start) return false;

          let maturity = cert.maturityDate ? new Date(cert.maturityDate) : null;
          if (!maturity && start && cert.period) {
            maturity = new Date(start);
            maturity.setMonth(maturity.getMonth() + Number(cert.period));
          }
          if (maturity && now > maturity) return false;

          return true;
        });

        const totalCertValue = activeCerts.reduce((acc, cert) => acc + Number(cert.amount || 0), 0);
        const totalForexValue = currs.reduce(
          (acc, curr) =>
            acc +
            Number(
              curr.currentValue ||
                curr.amount * (curr.currentRate || curr.purchaseRate || 0) ||
                0
            ),
          0
        );
        const totalForexCost = currs.reduce(
          (acc, curr) => acc + Number(curr.costBasis || curr.price || 0),
          0
        );

        setSavingsForexSummary({
          totalCertValue,
          activeCertCount: activeCerts.length,
          totalForexValue,
          totalForexGainLoss: totalForexValue - totalForexCost,
          forexHoldingCount: currs.length,
        });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const safeCurrencySummary = useMemo(() => safeArray(currencySummary), [currencySummary]);

  const calculations = useMemo(() => {
    const currencyTotalPrice = safeCurrencySummary.reduce(
      (sum, item) => sum + safeNumber(item.totalPrice),
      0
    );
    const currencyCurrentValue = safeCurrencySummary.reduce(
      (sum, item) => sum + safeNumber(item.currentPrice) * safeNumber(item.totalAmount),
      0
    );

    const goldPaid = safeNumber(overallTotalPaid);
    const goldCurrent = safeNumber(goldtotalNow);

    const certAmount = safeNumber(safeObject(certificateSummary).totalActiveAmount);
    const certReturns = safeNumber(safeObject(certificateSummary).totalExpectedReturns);

    const mfAmount = safeNumber(safeObject(overallTotals).totalOfAllMF);
    const mfValue = safeNumber(safeObject(overallTotals).totalSellingValue);
    const mfProfit = safeObject(overallTotals).totalProfit;

    const stockAmount = safeNumber(safeObject(summaryMetrics).netDeposits);
    const stockProfit = safeNumber(safeObject(summaryMetrics).totalProfitNow);
    const stockCurrent = stockAmount + stockProfit;

    const bankBalance = safeNumber(safeObject(bankAccountData).bank);
    const creditAvailable = safeNumber(safeObject(creditCardsSummary).totalAvailable);
    const creditOutstanding = safeNumber(safeObject(creditCardsSummary).totalOutstanding);

    const realEstateTotalPaid = realEstates.reduce(
      (sum, item) => sum + safeNumber(item.purchasePrice),
      0
    );
    const realEstateTotalCurrent = realEstates.reduce(
      (sum, item) => sum + safeNumber(item.currentValuation),
      0
    );

    const totalPaid =
      goldPaid +
      certAmount +
      mfAmount +
      stockAmount +
      bankBalance +
      currencyTotalPrice +
      realEstateTotalPaid;
    const totalCurrent =
      goldCurrent +
      certAmount +
      mfValue +
      stockCurrent +
      bankBalance +
      currencyCurrentValue +
      realEstateTotalCurrent;

    const goldCAGR =
      goldPaid > 0
        ? ((Math.pow(normDiv(goldCurrent, goldPaid), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const certCAGR =
      certAmount > 0
        ? ((Math.pow(normDiv(certReturns, certAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const mfCAGR =
      mfAmount > 0
        ? ((Math.pow(normDiv(mfValue, mfAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;
    const stockCAGR =
      stockAmount > 0
        ? ((Math.pow(normDiv(stockCurrent, stockAmount), 1 / INVESTMENT_PERIOD) - 1) * 100).toFixed(2)
        : 0;

    const totalGain = totalCurrent - totalPaid;
    const totalGainPct = totalPaid > 0 ? (totalGain / totalPaid) * 100 : 0;

    return {
      goldPaid,
      goldCurrent,
      goldCAGR,
      certAmount,
      certReturns,
      certCAGR,
      mfAmount,
      mfValue,
      mfProfit,
      mfCAGR,
      stockAmount,
      stockCurrent,
      stockCAGR,
      bankBalance,
      creditAvailable,
      creditOutstanding,
      currencyTotalPrice,
      currencyCurrentValue,
      realEstateTotalPaid,
      realEstateTotalCurrent,
      realEstates,
      totalPaid,
      totalCurrent,
      totalGain,
      totalGainPct,
      netWorth: totalCurrent - creditOutstanding,
    };
  }, [
    overallTotalPaid,
    goldtotalNow,
    certificateSummary,
    overallTotals,
    summaryMetrics,
    bankAccountData,
    creditCardsSummary,
    safeCurrencySummary,
    realEstates,
  ]);

  const holdings = useMemo(() => {
    const c = calculations;

    return [
      {
        key: 'gold',
        name: 'Gold',
        subtitle: 'Bullion & jewellery',
        icon: FaGem,
        tone: 'gold',
        color: '#f59e0b',
        current: c.goldCurrent,
        invested: c.goldPaid,
        metaLabel: 'Invested',
        metaValue: c.goldPaid,
        delta: changeBetween(c.goldCurrent, c.goldPaid),
        viewPath: '/gold-wallet',
        addPath: '/gold-wallet/new',
      },
      {
        key: 'certificates',
        name: 'Certificates',
        subtitle: 'Fixed-income deposits',
        icon: FaUniversity,
        tone: 'sky',
        color: '#38bdf8',
        current: c.certAmount,
        invested: c.certAmount,
        metaLabel: 'Expected returns',
        metaValue: c.certReturns,
        delta: changeBetween(c.certReturns, c.certAmount),
        viewPath: '/certificates',
        addPath: '/certificates/new',
      },
      {
        key: 'funds',
        name: 'Mutual Funds',
        subtitle: 'Managed portfolios',
        icon: FaChartPie,
        tone: 'violet',
        color: '#a78bfa',
        current: c.mfValue,
        invested: c.mfAmount,
        metaLabel: 'Invested',
        metaValue: c.mfAmount,
        delta: changeBetween(c.mfValue, c.mfAmount),
        viewPath: '/mutual-funds',
        addPath: '/mutual-funds/new',
      },
      {
        key: 'stocks',
        name: 'Stocks',
        subtitle: 'Trading portfolio',
        icon: FaChartLine,
        tone: 'emerald',
        color: '#34d399',
        current: c.stockCurrent,
        invested: c.stockAmount,
        metaLabel: 'Net deposits',
        metaValue: c.stockAmount,
        delta: changeBetween(c.stockCurrent, c.stockAmount),
        viewPath: '/trades',
        addPath: '/trades/add',
      },
      {
        key: 'bank',
        name: 'Bank & Credit',
        subtitle: 'Cash and card accounts',
        icon: FaLandmark,
        tone: 'cyan',
        color: '#22d3ee',
        current: c.bankBalance,
        invested: c.bankBalance,
        metaLabel: 'Credit available',
        metaValue: c.creditAvailable,
        delta: null,
        note: c.creditOutstanding > 0 ? `${formatCurrency(c.creditOutstanding)} due` : 'No balance due',
        viewPath: '/credit-cards',
        addPath: null,
      },
      {
        key: 'currency',
        name: 'Foreign Currency',
        subtitle: 'Multi-currency wallet',
        icon: FaExchangeAlt,
        tone: 'rose',
        color: '#fb7185',
        current: c.currencyCurrentValue,
        invested: c.currencyTotalPrice,
        metaLabel: 'Cost basis',
        metaValue: c.currencyTotalPrice,
        delta: changeBetween(c.currencyCurrentValue, c.currencyTotalPrice),
        viewPath: '/currency',
        addPath: '/currency/new',
      },
      {
        key: 'real-estate',
        name: 'Real Estate',
        subtitle: 'Property portfolio',
        icon: FaHome,
        tone: 'amber',
        color: '#fbbf24',
        current: c.realEstateTotalCurrent,
        invested: c.realEstateTotalPaid,
        metaLabel: 'Purchase price',
        metaValue: c.realEstateTotalPaid,
        delta: changeBetween(c.realEstateTotalCurrent, c.realEstateTotalPaid),
        viewPath: '/real-estate',
        addPath: '/real-estate/new',
      },
    ];
  }, [calculations]);

  const activeAssetCount = useMemo(
    () => holdings.filter((asset) => asset.current > 0 || asset.invested > 0).length,
    [holdings]
  );

  const assetMix = useMemo(() => {
    const list = holdings.filter((asset) => asset.current > 0);
    return {
      list,
      total: list.reduce((sum, asset) => sum + asset.current, 0),
    };
  }, [holdings]);

  const chartSegments = useMemo(() => {
    const list = holdings
      .map((asset) => ({
        ...asset,
        value: chartMode === 'current' ? asset.current : asset.invested,
      }))
      .filter((asset) => asset.value > 0);

    return {
      list,
      total: list.reduce((sum, asset) => sum + asset.value, 0),
    };
  }, [holdings, chartMode]);

  const chartData = useMemo(
    () => ({
      labels: chartSegments.list.map((asset) => asset.name),
      datasets: [
        {
          data: chartSegments.list.map((asset) => asset.value),
          backgroundColor: chartSegments.list.map((asset) => asset.color),
          borderColor: '#0b1220',
          borderWidth: 3,
          hoverOffset: 10,
        },
      ],
    }),
    [chartSegments]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { animateRotate: true, duration: 650 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(8, 15, 30, 0.96)',
          borderColor: 'rgba(148, 163, 184, 0.25)',
          borderWidth: 1,
          padding: 10,
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          callbacks: {
            label: (context) => ` ${formatCurrency(context.raw)}`,
          },
        },
      },
    }),
    []
  );

  const budgetTotals = useMemo(() => {
    const budgeted = budgetProgressList.reduce(
      (sum, item) => sum + safeNumber(item.budgetedAmount),
      0
    );
    const spent = budgetProgressList.reduce((sum, item) => sum + safeNumber(item.spentAmount), 0);

    return {
      budgeted,
      spent,
      pct: budgeted > 0 ? (spent / budgeted) * 100 : 0,
    };
  }, [budgetProgressList]);

  useEffect(() => {
    const hasMinimumData =
      summaryMetrics &&
      overallTotalPaid !== undefined &&
      overallTotals &&
      certificateSummary &&
      safeCurrencySummary &&
      bankAccountData &&
      creditCardsSummary;

    if (hasMinimumData) {
      setIsLoading(false);
    }
  }, [
    summaryMetrics,
    overallTotalPaid,
    overallTotals,
    certificateSummary,
    safeCurrencySummary,
    bankAccountData,
    creditCardsSummary,
  ]);

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const displayName = user?.fullName || user?.username || '';
  const firstName = displayName ? displayName.split(' ')[0] : '';

  const reports = useMemo(
    () => EXPLORE_LINKS.filter((link) => REPORT_KEYS.includes(link.key)),
    []
  );

  if (isLoading) {
    return (
      <div className="dashboard-loading" aria-busy="true" aria-label="Loading dashboard">
        <div className="dash-skeleton dash-skeleton-hero" />
        <div className="dash-skeleton-row">
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
          <div className="dash-skeleton" />
        </div>
        <div className="dash-skeleton dash-skeleton-panel" />
        <p className="dash-loading-copy">
          <span className="dash-loading-spinner" aria-hidden="true" />
          Building your financial overview…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error">
        <h2>Unable to load your dashboard</h2>
        <p>{error}</p>
        <button type="button" className="dash-btn dash-btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  const gainIsPositive = calculations.totalGain >= 0;

  return (
    <div className="dash-content">
      {/* Hero */}
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <div className="dash-eyebrow">
            <span className="dash-live-dot" aria-hidden="true" />
            Financial overview
            <span className="dash-eyebrow-divider" aria-hidden="true" />
            <span className="dash-eyebrow-date">{dateLabel}</span>
          </div>
          <h1>{firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}</h1>
          <p>
            One clean view of your cash, investments and spending — with every action one tap
            away.
          </p>
          <div className="dash-hero-actions">
            {canModify && (
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={() => onOpenLauncher('create')}
              >
                <FaPlus aria-hidden="true" />
                Add something new
              </button>
            )}
            <button
              type="button"
              className="dash-btn dash-btn-ghost"
              onClick={() => onOpenLauncher('explore')}
            >
              <FaCompass aria-hidden="true" />
              Explore summaries
            </button>
          </div>
        </div>

        <div className="dash-hero-card">
          <div className="dash-hero-card-head">
            <span>Net worth</span>
            <span className="dash-live-pill">
              <span className="dash-live-dot" aria-hidden="true" />
              Live
            </span>
          </div>
          <div className="dash-hero-value">{formatCurrency(calculations.netWorth)}</div>
          <div className={`dash-hero-delta ${gainIsPositive ? 'up' : 'down'}`}>
            {gainIsPositive ? <FaArrowUp aria-hidden="true" /> : <FaArrowDown aria-hidden="true" />}
            <strong>{formatCurrency(calculations.totalGain)}</strong>
            <span>({formatSignedPercent(calculations.totalGainPct)})</span>
            <em>all-time return</em>
          </div>

          <div className="dash-mix-bar" aria-hidden="true">
            {assetMix.list.map((asset) => (
              <span
                key={asset.key}
                style={{
                  width: `${assetMix.total > 0 ? (asset.current / assetMix.total) * 100 : 0}%`,
                  background: asset.color,
                }}
              />
            ))}
            {assetMix.total === 0 && <span className="dash-mix-empty" />}
          </div>

          <div className="dash-hero-card-foot">
            <div>
              <span>Invested</span>
              <strong>{formatCurrency(calculations.totalPaid)}</strong>
            </div>
            <div>
              <span>Credit due</span>
              <strong>{formatCurrency(calculations.creditOutstanding)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="dash-kpis" aria-label="Key financial metrics">
        <article className="dash-kpi tone-sky">
          <span className="dash-kpi-icon">
            <FaPiggyBank aria-hidden="true" />
          </span>
          <div>
            <span className="dash-kpi-label">Invested capital</span>
            <strong className="dash-kpi-value">{formatCurrency(calculations.totalPaid)}</strong>
            <small>
              {activeAssetCount} active asset class{activeAssetCount === 1 ? '' : 'es'}
            </small>
          </div>
        </article>

        <article className={`dash-kpi ${gainIsPositive ? 'tone-emerald' : 'tone-rose'}`}>
          <span className="dash-kpi-icon">
            <FaChartLine aria-hidden="true" />
          </span>
          <div>
            <span className="dash-kpi-label">Portfolio return</span>
            <strong className="dash-kpi-value">{formatCurrency(calculations.totalGain)}</strong>
            <small className={gainIsPositive ? 'positive' : 'negative'}>
              {formatSignedPercent(calculations.totalGainPct)} vs invested
            </small>
          </div>
        </article>

        <article className="dash-kpi tone-cyan">
          <span className="dash-kpi-icon">
            <FaCoins aria-hidden="true" />
          </span>
          <div>
            <span className="dash-kpi-label">Liquid cash</span>
            <strong className="dash-kpi-value">{formatCurrency(calculations.bankBalance)}</strong>
            <small>{formatCurrency(calculations.creditAvailable)} credit available</small>
          </div>
        </article>

        <article className="dash-kpi tone-violet">
          <span className="dash-kpi-icon">
            <FaBullseye aria-hidden="true" />
          </span>
          <div>
            <span className="dash-kpi-label">Budget used</span>
            <strong className="dash-kpi-value">
              {budgetTotals.budgeted > 0 ? `${Math.round(budgetTotals.pct)}%` : '—'}
            </strong>
            <small>
              {budgetTotals.budgeted > 0
                ? `${formatCurrency(budgetTotals.spent)} of ${formatCurrency(budgetTotals.budgeted)}`
                : 'No budget set for this month'}
            </small>
          </div>
        </article>
      </section>

      {/* Quick launch */}
      {canModify && (
        <section className="dash-section">
          <div className="dash-section-head">
            <div>
              <h2>Quick launch</h2>
              <p>Your most-used actions, ready to go.</p>
            </div>
            <button
              type="button"
              className="dash-text-btn"
              onClick={() => onOpenLauncher('create')}
            >
              All actions <FaArrowRight aria-hidden="true" />
            </button>
          </div>

          <div className="dash-launch-grid">
            {QUICK_LAUNCH_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.key}
                  to={action.path}
                  className={`dash-launch-tile tone-${action.tone}`}
                >
                  <span className="dash-launch-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="dash-launch-copy">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <FaArrowRight className="dash-launch-arrow" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Allocation */}
      <section className="dash-panel dash-allocation">
        <div className="dash-panel-head">
          <div className="dash-panel-title">
            <span className="dash-panel-icon tone-sky">
              <FaChartPie aria-hidden="true" />
            </span>
            <div>
              <h2>Asset allocation</h2>
              <p>How your wealth is distributed across asset classes.</p>
            </div>
          </div>
          <div className="dash-toggle" role="group" aria-label="Allocation value basis">
            <button
              type="button"
              className={`dash-toggle-btn ${chartMode === 'current' ? 'active' : ''}`}
              onClick={() => setChartMode('current')}
            >
              Current
            </button>
            <button
              type="button"
              className={`dash-toggle-btn ${chartMode === 'invested' ? 'active' : ''}`}
              onClick={() => setChartMode('invested')}
            >
              Invested
            </button>
          </div>
        </div>

        {chartSegments.total > 0 ? (
          <div className="dash-allocation-body">
            <div className="dash-donut-wrap">
              <Doughnut data={chartData} options={chartOptions} />
              <div className="dash-donut-center">
                <span>{chartMode === 'current' ? 'Current value' : 'Total invested'}</span>
                <strong>{formatCurrency(chartSegments.total)}</strong>
                <small>{chartSegments.list.length} asset classes</small>
              </div>
            </div>

            <div className="dash-legend">
              {chartSegments.list.map((asset) => {
                const share = (asset.value / chartSegments.total) * 100;
                return (
                  <Link key={asset.key} to={asset.viewPath} className="dash-legend-row">
                    <span className="dash-legend-dot" style={{ background: asset.color }} />
                    <span className="dash-legend-name">{asset.name}</span>
                    <span className="dash-legend-value">{formatCurrency(asset.value)}</span>
                    <span className="dash-legend-share">{share.toFixed(1)}%</span>
                    <FaChevronRight className="dash-legend-chevron" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="dash-empty">
            <FaChartPie aria-hidden="true" />
            <h3>No holdings yet</h3>
            <p>Add your first investment or asset to see your allocation come to life.</p>
            {canModify && (
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={() => onOpenLauncher('create')}
              >
                <FaPlus aria-hidden="true" /> Add a holding
              </button>
            )}
          </div>
        )}
      </section>

      {/* Holdings */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2>Your holdings</h2>
            <p>Current value, money invested and performance by asset class.</p>
          </div>
          <Link to="/portfolio" className="dash-text-btn">
            Open portfolio <FaArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="dash-holdings-grid">
          {holdings.map((asset) => {
            const Icon = asset.icon;
            const share =
              calculations.totalCurrent > 0 ? (asset.current / calculations.totalCurrent) * 100 : 0;
            return (
              <article key={asset.key} className={`dash-holding-card tone-${asset.tone}`}>
                <div className="dash-holding-head">
                  <span className="dash-holding-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <div className="dash-holding-title">
                    <h3>{asset.name}</h3>
                    <span>{asset.subtitle}</span>
                  </div>
                  {asset.delta !== null ? (
                    <span className={`dash-delta ${asset.delta >= 0 ? 'up' : 'down'}`}>
                      {formatSignedPercent(asset.delta)}
                    </span>
                  ) : (
                    <span className="dash-delta neutral">{asset.note}</span>
                  )}
                </div>

                <div className="dash-holding-value">{formatCurrency(asset.current)}</div>

                <div className="dash-holding-meta">
                  <span>{asset.metaLabel}</span>
                  <strong>{formatCurrency(asset.metaValue)}</strong>
                </div>

                <div className="dash-holding-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(100, share))}%`, background: asset.color }} />
                </div>

                <div className="dash-holding-foot">
                  <Link to={asset.viewPath} className="dash-holding-link">
                    Open <FaArrowRight aria-hidden="true" />
                  </Link>
                  {canModify && asset.addPath && (
                    <Link to={asset.addPath} className="dash-holding-add">
                      <FaPlus aria-hidden="true" /> Add
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Budget + savings */}
      <div className="dash-two-col">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">
              <span className="dash-panel-icon tone-violet">
                <FaBullseye aria-hidden="true" />
              </span>
              <div>
                <h2>Budget pulse</h2>
                <p>{monthLabel} · spending against category limits.</p>
              </div>
            </div>
            <Link to="/expenditures/budgets" className="dash-text-btn">
              Manage <FaArrowRight aria-hidden="true" />
            </Link>
          </div>

          {budgetProgressList.length > 0 ? (
            <div className="dash-budget-list">
              {budgetProgressList.map((budget) => {
                const barColor =
                  budget.alertStatus === 'red'
                    ? '#f87171'
                    : budget.alertStatus === 'yellow'
                    ? '#fbbf24'
                    : '#34d399';
                return (
                  <div key={budget.budgetId} className="dash-budget-item">
                    <div className="dash-budget-top">
                      <strong>{budget.category}</strong>
                      <span style={{ color: barColor }}>{Math.round(budget.percentageUsed)}%</span>
                    </div>
                    <div className="dash-budget-track">
                      <span
                        style={{
                          width: `${Math.min(100, budget.percentageUsed)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                    <div className="dash-budget-bottom">
                      <span>{formatCurrency(budget.spentAmount)} spent</span>
                      <span>{formatCurrency(budget.budgetedAmount)} limit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty compact">
              <FaBullseye aria-hidden="true" />
              <h3>No budgets for {monthLabel}</h3>
              <p>Create a category budget to track your monthly spending.</p>
              <Link to="/expenditures/budgets" className="dash-btn dash-btn-ghost">
                Set up budgets
              </Link>
            </div>
          )}
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">
              <span className="dash-panel-icon tone-emerald">
                <FaLandmark aria-hidden="true" />
              </span>
              <div>
                <h2>Savings & FX</h2>
                <p>Fixed income and foreign-currency value.</p>
              </div>
            </div>
            <Link to="/certificates" className="dash-text-btn">
              Details <FaArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="dash-savings-list">
            <Link to="/certificates" className="dash-savings-row">
              <span className="dash-savings-icon tone-sky">
                <FaUniversity aria-hidden="true" />
              </span>
              <span className="dash-savings-copy">
                <strong>Certificates</strong>
                <small>{savingsForexSummary.activeCertCount} active deposit(s)</small>
              </span>
              <span className="dash-savings-value">
                {formatCurrency(savingsForexSummary.totalCertValue)}
              </span>
            </Link>

            <Link to="/currency" className="dash-savings-row">
              <span className="dash-savings-icon tone-rose">
                <FaExchangeAlt aria-hidden="true" />
              </span>
              <span className="dash-savings-copy">
                <strong>Foreign currency</strong>
                <small>{savingsForexSummary.forexHoldingCount} holding(s)</small>
              </span>
              <span className="dash-savings-value">
                {formatCurrency(savingsForexSummary.totalForexValue)}
              </span>
            </Link>

            <div className="dash-savings-row static">
              <span
                className={`dash-savings-icon ${
                  savingsForexSummary.totalForexGainLoss >= 0 ? 'tone-emerald' : 'tone-rose'
                }`}
              >
                {savingsForexSummary.totalForexGainLoss >= 0 ? (
                  <FaArrowUp aria-hidden="true" />
                ) : (
                  <FaArrowDown aria-hidden="true" />
                )}
              </span>
              <span className="dash-savings-copy">
                <strong>Unrealized FX gain / loss</strong>
                <small>Calculated with daily CIB rates</small>
              </span>
              <span
                className={`dash-savings-value ${
                  savingsForexSummary.totalForexGainLoss >= 0 ? 'positive' : 'negative'
                }`}
              >
                {savingsForexSummary.totalForexGainLoss >= 0 ? '+' : ''}
                {formatCurrency(savingsForexSummary.totalForexGainLoss)}
              </span>
            </div>
          </div>

          {calculations.realEstates.length > 0 && (
            <div className="dash-property-note">
              <FaHome aria-hidden="true" />
              <span>
                {calculations.realEstates.length} propert
                {calculations.realEstates.length === 1 ? 'y' : 'ies'} valued at{' '}
                <strong>{formatCurrency(calculations.realEstateTotalCurrent)}</strong>
              </span>
              <Link to="/real-estate">
                View <FaArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* Reports */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2>Reports & insights</h2>
            <p>Go deeper with summaries built for every part of your finances.</p>
          </div>
          <button type="button" className="dash-text-btn" onClick={() => onOpenLauncher('explore')}>
            Browse all <FaArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="dash-reports-grid">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link key={report.key} to={report.path} className={`dash-report tone-${report.tone}`}>
                <span className="dash-report-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="dash-report-copy">
                  <strong>{report.label}</strong>
                  <small>{report.description}</small>
                </span>
                <FaArrowRight className="dash-report-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="dash-footnote">
        <span>
          <FaWallet aria-hidden="true" /> Values combine live market prices with your latest
          recorded transactions.
        </span>
        <span>
          <FaBalanceScale aria-hidden="true" /> Returns are indicative and exclude taxes and fees
          where not recorded.
        </span>
      </div>
    </div>
  );
};

export default DashboardSummary;
