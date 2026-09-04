// frontend/src/pages/admin/TaxConfigCard.js
import React from 'react';
import { Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const TaxConfigCard = ({ config, onEdit, onDelete, onToggleActive }) => {
  if (!config) return null;

  const isActive = config.isActive !== false;
  const year = config.year;
  const personalExemption = Number(config.personalExemption || 0).toLocaleString();
  const brackets = config.brackets || [];

  return (
    <div className={`admin-config-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="admin-card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h3 className="card-year-title">
              {year} Tax Brackets
            </h3>
            <span className={`status-badge-pill ${isActive ? 'status-active' : 'status-inactive'}`}>
              <span className="status-dot"></span>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="card-summary-subtext">
            <span>Personal Exemption: </span>
            <strong className="accent-amount">{personalExemption} EGP</strong>
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

      <div className="card-table-wrapper">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th scope="col">From (EGP)</th>
              <th scope="col">To (EGP)</th>
              <th scope="col" className="text-right">Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            {brackets.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-table-row">No bracket tiers configured</td>
              </tr>
            ) : (
              brackets.map((bracket, index) => {
                const isInfinity = bracket.to >= 100000000;
                return (
                  <tr key={bracket._id || index}>
                    <td className="font-mono">{Number(bracket.from || 0).toLocaleString()}</td>
                    <td className="font-mono">
                      {isInfinity ? (
                        <span className="infinity-symbol">∞</span>
                      ) : (
                        Number(bracket.to || 0).toLocaleString()
                      )}
                    </td>
                    <td className="font-mono text-right rate-cell">
                      <span className="rate-badge">{bracket.rate}%</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card-footer-meta">
        <span className="card-meta-status">
          Status: {isActive ? '🟢 Active' : '🟡 Inactive'}
        </span>
        {config.lastUpdated && (
          <span className="card-meta-date">
            Updated {new Date(config.lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaxConfigCard;
