// frontend/src/pages/expenditure/ExpenditureLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExpenditures, deleteExpenditure } from '../../services/expenditureService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import '../../components/Table.css'; // Reuse table styles
import './Expenditure.css'; // Load expenditure styles
import PaginationControls from '../../components/PaginationControls';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';

const transactionTypeMap = {
  W: 'Withdraw',
  T: 'Topup',
  S: 'Saving',
  na: 'Log',
  Prepaid: 'Prepaid',
  Bank: 'Bank',
  Cash: 'Cash'
};

const ExpenditureLogPage = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [processedExpenditures, setProcessedExpenditures] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadExpenditures = useCallback((page, selectedType) => {
    getExpenditures(page, 25, selectedType).then(response => {
      setExpenditures(response.data); // The data is now in a 'data' property
      setTotalPages(response.totalPages);
    });
  }, []);

  useEffect(() => {
    loadExpenditures(currentPage, selectedType);
  }, [currentPage, selectedType, loadExpenditures]);

  useEffect(() => {
    if (expenditures.length === 0) {
      setProcessedExpenditures([]);
      return;
    }

    const sortedByTimestamp = [...expenditures].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setProcessedExpenditures(sortedByTimestamp.reverse());
  }, [expenditures]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      await deleteExpenditure(id);
      loadExpenditures();
    }
  };

  const handleFilterChange = (type) => {
    setSelectedType(type);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const getFilterButtonStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    border: isActive ? '2px solid #3b82f6' : '1px solid #d1d5db',
    borderRadius: '20px',
    backgroundColor: isActive ? '#eff6ff' : 'white',
    color: isActive ? '#1e40af' : '#374151',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  const getCategoryFilterButtonStyle = (isActive, catColor) => ({
    padding: '0.5rem 1rem',
    border: isActive ? `2px solid ${catColor}` : '1px solid #d1d5db',
    borderRadius: '20px',
    backgroundColor: isActive ? catColor : 'white',
    color: isActive ? 'white' : '#374151',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  // Calculate the 'Transaction' value on the frontend
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenditure Log</h1>
      </div>

      {/* Filter Section */}
      <div className="filter-section" style={{ marginBottom: '2rem' }}>
        <div className="tax-card animate-fade-in">
          <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔍</span> Filter Expenditures
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#4b5563', fontSize: '0.95rem', fontWeight: '600' }}>By Action / Account Type:</h4>
            <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleFilterChange('all')}
                style={getFilterButtonStyle(selectedType === 'all')}
              >
                All Actions
              </button>
              {Object.keys(transactionTypeMap).map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
                  style={getFilterButtonStyle(selectedType === type)}
                >
                  {transactionTypeMap[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#4b5563', fontSize: '0.95rem', fontWeight: '600' }}>By Category:</h4>
            <div className="filter-buttons" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {EXPENDITURE_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleFilterChange(cat.name)}
                  style={getCategoryFilterButtonStyle(selectedType === cat.name, cat.color)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {selectedType !== 'all' && (
            <div style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#4b5563'
            }}>
              📅 Showing Expenditures filtered by: <strong>{transactionTypeMap[selectedType] || selectedType}</strong>
            </div>
          )}
        </div>
      </div>
      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Date</th>
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
            {processedExpenditures.map(log => (
              <tr key={log._id}>
                <td data-label="Date">{formatDate(log.date)}</td>
                <td data-label="Bank">{formatCurrency(log.bank)}</td>
                <td data-label="Cash">{formatCurrency(log.cash)}</td>
                <td data-label="Prepaid">{formatCurrency(log.prepaid || 0)}</td>
                <td data-label="Transaction" style={{
                  color: log.transactionType === 'W' ? 'red' :
                    log.transactionType === 'S' ? 'rgba(194, 139, 0, 0.9)' :
                      log.transactionType === 'T' ? 'green' : 'gray'
                }}>
                  <strong>{formatCurrency(log.transactionValue)}</strong>
                </td>
                <td data-label="Type">{transactionTypeMap[log.transactionType] || log.transactionType}</td>
                <td data-label="Categories">
                  <div className="category-badges-list">
                    {(log.categories && log.categories.length > 0 ? log.categories : ['Other']).map(catName => {
                      const catConfig = EXPENDITURE_CATEGORIES.find(c => c.name === catName) || { color: '#6B7280' };
                      return (
                        <span
                          key={catName}
                          className="category-badge"
                          style={{ backgroundColor: catConfig.color }}
                        >
                          {catName}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td data-label="Description" style={{ fontSize: '0.9rem', color: '#4b5563', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.description}>
                  {log.description || '-'}
                </td>
                <td data-label="Action" className="action-cell">
                  <Link to={`/expenditures/edit/${log._id}`}><FaPencilAlt className="action-icon edit-icon" /></Link>
                  <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(log._id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ExpenditureLogPage;
