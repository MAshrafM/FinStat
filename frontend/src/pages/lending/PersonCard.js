// frontend/src/pages/lending/PersonCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const PersonCard = ({ person }) => {
  const owes = (person.totalOwedInPiastres || 0) / 100;
  const loansCount = person.loanCount || 0;
  const activeCount = person.activeLoanCount || 0;

  return (
    <div className="person-card">
      <div className="person-card-header">
        <div>
          <h3 className="person-card-name">
            <Link to={`/lending/persons/${person._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {person.name}
            </Link>
          </h3>
          {person.note && <div className="person-card-note">{person.note}</div>}
        </div>
        <span className={`person-card-badge ${owes > 0 ? 'badge-active' : 'badge-repaid'}`}>
          {owes > 0 ? 'Owes Money' : 'Settled'}
        </span>
      </div>

      <div className="person-card-stats">
        <div>
          <div className="person-card-stat-label">Total Outstanding</div>
          <div className="person-card-stat-val" style={{ color: owes > 0 ? '#4f46e5' : '#059669' }}>
            {formatCurrency(owes)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="person-card-stat-label">Active / Total Loans</div>
          <div className="person-card-stat-val">
            {activeCount} / {loansCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonCard;
