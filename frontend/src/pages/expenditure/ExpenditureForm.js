// frontend/src/pages/expenditure/ExpenditureForm.js
import React, { useState, useEffect } from 'react';
import { formatDateForInput, formatCurrency } from '../../utils/formatters';
import '../../components/Form.css'; // Reuse form styles
import { FaPlus, FaMinus } from 'react-icons/fa';
import './Expenditure.css'; // For new styles
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';

const ExpenditureForm = ({ onSubmit, initialData = {}, mode = 'create', lastRecord = { bank: 0, cash: 0, prepaid: 0 } }) => {
  // State for form inputs
  const [transactionValue, setTransactionValue] = useState('');
  const [transactionType, setTransactionType] = useState('W');
  const [withdrawSource, setWithdrawSource] = useState('Bank'); // For W type
  const [topupTarget, setTopupTarget] = useState('Bank'); // For T type
  const [logBankOp, setLogBankOp] = useState('-'); // Default: - from Bank
  const [logCashOp, setLogCashOp] = useState('+'); // Default: + to Cash
  const [logPrepaidOp, setLogPrepaidOp] = useState('none');
  const [categories, setCategories] = useState(['Other']);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDateForInput(new Date()));

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setDate(formatDateForInput(initialData.date));
      setTransactionType(initialData.transactionType || 'W');
      setCategories(initialData.categories && initialData.categories.length > 0 ? initialData.categories : ['Other']);
      setDescription(initialData.description || '');
      if (initialData.logBankOp) setLogBankOp(initialData.logBankOp);
      if (initialData.logCashOp) setLogCashOp(initialData.logCashOp);
      if (initialData.logPrepaidOp) setLogPrepaidOp(initialData.logPrepaidOp);

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
    
    // For edit mode, we want to preserve the original balance snapshot
    if (mode === 'edit') {
      return {
        newBank: initialData.bank || 0,
        newCash: initialData.cash || 0,
        newPrepaid: initialData.prepaid || 0
      };
    }

    let newBank = lastRecord.bank || 0;
    let newCash = lastRecord.cash || 0;
    let newPrepaid = lastRecord.prepaid || 0;

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
      case 'na': // Log / Transfer
        if (logBankOp === '+') {
          newBank += value;
        } else if (logBankOp === '-') {
          newBank -= value;
        }
        if (logCashOp === '+') {
          newCash += value;
        } else if (logCashOp === '-') {
          newCash -= value;
        }
        if (logPrepaidOp === '+') {
          newPrepaid += value;
        } else if (logPrepaidOp === '-') {
          newPrepaid -= value;
        }
        break;
      default:
        break;
    }

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
      paymentMethod: getPaymentMethod(),
      logBankOp: transactionType === 'na' ? logBankOp : undefined,
      logCashOp: transactionType === 'na' ? logCashOp : undefined,
      logPrepaidOp: transactionType === 'na' ? logPrepaidOp : undefined,
      categories: categories.length > 0 ? categories : ['Other'],
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
          <label>Transaction Value</label>
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
            <option value="na">Log / Transfer</option>
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
        <div className="log-operations" style={{ gap: '2rem', flexWrap: 'wrap' }}>
          <div className="operation-group">
            <h4>Bank</h4>
            <div className="radio-group">
              <label
                className={`radio-option ${logBankOp === '+' ? 'selected-plus' : ''}`}
                title="Deposit to Bank"
              >
                <input
                  type="radio"
                  name="bankOp"
                  value="+"
                  checked={logBankOp === '+'}
                  onChange={e => setLogBankOp(e.target.value)}
                />
                <FaPlus />
              </label>
              <label
                className={`radio-option ${logBankOp === '-' ? 'selected-minus' : ''}`}
                title="Withdraw from Bank"
              >
                <input
                  type="radio"
                  name="bankOp"
                  value="-"
                  checked={logBankOp === '-'}
                  onChange={e => setLogBankOp(e.target.value)}
                />
                <FaMinus />
              </label>
              <label
                className={`radio-option ${logBankOp === 'none' ? 'selected-off' : ''}`}
                title="No change to Bank"
                style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <input
                  type="radio"
                  name="bankOp"
                  value="none"
                  checked={logBankOp === 'none'}
                  onChange={e => setLogBankOp(e.target.value)}
                />
                Off
              </label>
            </div>
          </div>

          <div className="operation-group">
            <h4>Cash</h4>
            <div className="radio-group">
              <label
                className={`radio-option ${logCashOp === '+' ? 'selected-plus' : ''}`}
                title="Add to Cash"
              >
                <input
                  type="radio"
                  name="cashOp"
                  value="+"
                  checked={logCashOp === '+'}
                  onChange={e => setLogCashOp(e.target.value)}
                />
                <FaPlus />
              </label>
              <label
                className={`radio-option ${logCashOp === '-' ? 'selected-minus' : ''}`}
                title="Subtract from Cash"
              >
                <input
                  type="radio"
                  name="cashOp"
                  value="-"
                  checked={logCashOp === '-'}
                  onChange={e => setLogCashOp(e.target.value)}
                />
                <FaMinus />
              </label>
              <label
                className={`radio-option ${logCashOp === 'none' ? 'selected-off' : ''}`}
                title="No change to Cash"
                style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <input
                  type="radio"
                  name="cashOp"
                  value="none"
                  checked={logCashOp === 'none'}
                  onChange={e => setLogCashOp(e.target.value)}
                />
                Off
              </label>
            </div>
          </div>

          <div className="operation-group">
            <h4>Prepaid</h4>
            <div className="radio-group">
              <label
                className={`radio-option ${logPrepaidOp === '+' ? 'selected-plus' : ''}`}
                title="Add to Prepaid"
              >
                <input
                  type="radio"
                  name="prepaidOp"
                  value="+"
                  checked={logPrepaidOp === '+'}
                  onChange={e => setLogPrepaidOp(e.target.value)}
                />
                <FaPlus />
              </label>
              <label
                className={`radio-option ${logPrepaidOp === '-' ? 'selected-minus' : ''}`}
                title="Subtract from Prepaid"
              >
                <input
                  type="radio"
                  name="prepaidOp"
                  value="-"
                  checked={logPrepaidOp === '-'}
                  onChange={e => setLogPrepaidOp(e.target.value)}
                />
                <FaMinus />
              </label>
              <label
                className={`radio-option ${logPrepaidOp === 'none' ? 'selected-off' : ''}`}
                title="No change to Prepaid"
                style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <input
                  type="radio"
                  name="prepaidOp"
                  value="none"
                  checked={logPrepaidOp === 'none'}
                  onChange={e => setLogPrepaidOp(e.target.value)}
                />
                Off
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
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>Categories (Select all that apply)</label>
        <div className="category-tags-container">
          {EXPENDITURE_CATEGORIES.map(cat => {
            const isChecked = categories.includes(cat.name);
            return (
              <div
                key={cat.name}
                className={`category-tag-checkbox ${isChecked ? 'checked' : ''}`}
                style={{
                  borderColor: cat.color,
                  backgroundColor: isChecked ? cat.color : 'transparent',
                  color: isChecked ? 'white' : cat.color
                }}
                onClick={() => {
                  setCategories(prev => {
                    let next;
                    if (prev.includes(cat.name)) {
                      next = prev.filter(c => c !== cat.name);
                      if (next.length === 0) next = ['Other'];
                    } else {
                      next = [...prev.filter(c => c !== 'Other'), cat.name];
                    }
                    return next;
                  });
                }}
              >
                {cat.name}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>Description (Optional Details)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows="3"
          placeholder="Enter transaction details..."
        ></textarea>
      </div>

      <button type="submit" className="submit-button">
        {mode === 'create' ? 'Create New Log' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ExpenditureForm;