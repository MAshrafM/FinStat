// frontend/src/pages/taxes/YearlyTaxTable.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../../components/ui/Badge';
import Delta from '../../components/ui/Delta';
import './TaxesPage.css';

const YearlyTaxTable = ({ year, processedPaychecks = [], yearlySummary = {}, taxBrackets = [] }) => {
  const totalDeductions = (yearlySummary.taxDeduction || 0) + (yearlySummary.insuranceDeduction || 0);
  const grossAll = (yearlySummary.grossAmount || 0) + (yearlySummary.prepaid || 0);
  const netAll = (yearlySummary.amount || 0) + (yearlySummary.prepaid || 0);
  const rateOfChange = yearlySummary.rateOfChange || 0;

  return (
    <div className="tax-card yearly-tax-card fs-card">
      <div className="tax-card-header">
        <h2 className="tax-card-title">Tax Deductions for {year}</h2>
        {taxBrackets && taxBrackets.length > 0 && (
          <span className="tax-bracket-count">
            {taxBrackets.length} Active Bracket Tiers Applied
          </span>
        )}
      </div>

      <div className="yearly-summary-grid">
        <div className="summary-item">
          <span>Sum of Gross</span>
          <strong className="fs-num">{formatCurrency(yearlySummary.grossAmount || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Prepaid</span>
          <strong className="fs-num">{formatCurrency(yearlySummary.prepaid || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Net</span>
          <strong className="fs-num">{formatCurrency(yearlySummary.amount || 0)}</strong>
        </div>
        <div className="summary-item">
          <span>Sum of Tax Ded.</span>
          <strong className="fs-num">{formatCurrency(yearlySummary.taxDeduction || 0)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Total Deductions</span>
          <strong className="fs-num">{formatCurrency(totalDeductions)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Gross (All)</span>
          <strong className="fs-num">{formatCurrency(grossAll)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Net (All)</span>
          <strong className="fs-num">{formatCurrency(netAll)}</strong>
        </div>
        <div className="summary-item rate-of-change">
          <span>vs. Previous Year</span>
          {rateOfChange === 0 ? (
            <strong className="change-neutral fs-num">
              N/A
            </strong>
          ) : (
            <Delta
              value={`${Math.floor(rateOfChange)}%`}
              tone="neutral"
              sign="auto"
              label="vs. Previous Year"
            />
          )}
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="styled-table custom-component-table">
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
                <td colSpan="6" className="table-empty-cell">
                  No paycheck records found for {year}
                </td>
              </tr>
            ) : (
              processedPaychecks.map((p) => (
                <tr key={p._id || p.month}>
                  <td data-label="Month">{p.month}</td>
                  <td data-label="Gross Amount" className="fs-num">{formatCurrency(p.grossAmount)}</td>
                  <td data-label="Tax Deduction" className="fs-num">{formatCurrency(p.taxDeduction)}</td>
                  <td data-label="Rate" className="fs-num">{p.effectiveRate.toFixed(2)}%</td>
                  <td data-label="Bracket Lvl">
                    {p.bracketLevel ? (
                      <span className="bracket-level-cell">
                        <Badge tone="neutral" label={`Level ${p.bracketLevel}`}>
                          Level {p.bracketLevel}
                        </Badge>
                        {p.bracketRate !== undefined && p.bracketRate !== null && (
                          <span className="bracket-rate-text fs-num"> ({p.bracketRate}%)</span>
                        )}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td data-label="Amount" className="fs-num">{formatCurrency(p.amount)}</td>
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
