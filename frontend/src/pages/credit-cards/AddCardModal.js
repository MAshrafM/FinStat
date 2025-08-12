// frontend/src/pages/credit-cards/AddCardModal.js
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { createCard } from '../../services/creditCardService';

const AddCardModal = ({ isOpen, onClose, onCardAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    limit: '',
    billingCycleDay: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const day = parseInt(formData.billingCycleDay);
    if (day < 1 || day > 28) {
      setError('Billing Cycle Day must be between 1 and 28.');
      return;
    }

    try {
      // The service function expects numbers, so we parse them
      const dataToSubmit = {
        ...formData,
        limit: parseFloat(formData.limit),
        billingCycleDay: day,
      };
      await createCard(dataToSubmit);
      onCardAdded(); // Callback to refresh the card list on the parent page
      onClose(); // Close the modal
    } catch (err) {
      setError('Failed to create card. Please check the console.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Credit Card">
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Card Name / Nickname</label>
          <input type="text" name="name" placeholder="e.g., Visa Gold, Everyday Card" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Bank</label>
          <input type="text" name="bank" placeholder="e.g., CIB, NBE" value={formData.bank} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Credit Limit</label>
          <input type="number" step="1" name="limit" placeholder="e.g., 50000" value={formData.limit} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Billing Cycle Day</label>
          <input type="number" name="billingCycleDay" placeholder="Day of the month (1-28)" value={formData.billingCycleDay} onChange={handleChange} required />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Add Card</button>
      </form>
    </Modal>
  );
};

export default AddCardModal;
