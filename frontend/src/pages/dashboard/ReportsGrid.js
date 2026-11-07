// frontend/src/pages/dashboard/ReportsGrid.js
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBalanceScale, FaWallet } from 'react-icons/fa';
import { QUICK_LAUNCH_ACTIONS, EXPLORE_LINKS } from '../../config/dashboardActions';

const REPORT_KEYS = [
  'portfolio',
  'payroll',
  'spending',
  'trade-summary',
  'fund-summary',
  'gold-summary',
  'budgets',
  'credit',
];

const ReportsGrid = ({ canModify = false, onOpenLauncher = () => {} }) => {
  const reports = useMemo(
    () => EXPLORE_LINKS.filter((link) => REPORT_KEYS.includes(link.key)),
    []
  );

  return (
    <>
      {/* Quick launch */}
      {canModify && (
        <section className="dash-section">
          <div className="dash-section-head">
            <div>
              <h2>Quick launch</h2>
              <p>Your most-used actions, ready to go.</p>
            </div>
            <button
              type="button"
              className="dash-text-btn"
              onClick={() => onOpenLauncher('create')}
            >
              All actions <FaArrowRight aria-hidden="true" />
            </button>
          </div>

          <div className="dash-launch-grid">
            {QUICK_LAUNCH_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.key}
                  to={action.path}
                  className={`dash-launch-tile tone-${action.tone}`}
                >
                  <span className="dash-launch-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="dash-launch-copy">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <FaArrowRight className="dash-launch-arrow" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Reports */}
      <section className="dash-section">
        <div className="dash-section-head">
          <div>
            <h2>Reports & insights</h2>
            <p>Go deeper with summaries built for every part of your finances.</p>
          </div>
          <button type="button" className="dash-text-btn" onClick={() => onOpenLauncher('explore')}>
            Browse all <FaArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="dash-reports-grid">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link key={report.key} to={report.path} className={`dash-report tone-${report.tone}`}>
                <span className="dash-report-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="dash-report-copy">
                  <strong>{report.label}</strong>
                  <small>{report.description}</small>
                </span>
                <FaArrowRight className="dash-report-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footnote */}
      <div className="dash-footnote">
        <span>
          <FaWallet aria-hidden="true" /> Values combine live market prices with your latest
          recorded transactions.
        </span>
        <span>
          <FaBalanceScale aria-hidden="true" /> Returns are indicative and exclude taxes and fees
          where not recorded.
        </span>
      </div>
    </>
  );
};

export default React.memo(ReportsGrid);
