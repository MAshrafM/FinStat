// frontend/src/pages/profile/RecycleBin.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaTrashRestore, FaReceipt, FaChartLine, FaArrowLeft, FaTrashAlt } from 'react-icons/fa';
import apiClient from '../../services/apiClient';
import { BASE_API_URL } from '../../config/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProtectedAction from '../../components/common/ProtectedAction';
import PaginationControls from '../../components/PaginationControls';
import { useToast } from '../../context/ToastContext';
import './RecycleBin.css';

const RecycleBin = () => {
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [activeTab, setActiveTab] = useState('expenditures'); // 'expenditures' | 'trades'
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Restore action state
  const [restoringItem, setRestoringItem] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const loadDeletedItems = useCallback(async (tab, page) => {
    setIsLoading(true);
    try {
      const endpoint = tab === 'expenditures' ? `${BASE_API_URL}/expenditures/deleted` : `${BASE_API_URL}/trades/deleted`;
      const res = await apiClient.get(`${endpoint}?page=${page}&limit=25`);
      setItems(res?.data || []);
      setTotalPages(res?.totalPages || 1);
      setTotalItems(res?.total || 0);
    } catch (err) {
      console.error('Failed to load deleted records:', err);
      if (notify) notify('Failed to load deleted records', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadDeletedItems(activeTab, currentPage);
  }, [activeTab, currentPage, loadDeletedItems]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleConfirmRestore = async () => {
    if (!restoringItem) return;
    setIsRestoring(true);
    try {
      const endpoint = activeTab === 'expenditures'
        ? `${BASE_API_URL}/expenditures/${restoringItem._id}/restore`
        : `${BASE_API_URL}/trades/${restoringItem._id}/restore`;

      await apiClient.post(endpoint);
      if (notify) notify('Item restored successfully', 'success');
      setRestoringItem(null);
      await loadDeletedItems(activeTab, currentPage);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Restoration failed';
      if (notify) notify(msg, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="recycle-bin-container" data-testid="recycle-bin-page">
      <div className="recycle-bin-header">
        <div className="recycle-bin-title">
          <h1>Recycle Bin</h1>
          <p>Recover soft-deleted expenditures and investment trades with ledger balance and bridge re-establishment</p>
        </div>
        <Link to="/settings" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FaArrowLeft aria-hidden="true" /> Back to Settings
        </Link>
      </div>

      {/* Tabs */}
      <div className="recycle-bin-tabs">
        <button
          type="button"
          className={`recycle-tab-btn ${activeTab === 'expenditures' ? 'active' : ''}`}
          onClick={() => handleTabChange('expenditures')}
          data-testid="tab-expenditures"
        >
          <FaReceipt aria-hidden="true" /> Deleted Expenditures {activeTab === 'expenditures' && `(${totalItems})`}
        </button>
        <button
          type="button"
          className={`recycle-tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => handleTabChange('trades')}
          data-testid="tab-trades"
        >
          <FaChartLine aria-hidden="true" /> Deleted Trades {activeTab === 'trades' && `(${totalItems})`}
        </button>
      </div>

      {/* Content Table */}
      <div className="recycle-bin-table-wrapper">
        {isLoading ? (
          <div className="recycle-bin-empty">Loading soft-deleted records...</div>
        ) : items.length === 0 ? (
          <div className="recycle-bin-empty" data-testid="empty-recycle-bin">
            <div className="recycle-bin-empty-icon">
              <FaTrashAlt aria-hidden="true" />
            </div>
            <h3>Recycle Bin is empty</h3>
            <p>No deleted {activeTab} found. Deleted items will be listed here and can be restored at any time.</p>
          </div>
        ) : (
          <table className="recycle-bin-table" data-testid="deleted-items-table">
            <thead>
              {activeTab === 'expenditures' ? (
                <tr>
                  <th>Date</th>
                  <th>Description / Category</th>
                  <th>Amount</th>
                  <th>Payment Account</th>
                  <th>Deleted At</th>
                  <th>Action</th>
                </tr>
              ) : (
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Stock Code</th>
                  <th>Broker</th>
                  <th>Total Value</th>
                  <th>Deleted At</th>
                  <th>Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} data-testid={`deleted-row-${item._id}`}>
                  <td>{formatDate(item.date)}</td>
                  {activeTab === 'expenditures' ? (
                    <>
                      <td>{item.description || item.categories?.[0] || 'Expenditure'}</td>
                      <td>{formatCurrency(item.transactionValue || 0)}</td>
                      <td>{item.paymentMethod || 'Bank'}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.type}</td>
                      <td>{item.stockCode || '-'}</td>
                      <td>{item.broker || 'Thndr'}</td>
                      <td>{formatCurrency(item.totalValue || 0)}</td>
                    </>
                  )}
                  <td>{item.deletedAt ? formatDate(item.deletedAt) : '-'}</td>
                  <td>
                    <ProtectedAction>
                      <button
                        type="button"
                        className="btn-restore"
                        onClick={() => setRestoringItem(item)}
                        data-testid={`restore-btn-${item._id}`}
                      >
                        <FaTrashRestore aria-hidden="true" /> Restore
                      </button>
                    </ProtectedAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      )}

      {/* Restore Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(restoringItem)}
        title="Restore Record"
        message={
          restoringItem
            ? `Restore this ${activeTab === 'expenditures' ? 'expenditure' : 'trade'}? Its ledger balance impact and transaction bridges will be automatically recalculated and restored.`
            : ''
        }
        confirmText="Restore Record"
        cancelText="Cancel"
        variant="primary"
        isLoading={isRestoring}
        onConfirm={handleConfirmRestore}
        onCancel={() => setRestoringItem(null)}
      />
    </div>
  );
};

export default RecycleBin;
