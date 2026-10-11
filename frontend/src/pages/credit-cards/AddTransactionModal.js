// frontend/src/pages/credit-cards/AddTransactionModal.js
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { createTransaction } from '../../services/creditCardService';
import { useToast } from '../../context/ToastContext';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';

const AddTransactionModal = ({ isOpen, onClose, cardId, onTransactionAdded }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    category: 'Groceries',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Purchase',
    createExpenditure: true,
    installmentMonths: '',
    installmentInterest: 0,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(formData.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const dataToSubmit = {
      card: cardId,
      description: formData.description,
      category: formData.category,
      amount: parsedAmount,
      date: formData.date,
      type: formData.type,
      createExpenditure: formData.createExpenditure,
    };

    if (formData.type === 'Installment') {
      const months = parseInt(formData.installmentMonths, 10);
      if (!months || months <= 0) {
        setError('Installment months must be a positive number.');
        return;
      }
      dataToSubmit.installmentDetails = {
        months: months,
        monthlyPrincipal: parsedAmount / months,
        interest: parseFloat(formData.installmentInterest) || 0,
      };
    }

    try {
      await createTransaction(dataToSubmit);
      showToast('Transaction logged successfully', 'success');
      onTransactionAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create transaction.');
      console.error(err);
    }
  };

  const numericAmount = parseFloat(formData.amount) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Card Transaction">
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Merchant / Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Carrefour Hypermarket"
            required
          />
        </div>

        <div className="form-group">
          <label>Category (Real Expenditure Category)</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            {EXPENDITURE_CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Total Amount (EGP)</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Transaction Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Purchase">Standard Purchase</option>
            <option value="Installment">Installment Plan</option>
          </select>
        </div>

        {formData.type === 'Installment' && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <div className="form-group">
              <label>Number of Months</label>
              <input
                type="number"
                name="installmentMonths"
                value={formData.installmentMonths}
                onChange={handleChange}
                placeholder="e.g. 12"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Interest Rate (%) (Optional)</label>
              <input
                type="number"
                step="0.01"
                name="installmentInterest"
                value={formData.installmentInterest}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            {formData.installmentMonths > 0 && numericAmount > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
                💡 Monthly Principal: {formatCurrency(numericAmount / parseInt(formData.installmentMonths, 10))} / mo
              </div>
            )}
          </div>
        )}

        {/* Integration Toggle */}
        <div style={{ marginTop: '0.75rem', marginBottom: '1rem', background: '#f0fdf4', padding: '0.9rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', margin: 0, fontWeight: 600, color: '#166534' }}>
            <input
              type="checkbox"
              name="createExpenditure"
              checked={formData.createExpenditure}
              onChange={handleChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Also record as an expenditure in Expenditure Log
          </label>

          {formData.createExpenditure && (
            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: '#ffffff', borderRadius: '6px', fontSize: '0.82rem', color: '#374151', border: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span><strong>Category:</strong> {formData.category}</span>
                <span><strong>Method:</strong> Credit Card</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span><strong>Amount:</strong> {formatCurrency(numericAmount)}</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>💳 Credit Purchase (Unsettled)</span>
              </div>
              <p style={{ margin: '0.4rem 0 0 0', color: '#6b7280', fontSize: '0.78rem' }}>
                🛡️ <strong>Ledger Rule:</strong> Bank running balance will NOT be reduced now. It will only be debited when settled via card payment.
              </p>
            </div>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Add Transaction</button>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
