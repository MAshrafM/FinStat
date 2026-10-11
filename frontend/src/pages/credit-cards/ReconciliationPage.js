// frontend/src/pages/credit-cards/ReconciliationPage.js
import React, { useState, useEffect } from 'react';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import { getCards, getStatementCycles, reconcileCycle } from '../../services/creditCardService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaBalanceScale, FaCheckCircle, FaExclamationTriangle, FaReceipt, FaMoneyCheckAlt } from 'react-icons/fa';
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

  useEffect(() => {
    getCards()
      .then((data) => {
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0]._id);
        }
      })
      .catch((err) => console.error('Failed to load cards:', err));
  }, []);

  useEffect(() => {
    if (!selectedCardId) return;
    getStatementCycles(selectedCardId, 6)
      .then((res) => {
        const fetchedCycles = res.cycles || [];
        setCycles(fetchedCycles);
        setSelectedCycleIndex(0);
      })
      .catch((err) => console.error('Failed to load cycles for card:', err));
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

  return (
    <div className="page-container">
      <CreditCardSubNav />

      <div className="page-header">
        <div>
          <h1>Auto-Reconciliation Engine</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Compare your logged transactions and payments against your official bank statement balance to catch missing fees or errors.
          </p>
        </div>
      </div>

      {/* Inputs Form Card */}
      <div className="reconcile-input-card">
        <form onSubmit={handleReconcile} className="reconcile-form">
          <div className="form-row-grid">
            <div className="form-group">
              <label>Select Card</label>
              <select
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

            <div className="form-group">
              <label>Select Statement Cycle</label>
              <select
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

            <div className="form-group">
              <label>Actual Statement Balance (EGP)</label>
              <input
                type="number"
                step="0.01"
                value={actualBalance}
                onChange={(e) => setActualBalance(e.target.value)}
                placeholder="From your bank statement"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="action-button"
              disabled={isLoading || cycles.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FaBalanceScale /> {isLoading ? 'Reconciling...' : 'Run Reconciliation'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Reconciliation Audit Results */}
      {report && (
        <div className="reconcile-results-section animate-fade-in">
          {/* Header Result Badge */}
          <div className={`reconcile-status-banner ${report.isReconciled ? 'banner-success' : 'banner-warning'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {report.isReconciled ? (
                <FaCheckCircle size={28} className="banner-icon-success" />
              ) : (
                <FaExclamationTriangle size={28} className="banner-icon-warning" />
              )}
              <div>
                <h3 style={{ margin: 0 }}>
                  {report.isReconciled ? 'Perfect Reconciliation!' : 'Discrepancy Detected'}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem' }}>{report.analysis}</p>
              </div>
            </div>

            <div className="discrepancy-pill">
              <span>Discrepancy:</span>
              <strong style={{ color: report.isReconciled ? '#15803d' : '#b91c1c' }}>
                {report.discrepancy > 0 ? `+${formatCurrency(report.discrepancy)}` : formatCurrency(report.discrepancy)}
              </strong>
            </div>
          </div>

          {/* Math Breakdown Cards */}
          <div className="math-breakdown-grid">
            <div className="math-box">
              <span className="math-label">Opening Balance</span>
              <span className="math-val">{formatCurrency(report.openingBalance)}</span>
              <span className="math-hint">Carried from previous cycles</span>
            </div>

            <div className="math-operator">+</div>

            <div className="math-box">
              <span className="math-label">Cycle Charges</span>
              <span className="math-val" style={{ color: '#dc2626' }}>{formatCurrency(report.totalTransactions)}</span>
              <span className="math-hint">{report.transactionCount} transactions</span>
            </div>

            <div className="math-operator">-</div>

            <div className="math-box">
              <span className="math-label">Cycle Payments</span>
              <span className="math-val" style={{ color: '#16a34a' }}>{formatCurrency(report.totalPayments)}</span>
              <span className="math-hint">{report.paymentCount} payments</span>
            </div>

            <div className="math-operator">=</div>

            <div className="math-box" style={{ background: '#f8fafc', border: '2px solid #e2e8f0' }}>
              <span className="math-label">Expected Balance</span>
              <span className="math-val" style={{ color: '#2563eb' }}>{formatCurrency(report.expectedBalance)}</span>
              <span className="math-hint">Actual: {formatCurrency(report.actualStatementBalance)}</span>
            </div>
          </div>

          {/* Itemized Lists */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {/* Transactions in cycle */}
            <div className="itemized-box">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
                <FaReceipt style={{ color: '#ef4444' }} /> Logged Charges ({report.transactions.length})
              </h4>
              <div className="table-container">
                <table className="styled-table mini-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af' }}>No charges logged</td></tr>
                    ) : (
                      report.transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td>{formatDate(tx.date)}</td>
                          <td>{tx.description}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(tx.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments in cycle */}
            <div className="itemized-box">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
                <FaMoneyCheckAlt style={{ color: '#10b981' }} /> Logged Settlements ({report.payments.length})
              </h4>
              <div className="table-container">
                <table className="styled-table mini-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.payments.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af' }}>No settlements logged</td></tr>
                    ) : (
                      report.payments.map((p) => (
                        <tr key={p._id}>
                          <td>{formatDate(p.date)}</td>
                          <td>{p.paymentSource || 'Bank'}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationPage;
