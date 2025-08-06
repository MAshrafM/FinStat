// frontend/src/pages/taxes/YearlyTaxTable.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import '../../components/Table.css'; // Reuse table styles
import { FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import './TaxesPage.css'; // For new styles

const YearlyTaxTable = ({ year, processedPaychecks, yearlySummary, taxBrackets }) => {

  const totalDeductions = yearlySummary.taxDeduction + yearlySummary.insuranceDeduction;
  const grossAll = yearlySummary.grossAmount + yearlySummary.prepaid;
  const netAll = yearlySummary.amount + yearlySummary.prepaid;
  const rateOfChange = yearlySummary.rateOfChange || 0;


  // Helper to get a color based on the tax bracket level
  const getColorForLevel = (level) => {
    if (!level) return '';
    const hue = 120 - ((level / taxBrackets.length) * 120); // Green to Red
    return `hsl(${hue}, 70%, 95%)`; // Very light pastel colors
  };

  return (
    <div className="tax-card" style={{ marginTop: '2rem' }}>
      <h3>Tax Deductions for {year}</h3>
      <div className="yearly-summary-grid">
        <div className="summary-item"><span>Sum of Gross</span><strong>{formatCurrency(yearlySummary.grossAmount)}</strong></div>
        <div className="summary-item"><span>Sum of Prepaid</span><strong>{formatCurrency(yearlySummary.prepaid)}</strong></div>
        <div className="summary-item"><span>Sum of Net</span><strong>{formatCurrency(yearlySummary.amount)}</strong></div>
        <div className="summary-item"><span>Sum of Tax Ded.</span><strong>{formatCurrency(yearlySummary.taxDeduction)}</strong></div>
        <div className="summary-item highlight"><span>Total Deductions</span><strong>{formatCurrency(totalDeductions)}</strong></div>
        <div className="summary-item highlight"><span>Gross (All)</span><strong>{formatCurrency(grossAll)}</strong></div>
        <div className="summary-item highlight"><span>Net (All)</span><strong>{formatCurrency(netAll)}</strong></div>
        <div className="summary-item rate-of-change">
          <span>vs. Previous Year</span>
          {rateOfChange === 0 ? (
            <strong className="change-neutral"><FaMinus /> N/A</strong>
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
            {processedPaychecks.map(p => (
              <tr key={p._id}>
                <td>{p.month}</td>
                <td>{formatCurrency(p.grossAmount)}</td>
                <td>{formatCurrency(p.taxDeduction)}</td>
                <td>{p.effectiveRate.toFixed(2)}%</td>
                <td style={{ backgroundColor: getColorForLevel(p.bracketLevel) }}>
                  {p.bracketLevel ? `Level ${p.bracketLevel}` : 'N/A'}
                </td>
                <td>{formatCurrency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YearlyTaxTable;
