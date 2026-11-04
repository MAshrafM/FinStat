// frontend/src/pages/lending/LendingDashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getLendingSummary,
  getPersons,
  getLoans,
  createPerson,
  createLoan,
} from '../../services/lendingService';
import PersonCard from './PersonCard';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './Lending.css';

const LendingDashboardPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [persons, setPersons] = useState([]);
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

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
      <div className="lending-page" data-testid="lending-loading" style={{ textAlign: 'center', padding: '60px' }}>
        <p>Loading Lending Tracker...</p>
      </div>
    );
  }

  const isEmpty = (!persons || persons.length === 0) && (!loans || loans.length === 0);

  return (
    <div className="lending-page">
      <div className="lending-header">
        <div>
          <h1>Lending Tracker</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Track personal loans, monitor informal receivables, and record repayments.
          </p>
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            onClick={() => setShowPersonModal(true)}
          >
            + Add Person
          </button>
          <button
            type="button"
            className="lending-btn lending-btn-primary"
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
          <div className="lending-kpi-value" style={{ color: '#009879' }}>
            {formatCurrency((summary?.totalOutstanding || 0) / 100)}
          </div>
          <div className="lending-kpi-sub">Active outstanding loans</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Repaid</div>
          <div className="lending-kpi-value" style={{ color: '#059669' }}>
            {formatCurrency((summary?.totalRepaid || 0) / 100)}
          </div>
          <div className="lending-kpi-sub">Collected repayments to date</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Active Debtors</div>
          <div className="lending-kpi-value">{summary?.personsCount || 0}</div>
          <div className="lending-kpi-sub">{summary?.activeLoansCount || 0} active loans</div>
        </div>
      </div>

      {isEmpty ? (
        <div className="lending-empty-state">
          <div className="lending-empty-title">No personal loans or receivables found</div>
          <div className="lending-empty-desc">
            You haven't recorded any borrowers or active loans yet. Start by adding a contact!
          </div>
          <button
            type="button"
            className="lending-btn lending-btn-primary"
            onClick={() => setShowPersonModal(true)}
          >
            + Add First Borrower
          </button>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="lending-controls-bar">
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Borrowers</h2>
            <div className="lending-filters">
              <label htmlFor="sort-by-select" style={{ fontSize: '0.85rem', color: '#64748b' }}>
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
          <div className="lending-controls-bar" style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Loan Ledgers</h2>
            <div className="lending-filters">
              <label htmlFor="filter-status-select" style={{ fontSize: '0.85rem', color: '#64748b' }}>
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

          <div className="lending-scroll-hint" aria-hidden="true">
            <span>↔ Scroll horizontally to view full loan details</span>
          </div>

          <div className="table-container lending-table-card">
            <table className="lending-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Created</th>
                  <th>Total Borrowed</th>
                  <th>Total Repaid</th>
                  <th>Remaining Balance</th>
                  <th>Repayment Progress</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No loans match the selected filter.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => {
                    const borrowed = (loan.totalBorrowedInPiastres || 0) / 100;
                    const repaid = (loan.totalRepaidInPiastres || 0) / 100;
                    const balance = (loan.balanceInPiastres || 0) / 100;
                    const progressPct = borrowed > 0 ? Math.min(100, Math.round((repaid / borrowed) * 100)) : 0;

                    return (
                      <tr key={loan._id}>
                        <td>
                          <strong>{loan.person?.name || 'Unknown'}</strong>
                        </td>
                        <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                        <td>{formatCurrency(borrowed)}</td>
                        <td style={{ color: '#059669' }}>{formatCurrency(repaid)}</td>
                        <td style={{ fontWeight: 600, color: balance > 0 ? '#009879' : '#64748b' }}>
                          {formatCurrency(balance)}
                        </td>
                        <td style={{ width: '160px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="lending-progress-bg">
                            <div className="lending-progress-fill" style={{ width: `${progressPct}%` }} />
                          </div>
                        </td>
                        <td>
                          <span
                            className={`person-card-badge ${
                              loan.status === 'Active'
                                ? 'badge-active'
                                : loan.status === 'Repaid'
                                ? 'badge-repaid'
                                : 'badge-writtenoff'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/lending/loans/${loan._id}`}
                            className="lending-btn lending-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem', textDecoration: 'none' }}
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
        </>
      )}

      {/* Add Person Modal */}
      {showPersonModal && (
        <div className="lending-modal-backdrop" role="dialog" aria-modal="true">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3>New Borrower / Contact</h3>
              <button
                type="button"
                className="lending-btn lending-btn-secondary"
                onClick={() => setShowPersonModal(false)}
                style={{ padding: '4px 8px' }}
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
                  className="lending-btn lending-btn-secondary"
                  onClick={() => setShowPersonModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="lending-btn lending-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      {showLoanModal && (
        <div className="lending-modal-backdrop" role="dialog" aria-modal="true">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3>Create New Loan</h3>
              <button
                type="button"
                className="lending-btn lending-btn-secondary"
                onClick={() => setShowLoanModal(false)}
                style={{ padding: '4px 8px' }}
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
                  className="lending-btn lending-btn-secondary"
                  onClick={() => setShowLoanModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="lending-btn lending-btn-primary" disabled={submitting}>
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
