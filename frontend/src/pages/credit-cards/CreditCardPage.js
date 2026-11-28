// frontend/src/pages/credit-cards/CreditCardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useCreditData } from '../../context/CreditContext';
import {
  FaCheckCircle,
  FaRegMoneyBillAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import {
  getCards,
  getCardSummary,
  getDueTransactions,
  makeFullPayment,
  getTransactions,
  deleteTransaction,
} from '../../services/creditCardService';
import AddTransactionModal from './AddTransactionModal';
import PartialPaymentModal from './PartialPaymentModal';
import AddCardModal from './AddCardModal';
import EditCardModal from './EditCardModal';
import EditTransactionModal from './EditTransactionModal';
import CreditCardSubNav from '../../components/creditCards/CreditCardSubNav';
import UtilizationWidget from '../../components/creditCards/UtilizationWidget';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import './CreditCardPage.css';

const CreditCardPage = () => {
  const { canModify } = useCanModify();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [transactionToPay, setTransactionToPay] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const { creditCardsSummary, refetchCreditSummary } = useCreditData();
  const [cards, setCards] = useState([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('all');
  const [summary, setSummary] = useState(null);
  const [allCardsSummary, setAllCardsSummary] = useState(null);
  const [dueTransactions, setDueTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState(null);
  const [expandedDueIds, setExpandedDueIds] = useState(() => new Set());
  const [expandedHistoryIds, setExpandedHistoryIds] = useState(() => new Set());

  const loadCards = useCallback(() => {
    setFetchError(null);
    return getCards()
      .then((data) => {
        const list = data || [];
        setCards(list);
        setCardsLoaded(true);
        if (list.length === 0) {
          setSelectedCardId('all');
          setSummary(null);
          setAllCardsSummary(null);
          setDueTransactions([]);
          setTransactionHistory([]);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial page data:', err);
        setFetchError(err.message || 'Failed to load credit cards.');
        setCardsLoaded(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const aggregateAllCardsData = useCallback(async () => {
    if (cards.length === 0) return;

    try {
      setIsLoading(true);
      setFetchError(null);

      const allCardsData = await Promise.all(
        cards.map(async (card) => {
          const [summaryData, dueData, historyData] = await Promise.all([
            getCardSummary(card._id),
            getDueTransactions(card._id),
            getTransactions(card._id),
          ]);
          return { summaryData, dueData, historyData, cardInfo: card };
        })
      );

      const aggregatedSummary = {
        cardDetails: {
          name: 'All Cards',
          limit: allCardsData.reduce((sum, data) => sum + (data.summaryData.cardDetails?.limit || 0), 0),
        },
        availableLimit: allCardsData.reduce((sum, data) => sum + (data.summaryData.availableLimit || 0), 0),
        outstandingBalance: allCardsData.reduce((sum, data) => sum + (data.summaryData.outstandingBalance || 0), 0),
        amountDueThisMonth: allCardsData.reduce((sum, data) => sum + (data.summaryData.amountDueThisMonth || 0), 0),
        minimumPaymentDue: allCardsData.reduce((sum, data) => sum + (data.summaryData.minimumPaymentDue || 0), 0),
      };

      const aggregatedDueTransactions = allCardsData.flatMap((data) =>
        (data.dueData || []).map((tx) => ({
          ...tx,
          cardInfo: data.cardInfo,
        }))
      );

      const aggregatedTransactionHistory = allCardsData.flatMap((data) =>
        (data.historyData || []).map((tx) => ({
          ...tx,
          cardInfo: data.cardInfo,
        }))
      );

      setAllCardsSummary(aggregatedSummary);
      setDueTransactions(aggregatedDueTransactions);
      setTransactionHistory(aggregatedTransactionHistory);
    } catch (err) {
      console.error('Failed to aggregate all cards data:', err);
      setFetchError(err.message || 'Failed to load credit card data.');
    } finally {
      setIsLoading(false);
    }
  }, [cards]);

  const loadCardData = useCallback(() => {
    if (!selectedCardId || selectedCardId === 'all') return;
    setIsLoading(true);
    setFetchError(null);
    Promise.all([
      getCardSummary(selectedCardId),
      getDueTransactions(selectedCardId),
      getTransactions(selectedCardId),
    ])
      .then(([summaryData, dueData, historyData]) => {
        setSummary(summaryData);
        setDueTransactions(dueData || []);
        setTransactionHistory(historyData || []);
      })
      .catch((err) => {
        console.error('Failed to load card data:', err);
        setFetchError(err.message || 'Failed to load card data.');
      })
      .finally(() => setIsLoading(false));
  }, [selectedCardId]);

  useEffect(() => {
    if (!cardsLoaded || cards.length === 0) return;
    if (selectedCardId === 'all') {
      aggregateAllCardsData();
    } else {
      loadCardData();
    }
  }, [cardsLoaded, cards.length, selectedCardId, aggregateAllCardsData, loadCardData]);

  const refreshData = useCallback(() => {
    if (selectedCardId === 'all') {
      aggregateAllCardsData();
    } else {
      loadCardData();
    }
  }, [selectedCardId, aggregateAllCardsData, loadCardData]);

  const handleFullPayment = (transactionId) => {
    if (!canModify) return;
    setTransactionToPay(transactionId);
  };

  const handleConfirmFullPayment = async () => {
    if (!transactionToPay) return;
    try {
      await makeFullPayment({
        transactionId: transactionToPay,
        paymentSource: 'Bank',
        createExpenditure: true,
      });
      if (notify) notify('Marked transaction as fully paid', 'success');
      setTransactionToPay(null);
      refreshData();
    } catch (err) {
      if (notify) notify('Failed to process full payment', 'error');
    }
  };

  const handlePartialPayment = (transaction) => {
    if (!canModify) return;
    setSelectedTransaction(transaction);
    setIsPaymentModalOpen(true);
  };

  const handleEdit = (transaction) => {
    if (!canModify) return;
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (transactionId) => {
    if (!canModify) return;
    setTransactionToDelete(transactionId);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      if (notify) notify('Transaction deleted successfully', 'success');
      setTransactionToDelete(null);
      refreshData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      if (notify) notify('Could not delete the transaction.', 'error');
    }
  };

  const handleOpenEditCard = () => {
    const card = cards.find((c) => c._id === selectedCardId);
    if (card) {
      setCardToEdit(card);
      setIsEditCardModalOpen(true);
    }
  };

  const handleCardUpdated = () => {
    loadCards();
    refreshData();
    if (refetchCreditSummary) refetchCreditSummary();
  };

  const toggleSetId = (setter, id) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalPaid = transactionHistory.reduce((sum, tx) => sum + (tx.status === 'Paid' ? tx.amount : 0), 0);
  const totalPartial = transactionHistory.reduce(
    (sum, tx) => sum + (tx.status === 'Partial' ? tx.paidAmount : 0),
    0
  );
  const displaySummary = selectedCardId === 'all' ? allCardsSummary : summary;

  const renderDueDescription = (tx) => {
    if (tx.type !== 'Installment') return tx.description;
    const transaction = transactionHistory.find((t) => t._id === tx._id);
    if (!transaction || !transaction.installmentDetails?.months) return tx.description;
    const paidMonths = Math.round(
      (transaction.paidAmount / transaction.amount) * transaction.installmentDetails.months
    );
    return `${tx.description} - ${paidMonths} / ${transaction.installmentDetails.months} months`;
  };

  const renderTxActionButtons = (tx, includeEditDelete = false) => (
    <div className="cc-actions-group">
      {tx.status !== 'Paid' && (
        <>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              className="cc-icon-btn"
              aria-label={`Pay ${tx.description} in full`}
              title="Pay in Full"
              onClick={() => handleFullPayment(tx._id)}
            >
              <FaCheckCircle aria-hidden="true" />
            </button>
          </ProtectedAction>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              className="cc-icon-btn"
              aria-label={`Make partial payment for ${tx.description}`}
              title="Make Partial Payment"
              onClick={() => handlePartialPayment(tx)}
            >
              <FaRegMoneyBillAlt aria-hidden="true" />
            </button>
          </ProtectedAction>
        </>
      )}
      {includeEditDelete && (
        <>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              className="cc-icon-btn"
              aria-label={`Edit transaction ${tx.description}`}
              title="Edit Transaction"
              onClick={() => handleEdit(tx)}
            >
              <FaEdit aria-hidden="true" />
            </button>
          </ProtectedAction>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              className="cc-icon-btn cc-icon-btn-danger"
              aria-label={`Delete transaction ${tx.description}`}
              title="Delete Transaction"
              onClick={() => handleDelete(tx._id)}
            >
              <FaTrash aria-hidden="true" />
            </button>
          </ProtectedAction>
        </>
      )}
    </div>
  );

  if (!cardsLoaded && isLoading && !fetchError) {
    return (
      <div className="page-container cc-page-container cc-dashboard-page">
        <CreditCardSubNav />
        <Loading variant="card" text="Loading credit card center..." />
      </div>
    );
  }

  return (
    <div className="page-container cc-page-container cc-dashboard-page">
      <CreditCardSubNav />
      <UtilizationWidget />

      <nav className="cc-breadcrumb" aria-label="Breadcrumb">
        <span>Debt</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Credit Cards</span>
      </nav>

      <header className="cc-header">
        <div className="cc-header-left">
          <h1>Credit Card Center</h1>
          <p className="cc-header-subtitle">
            Card limits, utilization health, due balances, and installment tracking.
          </p>
        </div>

        <div className="cc-header-actions">
          <div className="cc-card-selector">
            <label htmlFor="cc-card-selector">Select Card:</label>
            <select
              id="cc-card-selector"
              className="cc-card-select"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
            >
              <option value="all">All Cards</option>
              {cards.map((card) => (
                <option key={card._id} value={card._id}>
                  {card.name} - {card.bank}
                </option>
              ))}
            </select>
          </div>

          <div className="cc-btn-group">
            <ProtectedAction tooltip="View-only access">
              <button
                type="button"
                className="fs-btn fs-btn-primary"
                onClick={() => setIsCardModalOpen(true)}
                title="Add a new credit card"
              >
                <FaPlus aria-hidden="true" /> Add New Card
              </button>
            </ProtectedAction>
            <ProtectedAction tooltip="View-only access">
              <button
                type="button"
                className="fs-btn fs-btn-secondary"
                onClick={handleOpenEditCard}
                disabled={selectedCardId === 'all'}
                title={selectedCardId === 'all' ? 'Select a card to edit' : 'Edit card details'}
              >
                <FaEdit aria-hidden="true" /> Edit Card
              </button>
            </ProtectedAction>
            <ProtectedAction tooltip="View-only access">
              <button
                type="button"
                className="fs-btn fs-btn-secondary"
                onClick={() => setIsTransactionModalOpen(true)}
                disabled={selectedCardId === 'all'}
                title={selectedCardId === 'all' ? 'Select a card to log transaction' : 'Log a new transaction'}
              >
                <FaReceipt aria-hidden="true" /> Log Transaction
              </button>
            </ProtectedAction>
          </div>
        </div>
      </header>

      {fetchError && (
        <div className="cc-error-card" role="alert">
          <h2>Unable to Load Credit Card Data</h2>
          <p>{fetchError}</p>
          <button
            type="button"
            className="fs-btn fs-btn-secondary"
            onClick={() => (cards.length === 0 ? loadCards() : refreshData())}
          >
            Retry
          </button>
        </div>
      )}

      {!fetchError && cardsLoaded && cards.length === 0 && (
        <div className="cc-empty-card">
          <h2>No Credit Cards Found</h2>
          <p>Add your first credit card to track utilization, due balances, and statement cycles.</p>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              className="fs-btn fs-btn-primary"
              onClick={() => setIsCardModalOpen(true)}
            >
              <FaPlus aria-hidden="true" /> Add New Card
            </button>
          </ProtectedAction>
        </div>
      )}

      {!fetchError && cards.length > 0 && (
        <>
          {/* Overall Summary Row */}
          {creditCardsSummary && (
            <section className="cc-kpi-section" aria-label="Overall credit summary">
              <div className="cc-kpi-grid">
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Total Paid</span>
                  <strong className="cc-kpi-value fs-num">{formatCurrency(totalPaid + totalPartial)}</strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Total Available Credit</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(creditCardsSummary.totalAvailable)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Total Owed</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(creditCardsSummary.totalOutstanding)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Total Due This Month</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(creditCardsSummary.totalDueThisMonth)}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {isLoading && <Loading variant="card" text="Loading card details..." />}

          {displaySummary && !isLoading && (
            <section className="cc-kpi-section" aria-label="Selected card summary">
              <div className="cc-kpi-grid cc-kpi-grid-5">
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Card Limit</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(displaySummary.cardDetails?.limit || 0)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Available</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(displaySummary.availableLimit || 0)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Outstanding</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(displaySummary.outstandingBalance || 0)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Amount Due</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(displaySummary.amountDueThisMonth || 0)}
                  </strong>
                </div>
                <div className="cc-kpi-tile">
                  <span className="cc-kpi-label">Min Amount Due</span>
                  <strong className="cc-kpi-value fs-num">
                    {formatCurrency(displaySummary.minimumPaymentDue || 0)}
                  </strong>
                </div>
              </div>
            </section>
          )}

          {/* Due Transactions */}
          <section className="cc-section" aria-label="Due Transactions">
            <div className="cc-section-header">
              <h2 className="cc-section-title">Due Transactions</h2>
              <Badge tone="neutral">{dueTransactions.length} Due</Badge>
            </div>

            {dueTransactions.length === 0 ? (
              <div className="cc-empty-card">
                <p>No due transactions for this selection.</p>
              </div>
            ) : (
              <>
                <div className="cc-table-wrap">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        {selectedCardId === 'all' && <th scope="col">Card</th>}
                        <th scope="col">Description</th>
                        <th scope="col" className="cc-th-num">Amount Due</th>
                        <th scope="col">Type</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dueTransactions.map((tx) => (
                        <tr key={tx._id}>
                          {selectedCardId === 'all' && <td>{tx.cardInfo?.bank}</td>}
                          <td>{renderDueDescription(tx)}</td>
                          <td className="cc-td-num fs-num">{formatCurrency(tx.amountDue)}</td>
                          <td>
                            <Badge tone="neutral">{tx.type}</Badge>
                          </td>
                          <td>{renderTxActionButtons(tx, false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cc-mobile-cards" data-testid="cc-due-mobile-cards">
                  {dueTransactions.map((tx) => {
                    const isExpanded = expandedDueIds.has(tx._id);
                    return (
                      <article key={tx._id} className="cc-mobile-card">
                        <div className="cc-mobile-card-summary">
                          <div className="cc-mobile-card-main">
                            <span className="cc-mobile-card-title">{renderDueDescription(tx)}</span>
                            <Badge tone="neutral">{tx.type}</Badge>
                          </div>
                          <div className="cc-mobile-card-val">
                            <div className="cc-mobile-card-title fs-num">{formatCurrency(tx.amountDue)}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="cc-mobile-expand-btn"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} due details for ${tx.description}`}
                          onClick={() => toggleSetId(setExpandedDueIds, tx._id)}
                        >
                          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>

                        {isExpanded && (
                          <div className="cc-mobile-details">
                            {selectedCardId === 'all' && (
                              <div className="cc-mobile-detail-item">
                                <span className="cc-mobile-detail-label">Card</span>
                                <span className="cc-mobile-detail-value">{tx.cardInfo?.bank || '—'}</span>
                              </div>
                            )}
                            <div className="cc-mobile-detail-item">
                              <span className="cc-mobile-detail-label">Actions</span>
                              {renderTxActionButtons(tx, false)}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* Full Transaction History */}
          <section className="cc-section" aria-label="Full Transaction History">
            <div className="cc-section-header">
              <h2 className="cc-section-title">Full Transaction History</h2>
              <Badge tone="neutral">{transactionHistory.length} Total</Badge>
            </div>

            {transactionHistory.length === 0 ? (
              <div className="cc-empty-card">
                <p>No transactions recorded for this selection.</p>
              </div>
            ) : (
              <>
                <div className="cc-table-wrap">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        {selectedCardId === 'all' && <th scope="col">Card</th>}
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Description</th>
                        <th scope="col" className="cc-th-num">Amount</th>
                        <th scope="col" className="cc-th-num">Paid Amount</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((tx) => (
                        <tr key={tx._id}>
                          {selectedCardId === 'all' && <td>{tx.cardInfo?.bank}</td>}
                          <td>{new Date(tx.date).toLocaleDateString()}</td>
                          <td>
                            <Badge tone="neutral">{tx.type}</Badge>
                          </td>
                          <td>
                            {tx.description}
                            {tx.type === 'Installment' && tx.installmentDetails?.months
                              ? ` - ${tx.installmentDetails.months} months`
                              : ''}
                          </td>
                          <td className="cc-td-num fs-num">
                            <div>{formatCurrency(tx.amount)}</div>
                            {tx.currency && tx.currency !== 'EGP' && tx.foreignAmount && (
                              <div className="cc-cell-sub fs-num">
                                ({tx.foreignAmount.toLocaleString()} {tx.currency})
                              </div>
                            )}
                          </td>
                          <td className="cc-td-num fs-num">{formatCurrency(tx.paidAmount)}</td>
                          <td>
                            <Badge tone="neutral">{tx.status}</Badge>
                          </td>
                          <td>{renderTxActionButtons(tx, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cc-mobile-cards" data-testid="cc-history-mobile-cards">
                  {transactionHistory.map((tx) => {
                    const isExpanded = expandedHistoryIds.has(tx._id);
                    return (
                      <article key={tx._id} className="cc-mobile-card">
                        <div className="cc-mobile-card-summary">
                          <div className="cc-mobile-card-main">
                            <span className="cc-mobile-card-title">{tx.description}</span>
                            <div className="cc-actions-group">
                              <Badge tone="neutral">{tx.type}</Badge>
                              <Badge tone="neutral">{tx.status}</Badge>
                            </div>
                          </div>
                          <div className="cc-mobile-card-val">
                            <div className="cc-mobile-card-title fs-num">{formatCurrency(tx.amount)}</div>
                            <div className="cc-cell-sub fs-num">Paid: {formatCurrency(tx.paidAmount)}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="cc-mobile-expand-btn"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} history details for ${tx.description}`}
                          onClick={() => toggleSetId(setExpandedHistoryIds, tx._id)}
                        >
                          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>

                        {isExpanded && (
                          <div className="cc-mobile-details">
                            <div className="cc-mobile-detail-item">
                              <span className="cc-mobile-detail-label">Date</span>
                              <span className="cc-mobile-detail-value">
                                {new Date(tx.date).toLocaleDateString()}
                              </span>
                            </div>
                            {selectedCardId === 'all' && (
                              <div className="cc-mobile-detail-item">
                                <span className="cc-mobile-detail-label">Card</span>
                                <span className="cc-mobile-detail-value">{tx.cardInfo?.bank || '—'}</span>
                              </div>
                            )}
                            {tx.currency && tx.currency !== 'EGP' && tx.foreignAmount && (
                              <div className="cc-mobile-detail-item">
                                <span className="cc-mobile-detail-label">Foreign Amount</span>
                                <span className="cc-mobile-detail-value fs-num">
                                  {tx.foreignAmount.toLocaleString()} {tx.currency}
                                </span>
                              </div>
                            )}
                            <div className="cc-mobile-detail-item">
                              <span className="cc-mobile-detail-label">Actions</span>
                              {renderTxActionButtons(tx, true)}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(transactionToPay)}
        title="Mark as Fully Paid"
        message="Are you sure you want to mark this transaction as fully paid?"
        confirmText="Pay Full"
        variant="primary"
        onConfirm={handleConfirmFullPayment}
        onCancel={() => setTransactionToPay(null)}
      />

      <ConfirmModal
        isOpen={Boolean(transactionToDelete)}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this transaction?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      />

      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        cardId={selectedCardId}
        onTransactionAdded={refreshData}
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
        onPaymentMade={refreshData}
      />

      <AddCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onCardAdded={loadCards}
      />

      <EditCardModal
        isOpen={isEditCardModalOpen}
        onClose={() => setIsEditCardModalOpen(false)}
        card={cardToEdit}
        onCardUpdated={handleCardUpdated}
      />
    </div>
  );
};

export default CreditCardPage;
