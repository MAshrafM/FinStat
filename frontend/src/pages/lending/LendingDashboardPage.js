// frontend/src/pages/lending/LendingDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  getLendingSummary,
  getPersons,
  getLoans,
  createPerson,
  createLoan,
} from '../../services/lendingService';
import PersonCard from './PersonCard';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './Lending.css';

const getIsMobile = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 768px)').matches;

const LendingDashboardPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [persons, setPersons] = useState([]);
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [expandedLoanIds, setExpandedLoanIds] = useState(() => new Set());

  // Modal states
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', note: '' });
  const [loanForm, setLoanForm] = useState({
    person: '',
    initialAmount: '',
    date: new Date().toISOString().substring(0, 10),
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, persRes, loansRes] = await Promise.all([
        getLendingSummary(),
        getPersons({ sortBy, sortOrder: sortBy === 'totalOwed' ? 'desc' : 'asc' }),
        getLoans({ status: statusFilter }),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (persRes.success) setPersons(persRes.data || []);
      if (loansRes.success) setLoans(loansRes.data || []);
    } catch (err) {
      showToast(err?.message || 'Failed to load lending data', 'error');
    } finally {
      setLoading(false);
    }
  }, [sortBy, statusFilter, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleLoanExpand = (id) => {
    setExpandedLoanIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    if (submitting || !personForm.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await createPerson({
        name: personForm.name.trim(),
        note: personForm.note.trim(),
      });
      if (res.success) {
        showToast('Person created successfully', 'success');
        setPersonForm({ name: '', note: '' });
        setShowPersonModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err?.message || 'Failed to create person', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(loanForm.initialAmount);
    if (submitting || !loanForm.person || !amountNum || amountNum <= 0) return;

    try {
      setSubmitting(true);
      const res = await createLoan({
        person: loanForm.person,
        initialAmountInPiastres: Math.round(amountNum * 100),
        date: loanForm.date,
        note: loanForm.note.trim(),
      });
      if (res.success) {
        showToast('Loan created successfully', 'success');
        setLoanForm({
          person: '',
          initialAmount: '',
          date: new Date().toISOString().substring(0, 10),
          note: '',
        });
        setShowLoanModal(false);
        fetchData();
      }
    } catch (err) {
      showToast(err?.message || 'Failed to create loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="lending-page" data-testid="lending-loading">
        <div className="lending-loading-wrap">
          <Loading variant="card" text="Loading Lending Tracker..." />
        </div>
      </div>
    );
  }

  const isEmpty = (!persons || persons.length === 0) && (!loans || loans.length === 0);

  return (
    <div className="lending-page">
      <div className="lending-header">
        <div>
          <h1>Lending Tracker</h1>
          <p className="lending-subtitle">
            Track personal loans, monitor informal receivables, and record repayments.
          </p>
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="fs-btn fs-btn-secondary lending-action-btn"
            onClick={() => setShowPersonModal(true)}
          >
            + Add Person
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-primary lending-action-btn"
            onClick={() => setShowLoanModal(true)}
            disabled={persons.length === 0}
          >
            + New Loan
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="lending-kpi-grid">
        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Receivables</div>
          <div className="lending-kpi-value fs-num">
            {formatCurrency((summary?.totalOutstanding || 0) / 100)}
          </div>
          <div className="lending-kpi-sub">Active outstanding loans</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Repaid</div>
          <div className="lending-kpi-value fs-num">
            {formatCurrency((summary?.totalRepaid || 0) / 100)}
          </div>
          <div className="lending-kpi-sub">Collected repayments to date</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Active Debtors</div>
          <div className="lending-kpi-value fs-num">{summary?.personsCount || 0}</div>
          <div className="lending-kpi-sub fs-num">{summary?.activeLoansCount || 0} active loans</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="lending-empty-state">
          <div className="lending-empty-title">No personal loans or receivables found</div>
          <div className="lending-empty-desc">
            You haven&apos;t recorded any borrowers or active loans yet. Start by adding a contact!
          </div>
          <button
            type="button"
            className="fs-btn fs-btn-primary lending-action-btn"
            onClick={() => setShowPersonModal(true)}
          >
            + Add First Borrower
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="lending-controls-bar">
            <h2 className="lending-section-title">Borrowers</h2>
            <div className="lending-filters">
              <label htmlFor="sort-by-select" className="lending-filter-label">
                Sort By
              </label>
              <select
                id="sort-by-select"
                className="lending-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="totalOwed">Highest Balance</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>
          </div>

          {/* Persons Grid */}
          <div className="lending-persons-grid">
            {persons.map((person) => (
              <PersonCard key={person._id} person={person} />
            ))}
          </div>

          {/* Active Loans Section */}
          <div className="lending-controls-bar">
            <h2 className="lending-section-title">Loan Ledgers</h2>
            <div className="lending-filters">
              <label htmlFor="filter-status-select" className="lending-filter-label">
                Filter Status
              </label>
              <select
                id="filter-status-select"
                className="lending-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Repaid">Repaid Only</option>
                <option value="WrittenOff">Written Off Only</option>
              </select>
            </div>
          </div>

          {!isMobile ? (
            <div className="lending-table-wrap">
              <table className="lending-table">
                <thead>
                  <tr>
                    <th scope="col">Borrower</th>
                    <th scope="col">Created</th>
                    <th scope="col" className="lending-th-num">Total Borrowed</th>
                    <th scope="col" className="lending-th-num">Total Repaid</th>
                    <th scope="col" className="lending-th-num">Remaining Balance</th>
                    <th scope="col">Repayment Progress</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="lending-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="lending-table-empty">
                        No loans match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => {
                      const borrowed = (loan.totalBorrowedInPiastres || 0) / 100;
                      const repaid = (loan.totalRepaidInPiastres || 0) / 100;
                      const balance = (loan.balanceInPiastres || 0) / 100;
                      const progressPct = borrowed > 0 ? Math.min(100, Math.round((repaid / borrowed) * 100)) : 0;
                      const borrowerName = loan.person?.name || 'Unknown';

                      return (
                        <tr key={loan._id}>
                          <td>
                            <strong>{borrowerName}</strong>
                          </td>
                          <td className="fs-num">{new Date(loan.createdAt).toLocaleDateString()}</td>
                          <td className="lending-td-num fs-num">{formatCurrency(borrowed)}</td>
                          <td className="lending-td-num fs-num">{formatCurrency(repaid)}</td>
                          <td className="lending-td-num fs-num">
                            <strong>{formatCurrency(balance)}</strong>
                          </td>
                          <td>
                            <div className="lending-progress-wrap">
                              <span className="lending-progress-pct fs-num">{progressPct}%</span>
                              <progress
                                className="fs-progress lending-progress"
                                value={progressPct}
                                max={100}
                                aria-label={`Repayment progress for ${borrowerName}`}
                                aria-valuetext={`${progressPct}% repaid`}
                              />
                            </div>
                          </td>
                          <td>
                            <Badge tone={loan.status === 'WrittenOff' ? 'negative' : 'neutral'}>
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="lending-td-actions">
                            <Link
                              to={`/lending/loans/${loan._id}`}
                              className="fs-btn fs-btn-secondary lending-table-btn"
                            >
                              View Ledger
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="lending-mobile-cards" data-testid="lending-loans-mobile-cards">
              {loans.length === 0 ? (
                <div className="lending-empty-state">
                  <p className="lending-empty-desc">No loans match the selected filter.</p>
                </div>
              ) : (
                loans.map((loan) => {
                  const borrowed = (loan.totalBorrowedInPiastres || 0) / 100;
                  const repaid = (loan.totalRepaidInPiastres || 0) / 100;
                  const balance = (loan.balanceInPiastres || 0) / 100;
                  const progressPct = borrowed > 0 ? Math.min(100, Math.round((repaid / borrowed) * 100)) : 0;
                  const borrowerName = loan.person?.name || 'Unknown';
                  const isExpanded = expandedLoanIds.has(loan._id);

                  return (
                    <article key={loan._id} className="lending-mobile-card">
                      <div className="lending-mobile-card-summary">
                        <div className="lending-mobile-card-main">
                          <span className="lending-mobile-card-title">{borrowerName}</span>
                          <Badge tone={loan.status === 'WrittenOff' ? 'negative' : 'neutral'}>
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="lending-mobile-card-val fs-num">{formatCurrency(balance)}</div>
                      </div>

                      <div className="lending-progress-wrap">
                        <span className="lending-progress-pct fs-num">{progressPct}% repaid</span>
                        <progress
                          className="fs-progress lending-progress"
                          value={progressPct}
                          max={100}
                          aria-label={`Repayment progress for ${borrowerName}`}
                          aria-valuetext={`${progressPct}% repaid`}
                        />
                      </div>

                      <button
                        type="button"
                        className="lending-mobile-expand-btn"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} loan details for ${borrowerName}`}
                        onClick={() => toggleLoanExpand(loan._id)}
                      >
                        <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                        {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                      </button>

                      {isExpanded && (
                        <div className="lending-mobile-details">
                          <div className="lending-mobile-detail-item">
                            <span className="lending-mobile-detail-label">Created</span>
                            <span className="lending-mobile-detail-value fs-num">
                              {new Date(loan.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="lending-mobile-detail-item">
                            <span className="lending-mobile-detail-label">Total Borrowed</span>
                            <span className="lending-mobile-detail-value fs-num">{formatCurrency(borrowed)}</span>
                          </div>
                          <div className="lending-mobile-detail-item">
                            <span className="lending-mobile-detail-label">Total Repaid</span>
                            <span className="lending-mobile-detail-value fs-num">{formatCurrency(repaid)}</span>
                          </div>
                          <div className="lending-mobile-card-actions">
                            <Link
                              to={`/lending/loans/${loan._id}`}
                              className="fs-btn fs-btn-secondary lending-table-btn"
                            >
                              View Ledger
                            </Link>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Add Person Modal */}
      {showPersonModal && (
        <div className="modal-overlay lending-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-person-title">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3 id="add-person-title">New Borrower / Contact</h3>
              <button
                type="button"
                aria-label="Close modal"
                className="fs-btn fs-btn-secondary lending-modal-close"
                onClick={() => setShowPersonModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePerson}>
              <div className="lending-modal-body">
                <div className="lending-form-group">
                  <label htmlFor="person-name">Person Name</label>
                  <input
                    id="person-name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Ahmed Samir"
                    value={personForm.name}
                    onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="person-note">Note</label>
                  <input
                    id="person-note"
                    type="text"
                    maxLength={500}
                    placeholder="e.g. Work colleague, personal friend"
                    value={personForm.note}
                    onChange={(e) => setPersonForm({ ...personForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="lending-modal-footer">
                <button
                  type="button"
                  className="fs-btn fs-btn-secondary lending-action-btn"
                  onClick={() => setShowPersonModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="fs-btn fs-btn-primary lending-action-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      {showLoanModal && (
        <div className="modal-overlay lending-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-loan-title">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3 id="new-loan-title">Create New Loan</h3>
              <button
                type="button"
                aria-label="Close modal"
                className="fs-btn fs-btn-secondary lending-modal-close"
                onClick={() => setShowLoanModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateLoan}>
              <div className="lending-modal-body">
                <div className="lending-form-group">
                  <label htmlFor="loan-person">Borrower</label>
                  <select
                    id="loan-person"
                    required
                    value={loanForm.person}
                    onChange={(e) => setLoanForm({ ...loanForm, person: e.target.value })}
                  >
                    <option value="">Select a person...</option>
                    {persons.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lending-form-group">
                  <label htmlFor="loan-amount">Initial Loan Amount (EGP)</label>
                  <input
                    id="loan-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 5000.00"
                    value={loanForm.initialAmount}
                    onChange={(e) => setLoanForm({ ...loanForm, initialAmount: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="loan-date">Disbursement Date</label>
                  <input
                    id="loan-date"
                    type="date"
                    required
                    value={loanForm.date}
                    onChange={(e) => setLoanForm({ ...loanForm, date: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="loan-notes">Note / Purpose</label>
                  <input
                    id="loan-notes"
                    type="text"
                    maxLength={1000}
                    placeholder="e.g. Short term emergency loan"
                    value={loanForm.note}
                    onChange={(e) => setLoanForm({ ...loanForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="lending-modal-footer">
                <button
                  type="button"
                  className="fs-btn fs-btn-secondary lending-action-btn"
                  onClick={() => setShowLoanModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="fs-btn fs-btn-primary lending-action-btn" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LendingDashboardPage;
