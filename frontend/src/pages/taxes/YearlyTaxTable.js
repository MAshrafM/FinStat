// frontend/src/pages/taxes/YearlyTaxTable.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import '../../components/Table.css';
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './TaxesPage.css';

const YearlyTaxTable = ({ year, processedPaychecks = [], yearlySummary = {}, taxBrackets = [] }) => {
  const totalDeductions = (yearlySummary.taxDeduction || 0) + (yearlySummary.insuranceDeduction || 0);
  const grossAll = (yearlySummary.grossAmount || 0) + (yearlySummary.prepaid || 0);
  const netAll = (yearlySummary.amount || 0) + (yearlySummary.prepaid || 0);
  const rateOfChange = yearlySummary.rateOfChange || 0;

  // Helper to get a color based on the tax bracket level
  const getColorForLevel = (level) => {
    if (!level) return '';
    const totalLevels = taxBrackets && taxBrackets.length > 0 ? taxBrackets.length : 7;
    const hue = Math.max(0, 120 - ((level / totalLevels) * 120)); // Green to Red/Orange
    return `hsl(${hue}, 70%, 95%)`;
  };

  return (
    <div className="tax-card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Tax Deductions for {year}</h3>
        {taxBrackets && taxBrackets.length > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {taxBrackets.length} Active Bracket Tiers Applied
          </span>
        )}
      </div>

      <div className="yearly-summary-grid">
        <div className="summary-item">
          <span>Sum of Gross</span>
          <strong>{formatCurrency(yearlySummary.grossAmount || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Prepaid</span>
          <strong>{formatCurrency(yearlySummary.prepaid || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Net</span>
          <strong>{formatCurrency(yearlySummary.amount || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Tax Ded.</span>
          <strong>{formatCurrency(yearlySummary.taxDeduction || 0)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Total Deductions</span>
          <strong>{formatCurrency(totalDeductions)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Gross (All)</span>
          <strong>{formatCurrency(grossAll)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Net (All)</span>
          <strong>{formatCurrency(netAll)}</strong>
        </div>
        <div className="summary-item rate-of-change">
          <span>vs. Previous Year</span>
          {rateOfChange === 0 ? (
            <strong className="change-neutral">
              <FaMinus /> N/A
            </strong>
          ) : (
            <strong className={rateOfChange > 0 ? 'change-positive' : 'change-negative'}>
              {rateOfChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.floor(rateOfChange)}%
            </strong>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Gross Amount</th>
              <th>Tax Deduction</th>
              <th>Effective Rate</th>
              <th>Tax Bracket (Cumulative)</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {processedPaychecks.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8' }}>
                  No paycheck records found for {year}
                </td>
              </tr>
            ) : (
              processedPaychecks.map((p) => (
                <tr key={p._id || p.month}>
                  <td data-label="Month">{p.month}</td>
                  <td data-label="Gross Amount">{formatCurrency(p.grossAmount)}</td>
                  <td data-label="Tax Deduction">{formatCurrency(p.taxDeduction)}</td>
                  <td data-label="Rate">{p.effectiveRate.toFixed(2)}%</td>
                  <td
                    data-label="Bracket Lvl"
                    style={{
                      backgroundColor: getColorForLevel(p.bracketLevel),
                      fontWeight: 600,
                    }}
                  >
                    {p.bracketLevel
                      ? `Level ${p.bracketLevel}${p.bracketRate !== undefined && p.bracketRate !== null ? ` (${p.bracketRate}%)` : ''}`
                      : 'N/A'}
                  </td>
                  <td data-label="Amount">{formatCurrency(p.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyTaxTable;
