// frontend/src/pages/trades/TradeLogPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTrades, deleteTrade } from '../../services/tradeService';
import apiClient from '../../services/apiClient';
import { BASE_API_URL } from '../../config/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { sortData, getNextSortConfig } from '../../utils/helper';
import { FaEdit, FaTrash, FaPlus, FaBolt } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import DebouncedSearchInput from '../../components/common/DebouncedSearchInput';
import UndoToast from '../../components/common/UndoToast';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../../components/ui';
import '../../components/Table.css';
import './Trades.css';

const TradeLogPage = () => {
  const { showToast } = useToast();
  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brokerFilter, setBrokerFilter] = useState(null); // null, 'Thndr', 'EFG'
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTradeId, setDeletingTradeId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedUndoItem, setDeletedUndoItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  const loadTrades = useCallback((page, broker, search) => {
    setIsLoading(true);
    getTrades(page, broker, search)
      .then(data => {
        const tradeList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setTrades(tradeList);
        setTotalPages(data?.totalPages || 1);
      })
      .catch(err => {
        console.error("Failed to load trades:", err);
        setTrades([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const page = Number(currentPage);
    if (!Number.isFinite(page) || page < 1) {
      setCurrentPage(1);
      return;
    }
    loadTrades(currentPage, brokerFilter, searchTerm);
  }, [currentPage, brokerFilter, searchTerm, loadTrades]);

  const handleDeleteClick = (id) => {
    setDeletingTradeId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTradeId) return;
    const targetId = deletingTradeId;
    const targetTrade = trades.find((t) => t._id === targetId);
    setIsDeleting(true);
    try {
      await deleteTrade(targetId);
      setDeletingTradeId(null);
      loadTrades(currentPage, brokerFilter, searchTerm);
      setDeletedUndoItem({
        id: targetId,
        message: targetTrade ? `Deleted trade "${targetTrade.stockCode || targetTrade.type}"` : 'Trade deleted',
      });
    } catch (err) {
      console.error("Failed to delete trade:", err);
      showToast(err.response?.data?.message || 'Failed to delete trade.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedUndoItem) return;
    try {
      await apiClient.post(`${BASE_API_URL}/trades/${deletedUndoItem.id}/restore`);
      showToast('Trade restored successfully', 'success');
      loadTrades(currentPage, brokerFilter, searchTerm);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore trade.', 'error');
    }
  };

  const handlePageChange = (page) => {
    const num = Number(page);
    if (Number.isFinite(num) && num > 0) {
      setCurrentPage(num);
    }
  };

  const handleFilterClick = (broker) => {
    setBrokerFilter(broker);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = useCallback((val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  }, []);

  const getSortValue = useCallback((item, key) => {
    switch (key) {
      case 'date':
        return new Date(item.date || 0).getTime();
      case 'type':
        return (item.type || '').toLowerCase();
      case 'stockCode':
        return (item.stockCode || '').toLowerCase();
      case 'shares':
        return Number(item.shares) || 0;
      case 'price':
        return Number(item.price) || 0;
      case 'fees':
        return Number(item.fees) || 0;
      case 'totalValue':
        return Number(item.totalValue) || 0;
      default:
        return '';
    }
  }, []);

  const sortedTrades = useMemo(() => {
    return sortData(trades, sortConfig, getSortValue);
  }, [trades, sortConfig, getSortValue]);

  const handleSort = (key) => {
    setSortConfig(prev => getNextSortConfig(prev, key));
  };

  return (
    <div className="page-container trade-log-page">
      <div className="page-header trade-log-header">
        <div>
          <h1>Stock Trade Log</h1>
          <p className="trade-log-subtitle">
            Historical trade logs, purchases, sales, cash deposits, and dividends.
          </p>
        </div>
        <div className="page-header-actions trade-log-header-actions">
          <Link
            to="/corporate-actions"
            className="btn btn-secondary"
            title="View & apply corporate actions (stock splits and bonus shares)"
          >
            <FaBolt size={13} className="icon-warning" /> Corporate Actions
          </Link>
          <ProtectedAction tooltip="View-only access">
            <Link
              to="/trades/add"
              className="btn fs-btn-primary"
              title="Record a new trade or cash transaction"
            >
              <FaPlus size={13} /> Add Trade
            </Link>
          </ProtectedAction>
        </div>
      </div>

      <div className="filter-controls">
        <button type="button" onClick={() => handleFilterClick(null)} className={!brokerFilter ? 'active' : ''}>All Brokers</button>
        <button type="button" onClick={() => handleFilterClick('Thndr')} className={brokerFilter === 'Thndr' ? 'active' : ''}>Thndr</button>
        <button type="button" onClick={() => handleFilterClick('EFG')} className={brokerFilter === 'EFG' ? 'active' : ''}>EFG</button>
        <button type="button" onClick={() => handleFilterClick('Telda')} className={brokerFilter === 'Telda' ? 'active' : ''}>Telda</button>
        <button type="button" onClick={() => handleFilterClick('TopUp')} className={brokerFilter === 'TopUp' ? 'active' : ''}>Top Ups</button>
        <DebouncedSearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search Stock Code..."
          className="search-input"
          ariaLabel="Search Stock Code"
        />
      </div>

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th className={`sortable ${sortConfig.key === 'date' ? 'active-sort' : ''}`} onClick={() => handleSort('date')}>
                Date {sortConfig.key === 'date' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'type' ? 'active-sort' : ''}`} onClick={() => handleSort('type')}>
                Type {sortConfig.key === 'type' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'stockCode' ? 'active-sort' : ''}`} onClick={() => handleSort('stockCode')}>
                Stock {sortConfig.key === 'stockCode' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'shares' ? 'active-sort' : ''}`} onClick={() => handleSort('shares')}>
                Shares {sortConfig.key === 'shares' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'price' ? 'active-sort' : ''}`} onClick={() => handleSort('price')}>
                Price {sortConfig.key === 'price' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'fees' ? 'active-sort' : ''}`} onClick={() => handleSort('fees')}>
                Fees {sortConfig.key === 'fees' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th className={`sortable ${sortConfig.key === 'totalValue' ? 'active-sort' : ''}`} onClick={() => handleSort('totalValue')}>
                Total Value {sortConfig.key === 'totalValue' && <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  <Loading variant="table" rows={6} />
                </td>
              </tr>
            ) : sortedTrades.length === 0 ? (
              <tr>
                <td colSpan="8" className="table-empty-cell">
                  No stock trade records found. Click <strong>Add Trade</strong> to record a transaction.
                </td>
              </tr>
            ) : (
              sortedTrades.map(trade => {
                const tradeType = trade.type || 'Buy';
                return (
                  <tr key={trade._id} className="trade-card">
                    <td data-label="Date">{formatDate(trade.date)}</td>
                    <td data-label="Type" className={`trade-type-${tradeType.toLowerCase()}`}>{tradeType}</td>
                    <td data-label="Code">{trade.stockCode || '-'}</td>
                    <td data-label="Shares" className="fs-num">{trade.shares ?? '-'}</td>
                    <td data-label="Price" className="fs-num">{trade.price ? formatCurrency(trade.price) : '-'}</td>
                    <td data-label="Fees" className="fs-num">{formatCurrency(trade.fees || 0)}</td>
                    <td data-label="Value" className="total-value fs-num">{formatCurrency(trade.totalValue || 0)}</td>
                    <td data-label="Actions" className="action-cell">
                      <ProtectedAction tooltip="View-only access">
                        <Link to={`/trades/edit/${trade._id}`} title="Edit trade"><FaEdit className="action-icon edit-icon" /></Link>
                      </ProtectedAction>
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(trade._id)}
                          className="action-btn-delete"
                          title="Delete trade"
                          aria-label="Delete trade"
                        >
                          <FaTrash className="action-icon delete-icon" />
                        </button>
                      </ProtectedAction>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      <ConfirmModal
        isOpen={Boolean(deletingTradeId)}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This will permanently remove the trade and update your portfolio calculations."
        confirmText="Delete Trade"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setDeletingTradeId(null)}
      />

      <UndoToast
        isOpen={Boolean(deletedUndoItem)}
        message={deletedUndoItem?.message || 'Trade deleted'}
        duration={10}
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedUndoItem(null)}
      />
    </div>
  );
};

export default TradeLogPage;
