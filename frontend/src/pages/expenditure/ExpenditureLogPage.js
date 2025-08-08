// frontend/src/pages/expenditure/ExpenditureLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExpenditures, deleteExpenditure } from '../../services/expenditureService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';
import '../../components/Table.css'; // Reuse table styles
import PaginationControls from '../../components/PaginationControls';

const transactionTypeMap = {
  W: 'Withdraw',
  T: 'Topup',
  S: 'Saving',
  na: 'Log',
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

    const handleYearFilter = (type) => {
        setSelectedType(type);
        setCurrentPage(1); // Reset to first page when changing filter
    };

  // Calculate the 'Transaction' value on the frontend
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenditure Log</h1>
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
                          onClick={() => handleYearFilter('all')}
                          style={{
                              padding: '0.5rem 1rem',
                              border: selectedType === 'all' ? '2px solid #3b82f6' : '1px solid #d1d5db',
                              borderRadius: '6px',
                              backgroundColor: selectedType === 'all' ? '#eff6ff' : 'white',
                              color: selectedType === 'all' ? '#1e40af' : '#374151',
                              cursor: 'pointer',
                              fontWeight: selectedType === 'all' ? '600' : '400'
                          }}
                      >
                          All Types
                      </button>
                      {Object.keys(transactionTypeMap).map(type => (
                          <button
                              key={type}
                              onClick={() => handleYearFilter(type)}
                              style={{
                                  padding: '0.5rem 1rem',
                                  border: selectedType === type ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  backgroundColor: selectedType === type ? '#eff6ff' : 'white',
                                  color: selectedType === type ? '#1e40af' : '#374151',
                                  cursor: 'pointer',
                                  fontWeight: selectedType === type ? '600' : '400'
                              }}
                          >
                              {transactionTypeMap[type]}
                          </button>
                      ))}
                  </div>
                  {selectedType !== 'all' && (
                      <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          color: '#4b5563'
                      }}>
                          📅 Showing Expenditures for {transactionTypeMap[selectedType]} only
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
              <th>Transaction</th>
              <th>Type</th>
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
                <td data-label="Transaction" style={{ 
                  color: log.transactionType === 'W' ? 'red' : 
                        log.transactionType === 'S' ? 'rgba(194, 139, 0, 0.9)' : 
                        log.transactionType === 'T' ? 'green' :  'gray' 
                }}>
                  <strong>{formatCurrency(log.transactionValue)}</strong>
                </td>
                <td data-label="Type">{transactionTypeMap[log.transactionType] || log.transactionType}</td>
                <td data-label="Description">{log.description}</td>
                <td  data-label="Action" className="action-cell">
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
