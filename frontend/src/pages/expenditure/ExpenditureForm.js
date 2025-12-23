// frontend/src/pages/expenditure/ExpenditureForm.js
import React, { useState, useEffect } from 'react';
import { formatDateForInput, formatCurrency } from '../../utils/formatters';
import '../../components/Form.css'; // Reuse form styles
import { FaPlus, FaMinus } from 'react-icons/fa';
import './Expenditure.css'; // For new styles

const ExpenditureForm = ({ onSubmit, initialData = {}, mode = 'create', lastRecord = { bank: 0, cash: 0, prepaid: 0 } }) => {
  // State for form inputs
  const [transactionValue, setTransactionValue] = useState('');
  const [transactionType, setTransactionType] = useState('W');
  const [withdrawSource, setWithdrawSource] = useState('Bank'); // For W type
  const [topupTarget, setTopupTarget] = useState('Bank'); // For T type
  const [logBankOp, setLogBankOp] = useState('+'); // For 'na' type
  const [logCashOp, setLogCashOp] = useState('+'); // For 'na' type
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDateForInput(new Date()));

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setDate(formatDateForInput(initialData.date));
      setTransactionType(initialData.transactionType || 'W');
      setDescription(initialData.description || '');

      // For edit mode, calculate transaction value from the difference
      // This is a simplified approach - you might need to adjust based on your data structure
      if (initialData.transactionValue !== undefined) {
        setTransactionValue(initialData.transactionValue.toString());
      }
    }
  }, [initialData, mode]);

  // Calculate new totals based on transaction type
  const calculateNewTotals = () => {
    const value = parseFloat(transactionValue) || 0;
    //let newBank = mode === 'create' ? lastRecord.bank : (initialData.bank || 0);
    //let newCash = mode === 'create' ? lastRecord.cash : (initialData.cash || 0);
    let newBank = lastRecord.bank ? lastRecord.bank : (initialData.bank || 0);
    let newCash = lastRecord.cash ? lastRecord.cash : (initialData.cash || 0);
    let newPrepaid = lastRecord.prepaid ? lastRecord.prepaid : (initialData.prepaid || 0);
    // Only calculate changes for create mode
    //if (mode === 'create') {
    switch (transactionType) {
      case 'T': // Top-up
        if (topupTarget === 'Bank') {
          newBank += value;
        } else {
          newPrepaid += value; // Top-up Prepaid
        }
        break;
      case 'S': // Saving
        newBank -= value;
        break;
      case 'W': // Withdraw
        if (withdrawSource === 'Bank') {
          newBank -= value;
        } else if (withdrawSource === 'Cash') {
          newCash -= value;
        } else {
          newPrepaid -= value;
        }
        break;
      case 'na': // Log
        if (logBankOp === '+') {
          newBank += value;
        } else {
          newBank -= value;
        }
        if (logCashOp === '+') {
          newCash += value;
        } else {
          newCash -= value;
        }
        break;
      default:
        break;
    }
    //}

    return { newBank, newCash, newPrepaid };
  };

  const { newBank, newCash, newPrepaid } = calculateNewTotals();

  // Determine paymentMethod based on transaction details
  const getPaymentMethod = () => {
    if (transactionType === 'W') return withdrawSource;
    if (transactionType === 'T') return topupTarget;
    return 'Bank'; // Default/Fallback
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = parseFloat(transactionValue);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid positive transaction value.');
      return;
    }

    const dataToSubmit = {
      date,
      bank: newBank,
      cash: newCash,
      prepaid: newPrepaid,
      transactionValue: value,
      transactionType,
      transactionValue: value,
      transactionType,
      paymentMethod: getPaymentMethod(),
      description,
    };

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="paycheck-form-container" style={{ maxWidth: '700px' }}>
      <h3>{mode === 'create' ? 'Create New Expenditure Log' : 'Edit Expenditure Log'}</h3>

      {/* Current/Target Balances Display */}
      <div className="current-balances">
        <div className="balance-item">
          <span>Bank</span>
          <strong style={{ color: newBank >= 0 ? 'green' : 'red' }}>
            {formatCurrency(newBank)}
          </strong>
        </div>
        <div className="balance-item">
          <span>Cash</span>
          <strong style={{ color: newCash >= 0 ? 'green' : 'red' }}>
            {formatCurrency(newCash)}
          </strong>
        </div>
        <div className="balance-item">
          <span>Prepaid</span>
          <strong style={{ color: newPrepaid >= 0 ? 'green' : 'red' }}>
            {formatCurrency(newPrepaid)}
          </strong>
        </div>
      </div>

      <hr className="form-divider" />

      {/* Transaction Value and Type Side by Side */}
      <div className="value-type-row">
        <div className="form-group">
          <label>Transaction Value'</label>
          <input
            type="number"
            value={transactionValue}
            onChange={e => setTransactionValue(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="form-group">
          <label>Transaction Type</label>
          <select
            value={transactionType}
            onChange={e => setTransactionType(e.target.value)}
            required
          >
            <option value="W">Withdraw</option>
            <option value="T">Top-up</option>
            <option value="S">Saving</option>
            <option value="na">Log</option>
          </select>
        </div>
      </div>

      {/* Conditional Options Based on Transaction Type */}
      {transactionType === 'W' && (
        <div className="form-group">
          <label>Withdraw From</label>
          <select value={withdrawSource} onChange={e => setWithdrawSource(e.target.value)}>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
            <option value="Prepaid">Prepaid</option>
          </select>
        </div>
      )}

      {transactionType === 'T' && (
        <div className="form-group">
          <label>Top-up Target</label>
          <select value={topupTarget} onChange={e => setTopupTarget(e.target.value)}>
            <option value="Bank">Bank</option>
            <option value="Prepaid">Prepaid</option>
          </select>
        </div>
      )}

      {transactionType === 'na' && (
        <div className="log-operations">
          <div className="operation-group">
            <h4>Bank Operation</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="bankOp"
                  value="+"
                  checked={logBankOp === '+'}
                  onChange={e => setLogBankOp(e.target.value)}
                />
                <FaPlus />
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="bankOp"
                  value="-"
                  checked={logBankOp === '-'}
                  onChange={e => setLogBankOp(e.target.value)}
                />
                <FaMinus />
              </label>
            </div>
          </div>

          <div className="operation-group">
            <h4>Cash Operation</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="cashOp"
                  value="+"
                  checked={logCashOp === '+'}
                  onChange={e => setLogCashOp(e.target.value)}
                />
                <FaPlus />
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="cashOp"
                  value="-"
                  checked={logCashOp === '-'}
                  onChange={e => setLogCashOp(e.target.value)}
                />
                <FaMinus />
              </label>
            </div>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="edit-mode-notice">
          <p><em>Note: In edit mode, the balances shown reflect the target values after this transaction.</em></p>
        </div>
      )}

      <hr className="form-divider" />

      {/* Date and Description */}
      <div className="form-group">
        <label>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows="3"
          placeholder="Enter transaction description..."
        ></textarea>
      </div>

      <button type="submit" className="submit-button">
        {mode === 'create' ? 'Create New Log' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ExpenditureForm;