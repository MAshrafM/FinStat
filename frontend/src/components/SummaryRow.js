// frontend/src/components/SummaryRow.js
import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './SummaryRow.css';

const SummaryRow = ({ periodData, periodTitle }) => {
  // Get the sorted list of period keys (e.g., ['2024', '2023', '2022'])
  const sortedPeriods = Object.keys(periodData).sort().reverse();

  // Calculate the grand total across all periods
  const grandTotal = sortedPeriods.reduce((total, periodKey) => {
    const periodTotal = periodData[periodKey].reduce((sum, p) => sum + p.amount, 0);
    return total + periodTotal;
  }, 0);

  // Create an array of objects with detailed info for each period
  const periodDetails = sortedPeriods.map(periodKey => ({
    key: periodKey,
    total: periodData[periodKey].reduce((sum, p) => sum + p.amount, 0),
  }));

  // Calculate the rate of change for each period compared to the previous one
  const detailsWithRateOfChange = periodDetails.map((currentPeriod, index) => {
    // The last period in the array is the oldest, so it has no previous period to compare to
    const previousPeriod = periodDetails[index + 1];
    if (!previousPeriod || previousPeriod.total === 0) {
      return { ...currentPeriod, change: null }; // No change to calculate
    }

    const change = ((currentPeriod.total - previousPeriod.total) / previousPeriod.total) * 100;
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
        <h4>Grand Total</h4>
        <p>{formatCurrency(grandTotal)}</p>
      </div>
      <div className="summary-item period-totals">
        <h4>{periodTitle} Totals & Growth</h4>
        <div className="period-grid">
          {detailsWithRateOfChange.map(period => (
            <div key={period.key} className="period-item">
              <strong>{period.key}:</strong> {formatCurrency(period.total)}
              <div className="period-change">{renderChange(period.change)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryRow;
