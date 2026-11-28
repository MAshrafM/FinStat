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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!card || !card._id) return;
    setError('');

    const day = parseInt(formData.billingCycleDay, 10);
    if (Number.isNaN(day) || day < 1 || day > 31) {
      setError('Billing Cycle Day must be between 1 and 31.');
      return;
    }

    const limitVal = parseFloat(formData.limit);
    if (Number.isNaN(limitVal) || limitVal < 0) {
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
      console.error('Failed to update card:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Credit Card Details">
      <form onSubmit={handleSubmit} className="cc-modal-form">
        <div className="cc-modal-field">
          <label htmlFor="cc-edit-name">Card Name / Nickname</label>
          <input
            id="cc-edit-name"
            type="text"
            name="name"
            className="cc-modal-input"
            placeholder="e.g., Visa Gold, Everyday Card"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="cc-modal-field">
          <label htmlFor="cc-edit-bank">Bank</label>
          <input
            id="cc-edit-bank"
            type="text"
            name="bank"
            className="cc-modal-input"
            placeholder="e.g., CIB, NBE"
            value={formData.bank}
            onChange={handleChange}
            required
          />
        </div>
        <div className="cc-modal-field">
          <label htmlFor="cc-edit-limit">Credit Limit</label>
          <input
            id="cc-edit-limit"
            type="number"
            step="any"
            name="limit"
            className="cc-modal-input fs-num"
            placeholder="e.g., 50000"
            value={formData.limit}
            onChange={handleChange}
            required
          />
        </div>
        <div className="cc-modal-field">
          <label htmlFor="cc-edit-cycle">Billing Cycle Day</label>
          <input
            id="cc-edit-cycle"
            type="number"
            name="billingCycleDay"
            className="cc-modal-input fs-num"
            placeholder="Day of the month (1-31)"
            value={formData.billingCycleDay}
            onChange={handleChange}
            required
          />
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCardModal;
