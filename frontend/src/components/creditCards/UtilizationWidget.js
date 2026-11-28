// frontend/src/components/creditCards/UtilizationWidget.js
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { getUtilization } from '../../services/creditCardService';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../ui/Badge';
import './UtilizationWidget.css';

const getSeverityMeta = (utilization) => {
  const pct = Number(utilization) || 0;
  if (pct >= 70) {
    return { progressClass: 'fs-progress--negative', tone: 'negative', label: 'High' };
  }
  if (pct >= 30) {
    return { progressClass: 'fs-progress--warning', tone: 'warning', label: 'Elevated' };
  }
  return { progressClass: '', tone: 'neutral', label: '' };
};

const UtilizationWidget = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUtilization()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load credit utilization:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data || !data.cards || data.cards.length === 0) {
    return null;
  }

  const { overallUtilization, totalBalance, totalLimit, hasAlerts, cards } = data;
  const overallPct = Number(overallUtilization) || 0;
  const overallMeta = getSeverityMeta(overallPct);

  return (
    <section className="cc-util-card" aria-label="Credit Utilization Health">
      <div className="cc-util-header">
        <div className="cc-util-title-group">
          <FaShieldAlt className="cc-util-icon" aria-hidden="true" />
          <div>
            <h2>Credit Utilization Health</h2>
            <p className="cc-util-subtitle">Keep utilization below 30% to optimize credit health</p>
          </div>
        </div>
        <div className="cc-util-overall">
          <Badge tone={overallMeta.tone}>
            <span className="fs-num">{overallPct.toFixed(1)}%</span> Overall
            {overallMeta.label ? ` — ${overallMeta.label}` : ''}
          </Badge>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="cc-util-meter-wrap">
        <div className="cc-util-progress-track">
          <progress
            className={`cc-util-progress ${overallMeta.progressClass}`.trim()}
            aria-label="Overall credit utilization"
            aria-valuetext={`${overallPct.toFixed(1)}%${overallMeta.label ? ` — ${overallMeta.label}` : ''}`}
            value={Math.min(100, Math.max(0, Number(overallPct.toFixed(1))))}
            max={100}
          />
          <div className="cc-util-threshold-30" title="Target Threshold (30%)" aria-hidden="true" />
        </div>
        <div className="cc-util-meter-labels">
          <span className="fs-num">{formatCurrency(totalBalance)} Used</span>
          <span className="fs-num">{formatCurrency(totalLimit)} Total Limit</span>
        </div>
      </div>

      {/* Alert Banner if any cards exceeded threshold (informational 30% threshold) */}
      {hasAlerts && (
        <div className="cc-util-alert-banner" role="status">
          <FaExclamationTriangle className="cc-util-alert-icon" aria-hidden="true" />
          <span>
            One or more cards exceed the recommended 30% threshold. Consider paying down balances prior to statement close dates.
          </span>
        </div>
      )}

      {/* Individual Cards Breakdown */}
      <div className="cc-util-cards-grid">
        {cards.map((c) => {
          const pct = Number(c.utilization) || 0;
          const meta = getSeverityMeta(pct);
          return (
            <div key={c.cardId} className="cc-util-item">
              <div className="cc-util-item-header">
                <span className="cc-util-item-name">{c.cardName}</span>
                <span className="cc-util-item-pct fs-num">{pct.toFixed(1)}%</span>
              </div>

              <progress
                className={`cc-util-progress ${meta.progressClass}`.trim()}
                aria-label={`Utilization for ${c.cardName}`}
                aria-valuetext={`${pct.toFixed(1)}%${meta.label ? ` — ${meta.label}` : ''}`}
                value={Math.min(100, Math.max(0, Number(pct.toFixed(1))))}
                max={100}
              />

              <div className="cc-util-item-details">
                <span className="fs-num">{formatCurrency(c.currentBalance)}</span>
                <span className="cc-util-item-limit fs-num">/ {formatCurrency(c.limit)}</span>
              </div>

              {(meta.label || c.isAlert) && (
                <div className="cc-util-item-badges">
                  {meta.label && <Badge tone={meta.tone}>{meta.label}</Badge>}
                  {c.isAlert && (
                    <Badge tone="neutral">
                      <FaExclamationTriangle size={10} aria-hidden="true" /> Above {c.threshold}% Alert
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default UtilizationWidget;
