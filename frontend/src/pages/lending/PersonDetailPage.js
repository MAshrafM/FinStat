// frontend/src/pages/lending/PersonDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  getPersonById,
  updatePerson,
  deletePerson,
  createLoan,
} from '../../services/lendingService';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './Lending.css';

const getIsMobile = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 768px)').matches;

const PersonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [loans, setLoans] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [expandedLoanIds, setExpandedLoanIds] = useState(() => new Set());

  // Edit Person modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', note: '' });

  // New Loan modal
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [newLoanForm, setNewLoanForm] = useState({
    initialAmount: '',
    date: new Date().toISOString().substring(0, 10),
    note: '',
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPersonById(id);
      if (res.success) {
        setPerson(res.data.person);
        setLoans(res.data.loans || []);
        setAggregate(res.data.aggregate || null);
        setEditForm({
          name: res.data.person.name,
          note: res.data.person.note || '',
        });
      }
    } catch (err) {
      showToast(err?.message || 'Failed to load person detail', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const toggleLoanExpand = (loanId) => {
    setExpandedLoanIds((prev) => {
      const next = new Set(prev);
      if (next.has(loanId)) {
        next.delete(loanId);
      } else {
        next.add(loanId);
      }
      return next;
    });
  };

  const handleUpdatePerson = async (e) => {
    e.preventDefault();
    if (submitting || !editForm.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await updatePerson(id, {
        name: editForm.name.trim(),
        note: editForm.note.trim(),
      });
      if (res.success) {
        showToast('Person updated successfully', 'success');
        setIsEditing(false);
        fetchDetail();
      }
    } catch (err) {
      showToast(err?.message || 'Failed to update person', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLoanForPerson = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(newLoanForm.initialAmount);
    if (submitting || !amountNum || amountNum <= 0) return;

    try {
      setSubmitting(true);
      const res = await createLoan({
        person: id,
        initialAmountInPiastres: Math.round(amountNum * 100),
        date: newLoanForm.date,
        note: newLoanForm.note.trim(),
      });
      if (res.success) {
        showToast('New loan created successfully', 'success');
        setNewLoanForm({
          initialAmount: '',
          date: new Date().toISOString().substring(0, 10),
          note: '',
        });
        setShowNewLoanModal(false);
        fetchDetail();
      }
    } catch (err) {
      showToast(err?.message || 'Failed to create loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePerson = async () => {
    try {
      setSubmitting(true);
      const res = await deletePerson(id);
      if (res.success) {
        showToast('Person deleted successfully', 'success');
        navigate('/lending');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Cannot delete person', 'error');
    } finally {
      setSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading && !person) {
    return (
      <div className="lending-page">
        <div className="lending-loading-wrap">
          <Loading variant="card" text="Loading Person Details..." />
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="lending-page">
        <div className="lending-empty-state">
          <p className="lending-empty-title">Person not found.</p>
          <Link to="/lending" className="fs-btn fs-btn-secondary lending-action-btn">
            ← Back to Lending Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const activeDebt = (aggregate?.totalOutstandingInPiastres || 0) / 100;
  const writtenOffDebt = (aggregate?.totalWrittenOffInPiastres || 0) / 100;
  const activeCount = aggregate?.activeLoanCount || 0;

  return (
    <div className="lending-page">
      <div className="lending-back-row">
        <Link to="/lending" className="lending-back-link">
          ← Back to Lending Dashboard
        </Link>
      </div>

      <div className="lending-header">
        <div>
          <h1>{person.name}</h1>
          {person.note && <p className="lending-subtitle">{person.note}</p>}
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="fs-btn fs-btn-secondary lending-action-btn"
            onClick={() => setIsEditing(true)}
          >
            Edit Person
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-primary lending-action-btn"
            onClick={() => setShowNewLoanModal(true)}
          >
            + New Loan for {person.name}
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-secondary lending-action-btn"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Person
          </button>
        </div>
      </div>

      {/* Aggregate Banner */}
      <div className="lending-summary-banner">
        <div>
          <div className="lending-summary-headline">
            {activeDebt > 0
              ? `${person.name} currently owes you ${formatCurrency(activeDebt)} across ${activeCount} active loan${
                  activeCount === 1 ? '' : 's'
                }`
              : `All active loans for ${person.name} are fully settled`}
          </div>
          {writtenOffDebt > 0 && (
            <div className="lending-summary-meta fs-num">
              {aggregate?.writtenOffCount} written-off loan ({formatCurrency(writtenOffDebt)})
            </div>
          )}
        </div>
        <div className="lending-summary-count fs-num">Total Loans: {loans.length}</div>
      </div>

      {/* Loans List */}
      <div className="lending-controls-bar">
        <h2 className="lending-section-title">Loans for {person.name}</h2>
      </div>

      {!isMobile ? (
        <div className="lending-table-wrap">
          <table className="lending-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" className="lending-th-num">Total Borrowed</th>
                <th scope="col" className="lending-th-num">Total Repaid</th>
                <th scope="col" className="lending-th-num">Remaining Balance</th>
                <th scope="col">Status</th>
                <th scope="col">Purpose / Notes</th>
                <th scope="col" className="lending-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="lending-table-empty">
                    No loans recorded for this person yet.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const txs = loan.transactions || [];
                  const borrowed =
                    txs.filter((t) => t.type === 'borrow').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0) / 100;
                  const repaid =
                    txs.filter((t) => t.type === 'repay').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0) / 100;
                  const balance = Math.max(0, borrowed - repaid);

                  return (
                    <tr key={loan._id}>
                      <td className="fs-num">{new Date(loan.createdAt).toLocaleDateString()}</td>
                      <td className="lending-td-num fs-num">{formatCurrency(borrowed)}</td>
                      <td className="lending-td-num fs-num">{formatCurrency(repaid)}</td>
                      <td className="lending-td-num fs-num">
                        <strong>{formatCurrency(balance)}</strong>
                      </td>
                      <td>
                        <Badge tone={loan.status === 'WrittenOff' ? 'negative' : 'neutral'}>
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="cell-wrap">{loan.notes || '—'}</td>
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
        <div className="lending-mobile-cards" data-testid="person-loans-mobile-cards">
          {loans.length === 0 ? (
            <div className="lending-empty-state">
              <p className="lending-empty-desc">No loans recorded for this person yet.</p>
            </div>
          ) : (
            loans.map((loan) => {
              const txs = loan.transactions || [];
              const borrowed =
                txs.filter((t) => t.type === 'borrow').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0) / 100;
              const repaid =
                txs.filter((t) => t.type === 'repay').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0) / 100;
              const balance = Math.max(0, borrowed - repaid);
              const dateLabel = new Date(loan.createdAt).toLocaleDateString();
              const isExpanded = expandedLoanIds.has(loan._id);

              return (
                <article key={loan._id} className="lending-mobile-card">
                  <div className="lending-mobile-card-summary">
                    <div className="lending-mobile-card-main">
                      <span className="lending-mobile-card-title fs-num">{dateLabel}</span>
                      <Badge tone={loan.status === 'WrittenOff' ? 'negative' : 'neutral'}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="lending-mobile-card-val fs-num">{formatCurrency(balance)}</div>
                  </div>

                  <button
                    type="button"
                    className="lending-mobile-expand-btn"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} loan details for ${dateLabel}`}
                    onClick={() => toggleLoanExpand(loan._id)}
                  >
                    <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                    {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                  </button>

                  {isExpanded && (
                    <div className="lending-mobile-details">
                      <div className="lending-mobile-detail-item">
                        <span className="lending-mobile-detail-label">Total Borrowed</span>
                        <span className="lending-mobile-detail-value fs-num">{formatCurrency(borrowed)}</span>
                      </div>
                      <div className="lending-mobile-detail-item">
                        <span className="lending-mobile-detail-label">Total Repaid</span>
                        <span className="lending-mobile-detail-value fs-num">{formatCurrency(repaid)}</span>
                      </div>
                      <div className="lending-mobile-detail-item">
                        <span className="lending-mobile-detail-label">Purpose / Notes</span>
                        <span className="lending-mobile-detail-value">{loan.notes || '—'}</span>
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

      {/* Edit Person Modal */}
      {isEditing && (
        <div className="modal-overlay lending-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-person-title">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3 id="edit-person-title">Edit Person</h3>
              <button
                type="button"
                aria-label="Close modal"
                className="fs-btn fs-btn-secondary lending-modal-close"
                onClick={() => setIsEditing(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdatePerson}>
              <div className="lending-modal-body">
                <div className="lending-form-group">
                  <label htmlFor="edit-name">Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    maxLength={100}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="edit-note">Note</label>
                  <input
                    id="edit-note"
                    type="text"
                    maxLength={500}
                    value={editForm.note}
                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="lending-modal-footer">
                <button
                  type="button"
                  className="fs-btn fs-btn-secondary lending-action-btn"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="fs-btn fs-btn-primary lending-action-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      {showNewLoanModal && (
        <div className="modal-overlay lending-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="person-new-loan-title">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3 id="person-new-loan-title">New Loan for {person.name}</h3>
              <button
                type="button"
                aria-label="Close modal"
                className="fs-btn fs-btn-secondary lending-modal-close"
                onClick={() => setShowNewLoanModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateLoanForPerson}>
              <div className="lending-modal-body">
                <div className="lending-form-group">
                  <label htmlFor="new-loan-amount">Initial Loan Amount (EGP)</label>
                  <input
                    id="new-loan-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 5000.00"
                    value={newLoanForm.initialAmount}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, initialAmount: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="new-loan-date">Disbursement Date</label>
                  <input
                    id="new-loan-date"
                    type="date"
                    required
                    value={newLoanForm.date}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, date: e.target.value })}
                  />
                </div>
                <div className="lending-form-group">
                  <label htmlFor="new-loan-notes">Note / Purpose</label>
                  <input
                    id="new-loan-notes"
                    type="text"
                    maxLength={1000}
                    placeholder="e.g. Vacation loan"
                    value={newLoanForm.note}
                    onChange={(e) => setNewLoanForm({ ...newLoanForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="lending-modal-footer">
                <button
                  type="button"
                  className="fs-btn fs-btn-secondary lending-action-btn"
                  onClick={() => setShowNewLoanModal(false)}
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

      {/* Accessible ConfirmModal for Deleting Person */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Person"
        message={`Are you sure you want to delete ${person.name}? Note: Deletion is blocked if this person has any active loans with an outstanding balance.`}
        confirmText="Delete Person"
        cancelText="Cancel"
        variant="danger"
        isLoading={submitting}
        onConfirm={handleDeletePerson}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default PersonDetailPage;
