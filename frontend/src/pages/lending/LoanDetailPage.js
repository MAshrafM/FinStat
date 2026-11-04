// frontend/src/pages/lending/LoanDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getLoanById,
  updateLoan,
  deleteLoan,
  addTransaction,
  deleteTransaction,
} from '../../services/lendingService';
import AddTransactionForm from './AddTransactionForm';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './Lending.css';

const LoanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState(null);

  // Modals
  const [modalType, setModalType] = useState(null); // 'repay' | 'borrow' | null
  const [txToDelete, setTxToDelete] = useState(null);
  const [showDeleteLoanModal, setShowDeleteLoanModal] = useState(false);
  const [showWrittenOffModal, setShowWrittenOffModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLoanById(id);
      if (res.success) {
        setLoan(res.data);
      }
    } catch (err) {
      showToast(err?.message || 'Failed to load loan ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  const handleAddTransaction = async (formData) => {
    try {
      const res = await addTransaction(id, formData);
      if (res.success) {
        showToast(
          formData.type === 'repay' ? 'Repayment recorded successfully' : 'Loan balance increased successfully',
          'success'
        );
        fetchLoan();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add transaction';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleDeleteTransaction = async () => {
    if (!txToDelete) return;
    try {
      setActionLoading(true);
      const res = await deleteTransaction(id, txToDelete._id);
      if (res.success) {
        showToast('Transaction removed successfully', 'success');
        setTxToDelete(null);
        fetchLoan();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete transaction', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWrittenOff = async () => {
    try {
      setActionLoading(true);
      const newStatus = loan.status === 'WrittenOff' ? 'Active' : 'WrittenOff';
      const res = await updateLoan(id, { status: newStatus });
      if (res.success) {
        showToast(`Loan marked as ${newStatus}`, 'success');
        setShowWrittenOffModal(false);
        fetchLoan();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to update loan status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLoan = async () => {
    try {
      setActionLoading(true);
      const res = await deleteLoan(id);
      if (res.success) {
        showToast('Loan deleted successfully', 'success');
        navigate('/lending');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete loan', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteLoanModal(false);
    }
  };

  if (loading && !loan) {
    return (
      <div className="lending-page" style={{ textAlign: 'center', padding: '60px' }}>
        <p>Loading Loan Ledger...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="lending-page">
        <p>Loan not found.</p>
        <Link to="/lending" className="lending-btn lending-btn-secondary">
          ← Back to Lending Dashboard
        </Link>
      </div>
    );
  }

  const borrowed = (loan.totalBorrowedInPiastres || 0) / 100;
  const repaid = (loan.totalRepaidInPiastres || 0) / 100;
  const balance = (loan.balanceInPiastres || 0) / 100;
  const progressPct = borrowed > 0 ? Math.min(100, Math.round((repaid / borrowed) * 100)) : 0;
  const personName = loan.person?.name || 'Borrower';

  return (
    <div className="lending-page">
      <div style={{ marginBottom: '16px' }}>
        <Link
          to={loan.person?._id ? `/lending/persons/${loan.person._id}` : '/lending'}
          style={{ textDecoration: 'none', color: '#009879', fontSize: '0.9rem', fontWeight: 500 }}
        >
          ← Back to {personName}
        </Link>
      </div>

      <div className="lending-header">
        <div>
          <h1>Loan: {personName}</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            {loan.notes || 'No specific notes entered for this loan.'}
          </p>
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="lending-btn lending-btn-primary"
            onClick={() => setModalType('repay')}
            disabled={balance <= 0 || loan.status === 'WrittenOff'}
          >
            + Add Repayment
          </button>
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            onClick={() => setModalType('borrow')}
          >
            + Increase Loan (Borrow More)
          </button>
          {balance > 0 && (
            <button
              type="button"
              className="lending-btn lending-btn-secondary"
              style={{
                color: loan.status === 'WrittenOff' ? '#047857' : '#b45309',
                borderColor: loan.status === 'WrittenOff' ? '#a7f3d0' : '#fde68a',
              }}
              onClick={() => setShowWrittenOffModal(true)}
            >
              {loan.status === 'WrittenOff' ? 'Re-activate Loan' : 'Mark as Written Off'}
            </button>
          )}
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
            onClick={() => setShowDeleteLoanModal(true)}
          >
            Delete Loan
          </button>
        </div>
      </div>

      {/* Loan Financial Hero Card */}
      <div className="lending-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Remaining Balance</div>
          <div
            className="lending-kpi-value"
            style={{ color: balance > 0 ? '#009879' : '#059669', fontSize: '1.8rem' }}
          >
            {formatCurrency(balance)}
          </div>
          <div className="lending-kpi-sub">
            Status:{' '}
            <span
              className={`person-card-badge ${loan.status === 'Active'
                  ? 'badge-active'
                  : loan.status === 'Repaid'
                    ? 'badge-repaid'
                    : 'badge-writtenoff'
                }`}
            >
              {loan.status}
            </span>
          </div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Borrowed</div>
          <div className="lending-kpi-value">{formatCurrency(borrowed)}</div>
          <div className="lending-kpi-sub">Principal + cumulative increases</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Repaid</div>
          <div className="lending-kpi-value" style={{ color: '#059669' }}>
            {formatCurrency(repaid)}
          </div>
          <div className="lending-kpi-sub">Installments received</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Repayment Progress</div>
          <div className="lending-kpi-value">{progressPct}%</div>
          <div className="lending-progress-bg" style={{ marginTop: '10px' }}>
            <div className="lending-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="lending-controls-bar" style={{ marginTop: '28px' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Transaction History & Ledger</h2>
      </div>

      <div className="lending-scroll-hint" aria-hidden="true">
        <span>↔ Scroll horizontally to view full ledger columns</span>
      </div>

      <div className="table-container lending-table-card">
        <table className="lending-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Transaction Amount</th>
              <th>Running Balance</th>
              <th>Note</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(loan.transactions || []).length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No transactions recorded.
                </td>
              </tr>
            ) : (
              loan.transactions.map((tx) => {
                const txAmount = (tx.amountInPiastres || 0) / 100;
                const runningBal = (tx.runningBalanceInPiastres || 0) / 100;

                return (
                  <tr key={tx._id}>
                    <td>{new Date(tx.date).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`person-card-badge ${tx.type === 'borrow' ? 'badge-writtenoff' : 'badge-repaid'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {tx.type === 'borrow' ? 'Borrow' : 'Repayment'}
                      </span>
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        color: tx.type === 'borrow' ? '#b91c1c' : '#059669',
                      }}
                    >
                      {tx.type === 'borrow' ? `+ ${formatCurrency(txAmount)}` : `- ${formatCurrency(txAmount)}`}
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{formatCurrency(runningBal)}</td>
                    <td className="cell-wrap">{tx.note || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        aria-label="Delete transaction"
                        className="lending-btn lending-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#b91c1c', borderColor: '#fecaca' }}
                        onClick={() => setTxToDelete(tx)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Form Modal */}
      <AddTransactionForm
        isOpen={Boolean(modalType)}
        defaultType={modalType || 'repay'}
        maxRepayAmount={modalType === 'repay' ? loan.balanceInPiastres : null}
        onClose={() => setModalType(null)}
        onSubmit={handleAddTransaction}
      />

      {/* Accessible ConfirmModal for Deleting Transaction */}
      <ConfirmModal
        isOpen={Boolean(txToDelete)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? Note: Deletion will be rejected if it would cause any intermediate or final balance in the ledger to become negative."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleDeleteTransaction}
        onCancel={() => setTxToDelete(null)}
      />

      {/* Accessible ConfirmModal for Written Off Status */}
      <ConfirmModal
        isOpen={showWrittenOffModal}
        title={loan.status === 'WrittenOff' ? 'Re-activate Loan' : 'Mark Loan as Written Off'}
        message={
          loan.status === 'WrittenOff'
            ? 'Are you sure you want to re-activate this loan? It will be restored to your active receivables and comprehensive report assets.'
            : 'Are you sure you want to write off this loan? The remaining balance will be excluded from your active receivables and net worth calculations while preserving ledger history.'
        }
        confirmText={loan.status === 'WrittenOff' ? 'Re-activate' : 'Write Off Loan'}
        cancelText="Cancel"
        variant={loan.status === 'WrittenOff' ? 'primary' : 'warning'}
        isLoading={actionLoading}
        onConfirm={handleToggleWrittenOff}
        onCancel={() => setShowWrittenOffModal(false)}
      />

      {/* Accessible ConfirmModal for Deleting Entire Loan */}
      <ConfirmModal
        isOpen={showDeleteLoanModal}
        title="Delete Loan"
        message="Are you sure you want to delete this entire loan record? This action will soft-delete the loan and all associated transactions."
        confirmText="Delete Loan"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleDeleteLoan}
        onCancel={() => setShowDeleteLoanModal(false)}
      />
    </div>
  );
};

export default LoanDetailPage;
