// frontend/src/components/SummaryRow.js
import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './SummaryRow.css';

const SummaryRow = ({ grandTotal, grandTotalTitle, periodDetails, periodTitle }) => {
  // Calculate rate of change across periods
  const detailsWithRateOfChange = periodDetails.map((currentPeriod, index) => {
    const previousPeriod = periodDetails[index + 1]; // Assumes details are sorted descending
    if (!previousPeriod || !previousPeriod.value || previousPeriod.value === 0) {
      return { ...currentPeriod, change: null };
    }
    const change = ((currentPeriod.value - previousPeriod.value) / previousPeriod.value) * 100;
    return { ...currentPeriod, change: change.toFixed(2) };
  });

  const renderChange = (change) => {
    if (change === null) {
      return (
        <span className="fs-delta fs-delta--neutral change-neutral">
          <FaMinus size={10} /> N/A
        </span>
      );
    }
    const isPositive = Number(change) > 0;
    const Icon = isPositive ? FaArrowUp : FaArrowDown;
    const deltaClass = isPositive ? 'fs-delta--positive change-positive' : 'fs-delta--negative change-negative';

    return (
      <span className={`fs-delta ${deltaClass}`}>
        <Icon size={10} /> <span className="fs-delta-value fs-num">{Math.abs(change)}%</span>
      </span>
    );
  };

  return (
    <div className="summary-row">
      <div className="summary-item grand-total">
        <h4>{grandTotalTitle}</h4>
        <p className="fs-num">{formatCurrency(grandTotal)}</p>
      </div>
      <div className="summary-item period-totals">
        <h4>{periodTitle}</h4>
        <div className="period-grid">
          {detailsWithRateOfChange.map((period) => (
            <div key={period.key} className="period-item">
              <div className="period-main">
                <strong className="period-label">{period.key}:</strong>
                <span className="period-value fs-num">{formatCurrency(period.value)}</span>
              </div>
              <div className="period-change">{renderChange(period.change)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryRow;
