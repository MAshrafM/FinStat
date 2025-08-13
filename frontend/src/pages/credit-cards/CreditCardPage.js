// frontend/src/pages/credit-cards/CreditCardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaRegMoneyBillAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { getCards, getCardSummary, getDueTransactions, makeFullPayment,
         getTransactions, getOverallSummary, deleteTransaction } from '../../services/creditCardService';
import AddTransactionModal from './AddTransactionModal';
import PartialPaymentModal from './PartialPaymentModal';
import AddCardModal from './AddCardModal';
import EditTransactionModal from './EditTransactionModal';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import './CreditCardPage.css'; // Custom styles for this page

const CreditCardPage = () => {
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [summary, setSummary] = useState(null);
  const [dueTransactions, setDueTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [overallSummary, setOverallSummary] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch the list of cards on initial load
  useEffect(() => {
    Promise.all([
    getOverallSummary(),
    getCards()
  ]).then(([overallData, cardsData]) => {
    setOverallSummary(overallData);
    setCards(cardsData);
    if (cardsData.length > 0) {
      setSelectedCardId(cardsData[0]._id);
    }
  }).catch(err => console.error("Failed to load initial page data:", err));
}, []);

  // Function to fetch all data for the selected card
 const loadCardData = useCallback(() => {
  if (!selectedCardId) return;
  setIsLoading(true);
  Promise.all([
    getCardSummary(selectedCardId),
    getDueTransactions(selectedCardId),
    getTransactions(selectedCardId) // <-- FETCH HISTORY
  ]).then(([summaryData, dueData, historyData]) => {
    setSummary(summaryData);
    setDueTransactions(dueData);
    setTransactionHistory(historyData); // <-- SET HISTORY STATE
  }).catch(err => console.error("Failed to load card data:", err))
    .finally(() => setIsLoading(false));
}, [selectedCardId]);

  // Re-fetch data whenever the selected card changes
  useEffect(() => {
    loadCardData();
  }, [loadCardData]);

  const handleFullPayment = async (transactionId) => {
    if (window.confirm('Are you sure you want to mark this as fully paid?')) {
      await makeFullPayment(transactionId);
      loadCardData(); // Refresh all data after payment
    }
  };

  // Placeholder for opening partial payment modal
  const handlePartialPayment = (transaction) => {
    setSelectedTransaction(transaction); // Set the transaction to be paid
    setIsPaymentModalOpen(true); // Open the modal
  };

  const handleEdit = (transaction) => {
  setSelectedTransaction(transaction); // Set the transaction to be edited
  setIsEditModalOpen(true); // Open the edit modal
};

const handleDelete = async (transactionId) => {
  if (window.confirm('Are you sure you want to permanently delete this transaction?')) {
    try {
      await deleteTransaction(transactionId);
      loadCardData(); // Refresh all data after deleting
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      alert("Could not delete the transaction.");
    }
  }
};

  const loadCards = useCallback(() => {
  getCards().then(data => {
    setCards(data);
    // If there's no card selected yet, or the selected one was deleted, select the first one
    if (data.length > 0 && !cards.find(c => c._id === selectedCardId)) {
      setSelectedCardId(data[0]._id);
    } else if (data.length === 0) {
      setSelectedCardId('');
      setSummary(null);
      setDueTransactions([]);
    }
  });
}, [selectedCardId, cards]);

useEffect(() => {
  loadCards();
}, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Credit Card Center</h1>
        <div className="header-actions">
          <button className="action-button" onClick={() => setIsCardModalOpen(true)} style={{ marginRight: '10px' }}>Add New Card</button>
          <button className="action-button" onClick={() => setIsTransactionModalOpen(true)}>Log Transaction</button>
          <div className="card-selector">
            <label>Select Card:</label>
            <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)}>
              {cards.map(card => (
                <option key={card._id} value={card._id}>{card.name} - {card.bank}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- NEW OVERALL SUMMARY ROW --- */}
    {overallSummary && (
      <div className="summary-row" style={{ borderBottom: '2px solid #3498db', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div className="summary-item">
          <span>Total Available Credit</span>
          <strong>{formatCurrency(overallSummary.totalAvailable)}</strong>
        </div>
        <div className="summary-item">
          <span>Total Owed</span>
          <strong>{formatCurrency(overallSummary.totalOutstanding)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Total Due This Month</span>
          <strong>{formatCurrency(overallSummary.totalDueThisMonth)}</strong>
        </div>
      </div>
    )}
    {/* --- END OF NEW ROW --- */}

      {isLoading && <p>Loading card details...</p>}

      {summary && !isLoading && (
        <>
          {/* Summary Dashboard */}
          <div className="summary-row">
            <div className="summary-item"><span>Card Limit</span><strong>{formatCurrency(summary.cardDetails.limit)}</strong></div>
            <div className="summary-item"><span>Available</span><strong>{formatCurrency(summary.availableLimit)}</strong></div>
            <div className="summary-item"><span>Outstanding</span><strong>{formatCurrency(summary.outstandingBalance)}</strong></div>
            <div className="summary-item highlight"><span>Amount Due</span><strong>{formatCurrency(summary.amountDueThisMonth)}</strong></div>
          </div>
        </>
      )}

                {/* Due Transactions Table */}
          <div className="table-container">
            <h2>Due Transactions</h2>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Pay in Full</th>
                  <th>Description</th>
                  <th>Amount Due</th>
                  <th>Type</th>
                  <th>Partial Payment</th>
                </tr>
              </thead>
              <tbody>
                {dueTransactions.map(tx => (
                  <tr key={tx._id}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" className="payment-checkbox" onChange={() => handleFullPayment(tx._id)} />
                    </td>
                    <td>{tx.description}</td>
                    <td className="total-value">{formatCurrency(tx.amountDue)}</td>
                    <td>{tx.type}</td>
                    <td>
                      <button className="action-button-small" onClick={() => handlePartialPayment(tx)}>Pay Min/Partial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

      <div className="table-container" style={{ marginTop: '2rem' }}>
      <h2>Full Transaction History</h2>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Paid Amount</th>
            <th>Status</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactionHistory.map(tx => (
            <tr key={tx._id}>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
              <td>{tx.description}</td>
              <td className="total-value">{formatCurrency(tx.amount)}</td>
              <td className="total-value">{formatCurrency(tx.paidAmount)}</td>
              <td>
                <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                  {tx.status}
                </span>
              </td>
              <td className="actions-cell">
                {/* Show payment icons only if the transaction is not fully paid */}
                {tx.status !== 'Paid' && (
                  <>
                    <FaCheckCircle
                      className="action-icon pay-full"
                      title="Pay in Full"
                      onClick={() => handleFullPayment(tx._id)}
                    />
                    <FaRegMoneyBillAlt
                      className="action-icon pay-partial"
                      title="Make Partial Payment"
                      onClick={() => handlePartialPayment(tx)}
                    />
                  </>
                )}
                <FaEdit
                  className="action-icon edit"
                  title="Edit Transaction"
                  onClick={() => { handleEdit(tx) }}
                />
                  <FaTrash
                className="action-icon delete"
                title="Delete Transaction"
                onClick={() => { handleDelete(tx._id) }}
              />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        cardId={selectedCardId}
        onTransactionAdded={loadCardData} // Pass the refresh function as a callback
      />

    <EditTransactionModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      transaction={selectedTransaction}
      onTransactionUpdated={loadCardData}
    />
    <PartialPaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      transaction={selectedTransaction}
      onPaymentMade={loadCardData} // Pass the refresh function as a callback
    />
    <AddCardModal
      isOpen={isCardModalOpen}
      onClose={() => setIsCardModalOpen(false)}
      onCardAdded={loadCards} // Pass the refresh function as a callback
    />
    </div>
  );
};

export default CreditCardPage;
