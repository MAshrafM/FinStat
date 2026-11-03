// frontend/src/pages/lending/PersonDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getPersonById,
  updatePerson,
  deletePerson,
  createLoan,
} from '../../services/lendingService';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './Lending.css';

const PersonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState(null);
  const [loans, setLoans] = useState([]);
  const [aggregate, setAggregate] = useState(null);

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
      <div className="lending-page" style={{ textAlign: 'center', padding: '60px' }}>
        <p>Loading Person Details...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="lending-page">
        <p>Person not found.</p>
        <Link to="/lending" className="lending-btn lending-btn-secondary">
          ← Back to Lending Dashboard
        </Link>
      </div>
    );
  }

  const activeDebt = (aggregate?.totalOutstandingInPiastres || 0) / 100;
  const writtenOffDebt = (aggregate?.totalWrittenOffInPiastres || 0) / 100;
  const activeCount = aggregate?.activeLoanCount || 0;

  return (
    <div className="lending-page">
      <div style={{ marginBottom: '16px' }}>
        <Link to="/lending" style={{ textDecoration: 'none', color: '#4f46e5', fontSize: '0.9rem' }}>
          ← Back to Lending Dashboard
        </Link>
      </div>

      <div className="lending-header">
        <div>
          <h1>{person.name}</h1>
          {person.note && <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>{person.note}</p>}
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            Edit Person
          </button>
          <button
            type="button"
            className="lending-btn lending-btn-primary"
            onClick={() => setShowNewLoanModal(true)}
          >
            + New Loan for {person.name}
          </button>
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Person
          </button>
        </div>
      </div>

      {/* Aggregate Banner */}
      <div
        style={{
          background: activeDebt > 0 ? '#eef2ff' : '#f0fdf4',
          border: `1px solid ${activeDebt > 0 ? '#c7d2fe' : '#bbf7d0'}`,
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: activeDebt > 0 ? '#312e81' : '#14532d' }}>
            {activeDebt > 0
              ? `${person.name} currently owes you ${formatCurrency(activeDebt)} across ${activeCount} active loan${
                  activeCount === 1 ? '' : 's'
                }`
              : `All active loans for ${person.name} are fully settled`}
          </span>
          {writtenOffDebt > 0 && (
            <div style={{ fontSize: '0.85rem', color: '#b91c1c', marginTop: '4px' }}>
              • {aggregate?.writtenOffCount} written-off loan ({formatCurrency(writtenOffDebt)})
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Loans: {loans.length}</div>
      </div>

      {/* Loans List */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Loans for {person.name}</h2>
      <div className="lending-table-card">
        <table className="lending-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Borrowed</th>
              <th>Total Repaid</th>
              <th>Remaining Balance</th>
              <th>Status</th>
              <th>Purpose / Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
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
                    <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                    <td>{formatCurrency(borrowed)}</td>
                    <td style={{ color: '#059669' }}>{formatCurrency(repaid)}</td>
                    <td style={{ fontWeight: 600, color: balance > 0 ? '#4f46e5' : '#64748b' }}>
                      {formatCurrency(balance)}
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
                    <td>{loan.notes || '—'}</td>
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

      {/* Edit Person Modal */}
      {isEditing && (
        <div className="lending-modal-backdrop" role="dialog" aria-modal="true">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3>Edit Person</h3>
              <button
                type="button"
                className="lending-btn lending-btn-secondary"
                onClick={() => setIsEditing(false)}
                style={{ padding: '4px 8px' }}
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
                  className="lending-btn lending-btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="lending-btn lending-btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Loan Modal */}
      {showNewLoanModal && (
        <div className="lending-modal-backdrop" role="dialog" aria-modal="true">
          <div className="lending-modal-content">
            <div className="lending-modal-header">
              <h3>New Loan for {person.name}</h3>
              <button
                type="button"
                className="lending-btn lending-btn-secondary"
                onClick={() => setShowNewLoanModal(false)}
                style={{ padding: '4px 8px' }}
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
                  className="lending-btn lending-btn-secondary"
                  onClick={() => setShowNewLoanModal(false)}
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
