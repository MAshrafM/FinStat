// frontend/src/pages/dashboard/SavingsForexCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowDown,
  FaArrowRight,
  FaArrowUp,
  FaExchangeAlt,
  FaHome,
  FaLandmark,
  FaUniversity,
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';

const SavingsForexCard = ({
  savingsForexSummary = {},
  realEstates = [],
  realEstateTotalCurrent = 0,
}) => {
  const isPositiveGain = (savingsForexSummary.totalForexGainLoss || 0) >= 0;

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <div className="dash-panel-title">
          <span className="dash-panel-icon">
            <FaLandmark aria-hidden="true" />
          </span>
          <div>
            <h2>Savings & FX</h2>
            <p>Fixed income and foreign-currency value.</p>
          </div>
        </div>
        <Link to="/certificates" className="dash-text-btn">
          Details <FaArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="dash-savings-list">
        <Link to="/certificates" className="dash-savings-row">
          <span className="dash-savings-icon">
            <FaUniversity aria-hidden="true" />
          </span>
          <span className="dash-savings-copy">
            <strong>Certificates</strong>
            <small className="fs-num">{savingsForexSummary.activeCertCount || 0} active deposit(s)</small>
          </span>
          <span className="dash-savings-value fs-num">
            {formatCurrency(savingsForexSummary.totalCertValue || 0)}
          </span>
        </Link>

        <Link to="/currency" className="dash-savings-row">
          <span className="dash-savings-icon">
            <FaExchangeAlt aria-hidden="true" />
          </span>
          <span className="dash-savings-copy">
            <strong>Foreign currency</strong>
            <small className="fs-num">{savingsForexSummary.forexHoldingCount || 0} holding(s)</small>
          </span>
          <span className="dash-savings-value fs-num">
            {formatCurrency(savingsForexSummary.totalForexValue || 0)}
          </span>
        </Link>

        <div className="dash-savings-row static">
          <span className="dash-savings-icon">
            {isPositiveGain ? (
              <FaArrowUp aria-hidden="true" />
            ) : (
              <FaArrowDown aria-hidden="true" />
            )}
          </span>
          <span className="dash-savings-copy">
            <strong>Unrealized FX gain / loss</strong>
            <small>Calculated with daily CIB rates</small>
          </span>
          <span
            className={`dash-savings-value fs-num ${
              isPositiveGain ? 'positive' : 'negative'
            }`}
          >
            {isPositiveGain ? '+' : ''}
            {formatCurrency(savingsForexSummary.totalForexGainLoss || 0)}
          </span>
        </div>
      </div>

      {realEstates && realEstates.length > 0 && (
        <div className="dash-property-note">
          <FaHome aria-hidden="true" />
          <span>
            {realEstates.length} propert
            {realEstates.length === 1 ? 'y' : 'ies'} valued at{' '}
            <strong className="fs-num">{formatCurrency(realEstateTotalCurrent || 0)}</strong>
          </span>
          <Link to="/real-estate">
            View <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
};

export default React.memo(SavingsForexCard);
