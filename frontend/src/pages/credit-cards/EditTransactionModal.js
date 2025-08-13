// frontend/src/pages/credit-cards/EditTransactionModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { updateTransaction } from '../../services/creditCardService';

const EditTransactionModal = ({ isOpen, onClose, transaction, onTransactionUpdated }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'Purchase',
    installmentMonths: '',
    installmentInterest: 0,
  });
  const [error, setError] = useState('');

  // When the modal opens or the transaction prop changes, pre-fill the form
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description || '',
        amount: transaction.amount || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        type: transaction.type || 'Purchase',
        installmentMonths: transaction.installmentDetails?.months || '',
        installmentInterest: transaction.installmentDetails?.interest || 0,
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const dataToSubmit = {
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
      await updateTransaction(transaction._id, dataToSubmit);
      onTransactionUpdated(); // Callback to refresh data
      onClose(); // Close the modal
    } catch (err) {
      setError('Failed to update transaction. Please check the console.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction">
      <form onSubmit={handleSubmit} className="standard-form">
        {/* The form JSX is identical to AddTransactionModal */}
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
        <button type="submit" className="action-button">Save Changes</button>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;
