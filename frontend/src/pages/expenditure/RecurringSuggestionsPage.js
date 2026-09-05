// frontend/src/pages/expenditure/RecurringSuggestionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getRecurringSuggestions,
  triggerDetection,
  acceptSuggestion,
  rejectSuggestion,
} from '../../services/recurringSuggestionService';
import { getRecurringExpenditures } from '../../services/expenditureService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { FaSyncAlt, FaCalendarAlt, FaCheck, FaTimes, FaRedoAlt } from 'react-icons/fa';
import './RecurringSuggestionsPage.css';
import './RulesPage.css'; // For common subnav and modal styles

const RecurringSuggestionsPage = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'history'
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState([]);
  const [recurringExpenditures, setRecurringExpenditures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Accept Modal state
  const [acceptingItem, setAcceptingItem] = useState(null);
  const [acceptForm, setAcceptForm] = useState({
    category: '',
    amount: '',
    frequency: 'monthly',
  });

  const loadData = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      getRecurringSuggestions(1, 100, { isAccepted: false, isRejected: false }),
      getRecurringSuggestions(1, 100, { isAccepted: true }),
      getRecurringExpenditures(),
    ])
      .then(([pendingRes, acceptedRes, expRes]) => {
        setPendingSuggestions(pendingRes?.data || []);
        setAcceptedSuggestions(acceptedRes?.data || []);
        setRecurringExpenditures(Array.isArray(expRes) ? expRes : expRes?.data || []);
      })
      .catch((err) => {
        console.error('Failed to load recurring data:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const res = await triggerDetection();
      alert(`Pattern scan complete! Processed ${res.count || 0} suggestion(s).`);
      loadData();
    } catch (err) {
      alert('Failed to run recurring pattern scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenAcceptModal = (item) => {
    setAcceptingItem(item);
    setAcceptForm({
      category: item.category,
      amount: item.amount,
      frequency: item.frequency,
    });
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    if (!acceptingItem) return;
    try {
      await acceptSuggestion(acceptingItem._id, {
        category: acceptForm.category,
        amount: parseFloat(acceptForm.amount),
        frequency: acceptForm.frequency,
      });
      setAcceptingItem(null);
      loadData();
    } catch (err) {
      alert('Failed to accept suggestion');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Dismiss this recurring suggestion?')) {
      try {
        await rejectSuggestion(id);
        loadData();
      } catch (err) {
        alert('Failed to dismiss suggestion');
      }
    }
  };

  const getConfidenceClass = (score) => {
    if (score >= 80) return 'confidence-high';
    if (score >= 65) return 'confidence-medium';
    return 'confidence-low';
  };

  const getCategoryColor = (catName) => {
    const found = EXPENDITURE_CATEGORIES.find((c) => c.name === catName);
    return found ? found.color : '#6b7280';
  };

  return (
    <div className="recur-page-container">
      {/* Sub-navigation tabs */}
      <div className="rules-nav-tabs">
        <Link to="/expenditures" className="rules-nav-link">
          Expenditure Log
        </Link>
        <Link to="/expenditures/rules" className="rules-nav-link">
          Auto-Categorization Rules
        </Link>
        <Link to="/expenditures/budgets" className="rules-nav-link">
          Budget Tracker
        </Link>
        <Link to="/expenditures/recurring" className="rules-nav-link active">
          Recurring Detection
        </Link>
      </div>

      <div className="recur-header">
        <div className="recur-header-titles">
          <h1>Recurring Expense Automation</h1>
          <p>
            Machine learning &amp; statistical pattern detector identifies repeated bills and subscriptions
            from your expenditure history.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleTriggerScan}
          disabled={isScanning}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FaSyncAlt className={isScanning ? 'animate-spin' : ''} />
          {isScanning ? 'Scanning History...' : 'Scan Patterns Now'}
        </button>
      </div>

      {/* Internal Tabs */}
      <div className="recur-tabs">
        <button
          className={`recur-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Suggestions{' '}
          <span className={`badge-count ${pendingSuggestions.length > 0 ? '' : 'neutral'}`}>
            {pendingSuggestions.length}
          </span>
        </button>
        <button
          className={`recur-tab ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted Recurrences{' '}
          <span className="badge-count neutral">{acceptedSuggestions.length}</span>
        </button>
        <button
          className={`recur-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Flagged Recurring Entries{' '}
          <span className="badge-count neutral">{recurringExpenditures.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading recurrence data...</div>
      ) : activeTab === 'pending' ? (
        pendingSuggestions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px dashed #d1d5db',
              color: '#6b7280',
            }}
          >
            <FaRedoAlt style={{ fontSize: '2.5rem', color: '#9ca3af', marginBottom: '1rem' }} />
            <h3>No pending recurring suggestions</h3>
            <p style={{ margin: '0.5rem 0 1.5rem 0' }}>
              FinStat scans your expenditure logs for recurring rent, bills, and subscriptions. Click below to
              trigger an immediate detection pass.
            </p>
            <button className="btn-primary" onClick={handleTriggerScan} disabled={isScanning}>
              <FaSyncAlt /> Scan Patterns Now
            </button>
          </div>
        ) : (
          <div className="suggestions-grid">
            {pendingSuggestions.map((sug) => {
              const catColor = getCategoryColor(sug.category);
              return (
                <div key={sug._id} className="suggestion-card">
                  <div className="suggestion-card-top">
                    <div className="suggestion-header-row">
                      <div>
                        <h3 className="suggestion-title">{sug.description}</h3>
                        <span className="cat-pill" style={{ backgroundColor: catColor }}>
                          {sug.category}
                        </span>
                      </div>
                      <div className="suggestion-amount">{formatCurrency(sug.amount)}</div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <span className="freq-badge">{sug.frequency} frequency</span>
                    </div>

                    <div className="confidence-section">
                      <div className="confidence-header">
                        <span>Pattern Confidence</span>
                        <strong>{sug.confidenceScore}%</strong>
                      </div>
                      <div className="confidence-track">
                        <div
                          className={`confidence-fill ${getConfidenceClass(sug.confidenceScore)}`}
                          style={{ width: `${sug.confidenceScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="date-span">
                      <FaCalendarAlt /> Detected from {formatDate(sug.detectedFrom)} to {formatDate(sug.detectedTo)}
                    </div>
                  </div>

                  <div className="suggestion-card-actions">
                    <button className="btn-accept" onClick={() => handleOpenAcceptModal(sug)}>
                      <FaCheck /> Confirm &amp; Accept
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(sug._id)}>
                      <FaTimes /> Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'accepted' ? (
        acceptedSuggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            No accepted recurring expenses yet.
          </div>
        ) : (
          <div className="suggestions-grid">
            {acceptedSuggestions.map((sug) => {
              const catColor = getCategoryColor(sug.category);
              return (
                <div key={sug._id} className="suggestion-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <div className="suggestion-card-top">
                    <div className="suggestion-header-row">
                      <div>
                        <h3 className="suggestion-title">{sug.description}</h3>
                        <span className="cat-pill" style={{ backgroundColor: catColor }}>
                          {sug.category}
                        </span>
                      </div>
                      <div className="suggestion-amount">{formatCurrency(sug.amount)}</div>
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                      <span className="freq-badge">{sug.frequency} frequency</span>
                      <span style={{ marginLeft: '0.5rem', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                        Active recurring rule
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History of flagged recurring expenditures */
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table className="styled-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recurringExpenditures.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No expenditures are currently flagged as recurring.
                  </td>
                </tr>
              ) : (
                recurringExpenditures.map((exp) => (
                  <tr key={exp._id}>
                    <td>{formatDate(exp.date)}</td>
                    <td><strong>{exp.description || '-'}</strong></td>
                    <td style={{ color: '#dc2626', fontWeight: 700 }}>{formatCurrency(exp.transactionValue)}</td>
                    <td>
                      <span
                        className="cat-pill"
                        style={{ backgroundColor: getCategoryColor(exp.categories?.[0] || 'Other') }}
                      >
                        {exp.categories?.[0] || 'Other'}
                      </span>
                    </td>
                    <td>{exp.paymentMethod || 'Bank'}</td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 600 }}>🔁 Recurring</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation & Edit Modal when accepting */}
      {acceptingItem && (
        <div className="modal-overlay" onClick={() => setAcceptingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Recurring Expense</h2>
              <button
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
                onClick={() => setAcceptingItem(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmAccept}>
              <div className="modal-body">
                <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: 0 }}>
                  Confirming this pattern will mark matching past expenditures as <strong>Recurring</strong> and
                  link future transactions for budgeting insights.
                </p>

                <div className="form-row">
                  <label>Description Pattern</label>
                  <input type="text" disabled value={acceptingItem.description} />
                </div>

                <div className="form-row">
                  <label>Category</label>
                  <select
                    value={acceptForm.category}
                    onChange={(e) => setAcceptForm({ ...acceptForm, category: e.target.value })}
                  >
                    {EXPENDITURE_CATEGORIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Typical Amount (EGP)</label>
                  <input
                    type="number"
                    required
                    value={acceptForm.amount}
                    onChange={(e) => setAcceptForm({ ...acceptForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label>Frequency</label>
                  <select
                    value={acceptForm.frequency}
                    onChange={(e) => setAcceptForm({ ...acceptForm, frequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setAcceptingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Recurrence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringSuggestionsPage;
