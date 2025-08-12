// frontend/src/pages/credit-cards/AddTransactionModal.js
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { createTransaction } from '../../services/creditCardService';

const AddTransactionModal = ({ isOpen, onClose, cardId, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Purchase',
    installmentMonths: '',
    installmentInterest: 0,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const dataToSubmit = {
      card: cardId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      type: formData.type,
    };

    if (formData.type === 'Installment') {
      const months = parseInt(formData.installmentMonths);
      if (!months || months <= 0) {
        setError('Installment months must be a positive number.');
        return;
      }
      dataToSubmit.installmentDetails = {
        months: months,
        monthlyPrincipal: parseFloat(formData.amount) / months,
        interest: parseFloat(formData.installmentInterest) || 0,
      };
    }

    try {
      await createTransaction(dataToSubmit);
      onTransactionAdded(); // Callback to refresh data on the parent page
      onClose(); // Close the modal
    } catch (err) {
      setError('Failed to create transaction. Please check the console.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log New Transaction">
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Description</label>
          <input type="text" name="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Total Amount</label>
          <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="Purchase">Standard Purchase</option>
            <option value="Installment">Installment Plan</option>
          </select>
        </div>

        {formData.type === 'Installment' && (
          <>
            <div className="form-group">
              <label>Number of Months</label>
              <input type="number" name="installmentMonths" value={formData.installmentMonths} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Interest Rate (%) (Optional)</label>
              <input type="number" step="0.01" name="installmentInterest" value={formData.installmentInterest} onChange={handleChange} />
            </div>
          </>
        )}
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Add Transaction</button>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
