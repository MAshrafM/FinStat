// frontend/src/pages/credit-cards/EditCardModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { updateCard } from '../../services/creditCardService';

const EditCardModal = ({ isOpen, onClose, card, onCardUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    limit: '',
    billingCycleDay: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (card) {
      setFormData({
        name: card.name || '',
        bank: card.bank || '',
        limit: card.limit !== undefined ? card.limit.toString() : '',
        billingCycleDay: card.billingCycleDay !== undefined ? card.billingCycleDay.toString() : '',
      });
      setError('');
    }
  }, [card]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!card || !card._id) return;
    setError('');

    const day = parseInt(formData.billingCycleDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setError('Billing Cycle Day must be between 1 and 31.');
      return;
    }

    const limitVal = parseFloat(formData.limit);
    if (isNaN(limitVal) || limitVal < 0) {
      setError('Please enter a valid credit limit.');
      return;
    }

    try {
      const dataToSubmit = {
        name: formData.name,
        bank: formData.bank,
        limit: limitVal,
        billingCycleDay: day,
      };

      const res = await updateCard(card._id, dataToSubmit);
      if (res && res.msg && !res._id) {
        setError(res.msg);
        return;
      }

      onCardUpdated(res);
      onClose();
    } catch (err) {
      setError('Failed to update credit card details.');
      console.error("Failed to update card:", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Credit Card Details">
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label>Card Name / Nickname</label>
          <input
            type="text"
            name="name"
            placeholder="e.g., Visa Gold, Everyday Card"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Bank</label>
          <input
            type="text"
            name="bank"
            placeholder="e.g., CIB, NBE"
            value={formData.bank}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Credit Limit</label>
          <input
            type="number"
            step="any"
            name="limit"
            placeholder="e.g., 50000"
            value={formData.limit}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Billing Cycle Day</label>
          <input
            type="number"
            name="billingCycleDay"
            placeholder="Day of the month (1-31)"
            value={formData.billingCycleDay}
            onChange={handleChange}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Save Changes</button>
      </form>
    </Modal>
  );
};

export default EditCardModal;
