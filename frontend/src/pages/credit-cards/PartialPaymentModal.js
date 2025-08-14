// frontend/src/pages/credit-cards/PartialPaymentModal.js
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { makePartialPayment } from '../../services/creditCardService';
import { formatCurrency } from '../../utils/formatters';

const PartialPaymentModal = ({ isOpen, onClose, transaction, onPaymentMade }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [error, setError] = useState('');

  if (!transaction) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (amount >= transaction.amountDue) {
      setError('Amount must be less than the total due. Use the "Pay in Full" checkbox for full payments.');
      return;
    }

    try {
      await makePartialPayment(transaction._id, amount);
      onPaymentMade(); // Callback to refresh data
      onClose(); // Close the modal
    } catch (err) {
      setError('Failed to make payment. Please check the console.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Make a Partial Payment">
      <div className="payment-summary">
        <p><strong>Paying towards:</strong> {transaction.description}</p>
        <p><strong>Total Amount Due:</strong> <span className="total-value">{formatCurrency(transaction.amountDue)}</span></p>
      </div>
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Payment Amount</label>
          <input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter amount to pay"
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Submit Payment</button>
      </form>
    </Modal>
  );
};

export default PartialPaymentModal;
