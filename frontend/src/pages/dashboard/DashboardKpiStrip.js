// frontend/src/pages/dashboard/DashboardKpiStrip.js
import React from 'react';
import { FaBullseye, FaChartLine, FaCoins, FaPiggyBank } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const formatSignedPercent = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '0.0%';
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
};

const DashboardKpiStrip = ({ calculations, budgetTotals, activeAssetCount = 0 }) => {
  const gainIsPositive = (calculations?.totalGain || 0) >= 0;

  return (
    <section className="dash-kpis" aria-label="Key financial metrics">
      <article className="dash-kpi tone-sky">
        <span className="dash-kpi-icon">
          <FaPiggyBank aria-hidden="true" />
        </span>
        <div>
          <span className="dash-kpi-label">Invested capital</span>
          <strong className="dash-kpi-value">{formatCurrency(calculations?.totalPaid || 0)}</strong>
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
          <strong className="dash-kpi-value">{formatCurrency(calculations?.totalGain || 0)}</strong>
          <small className={gainIsPositive ? 'positive' : 'negative'}>
            {formatSignedPercent(calculations?.totalGainPct || 0)} vs invested
          </small>
        </div>
      </article>

      <article className="dash-kpi tone-cyan">
        <span className="dash-kpi-icon">
          <FaCoins aria-hidden="true" />
        </span>
        <div>
          <span className="dash-kpi-label">Liquid cash</span>
          <strong className="dash-kpi-value">{formatCurrency(calculations?.bankBalance || 0)}</strong>
          <small>{formatCurrency(calculations?.creditAvailable || 0)} credit available</small>
        </div>
      </article>

      <article className="dash-kpi tone-violet">
        <span className="dash-kpi-icon">
          <FaBullseye aria-hidden="true" />
        </span>
        <div>
          <span className="dash-kpi-label">Budget used</span>
          <strong className="dash-kpi-value">
            {(budgetTotals?.budgeted || 0) > 0 ? `${Math.round(budgetTotals.pct)}%` : '—'}
          </strong>
          <small>
            {(budgetTotals?.budgeted || 0) > 0
              ? `${formatCurrency(budgetTotals.spent)} of ${formatCurrency(budgetTotals.budgeted)}`
              : 'No budget set for this month'}
          </small>
        </div>
      </article>
    </section>
  );
};

export default React.memo(DashboardKpiStrip);

