// frontend/src/pages/admin/TaxConfigCard.js
import React from 'react';
import { Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '../../components/ui';

const TaxConfigCard = ({ config, onEdit, onDelete, onToggleActive }) => {
  if (!config) return null;

  const isActive = config.isActive !== false;
  const year = config.year;
  const personalExemption = Number(config.personalExemption || 0).toLocaleString();
  const brackets = config.brackets || [];

  return (
    <div className={`fs-card admin-config-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="admin-card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h2 className="card-year-title">{year} Tax Brackets</h2>
            <Badge tone={isActive ? 'neutral' : 'warning'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="card-summary-subtext">
            <span>Personal Exemption: </span>
            <strong className="fs-num card-summary-figure">{personalExemption} EGP</strong>
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

      <div className="card-table-wrapper">
        <table className="fs-table admin-data-table">
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
                    <td className="fs-num">{Number(bracket.from || 0).toLocaleString()}</td>
                    <td className="fs-num">
                      {isInfinity ? (
                        <span className="infinity-symbol">∞</span>
                      ) : (
                        Number(bracket.to || 0).toLocaleString()
                      )}
                    </td>
                    <td className="fs-num text-right rate-cell">
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
          Status: {isActive ? 'Active' : 'Inactive'}
        </span>
        {config.lastUpdated && (
          <span className="card-meta-date">
            Updated{' '}
            <time data-visual-mask="true" className="fs-num">
              {new Date(config.lastUpdated).toLocaleDateString()}
            </time>
          </span>
        )}
      </div>
    </div>
  );
};

export default TaxConfigCard;
