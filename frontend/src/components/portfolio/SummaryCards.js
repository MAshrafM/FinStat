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
  const isPositiveRoi = roiPercentage >= 0;
  const isPositiveXirr = xirr !== null && xirr >= 0;

  return (
    <div className="portfolio-kpi-grid">
      {/* 1. Total Invested */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Total Invested</span>
          <span className="kpi-card-icon" style={{ color: '#38bdf8' }}>
            <FaWallet />
          </span>
        </div>
        <div className="kpi-card-value">{formatCurrency(totalInvested)}</div>
        <div className="kpi-card-sub">
          Across <strong>{holdingsCount}</strong> active positions
        </div>
      </div>

      {/* 2. Current Portfolio Value */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Current Valuation</span>
          <span className="kpi-card-icon" style={{ color: '#818cf8' }}>
            <FaCoins />
          </span>
        </div>
        <div className="kpi-card-value">{formatCurrency(totalCurrentValue)}</div>
        <div className="kpi-card-sub">
          <span className={`status-pill ${priceHealth}`} title={`Valuation health: ${priceHealth}`}>
            <span className={`status-dot ${priceHealth}`}></span>
            {priceHealth === 'live' ? 'Live Market' : 'Fallback / Mixed'}
          </span>
        </div>
      </div>

      {/* 3. Total Profit & Loss */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Total Gain / Loss</span>
          <span className="kpi-card-icon" style={{ color: isPositivePnL ? '#4ade80' : '#f87171' }}>
            <FaChartLine />
          </span>
        </div>
        <div className="kpi-card-value" style={{ color: isPositivePnL ? '#4ade80' : '#f87171' }}>
          {isPositivePnL ? '+' : ''}
          {formatCurrency(totalPnL)}
        </div>
        <div className="kpi-card-sub">
          <span>Unrealized: {formatCurrency(unrealizedPnL)}</span>
          {realizedPnL !== 0 && <span>| Realized: {formatCurrency(realizedPnL)}</span>}
        </div>
      </div>

      {/* 4. Overall ROI */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Overall Return (ROI)</span>
          <span className="kpi-card-icon" style={{ color: '#fbbf24' }}>
            <FaPercentage />
          </span>
        </div>
        <div className="kpi-card-value">
          <span className={`kpi-trend ${isPositiveRoi ? 'positive' : 'negative'}`}>
            {isPositiveRoi ? '+' : ''}
            {roiPercentage.toFixed(2)}%
          </span>
        </div>
        <div className="kpi-card-sub">Total capital net appreciation</div>
      </div>

      {/* 5. XIRR (Annualized Return) */}
      <div className="kpi-card">
        <div className="kpi-card-header">
          <span className="kpi-card-title">Annualized XIRR</span>
          <span
            className="kpi-card-icon"
            style={{ color: '#c084fc', cursor: 'help' }}
            title={xirrMessage || 'Internal Rate of Return computed from dated cash flows.'}
          >
            <FaInfoCircle />
          </span>
        </div>
        <div className="kpi-card-value">
          {xirr !== null ? (
            <span className={`kpi-trend ${isPositiveXirr ? 'positive' : 'negative'}`}>
              {isPositiveXirr ? '+' : ''}
              {xirr.toFixed(2)}%
            </span>
          ) : (
            <span className="kpi-trend neutral" title={xirrMessage || 'Insufficient data'}>
              N/A
            </span>
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
