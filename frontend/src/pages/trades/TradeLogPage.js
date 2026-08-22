// frontend/src/pages/trades/TradeLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTrades, deleteTrade } from '../../services/tradeService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import '../../components/Table.css';
import './Trades.css';

const TradeLogPage = () => {
  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brokerFilter, setBrokerFilter] = useState(null); // null, 'Thndr', 'EFG'
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade(id);
        loadTrades(currentPage, brokerFilter, searchTerm); // Refresh the list
      } catch (err) {
        console.error("Failed to delete trade:", err);
        alert('Failed to delete trade.');
      }
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Stock Trade Log</h1>
      </div>

      <div className="filter-controls">
        <button onClick={() => handleFilterClick(null)} className={!brokerFilter ? 'active' : ''}>All Brokers</button>
        <button onClick={() => handleFilterClick('Thndr')} className={brokerFilter === 'Thndr' ? 'active' : ''}>Thndr</button>
        <button onClick={() => handleFilterClick('EFG')} className={brokerFilter === 'EFG' ? 'active' : ''}>EFG</button>
        <button onClick={() => handleFilterClick('Telda')} className={brokerFilter === 'Telda' ? 'active' : ''}>Telda</button>
        <button onClick={() => handleFilterClick('TopUp')} className={brokerFilter === 'TopUp' ? 'active' : ''}>Top Ups</button>
        <input
          type="text"
          placeholder="Search Stock Code..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
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
                      <Link to={`/trades/edit/${trade._id}`}><FaEdit className="action-icon edit-icon" /></Link>
                      <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(trade._id)} style={{ cursor: 'pointer' }} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default TradeLogPage;
