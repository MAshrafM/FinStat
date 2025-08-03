// frontend/src/pages/mutual-funds/MutualFundLogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMutualFundTrades, deleteTrade } from '../../services/mutualFundService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import '../trades/Trades.css'; // Reuse the same CSS as the stock trades page

const MutualFundLogPage = () => {
    const [trades, setTrades] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectType, setSelectType] = useState('all'); // For future filtering by type]
    const types = ['Buy', 'Sell', 'Coupon'];
    const loadTrades = (page, selectType) => {
        getMutualFundTrades(page, selectType)
            .then(data => {
                setTrades(data.data);
                setTotalPages(data.totalPages);
                setCurrentPage(data.currentPage);
            })
            .catch(err => console.error("Failed to load mutual fund trades:", err));
    };

    useEffect(() => {
        loadTrades(currentPage, selectType);
    }, [currentPage, selectType]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                await deleteTrade(id);
                loadTrades(currentPage, selectType); // Refresh the list
            } catch (err) {
                console.error("Failed to delete transaction:", err);
                alert('Failed to delete transaction.');
            }
        }
    };

    const handleTypeFilter = (type) => {
        setSelectType(type);
        setCurrentPage(1); // Reset to first page when changing filter
    };
    

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Mutual Fund Log</h1>
                <Link to="/mutual-funds/new" className="action-button">Add New Transaction</Link>
            </div>

            {/* Filter Section */}
          <div className="filter-section" style={{ marginBottom: '2rem' }}>
              <div className="tax-card">
                  <h3>🔍 Filter by Type</h3>
                  <div className="filter-buttons" style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                  }}>
                      <button
                          onClick={() => handleTypeFilter('all')}
                          style={{
                              padding: '0.5rem 1rem',
                              border: selectType === 'all' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: selectType === 'all' ? '#eff6ff' : 'white',
                              color: selectType === 'all' ? '#1e40af' : '#374151',
                              cursor: 'pointer',
                              fontWeight: selectType === 'all' ? '600' : '400'
                          }}
                      >
                          All Types
                      </button>
                      {types.map(type => (
                          <button
                              key={type}
                              onClick={() => handleTypeFilter(type)}
                              style={{
                                  padding: '0.5rem 1rem',
                                  border: selectType === type ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  backgroundColor: selectType === type ? '#eff6ff' : 'white',
                                  color: selectType === type ? '#1e40af' : '#374151',
                                  cursor: 'pointer',
                                  fontWeight: selectType === type ? '600' : '400'
                              }}
                          >
                              {type}
                          </button>
                      ))}
                  </div>
                  {selectType !== 'all' && (
                      <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          color: '#4b5563'
                      }}>
                          📅 Showing MF for {selectType} only
                      </div>
                  )}
              </div>
          </div>
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name / Code</th>
                            <th>Type</th>
                            <th>Units</th>
                            <th>Price</th>
                            <th>Fees</th>
                            <th>Total Value</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <tr key={trade._id}>
                                <td>{formatDate(trade.date)}</td>
                                <td>
                                    <p style={{ fontWeight: 'bold' }}>{trade.code}</p>
                                    <p className="broker">{trade.name}</p>
                                </td>
                                <td className={`trade-type-${trade.type.toLowerCase()}`}>{trade.type}</td>
                                <td>{trade.units || 'N/A'}</td>
                                <td>{trade.price ? formatCurrency(trade.price) : 'N/A'}</td>
                                <td>{formatCurrency(trade.fees)}</td>
                                <td className="total-value">{formatCurrency(trade.totalValue)}</td>
                                <td className="action-icons">
                                    <Link className="action-icon edit-icon" to={`/mutual-funds/edit/${trade._id}`}><FaEdit /></Link>
                                    <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(trade._id)} style={{ cursor: 'pointer', color: '#c0392b' }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
};

export default MutualFundLogPage;
