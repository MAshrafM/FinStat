// frontend/src/pages/dashboard/NetWorthHero.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown, FaArrowUp, FaCompass, FaPlus } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const formatSignedPercent = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '0.0%';
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
};

const NetWorthHero = ({
  calculations,
  assetMix,
  user,
  canModify,
  dateLabel,
  onOpenLauncher = () => {},
}) => {
  const displayName = user?.fullName || user?.username || '';
  const firstName = displayName ? displayName.split(' ')[0] : '';
  const gainIsPositive = (calculations?.totalGain || 0) >= 0;

  return (
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
          One clean view of your cash, investments and spending — with every action one tap away.
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
          <Link
            to="/reports/financial"
            className="dash-btn dash-btn-ghost"
            style={{ textDecoration: 'none' }}
          >
            📑 Financial Report
          </Link>
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
        <div className="dash-hero-value">{formatCurrency(calculations?.netWorth || 0)}</div>
        <div className={`dash-hero-delta ${gainIsPositive ? 'up' : 'down'}`}>
          {gainIsPositive ? <FaArrowUp aria-hidden="true" /> : <FaArrowDown aria-hidden="true" />}
          <strong>{formatCurrency(calculations?.totalGain || 0)}</strong>
          <span>({formatSignedPercent(calculations?.totalGainPct || 0)})</span>
          <em>all-time return</em>
        </div>

        <div className="dash-mix-bar" aria-hidden="true">
          {(assetMix?.list || []).map((asset) => (
            <span
              key={asset.key}
              style={{
                width: `${(assetMix?.total || 0) > 0 ? (asset.current / assetMix.total) * 100 : 0}%`,
                background: asset.color,
              }}
            />
          ))}
          {(!assetMix?.total || assetMix.total === 0) && <span className="dash-mix-empty" />}
        </div>

        <div className="dash-hero-card-foot">
          <div>
            <span>Invested</span>
            <strong>{formatCurrency(calculations?.totalPaid || 0)}</strong>
          </div>
          <div>
            <span>Credit due</span>
            <strong>{formatCurrency(calculations?.creditOutstanding || 0)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(NetWorthHero);

