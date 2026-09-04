// frontend/src/pages/admin/InsuranceConfigCard.js
import React from 'react';
import { Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const InsuranceConfigCard = ({ config, onEdit, onDelete, onToggleActive }) => {
  if (!config) return null;

  const isActive = config.isActive !== false;
  const year = config.year;
  const employeeShare = config.employeeShare !== undefined ? config.employeeShare : 11;
  const employerShare = config.employerShare !== undefined ? config.employerShare : 18.75;
  const minIncome = Number(config.minInsurableIncome || 0).toLocaleString();
  const maxIncome = Number(config.maxInsurableIncome || 0).toLocaleString();

  return (
    <div className={`admin-config-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="admin-card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h3 className="card-year-title">
              {year} Social Insurance
            </h3>
            <span className={`status-badge-pill ${isActive ? 'status-active' : 'status-inactive'}`}>
              <span className="status-dot"></span>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="card-summary-subtext">
            <span>Official contribution rates &amp; legal wage thresholds</span>
            {config.country && <span className="text-muted-country"> • {config.country}</span>}
          </div>
        </div>

        <div className="card-header-actions">
          <button
            type="button"
            className={`action-icon-btn toggle-btn ${isActive ? 'btn-active' : 'btn-inactive'}`}
            onClick={() => onToggleActive && onToggleActive(config)}
            title={isActive ? 'Deactivate configuration' : 'Activate configuration'}
            aria-label={isActive ? 'Deactivate configuration' : 'Activate configuration'}
          >
            {isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
          <button
            type="button"
            className="action-icon-btn edit-btn"
            onClick={() => onEdit && onEdit(config)}
            title="Edit configuration"
            aria-label="Edit configuration"
          >
            <Edit3 size={16} />
          </button>
          <button
            type="button"
            className="action-icon-btn delete-btn"
            onClick={() => onDelete && onDelete(config)}
            title="Delete configuration"
            aria-label="Delete configuration"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards (inline grid) */}
      <div className="insurance-metrics-grid">
        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Employee Share</span>
          <span className="metric-tile-val text-accent-blue font-bold">{employeeShare}%</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Employer Share</span>
          <span className="metric-tile-val text-accent-purple font-bold">{employerShare}%</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Min Insurable Income</span>
          <span className="metric-tile-val text-accent-cyan font-semibold">{minIncome} EGP</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Max Insurable Income</span>
          <span className="metric-tile-val text-accent-amber font-semibold">{maxIncome} EGP</span>
        </div>
      </div>

      <div className="card-footer-meta">
        <span className="card-meta-status">
          Status: {isActive ? '🟢 Active' : '🟡 Inactive'}
        </span>
        {config.updatedAt && (
          <span className="card-meta-date">
            Updated {new Date(config.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default InsuranceConfigCard;
