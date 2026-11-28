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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const day = parseInt(formData.billingCycleDay, 10);
    if (Number.isNaN(day) || day < 1 || day > 28) {
      setError('Billing Cycle Day must be between 1 and 28.');
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        limit: parseFloat(formData.limit),
        billingCycleDay: day,
      };
      await createCard(dataToSubmit);
      onCardAdded();
      onClose();
    } catch (err) {
      setError('Failed to create card. Please check the console.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Credit Card">
      <form onSubmit={handleSubmit} className="cc-modal-form">
        <div className="cc-modal-field">
          <label htmlFor="cc-add-name">Card Name / Nickname</label>
          <input
            id="cc-add-name"
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
          <label htmlFor="cc-add-bank">Bank</label>
          <input
            id="cc-add-bank"
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
          <label htmlFor="cc-add-limit">Credit Limit</label>
          <input
            id="cc-add-limit"
            type="number"
            step="1"
            name="limit"
            className="cc-modal-input fs-num"
            placeholder="e.g., 50000"
            value={formData.limit}
            onChange={handleChange}
            required
          />
        </div>
        <div className="cc-modal-field">
          <label htmlFor="cc-add-cycle">Billing Cycle Day</label>
          <input
            id="cc-add-cycle"
            type="number"
            name="billingCycleDay"
            className="cc-modal-input fs-num"
            placeholder="Day of the month (1-28)"
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
            Add Card
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCardModal;
