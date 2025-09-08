// frontend/src/pages/credit-cards/CreditCardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useCreditData } from '../../context/CreditContext';
import { FaCheckCircle, FaRegMoneyBillAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { getCards, getCardSummary, getDueTransactions, makeFullPayment,
         getTransactions, deleteTransaction } from '../../services/creditCardService';
import AddTransactionModal from './AddTransactionModal';
import PartialPaymentModal from './PartialPaymentModal';
import AddCardModal from './AddCardModal';
import EditTransactionModal from './EditTransactionModal';
import { formatCurrency } from '../../utils/formatters';
import '../trades/Trades.css'; // Reuse styles
import './CreditCardPage.css'; // Custom styles for this page

const CreditCardPage = () => {
  const { creditCardsSummary } = useCreditData();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] =  useState('all');
  const [summary, setSummary] = useState(null);
  const [allCardsSummary, setAllCardsSummary] = useState(null);
  const [dueTransactions, setDueTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch the list of cards on initial load
  useEffect(() => {
    getCards()
    .then((cardsData) => {
      setCards(cardsData);
    }).catch(err => console.error("Failed to load initial page data:", err));
  }, []);

  // Function to aggregate data from all cards
  const aggregateAllCardsData = useCallback(async () => {
    if (cards.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Fetch summary and transactions for all cards
      const allCardsData = await Promise.all(
        cards.map(async (card) => {
          const [summaryData, dueData, historyData] = await Promise.all([
            getCardSummary(card._id),
            getDueTransactions(card._id),
            getTransactions(card._id)
          ]);
          return { summaryData, dueData, historyData, cardInfo: card };
        })
      );

      // Aggregate summaries
      const aggregatedSummary = {
        cardDetails: {
          name: 'All Cards',
          limit: allCardsData.reduce((sum, data) => sum + data.summaryData.cardDetails.limit, 0)
        },
        availableLimit: allCardsData.reduce((sum, data) => sum + data.summaryData.availableLimit, 0),
        outstandingBalance: allCardsData.reduce((sum, data) => sum + data.summaryData.outstandingBalance, 0),
        amountDueThisMonth: allCardsData.reduce((sum, data) => sum + data.summaryData.amountDueThisMonth, 0),
        minimumPaymentDue: allCardsData.reduce((sum, data) => sum + data.summaryData.minimumPaymentDue, 0)
      };

      // Aggregate due transactions (add card info to each transaction)
      const aggregatedDueTransactions = allCardsData.flatMap(data => 
        data.dueData.map(tx => ({
          ...tx,
          cardInfo: data.cardInfo // Add card information to each transaction
        }))
      );

      // Aggregate transaction history (add card info to each transaction)
      const aggregatedTransactionHistory = allCardsData.flatMap(data => 
        data.historyData.map(tx => ({
          ...tx,
          cardInfo: data.cardInfo // Add card information to each transaction
        }))
      );

      setAllCardsSummary(aggregatedSummary);
      setDueTransactions(aggregatedDueTransactions);
      setTransactionHistory(aggregatedTransactionHistory);
      
    } catch (err) {
      console.error("Failed to aggregate all cards data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cards]);

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
  // Load data based on selection
  useEffect(() => {
    if (selectedCardId === 'all') {
      aggregateAllCardsData();
    } else {
      loadCardData();
    }
  }, [selectedCardId, aggregateAllCardsData, loadCardData]);


  const handleFullPayment = async (transactionId) => {
    if (window.confirm('Are you sure you want to mark this as fully paid?')) {
      await makeFullPayment(transactionId);
      // Refresh data based on current selection
      if (selectedCardId === 'all') {
        aggregateAllCardsData();
      } else {
        loadCardData();
      }
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
      // Refresh data based on current selection
        if (selectedCardId === 'all') {
          aggregateAllCardsData();
        } else {
          loadCardData();
        }
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      alert("Could not delete the transaction.");
    }
  }
};

  const loadCards = useCallback(() => {
  getCards().then(data => {
    setCards(data);
    // If no cards exist, reset to default state
      if (data.length === 0) {
        setSelectedCardId('all');
        setSummary(null);
        setAllCardsSummary(null);
        setDueTransactions([]);
        setTransactionHistory([]);
      }
  });
}, [selectedCardId, cards]);

useEffect(() => {
  loadCards();
}, []);

// Refresh function that handles both single card and all cards view
  const refreshData = useCallback(() => {
    if (selectedCardId === 'all') {
      aggregateAllCardsData();
    } else {
      loadCardData();
    }
  }, [selectedCardId, aggregateAllCardsData, loadCardData]);

const totalPaid = transactionHistory.reduce((sum, tx) => {
  return sum + (tx.status === 'Paid' ? tx.amount : 0);
}, 0);
const totalDue = transactionHistory.reduce((sum, tx) => {
  return sum + (tx.status === 'Due' ? tx.amount : 0);
}, 0);
const totalPartial = transactionHistory.reduce((sum, tx) => {
  return sum + (tx.status === 'Partial' ? tx.paidAmount : 0);
}, 0);

// Determine which summary to display
  const displaySummary = selectedCardId === 'all' ? allCardsSummary : summary;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Credit Card Center</h1>
        <div className="header-actions">
          <div className="card-selector">
            <label>Select Card:</label>
            <select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)}>
              <option value="all">All Cards</option>
              {cards.map(card => (
                <option key={card._id} value={card._id}>{card.name} - {card.bank}</option>
              ))}
            </select>
          </div>
          <button className="action-button" onClick={() => setIsCardModalOpen(true)}>Add New Card</button>
          <button className="action-button" onClick={() => setIsTransactionModalOpen(true)} disabled={selectedCardId === 'all'}>Log Transaction</button>
        </div>
      </div>

      {/* --- NEW OVERALL SUMMARY ROW --- */}
    {creditCardsSummary && (
      <div className="summary-row" style={{ borderBottom: '2px solid #3498db', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div className="summary-item">
          <span>Total Paid</span>
          <strong>{formatCurrency(totalPaid + totalPartial)}</strong> 
        </div>
        <div className="summary-item">
          <span>Total Available Credit</span>
          <strong>{formatCurrency(creditCardsSummary.totalAvailable)}</strong>
        </div>
        <div className="summary-item">
          <span>Total Owed</span>
          <strong>{formatCurrency(creditCardsSummary.totalOutstanding)}</strong>
        </div>
        <div className="summary-item highlight">
          <span>Total Due This Month</span>
          <strong>{formatCurrency(creditCardsSummary.totalDueThisMonth)}</strong>
        </div>
      </div>
    )}
    {/* --- END OF NEW ROW --- */}

      {isLoading && <p>Loading card details...</p>}

      {displaySummary && !isLoading && (
        <>
          {/* Summary Dashboard */}
          <div className="summary-row">
            <div className="summary-item"><span>Card Limit</span><strong>{formatCurrency(displaySummary.cardDetails.limit)}</strong></div>
            <div className="summary-item"><span>Available</span><strong>{formatCurrency(displaySummary.availableLimit)}</strong></div>
            <div className="summary-item"><span>Outstanding</span><strong>{formatCurrency(displaySummary.outstandingBalance)}</strong></div>
            <div className="summary-item highlight"><span>Amount Due</span><strong>{formatCurrency(displaySummary.amountDueThisMonth)}</strong></div>
            <div className="summary-item highlight"><span>Min Amount Due</span><strong>{formatCurrency(displaySummary.minimumPaymentDue)}</strong></div>
          </div>
        </>
      )}

                {/* Due Transactions Table */}
          <div className="table-container">
            <h2>Due Transactions</h2>
            <table className="styled-table">
              <thead>
                <tr>
                  {selectedCardId === 'all' && <th>Card</th>}
                  <th>Description</th>
                  <th>Amount Due</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dueTransactions.map(tx => (
                  <tr key={tx._id}>
                    {selectedCardId === 'all' && (
                      <td data-label="Card">{tx.cardInfo?.bank}</td>
                    )}
                    <td data-label="Description">{tx.description}
                      {tx.type === 'Installment' && (() => {
                        const transaction = transactionHistory.find(t => t._id === tx._id);
                        if (!transaction) return null;
                        const paidMonths = Math.round((transaction.paidAmount/transaction.amount)*transaction.installmentDetails.months);
                        return (
                          <>
                            {" - "}
                            {paidMonths} / {transaction.installmentDetails.months} months
                          </>
                        );
                      })()}

                    </td>
                    <td data-label="Amount Due" className="total-value">{formatCurrency(tx.amountDue)}</td>
                    <td data-label="Type">{tx.type}</td>
                    <td data-label="Action" className="actions-cell">
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
            {selectedCardId === 'all' && <th>Card</th>}
            <th>Date</th>
            <th>Type</th>
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
              {selectedCardId === 'all' && (
                  <td data-label="Card">{tx.cardInfo?.bank}</td>
                )}
              <td data-label="Date">{new Date(tx.date).toLocaleDateString()}</td>
              <td data-label="Type">{tx.type}</td>
              <td data-label="Description">{tx.description}
                {tx.type === 'Installment' && (
                    <>
                      - {tx.installmentDetails.months} months 
                    </>
                  )}

              </td>
              <td data-label="Value" className="total-value">{formatCurrency(tx.amount)}</td>
              <td data-label="Paid Amount" className="total-value">{formatCurrency(tx.paidAmount)}</td>
              <td data-label="Status">
                <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                  {tx.status}
                </span>
              </td>
              <td data-label="Action" className="actions-cell">
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
        onTransactionAdded={refreshData} // Pass the refresh function as a callback
      />

    <EditTransactionModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      transaction={selectedTransaction}
      onTransactionUpdated={refreshData}
    />
    <PartialPaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      transaction={selectedTransaction}
      onPaymentMade={refreshData} // Pass the refresh function as a callback
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
