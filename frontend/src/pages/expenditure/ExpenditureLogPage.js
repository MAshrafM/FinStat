// frontend/src/pages/expenditure/ExpenditureLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExpenditures, deleteExpenditure, getLatestExpenditure } from '../../services/expenditureService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaPencilAlt, FaTrash, FaUniversity, FaMoneyBillWave, FaCreditCard, FaWallet } from 'react-icons/fa';
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
  const [isLoading, setIsLoading] = useState(true);
  const [latestHolding, setLatestHolding] = useState({ bank: 0, cash: 0, prepaid: 0 });

  const loadExpenditures = useCallback((page, typeFilter) => {
    setIsLoading(true);
    getExpenditures(page, 25, typeFilter)
      .then(response => {
        const list = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        setExpenditures(list);
        setTotalPages(response?.totalPages || 1);
      })
      .catch(err => {
        console.error('Failed to load expenditures:', err);
        setExpenditures([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const loadLatestHolding = useCallback(() => {
    getLatestExpenditure()
      .then(data => {
        if (data) {
          setLatestHolding({
            bank: data.runningBalances?.bank ?? data.bank ?? 0,
            cash: data.runningBalances?.cash ?? data.cash ?? 0,
            prepaid: data.runningBalances?.prepaid ?? data.prepaid ?? 0
          });
        }
      })
      .catch(err => console.error('Failed to load latest expenditure holding:', err));
  }, []);

  useEffect(() => {
    loadExpenditures(currentPage, selectedType);
    loadLatestHolding();
  }, [currentPage, selectedType, loadExpenditures, loadLatestHolding]);

  useEffect(() => {
    if (!Array.isArray(expenditures) || expenditures.length === 0) {
      setProcessedExpenditures([]);
      return;
    }

    const sortedByTimestamp = [...expenditures].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    setProcessedExpenditures(sortedByTimestamp);
  }, [expenditures]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await deleteExpenditure(id);
        loadExpenditures(currentPage, selectedType);
        loadLatestHolding();
      } catch (err) {
        console.error('Failed to delete expenditure:', err);
      }
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

  return (
    <div className="page-container">
      {/* Sub-navigation tabs */}
      <div className="rules-nav-tabs">
        <Link to="/expenditures" className="rules-nav-link active">
          Expenditure Log
        </Link>
        <Link to="/expenditures/rules" className="rules-nav-link">
          Auto-Categorization Rules
        </Link>
        <Link to="/expenditures/budgets" className="rules-nav-link">
          Budget Tracker
        </Link>
        <Link to="/expenditures/recurring" className="rules-nav-link">
          Recurring Detection
        </Link>
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Expenditure Log</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/expenditures/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Add Expenditure
          </Link>
        </div>
      </div>

      {/* Current Holdings Summary Card */}
      <div className="tax-card animate-fade-in" style={{ marginBottom: '2rem', padding: '1.5rem 2rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1f2937', fontSize: '1.2rem' }}>
          <FaWallet style={{ color: '#3b82f6' }} /> Current Holdings
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          alignItems: 'center'
        }}>
          {/* Bank */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#eff6ff',
            borderRadius: '10px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <FaUniversity style={{ fontSize: '1.8rem', color: '#2563eb' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>Bank</span>
              <strong style={{ fontSize: '1.35rem', color: '#1e40af' }}>{formatCurrency(latestHolding.bank || 0)}</strong>
            </div>
          </div>

          {/* Cash */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#ecfdf5',
            borderRadius: '10px',
            borderLeft: '4px solid #10b981'
          }}>
            <FaMoneyBillWave style={{ fontSize: '1.8rem', color: '#059669' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>Cash</span>
              <strong style={{ fontSize: '1.35rem', color: '#065f46' }}>{formatCurrency(latestHolding.cash || 0)}</strong>
            </div>
          </div>

          {/* Prepaid */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#fffbebfb',
            borderRadius: '10px',
            borderLeft: '4px solid #f59e0b'
          }}>
            <FaCreditCard style={{ fontSize: '1.8rem', color: '#d97706' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>Prepaid</span>
              <strong style={{ fontSize: '1.35rem', color: '#92400e' }}>{formatCurrency(latestHolding.prepaid || 0)}</strong>
            </div>
          </div>

          {/* Total Holding */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '10px',
            borderLeft: '4px solid #6b7280'
          }}>
            <FaWallet style={{ fontSize: '1.8rem', color: '#4b5563' }} />
            <div>
              <span style={{ display: 'block', fontSize: '0.85rem', color: '#4b5563', fontWeight: '500' }}>Total Holding</span>
              <strong style={{ fontSize: '1.35rem', color: '#111827' }}>
                {formatCurrency((latestHolding.bank || 0) + (latestHolding.cash || 0) + (latestHolding.prepaid || 0))}
              </strong>
            </div>
          </div>
        </div>
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
            {isLoading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Loading expenditures...
                </td>
              </tr>
            ) : processedExpenditures.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No expenditure records found. Click <strong>Add Expenditure</strong> to record a new transaction.
                </td>
              </tr>
            ) : (
              processedExpenditures.map(log => (
                <tr key={log._id}>
                  <td data-label="Date">{formatDate(log.date)}</td>
                  <td data-label="Bank">{formatCurrency(log.runningBalances?.bank ?? log.bank)}</td>
                  <td data-label="Cash">{formatCurrency(log.runningBalances?.cash ?? log.cash)}</td>
                  <td data-label="Prepaid">{formatCurrency(log.runningBalances?.prepaid ?? log.prepaid ?? 0)}</td>
                  <td data-label="Transaction" style={{
                    color: log.transactionType === 'W' ? 'red' :
                      log.transactionType === 'S' ? 'rgba(194, 139, 0, 0.9)' :
                        log.transactionType === 'T' ? 'green' : 'gray'
                  }}>
                    <strong>{formatCurrency(log.transactionValue)}</strong>
                  </td>
                  <td data-label="Type">{transactionTypeMap[log.transactionType] || log.transactionType}</td>
                  <td data-label="Categories">
                    {log.splits && log.splits.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>
                          ✂ Split ({log.splits.length})
                        </span>
                        <div className="category-badges-list">
                          {log.splits.map((s, idx) => {
                            const catConfig =
                              EXPENDITURE_CATEGORIES.find((c) => c.name === s.category) || {
                                color: '#6B7280',
                              };
                            return (
                              <span
                                key={idx}
                                className="category-badge"
                                style={{
                                  backgroundColor: catConfig.color,
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.6rem',
                                }}
                                title={`${s.category}: ${formatCurrency(s.amount)}${
                                  s.description ? ` (${s.description})` : ''
                                }`}
                              >
                                {s.category} ({formatCurrency(s.amount)})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="category-badges-list">
                        {(log.categories && log.categories.length > 0
                          ? log.categories
                          : ['Other']
                        ).map((catName) => {
                          const catConfig =
                            EXPENDITURE_CATEGORIES.find((c) => c.name === catName) || {
                              color: '#6B7280',
                            };
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
                    )}
                  </td>
                  <td
                    data-label="Description"
                    style={{
                      fontSize: '0.9rem',
                      color: '#4b5563',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                      minWidth: '160px',
                    }}
                    title={log.description}
                  >
                    {log.description || '-'}
                    {log.isRecurring && (
                      <span
                        title="Recurring Expense"
                        style={{
                          marginLeft: '0.4rem',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        🔁 Recurring
                      </span>
                    )}
                  </td>
                  <td data-label="Action" className="action-cell">
                    <Link to={`/expenditures/edit/${log._id}`}>
                      <FaPencilAlt className="action-icon edit-icon" />
                    </Link>
                    <FaTrash
                      className="action-icon delete-icon"
                      onClick={() => handleDelete(log._id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))
            )}
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
