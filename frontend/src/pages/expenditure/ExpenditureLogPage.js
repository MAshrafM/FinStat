// frontend/src/pages/expenditure/ExpenditureLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getExpenditures,
  deleteExpenditure,
  getLatestExpenditure,
  bulkUpdateCategory,
  bulkDeleteExpenditures,
} from '../../services/expenditureService';
import apiClient from '../../services/apiClient';
import { BASE_API_URL } from '../../config/api';
import UndoToast from '../../components/common/UndoToast';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaPencilAlt, FaTrash, FaUniversity, FaMoneyBillWave, FaCreditCard, FaWallet, FaPlus } from 'react-icons/fa';
import '../../components/Table.css'; // Reuse table styles
import './Expenditure.css'; // Load expenditure styles
import PaginationControls from '../../components/PaginationControls';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import ExpenditureSubNav from './ExpenditureSubNav';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { Loading, Badge, Button } from '../../components/ui';

const transactionTypeMap = {
  W: 'Withdraw',
  T: 'Topup',
  S: 'Saving',
  na: 'Log',
  Prepaid: 'Prepaid',
  Bank: 'Bank',
  Cash: 'Cash',
};

const getAccountInfo = (log) => {
  if (log.paidWithCreditCard || log.paymentMethod === 'Credit Card') {
    return {
      accountName: 'Credit Card',
      balanceLabel: 'Bank Balance After',
      balanceValue: log.runningBalances?.bank ?? log.bank,
    };
  }

  const rawMethod = (log.paymentMethod || log.sourceAccount || log.fromAccount || 'Bank').trim();
  const lowerMethod = rawMethod.toLowerCase();

  if (lowerMethod === 'cash') {
    return {
      accountName: 'Cash',
      balanceLabel: 'Cash Balance After',
      balanceValue: log.runningBalances?.cash ?? log.cash,
    };
  }

  if (lowerMethod === 'prepaid') {
    return {
      accountName: 'Prepaid',
      balanceLabel: 'Prepaid Balance After',
      balanceValue: log.runningBalances?.prepaid ?? log.prepaid,
    };
  }

  return {
    accountName: rawMethod || 'Bank',
    balanceLabel: `${rawMethod || 'Bank'} Balance After`,
    balanceValue: log.runningBalances?.bank ?? log.bank,
  };
};

