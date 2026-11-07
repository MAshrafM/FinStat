// frontend/src/pages/dashboard/HoldingsGrid.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaPlus } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const formatSignedPercent = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '0.0%';
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
};

const HoldingsGrid = ({ holdings = [], totalCurrent = 0, canModify = false }) => {
  return (
    <section className="dash-section">
      <div className="dash-section-head">
        <div>
          <h2>Your holdings</h2>
          <p>Current value, money invested and performance by asset class.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/analytics/purchasing-power" className="dash-text-btn">
            Purchasing power <FaArrowRight aria-hidden="true" />
          </Link>
          <Link to="/portfolio" className="dash-text-btn">
            Open portfolio <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="dash-holdings-grid">
        {holdings.map((asset) => {
          const Icon = asset.icon;
          const share = totalCurrent > 0 ? (asset.current / totalCurrent) * 100 : 0;

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
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, share))}%`,
                    background: asset.color,
                  }}
                />
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
  );
};

export default React.memo(HoldingsGrid);
