// frontend/src/pages/expenditure/ExpenditureForm.js
import React, { useState, useEffect } from 'react';
import { formatDateForInput } from '../../utils/formatters';
import '../../components/PaycheckForm.css'; // Reuse form styles

const ExpenditureForm = ({ onSubmit, initialData ={}, mode = 'create' }) => {
  console.log(initialData)
  const [formData, setFormData] = useState({
    date: formatDateForInput(new Date()),
    bank: '',
    cash: '',
    transactionType: 'na', // Default value
    description: '',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        date: formatDateForInput(initialData.date),
        bank: initialData.bank || '',
        cash: initialData.cash || '',
        transactionType: initialData.transactionType || 'na',
        description: initialData.description || '',
      });
    }
  }, [initialData, mode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert numeric fields from string to number before submitting
    const dataToSubmit = {
      ...formData,
      bank: Number(formData.bank),
      cash: Number(formData.cash),
    };
    onSubmit(dataToSubmit);
  };

  const transactionTypes = ['W', 'T', 'S', 'na'];

  return (
    <form onSubmit={handleSubmit} className="paycheck-form-container" style={{maxWidth: '600px'}}>
      <h3>{mode === 'create' ? 'Add New Expenditure Log' : 'Edit Expenditure Log'}</h3>
      
      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="bank">Bank</label>
        <input id="bank" type="number" name="bank" value={formData.bank} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="cash">Cash</label>
        <input id="cash" type="number" name="cash" value={formData.cash} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label htmlFor="transactionType">Transaction Type</label>
        <select id="transactionType" name="transactionType" value={formData.transactionType} onChange={handleChange} required>
          {transactionTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
      </div>

      <button type="submit" className="submit-button">
        {mode === 'create' ? 'Add Log' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ExpenditureForm;
