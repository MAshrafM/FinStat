// frontend/src/pages/salary/SalaryHistory.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';
import { getProfile, deleteHistoryRecord } from '../../services/salaryService';
import { formatCurrency } from '../../utils/formatters';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../../components/ui';
import './SalaryProfile.css';

const SalaryHistory = () => {
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const [historyToDelete, setHistoryToDelete] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    getProfile()
      .then(setProfile)
      .catch((err) => console.error('Failed to load salary history profile:', err));
  };

  const handleDelete = (historyId) => {
    setHistoryToDelete(historyId);
  };

  const handleConfirmDelete = async () => {
    if (!historyToDelete) return;
    try {
      await deleteHistoryRecord(historyToDelete);
      if (notify) notify('Salary history record deleted', 'success');
      setHistoryToDelete(null);
      loadProfile();
    } catch (err) {
      if (notify) notify('Failed to delete salary history record', 'error');
    }
  };

  const toggleExpand = (recordId) => {
    setExpandedIds((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  if (!profile) {
    return <Loading variant="route" text="Loading salary history..." />;
  }

  // Sort history so the newest is at the top
  const sortedHistory = [...(profile.salaryHistory || [])].sort(
    (a, b) => new Date(b.effectiveDate || 0) - new Date(a.effectiveDate || 0)
  );

  return (
    <div className="fs-page salary-history-container">
      <div className="page-header salary-history-header">
        <div>
          <h1>Salary History for {profile.name}</h1>
          <p className="salary-history-subtitle">
            Comprehensive audit log of historical compensation adjustments and component structures
          </p>
        </div>
        <Link to="/salary/profiles" className="fs-btn fs-btn-secondary">
          <ArrowLeft size={16} /> Back to Profiles
        </Link>
      </div>

      {/* Desktop 12-Column Dense Financial Table (>768px) */}
      <div className="salary-history-table-wrapper fs-table-scroll">
        <table className="fs-table salary-history-table" data-testid="salary-history-table">
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
              <th className="action-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map((record) => (
              <tr key={record._id} data-id={record._id}>
                <td data-label="Date">
                  {record.effectiveDate ? new Date(record.effectiveDate).toLocaleDateString() : 'N/A'}
                </td>
                <td data-label="Basic Salary" className="fs-num">{formatCurrency(record.basicSalary)}</td>
                <td data-label="Production" className="fs-num">{formatCurrency(record.basicProduction)}</td>
                <td data-label="Variables" className="fs-num">{formatCurrency(record.variables)}</td>
                <td data-label="Environment" className="fs-num">{formatCurrency(record.environment)}</td>
                <td data-label="Meal" className="fs-num">{formatCurrency(record.meal)}</td>
                <td data-label="Shift" className="fs-num">{formatCurrency(record.shift)}</td>
                <td data-label="Supervising" className="fs-num">{formatCurrency(record.supervising)}</td>
                <td data-label="Others" className="fs-num">{formatCurrency(record.others)}</td>
                <td data-label="Prepaid" className="fs-num">{formatCurrency(record.prepaid)}</td>
                <td data-label="Bonds" className="fs-num">{formatCurrency(record.bonds)}</td>
                <td data-label="Actions" className="action-cell">
                  <div className="salary-history-actions">
                    <Link
                      to={`/salary-profile/history/edit/${record._id}`}
                      className="fs-btn fs-btn-ghost fs-btn-sm"
                      aria-label="Edit historical record"
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      className="fs-btn fs-btn-ghost fs-btn-sm fs-btn-danger"
                      aria-label="Delete historical record"
                      onClick={() => handleDelete(record._id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Decision D19 Compact-Expand Cards (<=768px) */}
      <div className="salary-history-cards" data-testid="salary-history-cards">
        {sortedHistory.map((record) => {
          const isExpanded = Boolean(expandedIds[record._id]);
          return (
            <div className="salary-history-card fs-card" key={record._id} data-id={record._id}>
              <div className="salary-history-card-header">
                <span className="salary-history-card-date">
                  {record.effectiveDate ? new Date(record.effectiveDate).toLocaleDateString() : 'N/A'}
                </span>
                <div className="salary-history-card-actions">
                  <Link
                    to={`/salary-profile/history/edit/${record._id}`}
                    className="fs-btn fs-btn-ghost fs-btn-sm"
                    aria-label="Edit historical record"
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    type="button"
                    className="fs-btn fs-btn-ghost fs-btn-sm fs-btn-danger"
                    aria-label="Delete historical record"
                    onClick={() => handleDelete(record._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="salary-history-card-primary">
                <span className="salary-history-label">Basic Salary</span>
                <span className="salary-history-value fs-num">{formatCurrency(record.basicSalary)}</span>
              </div>

              <button
                type="button"
                className="fs-btn fs-btn-ghost salary-history-expander"
                aria-expanded={isExpanded}
                aria-label="Expand salary components"
                onClick={() => toggleExpand(record._id)}
              >
                <span>{isExpanded ? 'Hide Details' : 'View Components'}</span>
                <ChevronDown size={16} className={`expander-chevron ${isExpanded ? 'rotated' : ''}`} />
              </button>

              {isExpanded && (
                <div className="salary-history-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-label">Production</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.basicProduction)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Variables</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.variables)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Environment</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.environment)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Meal</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.meal)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Shift</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.shift)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Supervising</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.supervising)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Others</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.others)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Prepaid</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.prepaid)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="breakdown-label">Bonds</span>
                    <span className="breakdown-value fs-num">{formatCurrency(record.bonds)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={Boolean(historyToDelete)}
        title="Delete Salary History Record"
        message="Are you sure you want to delete this historical record? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setHistoryToDelete(null)}
      />
    </div>
  );
};

export default SalaryHistory;
