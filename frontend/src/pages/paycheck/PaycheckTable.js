// frontend/src/pages/paycheck/PaycheckTable.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import ProtectedAction from '../../components/common/ProtectedAction';
import { Badge } from '../../components/ui';

const parsePeriodSortKey = (str) => {
  if (!str) return '';
  if (/^\d{4}-\d{2}/.test(str)) {
    return str.substring(0, 7);
  }
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return String(str);
};

const PaycheckTable = ({ paychecks, onPaycheckDeleted }) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleCardExpand = (id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const groupPaychecksByMonth = () => {
    if (!paychecks || paychecks.length === 0) return [];
    const monthlyGroups = paychecks.reduce((acc, p) => {
      const m = p.period || p.month || 'Unknown';
      (acc[m] = acc[m] || []).push(p);
      return acc;
    }, {});
    const result = Object.entries(monthlyGroups).map(([month, entries]) => ({
      month,
      entries: entries.sort((a, b) => {
        const dateA = new Date(a.payDate || a.date || 0).getTime();
        const dateB = new Date(b.payDate || b.date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA;
      }),
      monthlyTotal: entries.reduce((sum, entry) => {
        const val = Number(entry.netPay !== undefined && entry.netPay !== null && entry.netPay !== 0 ? entry.netPay : (entry.amount || 0)) || 0;
        return sum + val;
      }, 0),
      monthlyGrossTotal: entries.reduce((sum, entry) => {
        const amt = Number(entry.netPay !== undefined && entry.netPay !== null && entry.netPay !== 0 ? entry.netPay : (entry.amount || 0)) || 0;
        const tax = Number(entry.taxDetails?.actualTax ?? entry.taxDeduction ?? entry.taxDetails?.expectedTax ?? 0) || 0;
        const ins = Number(entry.insuranceDetails?.actualEmployeeShare ?? entry.insuranceDeduction ?? entry.insuranceDetails?.expectedEmployeeShare ?? 0) || 0;
        const martyrs = Number(entry.martyrsFund || 0) || 0;
        const ded = Number(entry.totalDeductions !== undefined && entry.totalDeductions !== null ? entry.totalDeductions : (tax + ins + martyrs)) || 0;
        const gr = Number(entry.grossSalary !== undefined && entry.grossSalary !== null && entry.grossSalary !== 0 ? entry.grossSalary : (entry.grossAmount || (amt + ded))) || 0;
        return sum + gr;
      }, 0),
      rowCount: entries.length,
    }));
    return result.sort((a, b) => parsePeriodSortKey(b.month).localeCompare(parsePeriodSortKey(a.month)));
  };

  const groupedData = groupPaychecksByMonth();

  if (isMobile) {
    return (
      <div className="paycheck-mobile-cards" role="region" aria-label="Paycheck cards list">
        {groupedData.length === 0 ? (
          <div className="paycheck-empty-cell">
            <p>No paycheck entries found</p>
            <p className="paycheck-empty-sub">Click &quot;+ Log Paycheck&quot; to record your first paycheck or disbursement</p>
          </div>
        ) : (
          groupedData.flatMap((monthGroup) =>
            monthGroup.entries.map((entry) => {
              const amountVal = Number(entry.netPay !== undefined && entry.netPay !== null && entry.netPay !== 0 ? entry.netPay : (entry.amount || 0)) || 0;
              const taxVal = Number(entry.taxDetails?.actualTax ?? entry.taxDeduction ?? entry.taxDetails?.expectedTax ?? 0) || 0;
              const insVal = Number(entry.insuranceDetails?.actualEmployeeShare ?? entry.insuranceDeduction ?? entry.insuranceDetails?.expectedEmployeeShare ?? 0) || 0;
              const martyrsVal = Number(entry.martyrsFund || 0) || 0;

              let deductionsVal = Number(entry.totalDeductions !== undefined && entry.totalDeductions !== null ? entry.totalDeductions : (taxVal + insVal + martyrsVal)) || 0;
              let grossVal = Number(entry.grossSalary !== undefined && entry.grossSalary !== null && entry.grossSalary !== 0 ? entry.grossSalary : (entry.grossAmount || 0)) || 0;

              if (grossVal === 0 && (amountVal > 0 || deductionsVal > 0)) {
                grossVal = amountVal + deductionsVal;
              }
              if (deductionsVal === 0 && grossVal > amountVal) {
                deductionsVal = grossVal - amountVal;
              }

              const noteVal = entry.note || entry.notes || '';
              const typeLabel = entry.disbursementType || entry.type || 'Regular';
              const isExpanded = expandedCards.has(entry._id);

              return (
                <article
                  key={entry._id}
                  className="paycheck-mobile-card"
                  aria-label={`Paycheck ${entry.period || monthGroup.month} ${typeLabel}`}
                >
                  <div className="paycheck-card-header">
                    <span className="paycheck-card-period">{entry.period || monthGroup.month}</span>
                    <Badge tone="neutral" label={typeLabel}>
                      {typeLabel}{entry.multiplier && entry.multiplier !== 1 ? ` (${entry.multiplier}x)` : ''}
                    </Badge>
                  </div>

                  <div className="paycheck-card-net">
                    <span className="paycheck-card-label">Net: </span>
                    <span className="fs-num">{formatCurrency(amountVal)}</span>
                  </div>

                  <div className="paycheck-card-row">
                    <span>Gross Payout</span>
                    <span className="fs-num">{formatCurrency(grossVal)}</span>
                  </div>

                  <div className="paycheck-card-row">
                    <span>Deductions</span>
                    <span className="fs-num">{deductionsVal > 0 ? `-${formatCurrency(deductionsVal)}` : formatCurrency(0)}</span>
                  </div>

                  <button
                    type="button"
                    className="paycheck-card-expander"
                    aria-expanded={isExpanded}
                    onClick={() => handleToggleCardExpand(entry._id)}
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>

                  {isExpanded && (
                    <div className="paycheck-card-details">
                      <div className="paycheck-card-row">
                        <span>Tax Deduction</span>
                        <span className="fs-num">{formatCurrency(taxVal)}</span>
                      </div>
                      <div className="paycheck-card-row">
                        <span>Insurance Deduction</span>
                        <span className="fs-num">{formatCurrency(insVal)}</span>
                      </div>
                      {martyrsVal > 0 && (
                        <div className="paycheck-card-row">
                          <span>Martyrs&apos; Fund</span>
                          <span className="fs-num">{formatCurrency(martyrsVal)}</span>
                        </div>
                      )}
                      {monthGroup.rowCount > 1 && (
                        <div className="paycheck-card-row paycheck-card-monthly-total">
                          <span>Monthly Total ({monthGroup.month})</span>
                          <strong className="fs-num">{formatCurrency(monthGroup.monthlyTotal)}</strong>
                        </div>
                      )}
                      {noteVal ? (
                        <div className="paycheck-card-note">
                          <span>Note: </span>{noteVal}
                        </div>
                      ) : null}
                      <div className="paycheck-card-actions">
                        <ProtectedAction tooltip="View-only access">
                          <Link
                            to={`/salary/paychecks/edit/${entry._id}`}
                            className="paycheck-card-action-btn"
                            aria-label={`Edit paycheck ${entry.period || monthGroup.month}`}
                          >
                            <FaPencilAlt className="action-icon edit-icon" aria-hidden="true" />
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            onClick={() => onPaycheckDeleted(entry._id)}
                            className="paycheck-delete-btn paycheck-card-action-btn"
                            title="Delete paycheck entry"
                            aria-label={`Delete paycheck entry for ${entry.period || monthGroup.month}`}
                          >
                            <FaTrash className="action-icon" aria-hidden="true" />
                          </button>
                        </ProtectedAction>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )
        )}
      </div>
    );
  }

  return (
    <div className="fs-table-scroll">
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
              <td colSpan={7} className="paycheck-empty-cell">
                <p>No paycheck entries found</p>
                <p className="paycheck-empty-sub">Click &quot;+ Log Paycheck&quot; to record your first paycheck or disbursement</p>
              </td>
            </tr>
          ) : (
            groupedData.map((monthGroup) => (
              <React.Fragment key={monthGroup.month}>
                {monthGroup.entries.map((entry, entryIndex) => {
                  const amountVal = Number(entry.netPay !== undefined && entry.netPay !== null && entry.netPay !== 0 ? entry.netPay : (entry.amount || 0)) || 0;
                  const taxVal = Number(entry.taxDetails?.actualTax ?? entry.taxDeduction ?? entry.taxDetails?.expectedTax ?? 0) || 0;
                  const insVal = Number(entry.insuranceDetails?.actualEmployeeShare ?? entry.insuranceDeduction ?? entry.insuranceDetails?.expectedEmployeeShare ?? 0) || 0;
                  const martyrsVal = Number(entry.martyrsFund || 0) || 0;

                  let deductionsVal = Number(entry.totalDeductions !== undefined && entry.totalDeductions !== null ? entry.totalDeductions : (taxVal + insVal + martyrsVal)) || 0;
                  let grossVal = Number(entry.grossSalary !== undefined && entry.grossSalary !== null && entry.grossSalary !== 0 ? entry.grossSalary : (entry.grossAmount || 0)) || 0;

                  if (grossVal === 0 && (amountVal > 0 || deductionsVal > 0)) {
                    grossVal = amountVal + deductionsVal;
                  }
                  if (deductionsVal === 0 && grossVal > amountVal) {
                    deductionsVal = grossVal - amountVal;
                  }

                  const noteVal = entry.note || entry.notes || '';
                  const typeLabel = entry.disbursementType || entry.type || 'Regular';

                  return (
                    <tr key={entry._id} className="tooltip-container" data-note={noteVal}>
                      {entryIndex === 0 && <td data-label="Month" rowSpan={monthGroup.rowCount}><strong>{monthGroup.month}</strong></td>}
                      <td data-label="Type">
                        <Badge tone="neutral" label={typeLabel}>
                          {typeLabel}{entry.multiplier && entry.multiplier !== 1 ? ` (${entry.multiplier}x)` : ''}
                        </Badge>
                      </td>
                      <td data-label="Gross" className="fs-num">{formatCurrency(grossVal)}</td>
                      <td data-label="Deductions" className="fs-num">
                        {deductionsVal > 0 ? `-${formatCurrency(deductionsVal)}` : formatCurrency(0)}
                      </td>
                      <td data-label="Net" className="fs-num">
                        {formatCurrency(amountVal)}
                      </td>
                      {entryIndex === 0 && (
                        <td data-label="Monthly Total" rowSpan={monthGroup.rowCount}>
                          <strong className="fs-num">{formatCurrency(monthGroup.monthlyTotal)}</strong>
                        </td>
                      )}
                      <td data-label="Action" className="action-cell">
                        <ProtectedAction tooltip="View-only access">
                          <Link to={`/salary/paychecks/edit/${entry._id}`} aria-label={`Edit paycheck for ${monthGroup.month}`}>
                            <FaPencilAlt className="action-icon edit-icon" aria-hidden="true" />
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            onClick={() => onPaycheckDeleted(entry._id)}
                            className="paycheck-delete-btn"
                            title="Delete paycheck entry"
                            aria-label={`Delete paycheck entry for ${monthGroup.month}`}
                          >
                            <FaTrash className="action-icon" aria-hidden="true" />
                          </button>
                        </ProtectedAction>
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
