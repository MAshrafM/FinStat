// frontend/src/pages/mutual-funds/MutualFundLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
} from 'react-icons/fa';
import { getMutualFundTrades, deleteTrade } from '../../services/mutualFundService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import PaginationControls from '../../components/PaginationControls';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useCanModify } from '../../context/AuthContext';
import { Badge } from '../../components/ui';
import Loading from '../../components/ui/Loading';
import './MutualFunds.css';

const TRANSACTION_TYPES = ['Buy', 'Sell', 'Coupon'];

const MutualFundLogPage = () => {
  const { canModify } = useCanModify();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectType, setSelectType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  const loadTrades = useCallback((page, type) => {
    setIsLoading(true);
    setLoadError(null);

    return getMutualFundTrades(page, type)
      .then((data) => {
        setTrades(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.totalPages || 1);
        setCurrentPage(data?.currentPage || page || 1);
      })
      .catch((err) => {
        console.error('Failed to load mutual fund trades:', err);
        setTrades([]);
        setLoadError('Failed to load mutual fund transactions.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTrades(currentPage, selectType);
  }, [loadTrades, currentPage, selectType]);

  const handlePageChange = (page) => {
    const num = Number(page);
    if (Number.isFinite(num) && num > 0) {
      setCurrentPage(num);
    }
  };

  const handleTypeFilter = (type) => {
    setSelectType(type);
    setCurrentPage(1);
  };

  const handleDelete = (id) => {
    if (!canModify) return;
    setTradeToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!tradeToDelete) return;
    try {
      await deleteTrade(tradeToDelete);
      if (notify) notify('Mutual fund transaction deleted', 'success');
      setTradeToDelete(null);
      loadTrades(currentPage, selectType);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      if (notify) notify('Failed to delete transaction', 'error');
    }
  };

  const toggleCardExpand = (id) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="page-container mf-page-container mf-log-page">
      <div className="mf-header">
        <div className="mf-header-title-group">
          <p className="mf-breadcrumb">Mutual Funds &gt; Transaction Log</p>
          <h1>Mutual Fund Log</h1>
        </div>
        <div className="mf-header-actions">
          <ProtectedAction tooltip="View-only access">
            <Link to="/mutual-funds/new" className="fs-btn fs-btn-primary">
              <FaPlus aria-hidden="true" /> Add Fund Trade
            </Link>
          </ProtectedAction>
        </div>
      </div>

      <div className="mf-filter-card">
        <span className="mf-filter-title">Filter by Type</span>
        <div className="mf-filter-buttons">
          <button
            type="button"
            className={`mf-filter-btn ${selectType === 'all' ? 'is-active' : ''}`}
            aria-pressed={selectType === 'all'}
            onClick={() => handleTypeFilter('all')}
          >
            All Types
          </button>
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`mf-filter-btn ${selectType === type ? 'is-active' : ''}`}
              aria-pressed={selectType === type}
              onClick={() => handleTypeFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
        {selectType !== 'all' && (
          <div className="mf-filter-active-note" role="status">
            Showing {selectType} transactions only
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mf-loading-wrap">
          <Loading variant="table" text="Loading mutual fund transactions..." rows={4} />
        </div>
      ) : loadError ? (
        <div className="mf-error-card" role="alert">
          <h2>Unable to load transactions</h2>
          <p>{loadError}</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="mf-empty-card" role="status">
          <div className="mf-empty-icon" aria-hidden="true">
            <FaClipboardList />
          </div>
          <h2>No mutual fund transactions</h2>
          <p>Record your first fund purchase, sale, or coupon to see it here.</p>
        </div>
      ) : (
        <>
          <div className="mf-desktop-table">
            <div
              className="mf-table-wrap"
              role="region"
              aria-label="Mutual fund transactions table"
              tabIndex={0}
            >
              <table className="mf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name / Code</th>
                    <th>Type</th>
                    <th className="mf-th-num">Units</th>
                    <th className="mf-th-num">Price</th>
                    <th className="mf-th-num">Fees</th>
                    <th className="mf-th-num">Total Value</th>
                    <th className="mf-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade._id}>
                      <td data-label="Date">{formatDate(trade.date)}</td>
                      <td data-label="Code">
                        <span className="mf-fund-cell">
                          <span className="mf-fund-name">{trade.name}</span>
                          <span className="mf-fund-code fs-code">{trade.code}</span>
                        </span>
                      </td>
                      <td data-label="Type">
                        <Badge label={trade.type} />
                      </td>
                      <td data-label="Units" className="fs-num">
                        {trade.units || 'N/A'}
                      </td>
                      <td data-label="Price" className="fs-num">
                        {trade.price ? formatCurrency(trade.price) : 'N/A'}
                      </td>
                      <td data-label="Fees" className="fs-num">
                        {formatCurrency(trade.fees)}
                      </td>
                      <td data-label="Value" className="fs-num">
                        {formatCurrency(trade.totalValue)}
                      </td>
                      <td data-label="Actions" className="mf-cell-actions">
                        <ProtectedAction tooltip="View-only access">
                          <Link
                            className="mf-icon-btn"
                            to={`/mutual-funds/edit/${trade._id}`}
                            title="Edit transaction"
                            aria-label={`Edit transaction for ${trade.code}`}
                          >
                            <FaEdit aria-hidden="true" />
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            className="mf-icon-btn mf-icon-btn-danger"
                            title="Delete transaction"
                            aria-label={`Delete transaction for ${trade.code}`}
                            onClick={() => handleDelete(trade._id)}
                          >
                            <FaTrash aria-hidden="true" />
                          </button>
                        </ProtectedAction>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mf-mobile-cards" data-testid="mf-mobile-card-list">
            {trades.map((trade) => {
              const isExpanded = expandedCardIds.has(trade._id);
              return (
                <article key={trade._id} className="mf-mobile-card">
                  <div className="mf-card-compact-row">
                    <div className="mf-card-primary">
                      <span className="mf-card-name">{trade.name}</span>
                      <span className="mf-fund-code fs-code">{trade.code}</span>
                    </div>
                    <div className="mf-card-metrics">
                      <span className="mf-card-value fs-num">
                        {formatCurrency(trade.totalValue || 0)}
                      </span>
                      <Badge label={trade.type} />
                    </div>
                    <button
                      type="button"
                      className="mf-card-expander-btn"
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded
                          ? 'Collapse transaction details'
                          : 'Expand transaction details'
                      }
                      onClick={() => toggleCardExpand(trade._id)}
                    >
                      {isExpanded ? (
                        <FaChevronUp aria-hidden="true" />
                      ) : (
                        <FaChevronDown aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mf-card-expanded">
                      <div className="mf-card-detail-item">
                        <span className="mf-card-detail-label">Date</span>
                        <span className="mf-card-detail-val">{formatDate(trade.date)}</span>
                      </div>
                      <div className="mf-card-detail-item">
                        <span className="mf-card-detail-label">Units</span>
                        <span className="mf-card-detail-val fs-num">{trade.units || 'N/A'}</span>
                      </div>
                      <div className="mf-card-detail-item">
                        <span className="mf-card-detail-label">Price</span>
                        <span className="mf-card-detail-val fs-num">
                          {trade.price ? formatCurrency(trade.price) : 'N/A'}
                        </span>
                      </div>
                      <div className="mf-card-detail-item">
                        <span className="mf-card-detail-label">Fees</span>
                        <span className="mf-card-detail-val fs-num">
                          {formatCurrency(trade.fees)}
                        </span>
                      </div>
                      <div className="mf-card-actions">
                        <ProtectedAction tooltip="View-only access">
                          <Link
                            className="fs-btn fs-btn-secondary"
                            to={`/mutual-funds/edit/${trade._id}`}
                            aria-label={`Edit transaction for ${trade.code}`}
                          >
                            <FaEdit aria-hidden="true" /> Edit
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            className="mf-icon-btn mf-icon-btn-danger"
                            aria-label={`Delete transaction for ${trade.code}`}
                            onClick={() => handleDelete(trade._id)}
                          >
                            <FaTrash aria-hidden="true" /> Delete
                          </button>
                        </ProtectedAction>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <ConfirmModal
        isOpen={Boolean(tradeToDelete)}
        title="Delete Mutual Fund Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTradeToDelete(null)}
      />
    </div>
  );
};

export default MutualFundLogPage;
