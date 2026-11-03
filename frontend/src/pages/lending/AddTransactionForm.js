// frontend/src/pages/lending/AddTransactionForm.js
import React, { useState } from 'react';

const AddTransactionForm = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'repay',
  maxRepayAmount = null,
}) => {
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const amountInPiastres = Math.round(numAmount * 100);

    if (type === 'repay' && maxRepayAmount !== null && amountInPiastres > maxRepayAmount) {
      setError(`Repayment cannot exceed remaining balance of ${(maxRepayAmount / 100).toFixed(2)} EGP.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSubmit({
        type,
        amountInPiastres,
        date,
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to record transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lending-modal-backdrop" role="dialog" aria-modal="true">
      <div className="lending-modal-content">
        <div className="lending-modal-header">
          <h3>{type === 'repay' ? 'Record Repayment' : 'Increase Loan (Borrow More)'}</h3>
          <button
            type="button"
            className="lending-btn lending-btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lending-modal-body">
            {error && (
              <div style={{ color: '#b91c1c', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="lending-form-group">
              <label htmlFor="tx-type">Transaction Type</label>
              <select
                id="tx-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isLoading}
              >
                <option value="repay">Repayment (Reduces Owed Balance)</option>
                <option value="borrow">Borrow (Increases Owed Balance)</option>
              </select>
            </div>

            <div className="lending-form-group">
              <label htmlFor="tx-amount">Amount (EGP)</label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="lending-form-group">
              <label htmlFor="tx-date">Date</label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="lending-form-group">
              <label htmlFor="tx-note">Note</label>
              <input
                id="tx-note"
                type="text"
                placeholder="e.g. Cash payment / bank transfer"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isLoading}
                maxLength={300}
              />
            </div>
          </div>

          <div className="lending-modal-footer">
            <button
              type="button"
              className="lending-btn lending-btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="lending-btn lending-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionForm;
