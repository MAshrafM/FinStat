// frontend/src/pages/expenditure/AddExpenditurePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createExpenditure, getLatestExpenditure } from '../../services/expenditureService';
import { formatCurrency, formatDateForInput } from '../../utils/formatters';
import '../../components/PaycheckForm.css'; // Reuse form styles
import './Expenditure.css'; // We'll create this for new styles

const AddExpenditurePage = () => {
  const navigate = useNavigate();

  // State for the last known record
  const [lastRecord, setLastRecord] = useState({ bank: 0, cash: 0 });

  // State for the form inputs
  const [bankChange, setBankChange] = useState(0);
  const [bankOp, setBankOp] = useState('-'); // '+' or '-'
  const [cashChange, setCashChange] = useState(0);
  const [cashOp, setCashOp] = useState('-'); // '+' or '-'
  
  const [transactionType, setTransactionType] = useState('log');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDateForInput(new Date()));

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLatestExpenditure()
      .then(data => {
        if (data) {
          setLastRecord({ bank: data.bank, cash: data.cash });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch latest expenditure:", err);
        setIsLoading(false);
      });
  }, []);

  // Real-time calculation for the new totals
  const newBankTotal = bankOp === '+' ? lastRecord.bank + bankChange : lastRecord.bank - bankChange;
  const newCashTotal = cashOp === '+' ? lastRecord.cash + cashChange : lastRecord.cash - cashChange;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      date,
      bank: newBankTotal,
      cash: newCashTotal,
      transactionType,
      description,
    };
    try {
      await createExpenditure(dataToSubmit);
      navigate('/expenditures');
    } catch (error) {
      console.error("Failed to create expenditure:", error);
    }
  };

  if (isLoading) {
    return <div className="page-container">Loading latest record...</div>;
  }

  return (
    <div className="page-container">
      <form onSubmit={handleSubmit} className="paycheck-form-container" style={{maxWidth: '700px'}}>
        <h3>Create New Expenditure Log (Transactional)</h3>
        
        {/* Bank Section */}
        <div className="transactional-section">
          <h4>Bank</h4>
          <div className="current-value">
            <span>Current:</span>
            <strong>{formatCurrency(lastRecord.bank)}</strong>
          </div>
          <div className="transaction-input">
            <select value={bankOp} onChange={e => setBankOp(e.target.value)}>
              <option value="-">Subtract (-)</option>
              <option value="+">Add (+)</option>
            </select>
            <input type="number" value={bankChange} onChange={e => setBankChange(Number(e.target.value))} />
          </div>
          <div className="new-total">
            <span>New Total:</span>
            <strong>{formatCurrency(newBankTotal)}</strong>
          </div>
        </div>

        {/* Cash Section */}
        <div className="transactional-section">
          <h4>Cash</h4>
          <div className="current-value">
            <span>Current:</span>
            <strong>{formatCurrency(lastRecord.cash)}</strong>
          </div>
          <div className="transaction-input">
            <select value={cashOp} onChange={e => setCashOp(e.target.value)}>
              <option value="-">Subtract (-)</option>
              <option value="+">Add (+)</option>
            </select>
            <input type="number" value={cashChange} onChange={e => setCashChange(Number(e.target.value))} />
          </div>
          <div className="new-total">
            <span>New Total:</span>
            <strong>{formatCurrency(newCashTotal)}</strong>
          </div>
        </div>

        <hr className="form-divider" />

        {/* Other Details Section */}
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Transaction Type</label>
          <select value={transactionType} onChange={e => setTransactionType(e.target.value)} required>
            <option value="W">Withdraw</option>
            <option value="T">Topup</option>
            <option value="S">Saving</option>
            <option value="na">Log</option>
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3"></textarea>
        </div>

        <button type="submit" className="submit-button">Create New Log</button>
      </form>
      <Link to="/expenditures" className="cancel-button" style={{textDecoration: 'none'}}>
        Cancel
      </Link>
    </div>
  );
};

export default AddExpenditurePage;
