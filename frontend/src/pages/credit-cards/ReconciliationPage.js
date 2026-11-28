// frontend/src/pages/credit-cards/ReconciliationPage.js
import React, { useState, useEffect } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { getCards, getStatementCycles, reconcileCycle } from '../../services/creditCardService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle,
  FaReceipt,
  FaMoneyCheckAlt,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import Delta from '../../components/ui/Delta';
import './ReconciliationPage.css';

const ReconciliationPage = () => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [cycles, setCycles] = useState([]);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);
  const [actualBalance, setActualBalance] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedChargeKeys, setExpandedChargeKeys] = useState(() => new Set());
  const [expandedPaymentKeys, setExpandedPaymentKeys] = useState(() => new Set());

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

  useEffect(() => {
    if (!selectedCardId) return;
    getStatementCycles(selectedCardId, 6)
      .then((res) => {
        const fetchedCycles = res.cycles || [];
        setCycles(fetchedCycles);
        setSelectedCycleIndex(0);
      })
      .catch((err) => {
        console.error('Failed to load cycles for card:', err);
        setError('Failed to load statement cycles.');
      });
  }, [selectedCardId]);

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!selectedCardId || cycles.length === 0) return;
    const balanceNum = parseFloat(actualBalance);
    if (isNaN(balanceNum)) {
      setError('Please enter a valid actual statement balance.');
      return;
    }
    setError('');
    setIsLoading(true);

    const activeCycle = cycles[selectedCycleIndex];
    try {
      const res = await reconcileCycle(selectedCardId, {
        cycleStart: activeCycle.startDate,
        cycleEnd: activeCycle.closeDate || activeCycle.endDate,
        actualStatementBalance: balanceNum,
      });
      setReport(res);
    } catch (err) {
      console.error('Reconciliation error:', err);
      setError(err.message || 'Failed to reconcile cycle.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleKey = (setter, key) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="page-container rec-page">
      <CreditCardSubNav />

      <div className="rec-header">
        <h1>Auto-Reconciliation Engine</h1>
        <p className="rec-subtitle">
          Compare your logged transactions and payments against your official bank statement balance to catch missing fees or errors.
        </p>
      </div>

      {/* Inputs Form Card */}
      <div className="rec-input-card">
        <form onSubmit={handleReconcile}>
          <div className="rec-form-grid">
            <div className="rec-form-group">
              <label htmlFor="rec-card-select">Select Card</label>
              <select
                id="rec-card-select"
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  setReport(null);
                }}
              >
                {cards.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.bank})
                  </option>
                ))}
              </select>
            </div>

            <div className="rec-form-group">
              <label htmlFor="rec-cycle-select">Select Statement Cycle</label>
              <select
                id="rec-cycle-select"
                value={selectedCycleIndex}
                onChange={(e) => {
                  setSelectedCycleIndex(parseInt(e.target.value, 10));
                  setReport(null);
                }}
                disabled={cycles.length === 0}
              >
                {cycles.map((cy, idx) => (
                  <option key={idx} value={idx}>
                    {formatDate(cy.startDate)} to {formatDate(cy.closeDate || cy.endDate)}
                  </option>
                ))}
              </select>
            </div>

            <div className="rec-form-group">
              <label htmlFor="rec-actual-balance">Actual Statement Balance (EGP)</label>
              <input
                id="rec-actual-balance"
                type="number"
                step="0.01"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
                placeholder="From your bank statement"
                required
                className="fs-num"
              />
            </div>
          </div>

          <div className="rec-form-actions">
            <button
              type="submit"
              className="fs-btn fs-btn-primary rec-submit-btn"
              disabled={isLoading || cycles.length === 0}
            >
              <FaBalanceScale aria-hidden="true" /> {isLoading ? 'Reconciling...' : 'Run Reconciliation'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rec-error-card" role="alert">
          <h2>Reconciliation Error</h2>
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="rec-loading-wrap">
          <Loading variant="card" text="Running statement reconciliation..." />
        </div>
      )}

      {!isLoading && !error && cards.length === 0 && (
        <div className="rec-empty-card">
          <h2>No Credit Cards Found</h2>
          <p>Add a credit card first to run statement cycle reconciliation.</p>
        </div>
      )}

      {/* Reconciliation Audit Results */}
      {!isLoading && report && (
        <div>
          {/* Header Result Badge */}
          <div className="rec-status-banner">
            <div className="rec-status-main">
              {report.isReconciled ? (
                <FaCheckCircle size={24} aria-hidden="true" />
              ) : (
                <FaExclamationTriangle size={24} aria-hidden="true" />
              )}
              <div className="rec-status-copy">
                <div className="rec-status-title-row">
                  <h2>
                    {report.isReconciled ? 'Perfect Reconciliation!' : 'Discrepancy Detected'}
                  </h2>
                  <Badge tone={report.isReconciled ? 'neutral' : 'warning'}>
                    {report.isReconciled ? 'Reconciled' : 'Discrepancy'}
                  </Badge>
                </div>
                <p>{report.analysis}</p>
              </div>
            </div>

            <div className="rec-discrepancy-box">
              <span className="rec-discrepancy-label">Discrepancy:</span>
              {report.isReconciled ? (
                <span className="rec-discrepancy-val fs-num">{formatCurrency(report.discrepancy)}</span>
              ) : (
                <Delta
                  tone="warning"
                  sign={report.discrepancy > 0 ? 'positive' : report.discrepancy < 0 ? 'negative' : 'none'}
                  value={formatCurrency(Math.abs(report.discrepancy))}
                  label="vs bank statement"
                />
              )}
            </div>
          </div>

          {/* Math Breakdown Cards */}
          <div className="rec-math-grid">
            <div className="rec-math-box">
              <span className="rec-math-label">Opening Balance</span>
              <span className="rec-math-val fs-num">{formatCurrency(report.openingBalance)}</span>
              <span className="rec-math-hint">Carried from previous cycles</span>
            </div>

            <div className="rec-math-operator" aria-hidden="true">+</div>

            <div className="rec-math-box">
              <span className="rec-math-label">Cycle Charges</span>
              <span className="rec-math-val fs-num">{formatCurrency(report.totalTransactions)}</span>
              <span className="rec-math-hint fs-num">{report.transactionCount} transactions</span>
            </div>

            <div className="rec-math-operator" aria-hidden="true">-</div>

            <div className="rec-math-box">
              <span className="rec-math-label">Cycle Payments</span>
              <span className="rec-math-val fs-num">{formatCurrency(report.totalPayments)}</span>
              <span className="rec-math-hint fs-num">{report.paymentCount} payments</span>
            </div>

            <div className="rec-math-operator" aria-hidden="true">=</div>

            <div className="rec-math-box rec-math-box--expected">
              <span className="rec-math-label">Expected Balance</span>
              <span className="rec-math-val fs-num">{formatCurrency(report.expectedBalance)}</span>
              <span className="rec-math-hint fs-num">Actual: {formatCurrency(report.actualStatementBalance)}</span>
            </div>
          </div>

          {/* Itemized Lists */}
          <div className="rec-itemized-grid">
            {/* Transactions in cycle */}
            <div className="rec-itemized-card">
              <h3 className="rec-itemized-title">
                <FaReceipt aria-hidden="true" /> Logged Charges ({report.transactions.length})
              </h3>

              {report.transactions.length === 0 ? (
                <p className="rec-subtitle">No charges logged</p>
              ) : (
                <>
                  <div className="rec-table-card">
                    <table className="rec-table">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="rec-th-num">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.transactions.map((tx) => (
                          <tr key={tx._id}>
                            <td className="fs-num">{formatDate(tx.date)}</td>
                            <td>{tx.description}</td>
                            <td className="rec-td-num fs-num">{formatCurrency(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rec-mobile-cards" data-testid="rec-charges-mobile-cards">
                    {report.transactions.map((tx, idx) => {
                      const key = tx._id || `charge-${idx}`;
                      const isExpanded = expandedChargeKeys.has(key);
                      return (
                        <article key={key} className="rec-mobile-card">
                          <div className="rec-mobile-card-summary">
                            <div className="rec-mobile-card-main">
                              <span className="rec-mobile-card-title">{tx.description}</span>
                              <span className="rec-mobile-card-sub fs-num">{formatDate(tx.date)}</span>
                            </div>
                            <div className="rec-mobile-card-val fs-num">{formatCurrency(tx.amount)}</div>
                          </div>

                          <button
                            type="button"
                            className="rec-mobile-expand-btn"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} charge details for ${tx.description}`}
                            onClick={() => toggleKey(setExpandedChargeKeys, key)}
                          >
                            <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                            {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                          </button>

                          {isExpanded && (
                            <div className="rec-mobile-details">
                              <div className="rec-mobile-detail-item">
                                <span className="rec-mobile-detail-label">Date</span>
                                <span className="rec-mobile-detail-value fs-num">{formatDate(tx.date)}</span>
                              </div>
                              <div className="rec-mobile-detail-item">
                                <span className="rec-mobile-detail-label">Amount</span>
                                <span className="rec-mobile-detail-value fs-num">{formatCurrency(tx.amount)}</span>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Payments in cycle */}
            <div className="rec-itemized-card">
              <h3 className="rec-itemized-title">
                <FaMoneyCheckAlt aria-hidden="true" /> Logged Settlements ({report.payments.length})
              </h3>

              {report.payments.length === 0 ? (
                <p className="rec-subtitle">No settlements logged</p>
              ) : (
                <>
                  <div className="rec-table-card">
                    <table className="rec-table">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Source</th>
                          <th scope="col" className="rec-th-num">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.payments.map((p) => (
                          <tr key={p._id}>
                            <td className="fs-num">{formatDate(p.date)}</td>
                            <td>{p.paymentSource || 'Bank'}</td>
                            <td className="rec-td-num fs-num">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rec-mobile-cards" data-testid="rec-payments-mobile-cards">
                    {report.payments.map((p, idx) => {
                      const key = p._id || `payment-${idx}`;
                      const isExpanded = expandedPaymentKeys.has(key);
                      const source = p.paymentSource || 'Bank';
                      return (
                        <article key={key} className="rec-mobile-card">
                          <div className="rec-mobile-card-summary">
                            <div className="rec-mobile-card-main">
                              <span className="rec-mobile-card-title">{source}</span>
                              <span className="rec-mobile-card-sub fs-num">{formatDate(p.date)}</span>
                            </div>
                            <div className="rec-mobile-card-val fs-num">{formatCurrency(p.amount)}</div>
                          </div>

                          <button
                            type="button"
                            className="rec-mobile-expand-btn"
                            aria-expanded={isExpanded}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} settlement details for ${source}`}
                            onClick={() => toggleKey(setExpandedPaymentKeys, key)}
                          >
                            <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                            {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                          </button>

                          {isExpanded && (
                            <div className="rec-mobile-details">
                              <div className="rec-mobile-detail-item">
                                <span className="rec-mobile-detail-label">Date</span>
                                <span className="rec-mobile-detail-value fs-num">{formatDate(p.date)}</span>
                              </div>
                              <div className="rec-mobile-detail-item">
                                <span className="rec-mobile-detail-label">Source</span>
                                <span className="rec-mobile-detail-value">{source}</span>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationPage;
