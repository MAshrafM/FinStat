// frontend/src/pages/lending/PersonCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
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
            <Link to={`/lending/persons/${person._id}`} className="person-card-link">
              {person.name}
            </Link>
          </h3>
          {person.note && <div className="person-card-note">{person.note}</div>}
        </div>
        <Badge tone="neutral">
          {owes > 0 ? 'Owes Money' : 'Settled'}
        </Badge>
      </div>

      <div className="person-card-stats">
        <div>
          <div className="person-card-stat-label">Total Outstanding</div>
          <div className="person-card-stat-val fs-num">
            {formatCurrency(owes)}
          </div>
        </div>
        <div className="person-card-stat-right">
          <div className="person-card-stat-label">Active / Total Loans</div>
          <div className="person-card-stat-val fs-num">
            {activeCount} / {loansCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonCard;
