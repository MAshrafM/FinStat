// frontend/src/components/PaycheckTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import '../../components/Table.css';

const TYPE_COLORS = {
  'Regular': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'Basic Months': { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  'Basic Production': { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
  'Sector Bonus': { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' },
  'Individual Bonus': { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
  'Surplus': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  'Bond Distribution': { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  'End of Year Bonus': { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
  'Prepaid': { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  'Cash': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
};

const PaycheckTable = ({ paychecks, onPaycheckDeleted }) => {
  const groupPaychecksByMonth = () => {
    if (!paychecks || paychecks.length === 0) return [];
    const monthlyGroups = paychecks.reduce((acc, p) => {
      const m = p.month || p.period || 'Unknown';
      (acc[m] = acc[m] || []).push(p);
      return acc;
    }, {});
    const result = Object.entries(monthlyGroups).map(([month, entries]) => ({
      month,
      entries,
      monthlyTotal: entries.reduce((sum, entry) => {
        const val = Number(entry.amount !== undefined && entry.amount !== null ? entry.amount : (entry.netPay || 0)) || 0;
        return sum + val;
      }, 0),
      monthlyGrossTotal: entries.reduce((sum, entry) => {
        const amt = Number(entry.amount !== undefined && entry.amount !== null ? entry.amount : (entry.netPay || 0)) || 0;
        const tax = Number(entry.taxDeduction || entry.taxDetails?.actualTax || entry.taxDetails?.expectedTax || 0) || 0;
        const ins = Number(entry.insuranceDeduction || entry.insuranceDetails?.actualEmployeeShare || entry.insuranceDetails?.expectedEmployeeShare || 0) || 0;
        const martyrs = Number(entry.martyrsFund || 0) || 0;
        const ded = Number(entry.totalDeductions || (tax + ins + martyrs)) || 0;
        const gr = Number(entry.grossSalary || entry.grossAmount || (amt + ded)) || 0;
        return sum + gr;
      }, 0),
      rowCount: entries.length,
    }));
    return result.sort((a, b) => b.month.localeCompare(a.month));
  };

  const groupedData = groupPaychecksByMonth();

  return (
    <div className="table-container">
      <h3>Paycheck Log</h3>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Month / Period</th>
            <th>Disbursement Type</th>
            <th>Gross Payout</th>
            <th>Deductions</th>
            <th>Net Disbursed</th>
            <th>Monthly Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#475569' }}>No paycheck entries found</p>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem' }}>Click "+ Log Paycheck" to record your first paycheck or disbursement</p>
              </td>
            </tr>
          ) : (
            groupedData.map((monthGroup) => (
              <React.Fragment key={monthGroup.month}>
                {monthGroup.entries.map((entry, entryIndex) => {
                  const amountVal = Number(entry.amount !== undefined && entry.amount !== null ? entry.amount : (entry.netPay || 0)) || 0;
                  const taxVal = Number(entry.taxDeduction || entry.taxDetails?.actualTax || entry.taxDetails?.expectedTax || 0) || 0;
                  const insVal = Number(entry.insuranceDeduction || entry.insuranceDetails?.actualEmployeeShare || entry.insuranceDetails?.expectedEmployeeShare || 0) || 0;
                  const martyrsVal = Number(entry.martyrsFund || 0) || 0;
                  
                  let deductionsVal = Number(entry.totalDeductions !== undefined && entry.totalDeductions !== null ? entry.totalDeductions : (taxVal + insVal + martyrsVal)) || 0;
                  let grossVal = Number(entry.grossSalary || entry.grossAmount || 0) || 0;

                  if (grossVal === 0 && (amountVal > 0 || deductionsVal > 0)) {
                    grossVal = amountVal + deductionsVal;
                  }
                  if (deductionsVal === 0 && grossVal > amountVal) {
                    deductionsVal = grossVal - amountVal;
                  }

                  const noteVal = entry.note || entry.notes || '';
                  const typeLabel = entry.disbursementType || entry.type || 'Regular';
                  const styleColors = TYPE_COLORS[typeLabel] || TYPE_COLORS['Regular'];

                  return (
                    <tr key={entry._id} className="tooltip-container" data-note={noteVal}>
                      {entryIndex === 0 && <td data-label="Month" rowSpan={monthGroup.rowCount}><strong>{monthGroup.month}</strong></td>}
                      <td data-label="Type">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          backgroundColor: styleColors.bg,
                          color: styleColors.text,
                          border: `1px solid ${styleColors.border}`,
                        }}>
                          {typeLabel}
                          {entry.multiplier && entry.multiplier !== 1 ? ` (${entry.multiplier}x)` : ''}
                        </span>
                      </td>
                      <td data-label="Gross" style={{ fontWeight: 600 }}>{formatCurrency(grossVal)}</td>
                      <td data-label="Deductions" style={{ color: deductionsVal > 0 ? '#e11d48' : '#64748b' }}>
                        {deductionsVal > 0 ? `-${formatCurrency(deductionsVal)}` : '0.00 EGP'}
                      </td>
                      <td data-label="Net" style={{ fontWeight: 700, color: '#009879' }}>
                        {formatCurrency(amountVal)}
                      </td>
                      {entryIndex === 0 && (
                        <td data-label="Monthly Total" rowSpan={monthGroup.rowCount}>
                          <strong style={{ color: '#1e293b' }}>{formatCurrency(monthGroup.monthlyTotal)}</strong>
                        </td>
                      )}
                      <td data-label="Action" className="action-cell">
                        <Link to={`/paycheck-log/edit/${entry._id}`}>
                          <FaPencilAlt className="action-icon edit-icon" />
                        </Link>
                        <FaTrash
                          className="action-icon"
                          onClick={() => onPaycheckDeleted(entry._id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PaycheckTable;
