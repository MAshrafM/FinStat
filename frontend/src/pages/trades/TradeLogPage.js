// frontend/src/pages/trades/TradeLogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrades, deleteTrade } from '../../services/tradeService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import './Trades.css'; // We will create this CSS file

const TradeLogPage = () => {
  const [trades, setTrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brokerFilter, setBrokerFilter] = useState(null); // null, 'Thndr', 'EFG'
  const [searchTerm, setSearchTerm] = useState('');

  const loadTrades = (page, broker, search) => {
    getTrades(page, broker, search)
      .then(data => {
        setTrades(data.data || []);
        setTotalPages(data.totalPages || 1);
        //setCurrentPage(data.page || 1);
      })
      .catch(err => console.error("Failed to load trades:", err));
  };

  useEffect(() => {
    const page = Number(currentPage);
    if (!Number.isFinite(page) || page < 1) {
      setCurrentPage(1);
      return
    }
    loadTrades(currentPage, brokerFilter, searchTerm);
  }, [currentPage, brokerFilter, searchTerm]);

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
        <button onClick={() => handleFilterClick('TopUp')}>Top Ups</button>
        <input
          type="text"
          placeholder="Search Stock Code..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ marginLeft: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
            {trades.map(trade => (
              <tr key={trade._id}>
                <td data-label="Date">{formatDate(trade.date)}</td>
                <td data-label="Type" className={`trade-type-${trade.type.toLowerCase()}`}>{trade.type}</td>
                <td data-label="Code">{trade.stockCode || 'N/A'}</td>
                <td data-label="Shares">{trade.shares || 'N/A'}</td>
                <td data-label="Price">{trade.price ? formatCurrency(trade.price) : 'N/A'}</td>
                <td data-label="Fees">{formatCurrency(trade.fees)}</td>
                <td data-label="Value" className="total-value">{formatCurrency(trade.totalValue)}</td>
                <td data-label="Actions" className="action-icons">
                  <Link to={`/trades/edit/${trade._id}`}><FaEdit className="action-icon edit-icon" /></Link>
                  <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(trade._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default TradeLogPage;
