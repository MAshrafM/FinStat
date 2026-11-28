// frontend/src/pages/credit-cards/PartialPaymentModal.js
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { makePartialPayment } from '../../services/creditCardService';
import { formatCurrency } from '../../utils/formatters';

const PartialPaymentModal = ({ isOpen, onClose, transaction, onPaymentMade }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState('Bank');
  const [createExpenditure, setCreateExpenditure] = useState(true);
  const [error, setError] = useState('');

  if (!transaction) return null;

  const maxPayable = Number(transaction.amountDue) || 0;
  const numericAmount = parseFloat(paymentAmount) || 0;
  const remainingAfterPayment = Math.max(0, maxPayable - numericAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (amount > maxPayable) {
      setError(`Payment amount cannot exceed the current amount due (${formatCurrency(maxPayable)}).`);
      return;
    }

    try {
      await makePartialPayment({
        transactionId: transaction._id,
        amount,
        paymentSource,
        createExpenditure,
      });
      onPaymentMade();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to make payment.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Card Payment / Settlement">
      <div className="cc-modal-panel">
        <div className="cc-modal-kv">
          <span>Target Item</span>
          <strong>{transaction.description}</strong>
        </div>
        <div className="cc-modal-kv">
          <span>Current Due</span>
          <strong className="fs-num">{formatCurrency(maxPayable)}</strong>
        </div>
        {transaction.type === 'Installment' && transaction.monthlyPrincipal && (
          <div className="cc-modal-kv">
            <span>Monthly Principal</span>
            <span className="fs-num">
              {formatCurrency(transaction.monthlyPrincipal)}
              {transaction.cyclePaid > 0 && ` (Paid this cycle: ${formatCurrency(transaction.cyclePaid)})`}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="cc-modal-form">
        <div className="cc-modal-field">
          <label htmlFor="cc-payment-source">Payment Source Account</label>
          <select
            id="cc-payment-source"
            className="cc-modal-select"
            value={paymentSource}
            onChange={(e) => setPaymentSource(e.target.value)}
          >
            <option value="Bank">Bank Account</option>
            <option value="Cash">Cash Wallet</option>
            <option value="Prepaid">Prepaid Card</option>
          </select>
        </div>

        <div className="cc-modal-field">
          <label htmlFor="cc-payment-amount">Payment Amount (EGP)</label>
          <input
            id="cc-payment-amount"
            type="number"
            step="0.01"
            className="cc-modal-input fs-num"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder={`Enter up to ${maxPayable}`}
            max={maxPayable}
            required
          />
        </div>

        {/* Integration Toggle */}
        <div className="cc-modal-panel">
          <label className="cc-modal-check-label" htmlFor="cc-payment-create-exp">
            <input
              id="cc-payment-create-exp"
              type="checkbox"
              className="cc-modal-checkbox"
              checked={createExpenditure}
              onChange={(e) => setCreateExpenditure(e.target.checked)}
            />
            Record as settlement expenditure &amp; debit source account
          </label>

          {createExpenditure && (
            <div className="cc-modal-panel-inner">
              <div className="cc-modal-kv">
                <span><strong>Category:</strong> Credit Card Settlement</span>
                <span><strong>Source:</strong> {paymentSource}</span>
              </div>
              <div className="cc-modal-kv">
                <span><strong>Debit Amount:</strong> <span className="fs-num">{formatCurrency(numericAmount)}</span></span>
                <span>Settlement Outflow</span>
              </div>
              <div className="cc-modal-kv">
                <span><strong>Remaining Due After Payment:</strong></span>
                <strong className="fs-num">{formatCurrency(remainingAfterPayment)}</strong>
              </div>
              <p className="cc-modal-note">
                <strong>Ledger Rule:</strong> Your {paymentSource} balance will be debited by{' '}
                <span className="fs-num">{formatCurrency(numericAmount)}</span>. Preceding purchases will be marked as settled.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="cc-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="cc-modal-actions">
          <button type="button" className="fs-btn fs-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="fs-btn fs-btn-primary">
            Submit Settlement Payment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PartialPaymentModal;
