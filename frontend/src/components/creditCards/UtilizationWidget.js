// frontend/src/components/creditCards/UtilizationWidget.js
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { getUtilization } from '../../services/creditCardService';
import { formatCurrency } from '../../utils/formatters';
import './UtilizationWidget.css';

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

  const getBarColor = (utilization) => {
    if (utilization >= 50) return '#ef4444'; // Red (High risk)
    if (utilization >= 30) return '#f59e0b'; // Amber (Moderate)
    return '#10b981'; // Green (Healthy)
  };

  return (
    <div className="utilization-widget-card animate-fade-in">
      <div className="utilization-header">
        <div className="utilization-title-group">
          <FaShieldAlt className="utilization-icon-shield" />
          <div>
            <h3>Credit Utilization Health</h3>
            <p className="utilization-subtitle">Keep utilization below 30% to optimize credit health</p>
          </div>
        </div>
        <div className="utilization-overall-badge" style={{ backgroundColor: getBarColor(overallUtilization) }}>
          {overallUtilization.toFixed(1)}% Overall
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="utilization-meter-container">
        <div className="utilization-meter-track">
          <div
            className="utilization-meter-fill"
            style={{
              width: `${Math.min(overallUtilization, 100)}%`,
              backgroundColor: getBarColor(overallUtilization),
            }}
          />
          <div className="threshold-marker-30" title="Target Threshold (30%)" />
        </div>
        <div className="utilization-meter-labels">
          <span>{formatCurrency(totalBalance)} Used</span>
          <span>{formatCurrency(totalLimit)} Total Limit</span>
        </div>
      </div>

      {/* Alert Banner if any cards exceeded threshold */}
      {hasAlerts && (
        <div className="utilization-alert-banner">
          <FaExclamationTriangle className="alert-icon" />
          <span>
            One or more cards exceed the recommended 30% threshold. Consider paying down balances prior to statement close dates.
          </span>
        </div>
      )}

      {/* Individual Cards Breakdown */}
      <div className="utilization-cards-grid">
        {cards.map((c) => {
          const color = getBarColor(c.utilization);
          return (
            <div key={c.cardId} className={`card-utilization-item ${c.isAlert ? 'item-alert' : ''}`}>
              <div className="card-item-header">
                <span className="card-item-name">{c.cardName}</span>
                <span className="card-item-pct" style={{ color }}>
                  {c.utilization.toFixed(1)}%
                </span>
              </div>
              <div className="mini-meter-track">
                <div
                  className="mini-meter-fill"
                  style={{
                    width: `${Math.min(c.utilization, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <div className="card-item-details">
                <span>{formatCurrency(c.currentBalance)}</span>
                <span className="card-item-limit">/ {formatCurrency(c.limit)}</span>
              </div>
              {c.isAlert && (
                <div className="card-alert-badge">
                  <FaExclamationTriangle size={10} /> Above {c.threshold}% Alert
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UtilizationWidget;
