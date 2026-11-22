// frontend/src/components/portfolio/SummaryCards.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import {
  FaWallet,
  FaChartLine,
  FaPercentage,
  FaCoins,
  FaInfoCircle,
} from 'react-icons/fa';
import { Delta } from '../ui';

const SummaryCards = ({ summary = {} }) => {
  const {
    totalInvested = 0,
    totalCurrentValue = 0,
    totalPnL = 0,
    unrealizedPnL = 0,
    realizedPnL = 0,
    roiPercentage = 0,
    xirr = null,
    xirrMessage = null,
    holdingsCount = 0,
    priceHealth = 'live',
  } = summary;

  const isPositivePnL = totalPnL >= 0;
  const pnlTone = totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral';
  const pnlLabel = isPositivePnL ? 'Gain' : 'Loss';

  return (
    <div className="portfolio-kpi-grid">
      {/* 1. Total Invested */}
      <div className="kpi-card" data-testid="kpi-total-invested">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Total Invested</span>
          <span className="kpi-card-icon" aria-hidden="true">
            <FaWallet />
          </span>
        </div>
        <div className="kpi-card-value fs-num">{formatCurrency(totalInvested)}</div>
        <div className="kpi-card-sub">
          Across <strong className="fs-num">{holdingsCount}</strong> active positions
        </div>
      </div>

      {/* 2. Current Portfolio Value */}
      <div className="kpi-card" data-testid="kpi-current-valuation">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Current Valuation</span>
          <span className="kpi-card-icon" aria-hidden="true">
            <FaCoins />
          </span>
        </div>
        <div className="kpi-card-value fs-num">{formatCurrency(totalCurrentValue)}</div>
        <div className="kpi-card-sub">
          <span className={`status-pill ${priceHealth}`} title={`Valuation health: ${priceHealth}`}>
            <span className={`portfolio-status-dot ${priceHealth}`} aria-hidden="true"></span>
            {priceHealth === 'live' ? 'Live Market' : 'Fallback / Mixed'}
          </span>
        </div>
      </div>

      {/* 3. Total Profit & Loss */}
      <div className="kpi-card" data-testid="kpi-total-pnl">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Total Gain / Loss</span>
          <span className="kpi-card-icon" aria-hidden="true">
            <FaChartLine />
          </span>
        </div>
        <div className="kpi-card-value">
          <Delta
            value={formatCurrency(Math.abs(totalPnL))}
            tone={pnlTone}
            sign={isPositivePnL ? 'positive' : 'negative'}
            label={pnlLabel}
            className="fs-num"
          />
        </div>
        <div className="kpi-card-sub">
          <span>Unrealized: <strong className="fs-num">{formatCurrency(unrealizedPnL)}</strong></span>
          {realizedPnL !== 0 && (
            <span> | Realized: <strong className="fs-num">{formatCurrency(realizedPnL)}</strong></span>
          )}
        </div>
      </div>

      {/* 4. Overall ROI */}
      <div className="kpi-card" data-testid="kpi-overall-roi">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Overall Return (ROI)</span>
          <span className="kpi-card-icon" aria-hidden="true">
            <FaPercentage />
          </span>
        </div>
        <div className="kpi-card-value fs-num">
          {roiPercentage >= 0 ? '+' : ''}
          {roiPercentage.toFixed(2)}%
        </div>
        <div className="kpi-card-sub">Total capital net appreciation</div>
      </div>

      {/* 5. XIRR (Annualized Return) */}
      <div className="kpi-card" data-testid="kpi-annualized-xirr">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Annualized XIRR</span>
          <span
            className="kpi-card-icon help-cursor"
            title={xirrMessage || 'Internal Rate of Return computed from dated cash flows.'}
            aria-hidden="true"
          >
            <FaInfoCircle />
          </span>
        </div>
        <div className="kpi-card-value fs-num">
          {xirr !== null ? (
            `${xirr >= 0 ? '+' : ''}${xirr.toFixed(2)}%`
          ) : (
            'N/A'
          )}
        </div>
        <div className="kpi-card-sub">
          {xirr !== null ? 'Time-weighted annual rate' : xirrMessage || 'Requires multi-dated cash flows'}
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
