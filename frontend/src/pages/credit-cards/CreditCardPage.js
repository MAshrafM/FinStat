// frontend/src/pages/credit-cards/CreditCardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { getCards, getCardSummary, getDueTransactions, makeFullPayment } from '../../services/creditCardService';
import AddTransactionModal from './AddTransactionModal';
import PartialPaymentModal from './PartialPaymentModal';
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

  // Fetch the list of cards on initial load
  useEffect(() => {
    getCards().then(data => {
      setCards(data);
      if (data.length > 0) {
        setSelectedCardId(data[0]._id); // Select the first card by default
      }
    });
  }, []);

  // Function to fetch all data for the selected card
  const loadCardData = useCallback(() => {
    if (!selectedCardId) return;
    setIsLoading(true);
    Promise.all([
      getCardSummary(selectedCardId),
      getDueTransactions(selectedCardId)
    ]).then(([summaryData, dueData]) => {
      setSummary(summaryData);
      setDueTransactions(dueData);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Credit Card Center</h1>
        <div className="header-actions">
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
        </>
      )}

      <AddTransactionModal
      isOpen={isTransactionModalOpen}
      onClose={() => setIsTransactionModalOpen(false)}
      cardId={selectedCardId}
      onTransactionAdded={loadCardData} // Pass the refresh function as a callback
    />

    <PartialPaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      transaction={selectedTransaction}
      onPaymentMade={loadCardData} // Pass the refresh function as a callback
    />
    </div>
  );
};

export default CreditCardPage;
