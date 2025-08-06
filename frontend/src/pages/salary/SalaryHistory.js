// frontend/src/pages/salary/SalaryHistory.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProfile, deleteHistoryRecord  } from '../../services/salaryService';
import { formatCurrency } from '../../utils/formatters';
import { FaTrash, FaPencilAlt } from 'react-icons/fa';
import '../../components/Table.css'; // Reuse the nice table styles

const SalaryHistory = () => {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    getProfile().then(setProfile);
  };

  const handleDelete = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this historical record? This cannot be undone.')) {
      await deleteHistoryRecord(historyId);
      loadProfile(); // Refresh the data
    }
  };

  if (!profile) return <div className="page-container">Loading...</div>;

  // Sort history so the newest is at the top
  const sortedHistory = [...profile.salaryHistory].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Salary History for {profile.name}</h1>
        <Link to="/salary-profile" className="nav-button">Back to Profiles</Link>
      </div>
      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Basic Salary</th>
              <th>Production</th>
              <th>Variables</th>
              <th>Environment</th>
              <th>Meal</th>
              <th>Shift</th>
              <th>Supervising</th>
              <th>Others</th>
              <th>Prepaid</th>
              <th>Bonds</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map(record => (
              <tr key={record._id} data-id={record._id}>
                <td>{new Date(record.effectiveDate).toLocaleDateString()}</td>
                <td>{formatCurrency(record.basicSalary)}</td>
                <td>{formatCurrency(record.basicProduction)}</td>
                <td>{formatCurrency(record.variables)}</td>
                <td>{formatCurrency(record.environment)}</td>
                <td>{formatCurrency(record.meal)}</td>
                <td>{formatCurrency(record.shift)}</td>
                <td>{formatCurrency(record.supervising)}</td>
                <td>{formatCurrency(record.others)}</td>
                <td>{formatCurrency(record.prepaid)}</td>
                <td>{formatCurrency(record.bonds)}</td>
                <td className="action-cell"> {/* <-- ADD ACTIONS CELL */}
                  <Link to={`/salary-profile/history/edit/${record._id}`}>
                    <FaPencilAlt className="action-icon edit-icon" />
                  </Link>
                  <FaTrash
                    className="action-icon delete-icon"
                    onClick={() => handleDelete(record._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryHistory;
