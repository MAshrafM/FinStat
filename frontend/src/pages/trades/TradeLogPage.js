// frontend/src/pages/trades/TradeLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTrades, deleteTrade } from '../../services/tradeService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash, FaPlus, FaBolt } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import DebouncedSearchInput from '../../components/common/DebouncedSearchInput';
import { useToast } from '../../context/ToastContext';
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
    setIsDeleting(true);
    try {
      await deleteTrade(deletingTradeId);
      showToast('Trade deleted successfully', 'success');
      setDeletingTradeId(null);
      loadTrades(currentPage, brokerFilter, searchTerm);
    } catch (err) {
      console.error("Failed to delete trade:", err);
      showToast(err.response?.data?.message || 'Failed to delete trade.', 'error');
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Stock Trade Log</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
            Historical trade logs, purchases, sales, cash deposits, and dividends.
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/corporate-actions"
            className="btn btn-secondary"
            title="View & apply corporate actions (stock splits and bonus shares)"
          >
            <FaBolt size={13} color="#f59e0b" /> Corporate Actions
          </Link>
          <ProtectedAction tooltip="View-only access">
            <Link
              to="/trades/new"
              className="btn btn-primary"
              title="Record a new trade or cash transaction"
            >
              <FaPlus size={13} /> Add Trade
            </Link>
          </ProtectedAction>
        </div>
      </div>

      <div className="filter-controls">
        <button onClick={() => handleFilterClick(null)} className={!brokerFilter ? 'active' : ''}>All Brokers</button>
        <button onClick={() => handleFilterClick('Thndr')} className={brokerFilter === 'Thndr' ? 'active' : ''}>Thndr</button>
        <button onClick={() => handleFilterClick('EFG')} className={brokerFilter === 'EFG' ? 'active' : ''}>EFG</button>
        <button onClick={() => handleFilterClick('Telda')} className={brokerFilter === 'Telda' ? 'active' : ''}>Telda</button>
        <button onClick={() => handleFilterClick('TopUp')} className={brokerFilter === 'TopUp' ? 'active' : ''}>Top Ups</button>
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
              <th>Date</th>
              <th>Type</th>
              <th>Stock</th>
              <th>Shares</th>
              <th>Price</th>
              <th>Fees</th>
              <th>Total Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Loading trades...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No stock trade records found. Click <strong>Add Trade</strong> to record a transaction.
                </td>
              </tr>
            ) : (
              trades.map(trade => {
                const tradeType = trade.type || 'Buy';
                return (
                  <tr key={trade._id}>
                    <td data-label="Date">{formatDate(trade.date)}</td>
                    <td data-label="Type" className={`trade-type-${tradeType.toLowerCase()}`}>{tradeType}</td>
                    <td data-label="Code">{trade.stockCode || '-'}</td>
                    <td data-label="Shares">{trade.shares ?? '-'}</td>
                    <td data-label="Price">{trade.price ? formatCurrency(trade.price) : '-'}</td>
                    <td data-label="Fees">{formatCurrency(trade.fees || 0)}</td>
                    <td data-label="Value" className="total-value">{formatCurrency(trade.totalValue || 0)}</td>
                    <td data-label="Actions" className="action-cell">
                      <ProtectedAction tooltip="View-only access">
                        <Link to={`/trades/edit/${trade._id}`}><FaEdit className="action-icon edit-icon" /></Link>
                      </ProtectedAction>
                      <ProtectedAction tooltip="View-only access">
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(trade._id)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          title="Delete trade"
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
    </div>
  );
};

export default TradeLogPage;
