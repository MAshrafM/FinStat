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
      <div className="payment-summary" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: '0 0 0.4rem 0' }}><strong>Target Item:</strong> {transaction.description}</p>
        <p style={{ margin: '0 0 0.4rem 0' }}><strong>Current Due:</strong> <span className="total-value" style={{ color: '#2563eb', fontWeight: 700 }}>{formatCurrency(maxPayable)}</span></p>
        {transaction.type === 'Installment' && transaction.monthlyPrincipal && (
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>
            Monthly Principal: {formatCurrency(transaction.monthlyPrincipal)}
            {transaction.cyclePaid > 0 && ` (Already paid this cycle: ${formatCurrency(transaction.cyclePaid)})`}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Payment Source Account</label>
          <select value={paymentSource} onChange={(e) => setPaymentSource(e.target.value)}>
            <option value="Bank">Bank Account</option>
            <option value="Cash">Cash Wallet</option>
            <option value="Prepaid">Prepaid Card</option>
          </select>
        </div>

        <div className="form-group">
          <label>Payment Amount (EGP)</label>
          <input
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder={`Enter up to ${maxPayable}`}
            max={maxPayable}
            required
          />
        </div>

        {/* Integration Toggle */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1rem', background: '#eff6ff', padding: '0.9rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0, fontWeight: 600, color: '#1e40af' }}>
            <input
              type="checkbox"
              checked={createExpenditure}
              onChange={(e) => setCreateExpenditure(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Record as settlement expenditure & debit source account
          </label>

          {createExpenditure && (
            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', fontSize: '0.82rem', color: '#374151', border: '1px solid #dbeafe' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span><strong>Category:</strong> Credit Card Settlement</span>
                <span><strong>Source:</strong> {paymentSource}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span><strong>Debit Amount:</strong> {formatCurrency(numericAmount)}</span>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>🔄 Settlement Outflow</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Remaining Due After Payment:</strong></span>
                <span style={{ fontWeight: 700, color: remainingAfterPayment > 0 ? '#d97706' : '#10b981' }}>
                  {formatCurrency(remainingAfterPayment)}
                </span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', color: '#6b7280', fontSize: '0.78rem' }}>
                📉 <strong>Ledger Rule:</strong> Your {paymentSource} balance will be debited by {formatCurrency(numericAmount)}. Preceding purchases will be marked as settled.
              </p>
            </div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Submit Settlement Payment</button>
      </form>
    </Modal>
  );
};

export default PartialPaymentModal;