const ExpenditureLogPage = () => {
  const { showToast } = useToast();
  const [expenditures, setExpenditures] = useState([]);
  const [processedExpenditures, setProcessedExpenditures] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedUndoItem, setDeletedUndoItem] = useState(null);
  const [latestHolding, setLatestHolding] = useState({ bank: 0, cash: 0, prepaid: 0 });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [targetCategory, setTargetCategory] = useState(EXPENDITURE_CATEGORIES[0]?.name || 'Groceries');
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdatingCategory, setIsBulkUpdatingCategory] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleCardExpand = (id) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (processedExpenditures.length === 0) return;
    const allSelected = processedExpenditures.every((log) => selectedIds.has(log._id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedExpenditures.map((log) => log._id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkCategoryReassign = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkUpdatingCategory(true);
    try {
      const idsArray = Array.from(selectedIds);
      await bulkUpdateCategory(idsArray, targetCategory);
      showToast(`Updated category to "${targetCategory}" for ${idsArray.length} transaction${idsArray.length === 1 ? '' : 's'}`, 'success');
      setSelectedIds(new Set());
      loadExpenditures(currentPage, selectedType);
    } catch (err) {
      console.error('Failed to update categories:', err);
      showToast(err.response?.data?.message || 'Failed to update categories', 'error');
    } finally {
      setIsBulkUpdatingCategory(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const idsArray = Array.from(selectedIds);
      await bulkDeleteExpenditures(idsArray);
      showToast(`Deleted ${idsArray.length} transaction${idsArray.length === 1 ? '' : 's'} successfully`, 'success');
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      loadExpenditures(currentPage, selectedType);
      loadLatestHolding();
    } catch (err) {
      console.error('Failed to bulk delete expenditures:', err);
      showToast(err.response?.data?.message || 'Failed to delete expenditures', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const loadExpenditures = useCallback((page, typeFilter) => {
    setIsLoading(true);
    getExpenditures(page, 25, typeFilter)
      .then(response => {
        const list = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        setExpenditures(list);
        setTotalPages(response?.totalPages || 1);
      })
      .catch(err => {
        console.error('Failed to load expenditures:', err);
        setExpenditures([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loadLatestHolding = useCallback(() => {
    getLatestExpenditure()
      .then(data => {
        if (data) {
          setLatestHolding({
            bank: data.runningBalances?.bank ?? data.bank ?? 0,
            cash: data.runningBalances?.cash ?? data.cash ?? 0,
            prepaid: data.runningBalances?.prepaid ?? data.prepaid ?? 0,
          });
        }
      })
      .catch(err => console.error('Failed to load latest expenditure holding:', err));
  }, []);

  useEffect(() => {
    loadExpenditures(currentPage, selectedType);
    loadLatestHolding();
  }, [currentPage, selectedType, loadExpenditures, loadLatestHolding]);

  useEffect(() => {
    if (!Array.isArray(expenditures) || expenditures.length === 0) {
      setProcessedExpenditures([]);
      return;
    }

    const sortedByTimestamp = [...expenditures].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    setProcessedExpenditures(sortedByTimestamp);
  }, [expenditures]);

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const targetId = deletingId;
    const targetItem = expenditures.find((e) => e._id === targetId);
    setIsDeleting(true);
    try {
      await deleteExpenditure(targetId);
      setDeletingId(null);
      loadExpenditures(currentPage, selectedType);
      loadLatestHolding();
      setDeletedUndoItem({
        id: targetId,
        message: targetItem ? `Deleted "${targetItem.description || targetItem.categories?.[0] || 'Expenditure'}"` : 'Expenditure deleted',
      });
    } catch (err) {
      console.error('Failed to delete expenditure:', err);
      showToast(err.response?.data?.message || 'Failed to delete expenditure', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedUndoItem) return;
    try {
      await apiClient.post(`${BASE_API_URL}/expenditures/${deletedUndoItem.id}/restore`);
      showToast('Expenditure restored successfully', 'success');
      loadExpenditures(currentPage, selectedType);
      loadLatestHolding();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore expenditure', 'error');
    }
  };

  const handleFilterChange = (type) => {
    setSelectedType(type);
    setSelectedIds(new Set());
    setCurrentPage(1); // Reset to first page when changing filter
  };

  return (
    <div className="page-container">
      {/* Sub-navigation tabs */}
      <ExpenditureSubNav />

      <div className="page-header">
        <h1>Expenditure Log</h1>
        <div className="page-header-actions">
          <ProtectedAction tooltip="View-only access">
            <Button
              as={Link}
              to="/expenditures/new"
              variant="primary"
              icon={<FaPlus size={13} />}
              title="Record a new expenditure"
            >
              Add Expenditure
            </Button>
          </ProtectedAction>
        </div>
      </div>

      {/* Current Holdings Summary Card */}
      <div className="holdings-summary-card">
        <div className="holdings-grid">
          {/* Bank */}
          <div className="holdings-tile">
            <FaUniversity className="holdings-tile-icon" />
            <div className="holdings-tile-label">Bank</div>
            <div className="holdings-tile-value fs-num">{formatCurrency(latestHolding.bank || 0)}</div>
          </div>

          {/* Cash */}
          <div className="holdings-tile">
            <FaMoneyBillWave className="holdings-tile-icon" />
            <div className="holdings-tile-label">Cash</div>
            <div className="holdings-tile-value fs-num">{formatCurrency(latestHolding.cash || 0)}</div>
          </div>

          {/* Prepaid */}
          <div className="holdings-tile">
            <FaCreditCard className="holdings-tile-icon" />
            <div className="holdings-tile-label">Prepaid</div>
            <div className="holdings-tile-value fs-num">{formatCurrency(latestHolding.prepaid || 0)}</div>
          </div>

          {/* Total Holding */}
          <div className="holdings-tile">
            <FaWallet className="holdings-tile-icon" />
            <div className="holdings-tile-label">Total Holding</div>
            <div className="holdings-tile-value fs-num">
              {formatCurrency((latestHolding.bank || 0) + (latestHolding.cash || 0) + (latestHolding.prepaid || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <div className="holdings-tile-label">By Action / Account Type:</div>
          <div className="filter-chips">
            <button
              type="button"
              className={`filter-chip ${selectedType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Actions
            </button>
            {Object.keys(transactionTypeMap).map(type => (
              <button
                type="button"
                key={type}
                className={`filter-chip ${selectedType === type ? 'active' : ''}`}
                onClick={() => handleFilterChange(type)}
              >
                {transactionTypeMap[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <div className="holdings-tile-label">By Category:</div>
          <div className="filter-chips">
            {EXPENDITURE_CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.name}
                className={`filter-chip ${selectedType === cat.name ? 'active' : ''}`}
                onClick={() => handleFilterChange(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {selectedType !== 'all' && (
          <div className="filter-notice">
            Showing Expenditures filtered by: <strong>{transactionTypeMap[selectedType] || selectedType}</strong>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar" role="region" aria-label="Bulk actions toolbar">
          <div className="bulk-actions-info">
            <span className="bulk-count-badge">{selectedIds.size} selected</span>
            <Button
              variant="secondary"
              onClick={handleClearSelection}
              disabled={isBulkUpdatingCategory || isBulkDeleting}
            >
              Deselect All
            </Button>
          </div>

          <div className="bulk-actions-controls">
            <label htmlFor="bulk-category-select" className="bulk-category-label">
              Category:
            </label>
            <select
              id="bulk-category-select"
              className="bulk-category-select"
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              disabled={isBulkUpdatingCategory || isBulkDeleting}
            >
              {EXPENDITURE_CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <ProtectedAction tooltip="View-only access">
              <Button
                variant="secondary"
                onClick={handleBulkCategoryReassign}
                disabled={isBulkUpdatingCategory || isBulkDeleting}
              >
                {isBulkUpdatingCategory ? 'Updating...' : 'Reassign Category'}
              </Button>
            </ProtectedAction>

            <ProtectedAction tooltip="View-only access">
              <Button
                variant="secondary"
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={isBulkUpdatingCategory || isBulkDeleting}
              >
                Delete Selected
              </Button>
            </ProtectedAction>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loading variant="table" rows={5} text="Loading expenditures..." />
      ) : isMobile ? (
        <div className="fs-mobile-card-list" role="region" aria-label="Expenditures card list">
          {processedExpenditures.length === 0 ? (
            <div className="filter-notice">
              No expenditure records found. Click <strong>Add Expenditure</strong> to record a new transaction.
            </div>
          ) : (
            processedExpenditures.map((log) => {
              const accountInfo = getAccountInfo(log);
              return (
                <article
                  key={log._id}
                  className={`fs-card-item ${selectedIds.has(log._id) ? 'fs-row-selected' : ''}`}
                  aria-label={`Expenditure ${log.description || log._id}`}
                >
                  <div className="fs-card-header">
                    <label className="fs-checkbox-label">
                      <input
                        type="checkbox"
                        className="fs-checkbox-input"
                        aria-label={`Select transaction ${log.description || log._id}`}
                        checked={selectedIds.has(log._id)}
                        onChange={() => handleToggleSelect(log._id)}
                      />
                      <span className="fs-checkbox-custom" aria-hidden="true" />
                    </label>
                    <span className="fs-card-date">{formatDate(log.date)}</span>
                    <span className="fs-card-amount fs-num">{formatCurrency(log.transactionValue)}</span>
                  </div>

                  <div className="fs-card-primary-info">
                    {log.splits && log.splits.length > 0 ? (
                      <div className="split-container">
                        <span className="split-badge-title">✂ Split ({log.splits.length})</span>
                        <div className="category-badges-list">
                          {log.splits.map((s, idx) => (
                            <span key={idx} className="fs-cat-badge">
                              {s.category}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="fs-cat-badge">{log.categories?.[0] || 'Uncategorized'}</span>
                    )}
                    <span className="fs-card-desc">{log.description || '-'}</span>
                  </div>

                  <button
                    type="button"
                    className="fs-card-expander-btn"
                    aria-expanded={expandedCards.has(log._id)}
                    onClick={() => handleToggleCardExpand(log._id)}
                  >
                    {expandedCards.has(log._id) ? 'Hide Details ▲' : 'View Details ▼'}
                  </button>

                  {expandedCards.has(log._id) && (
                    <div className="fs-card-details-drawer">
                      <div className="fs-card-field">
                        <span className="fs-card-label">Account</span>
                        <span className="fs-card-value">
                          {accountInfo.accountName}
                        </span>
                      </div>
                      <div className="fs-card-field">
                        <span className="fs-card-label">{accountInfo.balanceLabel}</span>
                        <span className="fs-card-value fs-num">
                          {accountInfo.balanceValue != null ? formatCurrency(accountInfo.balanceValue) : '—'}
                        </span>
                      </div>
                      <div className="fs-card-field">
                        <span className="fs-card-label">Type</span>
                        <span className="fs-card-value">
                          {transactionTypeMap[log.transactionType] || log.transactionType}
                        </span>
                      </div>
                      {log.currency && log.currency !== 'EGP' && log.foreignAmount && (
                        <div className="fs-card-field">
                          <span className="fs-card-label">Foreign Currency</span>
                          <span className="fs-card-value fs-num">
                            {log.foreignAmount.toLocaleString()} {log.currency}
                          </span>
                        </div>
                      )}
                      {log.splits && log.splits.length > 0 && (
                        <div className="fs-card-field split-details-drawer">
                          <span className="fs-card-label">Split Breakdown</span>
                          <div className="split-items-list">
                            {log.splits.map((s, idx) => (
                              <div key={idx} className="split-detail-row">
                                <span className="fs-cat-badge">{s.category}</span>
                                <span className="fs-num">{formatCurrency(s.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="fs-card-actions">
                        <ProtectedAction tooltip="View-only access">
                          <Link to={`/expenditures/edit/${log._id}`} className="action-icon edit-icon" title="Edit">
                            <FaPencilAlt />
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            className="action-icon delete-icon"
                            title="Delete"
                            onClick={() => handleDeleteClick(log._id)}
                          >
                            <FaTrash />
                          </button>
                        </ProtectedAction>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="fs-table-scroll">
          <table className="styled-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <label className="fs-checkbox-label">
                    <input
                      type="checkbox"
                      className="fs-checkbox-input"
                      aria-label="Select all expenditures on this page"
                      checked={
                        processedExpenditures.length > 0 &&
                        processedExpenditures.every((log) => selectedIds.has(log._id))
                      }
                      onChange={handleToggleSelectAll}
                    />
                    <span className="fs-checkbox-custom" aria-hidden="true" />
                  </label>
                </th>
                <th>
                  Date <span className="fs-sort-arrow" aria-hidden="true">▼</span>
                </th>
                <th>Bank</th>
                <th>Cash</th>
                <th>Prepaid</th>
                <th>Transaction</th>
                <th>Type</th>
                <th>Categories</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedExpenditures.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-state">
                    No expenditure records found. Click <strong>Add Expenditure</strong> to record a new transaction.
                  </td>
                </tr>
              ) : (
                processedExpenditures.map(log => (
                  <tr key={log._id} className={selectedIds.has(log._id) ? 'fs-row-selected' : ''}>
                    <td className="checkbox-cell">
                      <label className="fs-checkbox-label">
                        <input
                          type="checkbox"
                          className="fs-checkbox-input"
                          aria-label={`Select transaction ${log.description || log._id}`}
                          checked={selectedIds.has(log._id)}
                          onChange={() => handleToggleSelect(log._id)}
                        />
                        <span className="fs-checkbox-custom" aria-hidden="true" />
                      </label>
                    </td>
                    <td data-label="Date">{formatDate(log.date)}</td>
                    <td data-label="Bank" className="fs-num">{formatCurrency(log.runningBalances?.bank ?? log.bank)}</td>
                    <td data-label="Cash" className="fs-num">{formatCurrency(log.runningBalances?.cash ?? log.cash)}</td>
                    <td data-label="Prepaid" className="fs-num">{formatCurrency(log.runningBalances?.prepaid ?? log.prepaid ?? 0)}</td>
                    <td data-label="Transaction" className="fs-num">
                      <strong className="fs-num">{formatCurrency(log.transactionValue)}</strong>
                      {log.currency && log.currency !== 'EGP' && log.foreignAmount && (
                        <div className="fs-card-date">
                          ({log.foreignAmount.toLocaleString()} {log.currency})
                        </div>
                      )}
                    </td>
                    <td data-label="Type">{transactionTypeMap[log.transactionType] || log.transactionType}</td>
                    <td data-label="Categories">
                      {log.splits && log.splits.length > 0 ? (
                        <div className="split-container">
                          <span className="split-badge-title">
                            ✂ Split ({log.splits.length})
                          </span>
                          <div className="category-badges-list">
                            {log.splits.map((s, idx) => (
                              <span
                                key={idx}
                                className="fs-cat-badge"
                                title={`${s.category}: ${formatCurrency(s.amount)}${
                                  s.description ? ` (${s.description})` : ''
                                }`}
                              >
                                {s.category} ({formatCurrency(s.amount)})
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="category-badges-list">
                          {(log.categories && log.categories.length > 0
                            ? log.categories
                            : ['Other']
                          ).map((catName) => (
                            <span key={catName} className="fs-cat-badge">
                              {catName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      data-label="Description"
                      className="fs-card-desc"
                      title={log.description}
                    >
                      {log.description || '-'}
                      {log.paidWithCreditCard && !log.settledFromBank && (log.settledAmountInPiastres || 0) === 0 && (
                        <Badge label="Credit Purchase">
                          💳 Credit Purchase
                        </Badge>
                      )}
                      {log.paidWithCreditCard && !log.settledFromBank && (log.settledAmountInPiastres || 0) > 0 && (
                        <Badge label={`Partially settled: ${formatCurrency((log.settledAmountInPiastres || 0) / 100)} of ${formatCurrency(log.transactionValue)}`}>
                          💳🟡 Partial ({formatCurrency((log.settledAmountInPiastres || 0) / 100)})
                        </Badge>
                      )}
                      {log.paidWithCreditCard && log.settledFromBank && (
                        <Badge label={log.settlementDate ? `Fully settled from bank on ${formatDate(log.settlementDate)}` : 'Fully settled from bank'}>
                          💳✅ Settled
                        </Badge>
                      )}
                      {log.categories && log.categories.includes('Credit Card Settlement') && (
                        <Badge label="Credit card settlement payment debited from bank balance.">
                          🔄 Settlement Outflow
                        </Badge>
                      )}
                      {log.isRecurring && (
                        <Badge label="Recurring Expense">
                          🔁 Recurring
                        </Badge>
                      )}
                    </td>
                    <td data-label="Action" className="action-cell">
                      <ProtectedAction tooltip="View-only access">
                        <Link to={`/expenditures/edit/${log._id}`}>
                          <FaPencilAlt className="action-icon edit-icon" />
                        </Link>
                      </ProtectedAction>
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(log._id)}
                          title="Delete expenditure"
                          className="action-icon delete-icon"
                        >
                          <FaTrash />
                        </button>
                      </ProtectedAction>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setSelectedIds(new Set());
          setCurrentPage(page);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Expenditure"
        message="Are you sure you want to delete this expenditure log? This action cannot be undone."
        confirmText="Delete Expenditure"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeletingId(null)}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Selected Expenditures"
        message={`Are you sure you want to delete ${selectedIds.size} expenditure transaction${selectedIds.size === 1 ? '' : 's'}? Running balances for subsequent transactions will be automatically adjusted.`}
        confirmText={`Delete ${selectedIds.size} Items`}
        cancelText="Cancel"
        variant="danger"
        isLoading={isBulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
      />

      <UndoToast
        isOpen={Boolean(deletedUndoItem)}
        message={deletedUndoItem?.message || 'Expenditure deleted'}
        duration={10}
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedUndoItem(null)}
      />
    </div>
  );
};

export default ExpenditureLogPage;
