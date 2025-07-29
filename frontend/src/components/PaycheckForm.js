// frontend/src/components/PaycheckForm.js
import React, { useState } from 'react';
import './PaycheckForm.css'; // We will create this new CSS file

const PaycheckForm = ({ onPaycheckAdded }) => {
  // Get the current month in YYYY-MM format for the default value
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonth);
  const [type, setType] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!month || !amount) {
      alert('Please fill in the month and amount.');
      return;
    }
    onPaycheckAdded({ month, type, amount: Number(amount), note });
    // No need to reset the form here, as we navigate away
  };

  return (
    // The 'form-container' class will be our main styling hook
    <form onSubmit={handleSubmit} className="paycheck-form-container">
      <h3>Add New Paycheck Log</h3>
      
      {/* Each form element is wrapped in a 'form-group' for vertical layout */}
      <div className="form-group">
        <label htmlFor="month">Month</label>
        <input
          id="month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
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
        <input
          id="amount"
          type="number"
          placeholder="e.g., 1500.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="note">Note</label>
        <input
          id="note"
          type="text"
          placeholder="e.g., 'Monthly Salary'"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button type="submit" className="submit-button">Add Paycheck</button>
    </form>
  );
};

export default PaycheckForm;
