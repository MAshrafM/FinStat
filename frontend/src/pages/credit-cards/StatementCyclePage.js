// frontend/src/pages/credit-cards/StatementCyclePage.js
import React, { useState, useEffect, useCallback } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { getCards, getStatementCycles } from '../../services/creditCardService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaCalendarAlt, FaClock, FaReceipt, FaMoneyCheckAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CardInstallmentSchedule from './CardInstallmentSchedule';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import './CreditCardPage.css';
import './StatementCyclePage.css';

const getDueBadgeProps = (currentPeriod) => {
  if (!currentPeriod) return null;
  if (currentPeriod.isOverdue) {
    return { tone: 'negative', label: 'Overdue' };
  }
  if (currentPeriod.daysUntilDue <= 7) {
    return { tone: 'warning', label: 'Due soon' };
  }
  return null;
};

const StatementCyclePage = () => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cycleData, setCycleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTxIds, setExpandedTxIds] = useState(() => new Set());

  const loadCards = useCallback(() => {
    setError('');
    getCards()
      .then((data) => {
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId((prev) => prev || data[0]._id);
        }
      })
      .catch((err) => {
        console.error('Failed to load cards:', err);
        setError('Failed to load credit cards.');
      });
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const loadCycles = useCallback(() => {
    if (!selectedCardId) return;
    setIsLoading(true);
    setError('');

    getStatementCycles(selectedCardId, 6)
      .then((res) => {
        setCycleData(res);
      })
      .catch((err) => {
        console.error('Failed to load statement cycle data:', err);
        setError(err.message || 'Failed to fetch statement cycle.');
      })
      .finally(() => setIsLoading(false));
  }, [selectedCardId]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const toggleTxExpand = (id) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const currentPeriod = cycleData?.currentPeriod;
  const cycleSummary = cycleData?.currentCycleData;
  const cardInfo = cycleData?.card;
  const dueBadge = getDueBadgeProps(currentPeriod);
  const cycleTransactions = cycleSummary?.transactions || [];

  return (
    <div className="page-container cc-page-container cc-dashboard-page sc-page">
      <CreditCardSubNav />

      <div className="sc-header">
        <div className="sc-title-block">
          <h1>Statement Cycle Visualization</h1>
          <p className="sc-subtitle">
            Monitor billing cycle windows, transaction accumulation, and upcoming payment due dates.
          </p>
        </div>

        {cards.length > 0 && (
          <div className="sc-card-selector">
            <label htmlFor="sc-card-select" className="sc-selector-label">
              Select Card:
            </label>
            <select
              id="sc-card-select"
              className="sc-select"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
            >
              {cards.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.bank})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="sc-error-card" role="alert">
          <h2>Unable to load statement cycle</h2>
          <p>{error}</p>
          <button
            type="button"
            className="fs-btn fs-btn-secondary"
            onClick={selectedCardId ? loadCycles : loadCards}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="sc-loading-wrap">
          <Loading variant="card" text="Loading statement cycle timeline..." />
        </div>
      )}

      {!isLoading && !error && cards.length === 0 && (
        <div className="sc-empty-card">
          <h2>No Credit Cards Found</h2>
          <p>Add a credit card on the Cards &amp; Transactions tab to inspect statement cycles.</p>
        </div>
      )}

      {currentPeriod && !isLoading && (
        <>
          {/* Cycle Metrics Top Cards */}
          <div className="sc-summary-grid">
            <div className="sc-metric-card">
              <div className="sc-metric-icon" aria-hidden="true">
                <FaCalendarAlt size={18} />
              </div>
              <div className="sc-metric-body">
                <span className="sc-metric-label">Statement Period</span>
                <span className="sc-metric-value fs-num">
                  {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.closeDate)}
                </span>
                <span className="sc-metric-hint">
                  Closes on day {cardInfo?.statementCloseDay || cardInfo?.billingCycleDay || 25}
                </span>
              </div>
            </div>

            <div className="sc-metric-card">
              <div className="sc-metric-icon" aria-hidden="true">
                <FaClock size={18} />
              </div>
              <div className="sc-metric-body">
                <span className="sc-metric-label">Payment Due Date</span>
                <span className="sc-metric-value fs-num">{formatDate(currentPeriod.dueDate)}</span>
                <div className="sc-due-row">
                  {dueBadge && <Badge tone={dueBadge.tone}>{dueBadge.label}</Badge>}
                  <span className="sc-metric-hint fs-num">
                    {currentPeriod.isOverdue
                      ? `Overdue by ${Math.abs(currentPeriod.daysUntilDue)} days`
                      : `Due in ${currentPeriod.daysUntilDue} days`}
                  </span>
                </div>
              </div>
            </div>

            <div className="sc-metric-card">
              <div className="sc-metric-icon" aria-hidden="true">
                <FaReceipt size={18} />
              </div>
              <div className="sc-metric-body">
                <span className="sc-metric-label">Current Cycle Charges</span>
                <span className="sc-metric-value fs-num">
                  {formatCurrency(cycleSummary?.totalCharges || 0)}
                </span>
                <span className="sc-metric-hint fs-num">
                  {cycleTransactions.length} transactions logged
                </span>
              </div>
            </div>

            <div className="sc-metric-card">
              <div className="sc-metric-icon" aria-hidden="true">
                <FaMoneyCheckAlt size={18} />
              </div>
              <div className="sc-metric-body">
                <span className="sc-metric-label">Payments / Settlements</span>
                <span className="sc-metric-value fs-num">
                  {formatCurrency(cycleSummary?.totalPayments || 0)}
                </span>
                <span className="sc-metric-hint fs-num">
                  Net Change: {formatCurrency(Math.max(0, cycleSummary?.netCycleChange || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="sc-timeline-card">
            <h2>Cycle Timeline &amp; Milestones</h2>
            <div className="sc-timeline-track">
              <div className="sc-milestone">
                <div className="sc-milestone-dot" aria-hidden="true" />
                <span className="sc-milestone-title">Cycle Start</span>
                <span className="sc-milestone-date fs-num">{formatDate(currentPeriod.startDate)}</span>
              </div>

              <div className="sc-milestone">
                <div className="sc-milestone-dot" aria-hidden="true" />
                <span className="sc-milestone-title">Statement Close</span>
                <span className="sc-milestone-date fs-num">{formatDate(currentPeriod.closeDate)}</span>
                <span className="sc-milestone-meta fs-num">{currentPeriod.daysUntilClose} days left</span>
              </div>

              <div className="sc-milestone">
                <div className="sc-milestone-dot" aria-hidden="true" />
                <span className="sc-milestone-title">Payment Due</span>
                <span className="sc-milestone-date fs-num">{formatDate(currentPeriod.dueDate)}</span>
                <Badge tone={dueBadge ? dueBadge.tone : 'neutral'}>
                  {dueBadge ? `${dueBadge.label} (${currentPeriod.daysUntilDue}d)` : `${currentPeriod.daysUntilDue} days`}
                </Badge>
              </div>
            </div>
          </div>

          {/* Active Card Installment Schedule */}
          <CardInstallmentSchedule
            installments={
              cycleSummary?.activeInstallments ||
              cycleTransactions.filter((tx) => tx.type === 'Installment') ||
              []
            }
          />

          {/* Current Cycle Transactions Itemization */}
          <section className="sc-section" aria-label="Current Cycle Charges">
            <div className="sc-section-header">
              <h2 className="sc-section-title">
                Current Cycle Charges ({cycleTransactions.length})
              </h2>
            </div>

            {cycleTransactions.length === 0 ? (
              <div className="sc-empty-card">
                <p>No transactions logged during this statement cycle.</p>
              </div>
            ) : (
              <>
                <div className="sc-table-card">
                  <table className="sc-table">
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Merchant / Description</th>
                        <th scope="col">Category</th>
                        <th scope="col">Type</th>
                        <th scope="col" className="sc-th-num">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleTransactions.map((tx) => (
                        <tr key={tx._id}>
                          <td className="fs-num">{formatDate(tx.date)}</td>
                          <td className="sc-tx-merchant">{tx.description}</td>
                          <td>
                            <Badge tone="neutral">{tx.category || 'Other'}</Badge>
                          </td>
                          <td>{tx.type}</td>
                          <td className="sc-td-num fs-num">{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sc-mobile-cards" data-testid="sc-charges-mobile-cards">
                  {cycleTransactions.map((tx, index) => {
                    const key = tx._id || `tx-${index}`;
                    const isExpanded = expandedTxIds.has(key);
                    return (
                      <article key={key} className="sc-mobile-card">
                        <div className="sc-mobile-card-summary">
                          <div className="sc-mobile-card-main">
                            <span className="sc-mobile-card-title">{tx.description}</span>
                            <span className="sc-mobile-card-sub fs-num">{formatDate(tx.date)}</span>
                          </div>
                          <div className="sc-mobile-card-val fs-num">{formatCurrency(tx.amount)}</div>
                        </div>

                        <button
                          type="button"
                          className="sc-mobile-expand-btn"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} charge details for ${tx.description}`}
                          onClick={() => toggleTxExpand(key)}
                        >
                          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>

                        {isExpanded && (
                          <div className="sc-mobile-details">
                            <div className="sc-mobile-detail-item">
                              <span className="sc-mobile-detail-label">Category</span>
                              <span className="sc-mobile-detail-value">{tx.category || 'Other'}</span>
                            </div>
                            <div className="sc-mobile-detail-item">
                              <span className="sc-mobile-detail-label">Type</span>
                              <span className="sc-mobile-detail-value">{tx.type}</span>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StatementCyclePage;
