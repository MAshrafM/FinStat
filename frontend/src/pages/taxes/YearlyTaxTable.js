// frontend/src/pages/taxes/YearlyTaxTable.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import '../../components/PaycheckTable.css'; // Reuse table styles
import './TaxesPage.css'; // For new styles

const YearlyTaxTable = ({ year, processedPaychecks, taxBrackets }) => {

  const yearlyTotals = processedPaychecks.reduce((totals, p) => {
    totals.grossAmount += p.grossAmount || 0;
    totals.taxDeduction += p.taxDeduction || 0;
    totals.insuranceDeduction += p.insuranceDeduction || 0;
    if (p.type === 'Prepaid') {
        totals.prepaid += p.amount || 0;
    } else {
        totals.amount += p.amount || 0;
    }
    return totals;
  }, {
    grossAmount: 0,
    prepaid: 0,
    amount: 0,
    taxDeduction: 0,
    insuranceDeduction: 0,
  });

  const totalDeductions = yearlyTotals.taxDeduction + yearlyTotals.insuranceDeduction;
  const grossAll = yearlyTotals.grossAmount + yearlyTotals.prepaid;
  const netAll = yearlyTotals.amount + yearlyTotals.prepaid;

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
        <div className="summary-item"><span>Sum of Gross</span><strong>{formatCurrency(yearlyTotals.grossAmount)}</strong></div>
        <div className="summary-item"><span>Sum of Prepaid</span><strong>{formatCurrency(yearlyTotals.prepaid)}</strong></div>
        <div className="summary-item"><span>Sum of Net</span><strong>{formatCurrency(yearlyTotals.amount)}</strong></div>
        <div className="summary-item"><span>Sum of Tax Ded.</span><strong>{formatCurrency(yearlyTotals.taxDeduction)}</strong></div>
        <div className="summary-item highlight"><span>Total Deductions</span><strong>{formatCurrency(totalDeductions)}</strong></div>
        <div className="summary-item highlight"><span>Gross (All)</span><strong>{formatCurrency(grossAll)}</strong></div>
        <div className="summary-item highlight"><span>Net (All)</span><strong>{formatCurrency(netAll)}</strong></div>
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
