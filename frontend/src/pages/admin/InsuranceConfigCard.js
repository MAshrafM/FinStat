// frontend/src/pages/admin/InsuranceConfigCard.js
import React from 'react';
import { Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '../../components/ui';

const InsuranceConfigCard = ({ config, onEdit, onDelete, onToggleActive }) => {
  if (!config) return null;

  const isActive = config.isActive !== false;
  const year = config.year;
  const employeeShare = config.employeeShare !== undefined ? config.employeeShare : 11;
  const employerShare = config.employerShare !== undefined ? config.employerShare : 18.75;
  const minIncome = Number(config.minInsurableIncome || 0).toLocaleString();
  const maxIncome = Number(config.maxInsurableIncome || 0).toLocaleString();

  return (
    <div className={`fs-card admin-config-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="admin-card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h2 className="card-year-title">{year} Social Insurance</h2>
            <Badge tone={isActive ? 'neutral' : 'warning'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="card-summary-subtext">
            <span>Official contribution rates &amp; legal wage thresholds</span>
            {config.country && <span className="text-muted-country"> • {config.country}</span>}
          </div>
        </div>

        <div className="card-header-actions">
          <button
            type="button"
            className="fs-btn fs-btn-ghost action-icon-btn"
            onClick={() => onToggleActive && onToggleActive(config)}
            title={isActive ? 'Deactivate configuration' : 'Activate configuration'}
            aria-label={isActive ? 'Deactivate configuration' : 'Activate configuration'}
          >
            {isActive ? <ToggleRight size={20} aria-hidden="true" /> : <ToggleLeft size={20} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-ghost action-icon-btn"
            onClick={() => onEdit && onEdit(config)}
            title="Edit configuration"
            aria-label="Edit configuration"
          >
            <Edit3 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-ghost action-icon-btn"
            onClick={() => onDelete && onDelete(config)}
            title="Delete configuration"
            aria-label="Delete configuration"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="insurance-metrics-grid">
        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Employee Share</span>
          <span className="metric-tile-val fs-num">{employeeShare}%</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Employer Share</span>
          <span className="metric-tile-val fs-num">{employerShare}%</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Min Insurable Income</span>
          <span className="metric-tile-val fs-num">{minIncome} EGP</span>
        </div>

        <div className="insurance-metric-tile">
          <span className="metric-tile-label">Max Insurable Income</span>
          <span className="metric-tile-val fs-num">{maxIncome} EGP</span>
        </div>
      </div>

      <div className="card-footer-meta">
        <span className="card-meta-status">
          Status: {isActive ? 'Active' : 'Inactive'}
        </span>
        {config.updatedAt && (
          <span className="card-meta-date">
            Updated{' '}
            <time data-visual-mask="true" className="fs-num">
              {new Date(config.updatedAt).toLocaleDateString()}
            </time>
          </span>
        )}
      </div>
    </div>
  );
};

export default InsuranceConfigCard;
