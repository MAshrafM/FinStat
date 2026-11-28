// frontend/src/pages/lending/LoanDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  getLoanById,
  updateLoan,
  deleteLoan,
  addTransaction,
  deleteTransaction,
} from '../../services/lendingService';
import AddTransactionForm from './AddTransactionForm';
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

const LoanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState(null);
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [expandedTxIds, setExpandedTxIds] = useState(() => new Set());

  // Modals
  const [modalType, setModalType] = useState(null); // 'repay' | 'borrow' | null
  const [txToDelete, setTxToDelete] = useState(null);
  const [showDeleteLoanModal, setShowDeleteLoanModal] = useState(false);
  const [showWrittenOffModal, setShowWrittenOffModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

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

  const toggleTxExpand = (txId) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

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
      <div className="lending-page">
        <div className="lending-loading-wrap">
          <Loading variant="card" text="Loading Loan Ledger..." />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="lending-page">
        <div className="lending-empty-state">
          <p className="lending-empty-title">Loan not found.</p>
          <Link to="/lending" className="fs-btn fs-btn-secondary lending-action-btn">
            ← Back to Lending Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const borrowed = (loan.totalBorrowedInPiastres || 0) / 100;
  const repaid = (loan.totalRepaidInPiastres || 0) / 100;
  const balance = (loan.balanceInPiastres || 0) / 100;
  const progressPct = borrowed > 0 ? Math.min(100, Math.round((repaid / borrowed) * 100)) : 0;
  const personName = loan.person?.name || 'Borrower';
  const transactions = loan.transactions || [];

  return (
    <div className="lending-page">
      <div className="lending-back-row">
        <Link
          to={loan.person?._id ? `/lending/persons/${loan.person._id}` : '/lending'}
          className="lending-back-link"
        >
          ← Back to {personName}
        </Link>
      </div>

      <div className="lending-header">
        <div>
          <h1>Loan: {personName}</h1>
          <p className="lending-subtitle">
            {loan.notes || 'No specific notes entered for this loan.'}
          </p>
        </div>
        <div className="lending-header-actions">
          <button
            type="button"
            className="fs-btn fs-btn-primary lending-action-btn"
            onClick={() => setModalType('repay')}
            disabled={balance <= 0 || loan.status === 'WrittenOff'}
          >
            + Add Repayment
          </button>
          <button
            type="button"
            className="fs-btn fs-btn-secondary lending-action-btn"
            onClick={() => setModalType('borrow')}
          >
            + Increase Loan (Borrow More)
          </button>
          {balance > 0 && (
            <button
              type="button"
              className="fs-btn fs-btn-secondary lending-action-btn"
              onClick={() => setShowWrittenOffModal(true)}
            >
              {loan.status === 'WrittenOff' ? 'Re-activate Loan' : 'Mark as Written Off'}
            </button>
          )}
          <button
            type="button"
            className="fs-btn fs-btn-secondary lending-action-btn"
            onClick={() => setShowDeleteLoanModal(true)}
          >
            Delete Loan
          </button>
        </div>
      </div>

      {/* Loan Financial Hero Card */}
      <div className="lending-kpi-grid">
        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Remaining Balance</div>
          <div className="lending-kpi-value fs-num">{formatCurrency(balance)}</div>
          <div className="lending-kpi-sub">
            <span>Status:</span>
            <Badge tone={loan.status === 'WrittenOff' ? 'negative' : 'neutral'}>
              {loan.status}
            </Badge>
          </div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Borrowed</div>
          <div className="lending-kpi-value fs-num">{formatCurrency(borrowed)}</div>
          <div className="lending-kpi-sub">Principal + cumulative increases</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Total Repaid</div>
          <div className="lending-kpi-value fs-num">{formatCurrency(repaid)}</div>
          <div className="lending-kpi-sub">Installments received</div>
        </div>

        <div className="lending-kpi-card">
          <div className="lending-kpi-title">Repayment Progress</div>
          <div className="lending-kpi-value fs-num">{progressPct}%</div>
          <div className="lending-kpi-sub">
            <progress
              className="fs-progress lending-progress"
              value={progressPct}
              max={100}
              aria-label={`Repayment progress for ${personName}`}
              aria-valuetext={`${progressPct}% repaid`}
            />
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="lending-controls-bar">
        <h2 className="lending-section-title">Transaction History &amp; Ledger</h2>
      </div>

      {!isMobile ? (
        <div className="lending-table-wrap">
          <table className="lending-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col" className="lending-th-num">Transaction Amount</th>
                <th scope="col" className="lending-th-num">Running Balance</th>
                <th scope="col">Note</th>
                <th scope="col" className="lending-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="lending-table-empty">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const txAmount = (tx.amountInPiastres || 0) / 100;
                  const runningBal = (tx.runningBalanceInPiastres || 0) / 100;

                  return (
                    <tr key={tx._id}>
                      <td className="fs-num">{new Date(tx.date).toLocaleDateString()}</td>
                      <td>
                        <Badge tone="neutral">
                          {tx.type === 'borrow' ? 'Borrow' : 'Repayment'}
                        </Badge>
                      </td>
                      <td className="lending-td-num fs-num">
                        <strong>
                          {tx.type === 'borrow' ? `+ ${formatCurrency(txAmount)}` : `- ${formatCurrency(txAmount)}`}
                        </strong>
                      </td>
                      <td className="lending-td-num fs-num">
                        <strong>{formatCurrency(runningBal)}</strong>
                      </td>
                      <td className="cell-wrap">{tx.note || '—'}</td>
                      <td className="lending-td-actions">
                        <button
                          type="button"
                          aria-label="Delete transaction"
                          className="fs-btn fs-btn-secondary lending-table-btn"
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
      ) : (
        <div className="lending-mobile-cards" data-testid="loan-tx-mobile-cards">
          {transactions.length === 0 ? (
            <div className="lending-empty-state">
              <p className="lending-empty-desc">No transactions recorded.</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const txAmount = (tx.amountInPiastres || 0) / 100;
              const runningBal = (tx.runningBalanceInPiastres || 0) / 100;
              const dateLabel = new Date(tx.date).toLocaleDateString();
              const typeLabel = tx.type === 'borrow' ? 'Borrow' : 'Repayment';
              const isExpanded = expandedTxIds.has(tx._id);

              return (
                <article key={tx._id} className="lending-mobile-card">
                  <div className="lending-mobile-card-summary">
                    <div className="lending-mobile-card-main">
                      <span className="lending-mobile-card-title fs-num">{dateLabel}</span>
                      <Badge tone="neutral">{typeLabel}</Badge>
                    </div>
                    <div className="lending-mobile-card-val fs-num">
                      {tx.type === 'borrow' ? `+ ${formatCurrency(txAmount)}` : `- ${formatCurrency(txAmount)}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="lending-mobile-expand-btn"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} transaction details for ${dateLabel}`}
                    onClick={() => toggleTxExpand(tx._id)}
                  >
                    <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                    {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                  </button>

                  {isExpanded && (
                    <div className="lending-mobile-details">
                      <div className="lending-mobile-detail-item">
                        <span className="lending-mobile-detail-label">Running Balance</span>
                        <span className="lending-mobile-detail-value fs-num">{formatCurrency(runningBal)}</span>
                      </div>
                      <div className="lending-mobile-detail-item">
                        <span className="lending-mobile-detail-label">Note</span>
                        <span className="lending-mobile-detail-value">{tx.note || '—'}</span>
                      </div>
                      <div className="lending-mobile-card-actions">
                        <button
                          type="button"
                          aria-label="Delete transaction"
                          className="fs-btn fs-btn-secondary lending-table-btn"
                          onClick={() => setTxToDelete(tx)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

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
        variant={loan.status === 'WrittenOff' ? 'primary' : 'danger'}
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
