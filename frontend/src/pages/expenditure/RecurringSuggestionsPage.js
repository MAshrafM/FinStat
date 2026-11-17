// frontend/src/pages/expenditure/RecurringSuggestionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import ExpenditureSubNav from './ExpenditureSubNav';
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
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Badge, Loading, EmptyState, Tabs } from '../../components/ui';
import './RecurringSuggestionsPage.css';
import './RulesPage.css'; // For common subnav and modal styles

const RecurringSuggestionsPage = () => {
  const canModifyContext = useCanModify();
  const canModify = canModifyContext?.canModify ?? (typeof canModifyContext === 'boolean' ? canModifyContext : true);
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const [suggestionToDismiss, setSuggestionToDismiss] = useState(null);
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
    if (!canModify) return;
    setIsScanning(true);
    try {
      const res = await triggerDetection();
      if (notify) notify(`Pattern scan complete! Processed ${res.count || 0} suggestion(s).`, 'success');
      loadData();
    } catch (err) {
      if (notify) notify('Failed to run recurring pattern scan.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenAcceptModal = (item) => {
    if (!canModify) return;
    setAcceptingItem(item);
    setAcceptForm({
      category: item.category,
      amount: item.amount,
      frequency: item.frequency,
    });
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    if (!canModify) return;
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
      if (notify) notify('Failed to accept suggestion', 'error');
    }
  };

  const handleReject = (id) => {
    if (!canModify) return;
    setSuggestionToDismiss(id);
  };

  const handleConfirmDismiss = async () => {
    if (!suggestionToDismiss) return;
    try {
      await rejectSuggestion(suggestionToDismiss);
      if (notify) notify('Recurring suggestion dismissed', 'info');
      setSuggestionToDismiss(null);
      loadData();
    } catch (err) {
      if (notify) notify('Failed to dismiss suggestion', 'error');
    }
  };

  return (
    <div className="fs-page recur-page-container" data-testid="recurring-suggestions-page">
      {/* Sub-navigation tabs */}
      <ExpenditureSubNav />

      <PageHeader
        title="Recurring Expense Automation"
        subtitle="Machine learning & statistical pattern detector identifies repeated bills and subscriptions from your expenditure history."
        actions={
          <ProtectedAction tooltip="View-only access">
            <Button
              variant="primary"
              onClick={handleTriggerScan}
              disabled={isScanning}
              data-testid="scan-patterns-btn"
            >
              <FaSyncAlt className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning History...' : 'Scan Patterns Now'}
            </Button>
          </ProtectedAction>
        }
      />

      {/* Primary Tab Navigation */}
      <div className="recur-tabs-container">
        <Tabs
          tabs={[
            {
              id: 'pending',
              label: 'Pending Suggestions',
              badge: pendingSuggestions.length || undefined,
            },
            {
              id: 'accepted',
              label: 'Accepted Recurrences',
              badge: acceptedSuggestions.length || undefined,
            },
            {
              id: 'history',
              label: 'Flagged Recurring Entries',
              badge: recurringExpenditures.length || undefined,
            },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Recurring suggestions views"
        />
      </div>

      {isLoading ? (
        <Loading variant="card" message="Loading recurrence data..." />
      ) : activeTab === 'pending' ? (
        pendingSuggestions.length === 0 ? (
          <EmptyState
            icon={<FaRedoAlt />}
            title="No pending recurring suggestions"
            description="FinStat scans your expenditure logs for recurring rent, bills, and subscriptions. Click below to trigger an immediate detection pass."
            action={
              <ProtectedAction tooltip="View-only access">
                <Button
                  variant="primary"
                  onClick={handleTriggerScan}
                  disabled={isScanning}
                >
                  <FaSyncAlt /> Scan Patterns Now
                </Button>
              </ProtectedAction>
            }
          />
        ) : (
          <div className="suggestions-grid">
            {pendingSuggestions.map((sug) => {
              return (
                <div key={sug._id} className="suggestion-card" data-testid={`suggestion-card-${sug._id}`}>
                  <div className="suggestion-card-top">
                    <div className="suggestion-header-row">
                      <div>
                        <h2 className="suggestion-title">{sug.description}</h2>
                        <Badge tone="neutral" className="suggestion-cat-badge">
                          {sug.category}
                        </Badge>
                      </div>
                      <div className="suggestion-amount fs-num">{formatCurrency(sug.amount)}</div>
                    </div>

                    <div className="suggestion-freq-row">
                      <Badge tone="neutral">{sug.frequency} frequency</Badge>
                    </div>

                    <div className="confidence-section">
                      <div className="confidence-header">
                        <span>Pattern Confidence</span>
                        <strong className="fs-num">{sug.confidenceScore}%</strong>
                      </div>
                      <div
                        className="fs-progress"
                        role="progressbar"
                        aria-valuenow={sug.confidenceScore}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label={`Pattern confidence: ${sug.confidenceScore}%`}
                      >
                        <div
                          className="fs-progress-bar"
                          style={{ width: `${sug.confidenceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="date-span">
                      <FaCalendarAlt className="date-span-icon" /> Detected from {formatDate(sug.detectedFrom)} to {formatDate(sug.detectedTo)}
                    </div>
                  </div>

                  <div className="suggestion-card-actions">
                    <ProtectedAction tooltip="View-only access">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenAcceptModal(sug)}
                        data-testid={`accept-btn-${sug._id}`}
                      >
                        <FaCheck /> Confirm &amp; Accept
                      </Button>
                    </ProtectedAction>
                    <ProtectedAction tooltip="View-only access">
                      <Button
                        variant="danger"
                        onClick={() => handleReject(sug._id)}
                        data-testid={`dismiss-btn-${sug._id}`}
                      >
                        <FaTimes /> Dismiss
                      </Button>
                    </ProtectedAction>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'accepted' ? (
        acceptedSuggestions.length === 0 ? (
          <EmptyState
            icon={<FaCheck />}
            title="No accepted recurring expenses yet"
            description="Accepted recurring expenses will appear here and provide continuous forecasting data."
          />
        ) : (
          <div className="suggestions-grid">
            {acceptedSuggestions.map((sug) => {
              return (
                <div key={sug._id} className="suggestion-card accepted" data-testid={`accepted-card-${sug._id}`}>
                  <div className="suggestion-card-top">
                    <div className="suggestion-header-row">
                      <div>
                        <h2 className="suggestion-title">{sug.description}</h2>
                        <Badge tone="neutral" className="suggestion-cat-badge">
                          {sug.category}
                        </Badge>
                      </div>
                      <div className="suggestion-amount fs-num">{formatCurrency(sug.amount)}</div>
                    </div>
                    <div className="suggestion-freq-row">
                      <Badge tone="neutral">{sug.frequency} frequency</Badge>
                      <Badge tone="positive" className="active-rule-badge">
                        Active recurring rule
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History of flagged recurring expenditures */
        <div className="table-container recurring-history-container fs-table-container">
          {/* Desktop Table View */}
          <div className="recurring-history-desktop-table">
            <table className="styled-table recurring-history-table" data-testid="recurring-history-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col" className="cell-right">Amount</th>
                  <th scope="col">Category</th>
                  <th scope="col">Payment Method</th>
                  <th scope="col" className="cell-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenditures.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="cell-empty">
                      No expenditures are currently flagged as recurring.
                    </td>
                  </tr>
                ) : (
                  recurringExpenditures.map((exp) => (
                    <tr key={exp._id}>
                      <td className="fs-num">{formatDate(exp.date)}</td>
                      <td><strong>{exp.description || '-'}</strong></td>
                      <td className="cell-right fs-num">{formatCurrency(exp.transactionValue)}</td>
                      <td>
                        <Badge tone="neutral">
                          {exp.categories?.[0] || 'Other'}
                        </Badge>
                      </td>
                      <td>{exp.paymentMethod || 'Bank'}</td>
                      <td className="cell-center">
                        <Badge tone="positive">Recurring</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (D19) */}
          <div className="recurring-history-mobile-cards">
            {recurringExpenditures.length === 0 ? (
              <div className="cell-empty">
                No expenditures are currently flagged as recurring.
              </div>
            ) : (
              recurringExpenditures.map((exp) => (
                <div key={exp._id} className="recurring-mobile-card">
                  <div className="recurring-mobile-header">
                    <strong>{exp.description || '-'}</strong>
                    <span className="fs-num">{formatCurrency(exp.transactionValue)}</span>
                  </div>
                  <div className="recurring-mobile-row">
                    <span className="recurring-mobile-label">Date</span>
                    <span className="fs-num">{formatDate(exp.date)}</span>
                  </div>
                  <div className="recurring-mobile-row">
                    <span className="recurring-mobile-label">Category</span>
                    <Badge tone="neutral">{exp.categories?.[0] || 'Other'}</Badge>
                  </div>
                  <div className="recurring-mobile-row">
                    <span className="recurring-mobile-label">Payment</span>
                    <span>{exp.paymentMethod || 'Bank'}</span>
                  </div>
                  <div className="recurring-mobile-row">
                    <span className="recurring-mobile-label">Status</span>
                    <Badge tone="positive">Recurring</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation & Edit Modal when accepting */}
      <ConfirmModal
        isOpen={Boolean(suggestionToDismiss)}
        title="Dismiss Suggestion"
        message="Are you sure you want to dismiss this recurring pattern suggestion?"
        confirmText="Dismiss"
        variant="warning"
        onConfirm={handleConfirmDismiss}
        onCancel={() => setSuggestionToDismiss(null)}
      />

      {acceptingItem && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setAcceptingItem(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setAcceptingItem(null);
          }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurring-modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="recurring-modal-title">Confirm Recurring Expense</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Close modal"
                onClick={() => setAcceptingItem(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmAccept}>
              <div className="modal-body">
                <p className="recur-modal-help-text">
                  Confirming this pattern will mark matching past expenditures as <strong>Recurring</strong> and
                  link future transactions for budgeting insights.
                </p>

                <div className="form-row">
                  <label htmlFor="recur-form-desc">Description Pattern</label>
                  <input id="recur-form-desc" type="text" disabled value={acceptingItem.description} />
                </div>

                <div className="form-row">
                  <label htmlFor="recur-form-category">Category</label>
                  <select
                    id="recur-form-category"
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
                  <label htmlFor="recur-form-amount">Typical Amount (EGP)</label>
                  <input
                    id="recur-form-amount"
                    type="number"
                    step="any"
                    required
                    value={acceptForm.amount}
                    onChange={(e) => setAcceptForm({ ...acceptForm, amount: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="recur-form-frequency">Frequency</label>
                  <select
                    id="recur-form-frequency"
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAcceptingItem(null)}
                >
                  Cancel
                </Button>
                <ProtectedAction tooltip="View-only access">
                  <Button
                    type="submit"
                    variant="primary"
                    data-testid="confirm-recurrence-submit-btn"
                  >
                    Confirm Recurrence
                  </Button>
                </ProtectedAction>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringSuggestionsPage;
