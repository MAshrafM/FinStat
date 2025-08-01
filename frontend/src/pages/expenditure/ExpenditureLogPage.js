// frontend/src/pages/expenditure/ExpenditureLogPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExpenditures, deleteExpenditure } from '../../services/expenditureService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';
import '../../components/PaycheckTable.css'; // Reuse table styles
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadExpenditures(currentPage);
  }, [currentPage]);

  const loadExpenditures = (page) => {
    getExpenditures(page).then(response => {
      setExpenditures(response.data); // The data is now in a 'data' property
      setTotalPages(response.totalPages);
    });
  };

  useEffect(() => {
    if (expenditures.length === 0) {
      setProcessedExpenditures([]);
      return;
    }

    const sortedByTimestamp = [...expenditures].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // STEP 2: Calculate the transaction value based on the *truly* previous day's record.
    const calculated = sortedByTimestamp.map((current, index) => {
      // The very first record in history has no previous day to compare to. Its transaction is 0.
      if (index === 0) {
        return { ...current, transaction: 0 };
      }
      
      // Now, `previous` is guaranteed to be the record from the day before.
      const previous = sortedByTimestamp[index - 1];
      const transaction = (current.bank + current.cash) - (previous.bank + previous.cash);
      return { ...current, transaction };
    });

    setProcessedExpenditures(calculated.reverse());
    }, [expenditures]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      await deleteExpenditure(id);
      loadExpenditures();
    }
  };

  // Calculate the 'Transaction' value on the frontend
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Expenditure Log</h1>
        <Link to="/expenditures/new" className="nav-button">
          <FaPlus /> Add New Log
        </Link>
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
                <td>{formatDate(log.date)}</td>
                <td>{formatCurrency(log.bank)}</td>
                <td>{formatCurrency(log.cash)}</td>
                <td style={{ color: log.transaction > 0 ? 'green' : 'red' }}>
                  {formatCurrency(log.transaction)}
                </td>
                <td>{transactionTypeMap[log.transactionType] || log.transactionType}</td>
                <td>{log.description}</td>
                <td className="action-cell">
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
