// frontend/src/components/PaycheckForm.js
import React, { useState, useEffect } from 'react';
import '../../components/Form.css';

// The component now accepts 'onFormSubmit' and optional 'initialData'
const PaycheckForm = ({ onFormSubmit, initialData }) => {
  const [month, setMonth] = useState('');
  const [type, setType] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [insuranceDeduction, setInsuranceDeduction] = useState('');
  const [grossAmount, setGrossAmount] = useState(''); 
  const [taxDeduction, setTaxDeduction] = useState('');

  // Determine if we are in "edit" mode based on presence of initialData
  const isEditMode = Boolean(initialData);

  // If in edit mode, populate the form with existing data
  useEffect(() => {
    if (isEditMode && initialData) {
      setMonth(initialData.month);
      setType(initialData.type);
      setAmount(initialData.amount);
      setNote(initialData.note);
      setInsuranceDeduction(initialData.insuranceDeduction);
      setGrossAmount(initialData.grossAmount);
      setTaxDeduction(initialData.taxDeduction);
    } else {
      // If in create mode, set default month
      const currentMonth = new Date().toISOString().slice(0, 7);
      setMonth(currentMonth);
    }
  }, [initialData, isEditMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!month || !amount) {
      alert('Please fill in the month and amount.');
      return;
    }
    // Call the single, generalized submit handler
    onFormSubmit({ 
      month, type,
      amount: Number(amount),
      note,
      insuranceDeduction: Number(insuranceDeduction),
      grossAmount: Number(grossAmount),
      taxDeduction: Number(taxDeduction),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="paycheck-form-container">
      {/* Change title based on mode */}
      <h3>{isEditMode ? 'Edit Paycheck Log' : 'Add New Paycheck Log'}</h3>
      
      <div className="form-group">
        <label htmlFor="month">Month</label>
        <input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="type">Payment Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Cash">Cash</option>
          <option value="Prepaid">Prepaid</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" placeholder="e.g., 1500.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="note">Note</label>
        <input id="note" type="text" placeholder="e.g., 'Monthly Salary'" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="insuranceDeduction">Insurance Deduction</label>
        <input id="insuranceDeduction" type="number" placeholder='e.g., 100' value={insuranceDeduction} onChange={(e) => setInsuranceDeduction(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="taxDeduction">Tax Deduction</label>
        <input id="taxDeduction" type="number" placeholder='e.g., 100' value={taxDeduction} onChange={(e) => setTaxDeduction(e.target.value)} />
      </div>

      <div className="form-group">
        <label htmlFor="agrossAmount">Gross Amount</label>
        <input id="grossAmount" type="number" placeholder='e.g., 100' value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} />
      </div>

      {/* Change button text based on mode */}
      <button type="submit" className="submit-button">
        {isEditMode ? 'Update Paycheck' : 'Add Paycheck'}
      </button>
    </form>
  );
};

export default PaycheckForm;
