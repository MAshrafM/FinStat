// frontend/src/components/SummaryRow.js
import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './SummaryRow.css';

const SummaryRow = ({ grandTotal, grandTotalTitle, periodDetails, periodTitle }) => {

    // The rate of change calculation logic can stay, as it works on the passed-in periodDetails
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
      return <span className="change-neutral"><FaMinus /> N/A</span>;
    }
    const isPositive = change > 0;
    const Icon = isPositive ? FaArrowUp : FaArrowDown;
    const className = isPositive ? 'change-positive' : 'change-negative';
    return (
      <span className={className}>
        <Icon /> {Math.abs(change)}%
      </span>
    );
  };

  return (
    <div className="summary-row">
      <div className="summary-item grand-total">
        <h4>{grandTotalTitle}</h4>
        <p>{formatCurrency(grandTotal)}</p>
      </div>
      <div className="summary-item period-totals">
        <h4>{periodTitle}</h4>
        <div className="period-grid">
          {detailsWithRateOfChange.map(period => (
            <div key={period.key} className="period-item">
              <strong>{period.key}:</strong> {formatCurrency(period.value)}
              <div className="period-change">{renderChange(period.change)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryRow;
