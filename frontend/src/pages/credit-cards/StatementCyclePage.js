import React, { useState, useEffect, useCallback } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { getCards, getStatementCycles } from '../../services/creditCardService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaCalendarAlt, FaClock, FaReceipt, FaMoneyCheckAlt } from 'react-icons/fa';
import CardInstallmentSchedule from './CardInstallmentSchedule';
import './StatementCyclePage.css';

const StatementCyclePage = () => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cycleData, setCycleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user's cards
  useEffect(() => {
    getCards()
      .then((data) => {
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0]._id);
        }
      })
      .catch((err) => {
        console.error('Failed to load cards:', err);
        setError('Failed to load credit cards.');
      });
  }, []);

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

  const currentPeriod = cycleData?.currentPeriod;
  const cycleSummary = cycleData?.currentCycleData;
  const cardInfo = cycleData?.card;

  return (
    <div className="page-container">
      <CreditCardSubNav />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Statement Cycle Visualization</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Monitor billing cycle windows, transaction accumulation, and upcoming payment due dates.
          </p>
        </div>

        {cards.length > 0 && (
          <div className="card-selector" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, color: '#374151', marginRight: '0.5rem' }}>Select Card:</label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <p>Loading statement cycle timeline...</p>}

      {currentPeriod && !isLoading && (
        <>
          {/* Cycle Metrics Top Cards */}
          <div className="cycle-summary-cards-grid">
            <div className="cycle-metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <FaCalendarAlt size={18} />
              </div>
              <div>
                <span className="metric-label">Statement Period</span>
                <span className="metric-value">
                  {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.closeDate)}
                </span>
                <span className="metric-hint">Closes on day {cardInfo?.statementCloseDay || cardInfo?.billingCycleDay || 25}</span>
              </div>
            </div>

            <div className={`cycle-metric-card ${currentPeriod.isOverdue ? 'metric-card-danger' : ''}`}>
              <div
                className="metric-icon-wrap"
                style={{
                  backgroundColor: currentPeriod.isOverdue ? '#fee2e2' : '#fef3c7',
                  color: currentPeriod.isOverdue ? '#dc2626' : '#d97706',
                }}
              >
                <FaClock size={18} />
              </div>
              <div>
                <span className="metric-label">Payment Due Date</span>
                <span className="metric-value">{formatDate(currentPeriod.dueDate)}</span>
                <span
                  className="metric-hint"
                  style={{ color: currentPeriod.isOverdue ? '#dc2626' : '#d97706', fontWeight: 600 }}
                >
                  {currentPeriod.isOverdue
                    ? `⚠️ Overdue by ${Math.abs(currentPeriod.daysUntilDue)} days`
                    : `⏳ Due in ${currentPeriod.daysUntilDue} days`}
                </span>
              </div>
            </div>

            <div className="cycle-metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <FaReceipt size={18} />
              </div>
              <div>
                <span className="metric-label">Current Cycle Charges</span>
                <span className="metric-value" style={{ color: '#dc2626' }}>
                  {formatCurrency(cycleSummary?.totalCharges || 0)}
                </span>
                <span className="metric-hint">{cycleSummary?.transactions?.length || 0} transactions logged</span>
              </div>
            </div>

            <div className="cycle-metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                <FaMoneyCheckAlt size={18} />
              </div>
              <div>
                <span className="metric-label">Payments / Settlements</span>
                <span className="metric-value" style={{ color: '#16a34a' }}>
                  {formatCurrency(cycleSummary?.totalPayments || 0)}
                </span>
                <span className="metric-hint">Net Change: {formatCurrency(Math.max(0, cycleSummary?.netCycleChange || 0))}</span>
              </div>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="timeline-container-card">
            <h3>Cycle Timeline & Milestones</h3>
            <div className="cycle-timeline-track">
              {/* Start Milestone */}
              <div className="timeline-milestone milestone-start">
                <div className="milestone-dot" />
                <span className="milestone-title">Cycle Start</span>
                <span className="milestone-date">{formatDate(currentPeriod.startDate)}</span>
              </div>

              {/* Close Milestone */}
              <div className="timeline-milestone milestone-close">
                <div className="milestone-dot dot-close" />
                <span className="milestone-title">Statement Close</span>
                <span className="milestone-date">{formatDate(currentPeriod.closeDate)}</span>
                <span className="milestone-days">{currentPeriod.daysUntilClose} days left</span>
              </div>

              {/* Due Date Milestone */}
              <div className="timeline-milestone milestone-due">
                <div className={`milestone-dot ${currentPeriod.isOverdue ? 'dot-overdue' : 'dot-due'}`} />
                <span className="milestone-title">Payment Due</span>
                <span className="milestone-date">{formatDate(currentPeriod.dueDate)}</span>
                <span className="milestone-badge">{currentPeriod.daysUntilDue} days</span>
              </div>
            </div>
          </div>

          {/* Active Card Installment Schedule */}
          <CardInstallmentSchedule
            installments={cycleSummary?.activeInstallments || cycleSummary?.transactions?.filter((tx) => tx.type === 'Installment') || []}
          />

          {/* Current Cycle Transactions Itemization */}
          <div className="cycle-transactions-section">
            <h3 style={{ margin: '1.5rem 0 1rem 0', color: '#1f2937' }}>Current Cycle Charges ({cycleSummary?.transactions?.length || 0})</h3>
            <div className="table-container">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant / Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cycleSummary?.transactions?.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af' }}>
                        No transactions logged during this statement cycle.
                      </td>
                    </tr>
                  ) : (
                    cycleSummary?.transactions?.map((tx) => (
                      <tr key={tx._id}>
                        <td>{formatDate(tx.date)}</td>
                        <td><strong>{tx.description}</strong></td>
                        <td>
                          <span className="category-pill">{tx.category || 'Other'}</span>
                        </td>
                        <td>{tx.type}</td>
                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatementCyclePage;
