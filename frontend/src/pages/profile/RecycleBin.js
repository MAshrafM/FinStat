// frontend/src/pages/profile/RecycleBin.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaTrashRestore, FaReceipt, FaChartLine, FaArrowLeft, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import apiClient from '../../services/apiClient';
import { BASE_API_URL } from '../../config/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import ConfirmModal from '../../components/common/ConfirmModal';
import ProtectedAction from '../../components/common/ProtectedAction';
import PaginationControls from '../../components/PaginationControls';
import { Loading, EmptyState } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import './RecycleBin.css';

const RECYCLE_TABS = [
  { id: 'expenditures', label: 'Deleted Expenditures', testId: 'tab-expenditures' },
  { id: 'trades', label: 'Deleted Trades', testId: 'tab-trades' },
];

const RecycleBin = () => {
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [activeTab, setActiveTab] = useState('expenditures'); // 'expenditures' | 'trades'
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  ));

  // Restore action state
  const [restoringItem, setRestoringItem] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const tabRefs = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleMediaChange);
      return () => mql.removeEventListener('change', handleMediaChange);
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(handleMediaChange);
      return () => mql.removeListener(handleMediaChange);
    }
    return undefined;
  }, []);

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
    setExpandedIds(new Set());
  };

  const handleTabKeyDown = (e, index) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      targetIndex = (index + 1) % RECYCLE_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      targetIndex = (index - 1 + RECYCLE_TABS.length) % RECYCLE_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = RECYCLE_TABS.length - 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(RECYCLE_TABS[index].id);
      return;
    }

    if (targetIndex >= 0 && tabRefs.current[targetIndex]) {
      tabRefs.current[targetIndex].focus();
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  const activeTabId = activeTab === 'expenditures' ? 'recycle-tab-expenditures' : 'recycle-tab-trades';

  return (
    <div className="recycle-bin-container" data-testid="recycle-bin-page">
      <div className="recycle-bin-shell">
        <div className="recycle-bin-header">
          <div className="recycle-bin-title">
            <h1>Recycle Bin</h1>
            <p>Recover soft-deleted expenditures and investment trades with ledger balance and bridge re-establishment</p>
          </div>
          <Link to="/settings" className="fs-btn fs-btn-secondary recycle-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Settings
          </Link>
        </div>

        {/* APG Tabs */}
        <div
          className="fs-tabs recycle-bin-tabs"
          role="tablist"
          aria-label="Recycle bin categories"
          aria-orientation="horizontal"
        >
          <button
            ref={(el) => { tabRefs.current[0] = el; }}
            id="recycle-tab-expenditures"
            type="button"
            role="tab"
            aria-selected={activeTab === 'expenditures'}
            aria-controls="recycle-panel-deleted-items"
            tabIndex={activeTab === 'expenditures' ? 0 : -1}
            className={`fs-tab recycle-tab-btn ${activeTab === 'expenditures' ? 'fs-tab--active active' : ''}`}
            onClick={() => handleTabChange('expenditures')}
            onKeyDown={(e) => handleTabKeyDown(e, 0)}
            data-testid="tab-expenditures"
          >
            <FaReceipt aria-hidden="true" />
            <span>Deleted Expenditures {activeTab === 'expenditures' && `(${totalItems})`}</span>
          </button>
          <button
            ref={(el) => { tabRefs.current[1] = el; }}
            id="recycle-tab-trades"
            type="button"
            role="tab"
            aria-selected={activeTab === 'trades'}
            aria-controls="recycle-panel-deleted-items"
            tabIndex={activeTab === 'trades' ? 0 : -1}
            className={`fs-tab recycle-tab-btn ${activeTab === 'trades' ? 'fs-tab--active active' : ''}`}
            onClick={() => handleTabChange('trades')}
            onKeyDown={(e) => handleTabKeyDown(e, 1)}
            data-testid="tab-trades"
          >
            <FaChartLine aria-hidden="true" />
            <span>Deleted Trades {activeTab === 'trades' && `(${totalItems})`}</span>
          </button>
        </div>

        {/* Content Panel */}
        <div
          id="recycle-panel-deleted-items"
          role="tabpanel"
          aria-labelledby={activeTabId}
          className="recycle-bin-table-wrapper"
        >
          {isLoading ? (
            <div className="recycle-bin-loading">
              <Loading variant="table" rows={5} text="Loading soft-deleted records..." />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              className="recycle-bin-empty"
              data-testid="empty-recycle-bin"
              icon={<FaTrashAlt aria-hidden="true" />}
              title="Recycle Bin is empty"
              description={`No deleted ${activeTab} found. Deleted items will be listed here and can be restored at any time.`}
            />
          ) : isMobile ? (
            <div className="recycle-mobile-cards" data-testid="recycle-mobile-cards">
              {items.map((item) => {
                const isExpanded = expandedIds.has(item._id);
                const itemLabel = activeTab === 'expenditures'
                  ? (item.description || item.categories?.[0] || 'Expenditure')
                  : `${item.stockCode || '-'} (${item.type})`;
                const itemAmount = activeTab === 'expenditures'
                  ? formatCurrency(item.transactionValue || 0)
                  : formatCurrency(item.totalValue || 0);

                return (
                  <div
                    key={item._id}
                    className="recycle-mobile-card"
                    data-testid={`deleted-row-${item._id}`}
                  >
                    <div className="recycle-mobile-summary">
                      <div className="recycle-mobile-primary">
                        <span className="recycle-mobile-title">{itemLabel}</span>
                        <span className="recycle-mobile-amount recycle-num-cell fs-num">{itemAmount}</span>
                      </div>
                      <button
                        type="button"
                        className="fs-btn fs-btn-secondary fs-btn-sm recycle-expand-btn"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Hide details for ${itemLabel}` : `Show details for ${itemLabel}`}
                        onClick={() => toggleExpand(item._id)}
                      >
                        {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="recycle-mobile-details">
                        <div className="recycle-mobile-kv">
                          <span className="recycle-mobile-k">Date</span>
                          <span className="recycle-mobile-v recycle-num-cell fs-num">{formatDate(item.date)}</span>
                        </div>
                        {activeTab === 'expenditures' ? (
                          <div className="recycle-mobile-kv">
                            <span className="recycle-mobile-k">Payment Account</span>
                            <span className="recycle-mobile-v">{item.paymentMethod || 'Bank'}</span>
                          </div>
                        ) : (
                          <div className="recycle-mobile-kv">
                            <span className="recycle-mobile-k">Broker</span>
                            <span className="recycle-mobile-v">{item.broker || 'Thndr'}</span>
                          </div>
                        )}
                        <div className="recycle-mobile-kv">
                          <span className="recycle-mobile-k">Deleted At</span>
                          <span className="recycle-mobile-v recycle-num-cell fs-num">
                            {item.deletedAt ? formatDate(item.deletedAt) : '-'}
                          </span>
                        </div>
                        <div className="recycle-mobile-actions">
                          <ProtectedAction>
                            <button
                              type="button"
                              className="fs-btn fs-btn-secondary fs-btn-sm btn-restore"
                              onClick={() => setRestoringItem(item)}
                              data-testid={`restore-btn-${item._id}`}
                            >
                              <FaTrashRestore aria-hidden="true" /> Restore
                            </button>
                          </ProtectedAction>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="fs-table recycle-bin-table" data-testid="deleted-items-table">
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
                    <td className="recycle-num-cell fs-num">{formatDate(item.date)}</td>
                    {activeTab === 'expenditures' ? (
                      <>
                        <td>{item.description || item.categories?.[0] || 'Expenditure'}</td>
                        <td className="recycle-num-cell fs-num">{formatCurrency(item.transactionValue || 0)}</td>
                        <td>{item.paymentMethod || 'Bank'}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.type}</td>
                        <td>{item.stockCode || '-'}</td>
                        <td>{item.broker || 'Thndr'}</td>
                        <td className="recycle-num-cell fs-num">{formatCurrency(item.totalValue || 0)}</td>
                      </>
                    )}
                    <td className="recycle-num-cell fs-num">{item.deletedAt ? formatDate(item.deletedAt) : '-'}</td>
                    <td>
                      <ProtectedAction>
                        <button
                          type="button"
                          className="fs-btn fs-btn-secondary fs-btn-sm btn-restore"
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
          <div className="recycle-pagination-wrap">
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </div>

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
