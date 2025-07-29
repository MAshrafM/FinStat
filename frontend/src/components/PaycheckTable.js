// frontend/src/components/PaycheckTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaTrash, FaPencilAlt } from 'react-icons/fa'; // Import the trash icon
import './PaycheckTable.css'; // We will update this file next

const PaycheckTable = ({ paychecks, onPaycheckDeleted }) => {
  const groupPaychecksByMonth = () => {
    if (!paychecks || paychecks.length === 0) return [];
    const monthlyGroups = paychecks.reduce((acc, p) => {
      (acc[p.month] = acc[p.month] || []).push(p);
      return acc;
    }, {});
    const result = Object.entries(monthlyGroups).map(([month, entries]) => ({
      month,
      entries,
      monthlyTotal: entries.reduce((sum, entry) => sum + entry.amount, 0),
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
            <th>Month</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Monthly Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map((monthGroup) => (
            <React.Fragment key={monthGroup.month}>
              {monthGroup.entries.map((entry, entryIndex) => (
                <tr key={entry._id} className="tooltip-container" data-note={entry.note}>
                  {entryIndex === 0 && <td rowSpan={monthGroup.rowCount}>{monthGroup.month}</td>}
                  <td>{entry.type}</td>
                  <td>${entry.amount.toFixed(2)}</td>
                  {entryIndex === 0 && (
                    <td rowSpan={monthGroup.rowCount}>
                      <strong>${monthGroup.monthlyTotal.toFixed(2)}</strong>
                    </td>
                  )}
                  <td className="action-cell">
                    <Link to={`/paycheck-log/edit/${entry._id}`}>
                      <FaPencilAlt className="action-icon edit-icon" />
                    </Link>
                    <FaTrash
                      className="action-icon"
                      onClick={() => onPaycheckDeleted(entry._id)}
                    />
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaycheckTable;
