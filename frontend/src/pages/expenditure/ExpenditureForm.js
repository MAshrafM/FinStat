// frontend/src/pages/expenditure/ExpenditureForm.js
import React, { useState, useEffect } from 'react';
import { formatDateForInput, formatCurrency } from '../../utils/formatters';
import '../../components/Form.css'; // Reuse form styles
import { FaPlus, FaMinus, FaTrash, FaMagic } from 'react-icons/fa';
import './Expenditure.css'; // For new styles
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { getRules } from '../../services/categorizationRuleService';
import { getCurrencyPrice } from '../../services/currencyService';

export const CURRENCY_OPTIONS = [
  { code: 'EGP', label: 'EGP (Egyptian Pound)' },
  { code: 'USD', label: 'USD (US Dollar)' },
  { code: 'EUR', label: 'EUR (Euro)' },
  { code: 'GBP', label: 'GBP (British Pound)' },
  { code: 'SAR', label: 'SAR (Saudi Riyal)' },
  { code: 'AED', label: 'AED (UAE Dirham)' },
  { code: 'KWD', label: 'KWD (Kuwaiti Dinar)' },
  { code: 'CAD', label: 'CAD (Canadian Dollar)' },
  { code: 'JPY', label: 'JPY (Japanese Yen)' },
  { code: 'CHF', label: 'CHF (Swiss Franc)' },
  { code: 'QAR', label: 'QAR (Qatari Riyal)' },
];

export const DEFAULT_RATES = {
  USD: 48.5,
  EUR: 52.5,
  GBP: 63.0,
  SAR: 12.95,
  AED: 13.2,
  KWD: 158.0,
  CAD: 35.5,
  JPY: 0.32,
  CHF: 55.0,
  QAR: 13.3,
};

const ExpenditureForm = ({
  onSubmit,
  initialData = {},
  mode = 'create',
  lastRecord = { bank: 0, cash: 0, prepaid: 0 },
}) => {
  // Currency and FX state
  const [currency, setCurrency] = useState('EGP');
  const [foreignAmount, setForeignAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [liveRates, setLiveRates] = useState({});

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

  // Split transaction state
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState([
    { category: EXPENDITURE_CATEGORIES[0]?.name || 'Groceries', amount: '', description: '' },
    { category: EXPENDITURE_CATEGORIES[1]?.name || 'Food & Dining', amount: '', description: '' },
  ]);

  // Rules & Auto-categorization state
  const [activeRules, setActiveRules] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState(null);

  useEffect(() => {
    let isMounted = true;
    // Load active rules for auto-categorization suggestions
    getRules(1, 100, true)
      .then((res) => {
        if (isMounted) setActiveRules(res?.data || []);
      })
      .catch(() => {
        if (isMounted) setActiveRules([]);
      });

    // Load live CIB exchange rates
    getCurrencyPrice({ suppressToast: true })
      .then((res) => {
        if (!isMounted) return;
        const ratesMap = {};
        const list = Array.isArray(res) ? res : (res?.data || []);
        list.forEach((item) => {
          const code = item.currencyID || item.currency || item.code;
          const rate = Number(item.sellRate ?? item.buyRate ?? item.rate ?? 0);
          if (code && rate > 0) {
            ratesMap[code.toUpperCase()] = rate;
          }
        });
        setLiveRates((prev) => ({ ...prev, ...ratesMap }));
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setDate(formatDateForInput(initialData.date));
      setTransactionType(initialData.transactionType || 'W');
      setCategories(
        initialData.categories && initialData.categories.length > 0
          ? initialData.categories
          : ['Other']
      );
      setDescription(initialData.description || '');
      if (initialData.logBankOp) setLogBankOp(initialData.logBankOp);
      if (initialData.logCashOp) setLogCashOp(initialData.logCashOp);
      if (initialData.logPrepaidOp) setLogPrepaidOp(initialData.logPrepaidOp);

      const initCurr = (initialData.currency || 'EGP').toUpperCase();
      setCurrency(initCurr);

      if (initialData.foreignAmount !== undefined && initialData.foreignAmount !== null) {
        setForeignAmount(initialData.foreignAmount.toString());
      } else {
        setForeignAmount('');
      }

      if (initialData.exchangeRateSnapshot && Number(initialData.exchangeRateSnapshot) > 0) {
        setExchangeRate(Number(initialData.exchangeRateSnapshot));
      } else if (initCurr !== 'EGP') {
        const r = liveRates[initCurr] || DEFAULT_RATES[initCurr] || 1;
        setExchangeRate(r);
      } else {
        setExchangeRate(1);
      }

      if (initialData.transactionValue !== undefined) {
        setTransactionValue(initialData.transactionValue.toString());
      }

      if (initialData.splits && Array.isArray(initialData.splits) && initialData.splits.length > 0) {
        setIsSplit(true);
        setSplits(
          initialData.splits.map((s) => ({
            category: s.category,
            amount: s.amount.toString(),
            description: s.description || '',
          }))
        );
      }
    }
  }, [initialData, mode, liveRates]);

  const handleCurrencyChange = (e) => {
    const newCurr = e.target.value;
    setCurrency(newCurr);

    if (newCurr === 'EGP') {
      setForeignAmount('');
      setExchangeRate(1);
    } else {
      const targetRate = liveRates[newCurr] || DEFAULT_RATES[newCurr] || 1;
      setExchangeRate(targetRate);
      if (foreignAmount) {
        const amt = parseFloat(foreignAmount) || 0;
        const egpEquivalent = Number((amt * targetRate).toFixed(2));
        setTransactionValue(egpEquivalent > 0 ? egpEquivalent.toString() : '');
      }
    }
  };

  const handleForeignAmountChange = (e) => {
    const val = e.target.value;
    setForeignAmount(val);
    const num = parseFloat(val) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const egp = Number((num * rate).toFixed(2));
    setTransactionValue(num > 0 ? egp.toString() : '');
  };

  const handleExchangeRateChange = (e) => {
    const newRate = e.target.value;
    setExchangeRate(newRate);
    const rateNum = parseFloat(newRate) || 0;
    const num = parseFloat(foreignAmount) || 0;
    const egp = Number((num * rateNum).toFixed(2));
    setTransactionValue(num > 0 && rateNum > 0 ? egp.toString() : '');
  };

  // Real-time converted EGP equivalent
  const numericForeignAmount = parseFloat(foreignAmount) || 0;
  const numericExchangeRate = parseFloat(exchangeRate) || 0;
  const convertedEgpValue =
    currency !== 'EGP'
      ? Number((numericForeignAmount * numericExchangeRate).toFixed(2))
      : parseFloat(transactionValue) || 0;

  // Evaluate rules in real-time when description changes
  useEffect(() => {
    if (!description || description.trim() === '' || isSplit || activeRules.length === 0) {
      setSuggestedCategory(null);
      return;
    }

    const lowerDesc = description.toLowerCase();
    for (const rule of activeRules) {
      const targetVal = (rule.field === 'paymentMethod' ? withdrawSource : lowerDesc).toLowerCase();
      const ruleVal = (rule.value || '').toLowerCase();

      let matched = false;
      if (rule.operator === 'contains') matched = targetVal.includes(ruleVal);
      else if (rule.operator === 'equals') matched = targetVal === ruleVal;
      else if (rule.operator === 'startsWith') matched = targetVal.startsWith(ruleVal);
      else if (rule.operator === 'endsWith') matched = targetVal.endsWith(ruleVal);

      if (matched) {
        setSuggestedCategory({ category: rule.category, ruleName: rule.name });
        return;
      }
    }
    setSuggestedCategory(null);
  }, [description, withdrawSource, isSplit, activeRules]);

  // Calculate new totals based on transaction type
  const calculateNewTotals = () => {
    const value = parseFloat(transactionValue) || 0;

    if (mode === 'edit') {
      return {
        newBank: initialData.bank || 0,
        newCash: initialData.cash || 0,
        newPrepaid: initialData.prepaid || 0,
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
          newPrepaid += value;
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
        if (logBankOp === '+') newBank += value;
        else if (logBankOp === '-') newBank -= value;
        if (logCashOp === '+') newCash += value;
        else if (logCashOp === '-') newCash -= value;
        if (logPrepaidOp === '+') newPrepaid += value;
        else if (logPrepaidOp === '-') newPrepaid -= value;
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
    return 'Bank';
  };

  // Split Calculations
  const numericTxValue = parseFloat(transactionValue) || 0;
  const totalSplitAmount = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const splitDifference = Math.round((numericTxValue - totalSplitAmount) * 100) / 100;
  const isBalanced = numericTxValue > 0 && Math.abs(splitDifference) < 0.01;

  const handleAddSplitRow = () => {
    setSplits([
      ...splits,
      { category: EXPENDITURE_CATEGORIES[0]?.name || 'Groceries', amount: '', description: '' },
    ]);
  };

  const handleRemoveSplitRow = (index) => {
    if (splits.length <= 1) return;
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSplitChange = (index, field, value) => {
    const updated = [...splits];
    updated[index][field] = value;
    setSplits(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isForeign = currency !== 'EGP';
    let value = parseFloat(transactionValue);

    if (isForeign) {
      const fAmount = parseFloat(foreignAmount);
      if (isNaN(fAmount) || fAmount <= 0) {
        alert(`Please enter a valid positive foreign amount in ${currency}.`);
        return;
      }
      const rate = parseFloat(exchangeRate);
      if (isNaN(rate) || rate <= 0) {
        alert('Please enter a valid positive exchange rate.');
        return;
      }
      value = Number((fAmount * rate).toFixed(2));
    } else {
      if (isNaN(value) || value <= 0) {
        alert('Please enter a valid positive transaction value.');
        return;
      }
    }

    if (isSplit) {
      if (splits.length === 0) {
        alert('Please add at least one split entry.');
        return;
      }
      for (const item of splits) {
        const amt = parseFloat(item.amount);
        if (isNaN(amt) || amt <= 0) {
          alert('Every split item must have a positive amount.');
          return;
        }
      }
      if (!isBalanced) {
        alert(
          `Sum of split amounts (${totalSplitAmount.toFixed(2)} EGP) must equal total transaction value (${value.toFixed(2)} EGP). Difference: ${splitDifference.toFixed(2)} EGP.`
        );
        return;
      }
    }

    const dataToSubmit = {
      date,
      bank: newBank,
      cash: newCash,
      prepaid: newPrepaid,
      transactionValue: value,
      currency,
      transactionType,
      paymentMethod: getPaymentMethod(),
      logBankOp: transactionType === 'na' ? logBankOp : undefined,
      logCashOp: transactionType === 'na' ? logCashOp : undefined,
      logPrepaidOp: transactionType === 'na' ? logPrepaidOp : undefined,
      description,
    };

    if (isForeign) {
      dataToSubmit.foreignAmount = parseFloat(foreignAmount);
      dataToSubmit.exchangeRateSnapshot = parseFloat(exchangeRate);
    }

    if (isSplit) {
      dataToSubmit.splits = splits.map((s) => ({
        category: s.category,
        amount: parseFloat(s.amount),
        description: s.description || '',
      }));
      dataToSubmit.categories = Array.from(new Set(splits.map((s) => s.category)));
    } else {
      dataToSubmit.categories = categories.length > 0 ? categories : ['Other'];
      dataToSubmit.splits = [];
    }

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="paycheck-form-container" style={{ maxWidth: '750px' }}>
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

      {/* Currency and Transaction Type Side by Side */}
      <div className="value-type-row">
        <div className="form-group">
          <label htmlFor="expenditure-currency">Currency</label>
          <select
            id="expenditure-currency"
            value={currency}
            onChange={handleCurrencyChange}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-type">Transaction Type</label>
          <select
            id="transaction-type"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            required
          >
            <option value="W">Withdraw</option>
            <option value="T">Top-up</option>
            <option value="S">Saving</option>
            <option value="na">Log / Transfer</option>
          </select>
        </div>
      </div>

      {/* Amount Section: Base Currency (EGP) vs Foreign Currency */}
      {currency === 'EGP' ? (
        <div className="form-group">
          <label htmlFor="transaction-value">Transaction Value (EGP)</label>
          <input
            id="transaction-value"
            type="number"
            step="any"
            value={transactionValue}
            onChange={(e) => setTransactionValue(e.target.value)}
            placeholder="Enter amount in EGP"
            required
          />
        </div>
      ) : (
        <>
          <div className="value-type-row">
            <div className="form-group">
              <label htmlFor="foreign-amount">
                Foreign Amount ({currency})
              </label>
              <input
                id="foreign-amount"
                type="number"
                step="any"
                value={foreignAmount}
                onChange={handleForeignAmountChange}
                placeholder={`Enter amount in ${currency}`}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exchange-rate">
                Exchange Rate (1 {currency} in EGP)
              </label>
              <input
                id="exchange-rate"
                type="number"
                step="any"
                value={exchangeRate}
                onChange={handleExchangeRateChange}
                placeholder="Exchange rate"
                required
              />
            </div>
          </div>

          {/* Auto-displayed Converted EGP Equivalent Confirmation */}
          <div className="currency-conversion-card" data-testid="conversion-confirmation-card">
            <div className="conversion-header">
              <span className="conversion-label">Converted EGP Equivalent (Confirmation)</span>
              <span className="rate-badge">
                1 {currency} = {parseFloat(exchangeRate || 0).toFixed(4)} EGP
              </span>
            </div>
            <div className="conversion-value-row">
              <span className="foreign-pill">
                {foreignAmount
                  ? `${parseFloat(foreignAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${currency}`
                  : `0.00 ${currency}`}
              </span>
              <span className="conversion-arrow">→</span>
              <strong className="egp-equivalent" data-testid="converted-egp-value">
                {formatCurrency(convertedEgpValue)}
              </strong>
            </div>
            <div className="conversion-hint">
              This transaction will be recorded in your ledger as <strong>{formatCurrency(convertedEgpValue)}</strong>.
            </div>
          </div>
        </>
      )}

      {/* Conditional Options Based on Transaction Type */}
      {transactionType === 'W' && (
        <div className="form-group">
          <label>Withdraw From</label>
          <select value={withdrawSource} onChange={(e) => setWithdrawSource(e.target.value)}>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
            <option value="Prepaid">Prepaid</option>
          </select>
        </div>
      )}

      {transactionType === 'T' && (
        <div className="form-group">
          <label>Top-up Target</label>
          <select value={topupTarget} onChange={(e) => setTopupTarget(e.target.value)}>
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
                  onChange={(e) => setLogBankOp(e.target.value)}
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
                  onChange={(e) => setLogBankOp(e.target.value)}
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
                  onChange={(e) => setLogBankOp(e.target.value)}
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
                  onChange={(e) => setLogCashOp(e.target.value)}
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
                  onChange={(e) => setLogCashOp(e.target.value)}
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
                  onChange={(e) => setLogCashOp(e.target.value)}
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
                  onChange={(e) => setLogPrepaidOp(e.target.value)}
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
                  onChange={(e) => setLogPrepaidOp(e.target.value)}
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
                  onChange={(e) => setLogPrepaidOp(e.target.value)}
                />
                Off
              </label>
            </div>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="edit-mode-notice">
          <p>
            <em>Note: In edit mode, the balances shown reflect the target values after this transaction.</em>
          </p>
        </div>
      )}

      <hr className="form-divider" />

      {/* Date */}
      <div className="form-group">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      {/* Description & Auto-categorization Suggestion */}
      <div className="form-group">
        <label>Description (Optional Details)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
          placeholder="e.g. Amazon order, Netflix subscription, supermarket receipt..."
        ></textarea>

        {suggestedCategory && !isSplit && (
          <div className="auto-rule-pill">
            <span>
              <FaMagic style={{ marginRight: '0.4rem', color: '#2563eb' }} />
              Auto-categorized as <strong>{suggestedCategory.category}</strong> via rule "{suggestedCategory.ruleName}"
            </span>
            <button
              type="button"
              className="btn-apply-rule"
              onClick={() => setCategories([suggestedCategory.category])}
            >
              Apply Category
            </button>
          </div>
        )}
      </div>

      {/* Split Transaction Toggle */}
      <div className="split-toggle-container">
        <label className="split-toggle-label">
          <input
            type="checkbox"
            checked={isSplit}
            onChange={(e) => {
              setIsSplit(e.target.checked);
              if (e.target.checked && splits.length === 0) {
                handleAddSplitRow();
              }
            }}
          />
          <span>Split across multiple categories</span>
        </label>
        {isSplit && (
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Allocated: {formatCurrency(totalSplitAmount)} / {formatCurrency(numericTxValue)}
          </span>
        )}
      </div>

      {/* If Split Enabled: Dynamic Splits Table */}
      {isSplit ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <table className="split-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Category</th>
                <th style={{ width: '25%' }}>Amount (EGP)</th>
                <th style={{ width: '25%' }}>Note</th>
                <th style={{ width: '10%' }}></th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split, index) => (
                <tr key={index}>
                  <td>
                    <select
                      className="split-input"
                      value={split.category}
                      onChange={(e) => handleSplitChange(index, 'category', e.target.value)}
                    >
                      {EXPENDITURE_CATEGORIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      className="split-input"
                      placeholder="Amount"
                      value={split.amount}
                      onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="split-input"
                      placeholder="Note"
                      value={split.description}
                      onChange={(e) => handleSplitChange(index, 'description', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {splits.length > 1 && (
                      <button
                        type="button"
                        className="rule-action-btn delete"
                        onClick={() => handleRemoveSplitRow(index)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              onClick={handleAddSplitRow}
            >
              <FaPlus /> Add Split Row
            </button>

            <div
              className={`split-balance-bar ${isBalanced ? 'balanced' : 'unbalanced'}`}
              style={{ margin: 0 }}
            >
              {isBalanced ? (
                <span>✓ Splits balanced with transaction value ({formatCurrency(numericTxValue)})</span>
              ) : (
                <span>
                  ⚠ Remaining to allocate: <strong>{formatCurrency(Math.abs(splitDifference))}</strong>{' '}
                  ({splitDifference > 0 ? 'under' : 'over'})
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* If Single Category: Categories Multi-Tag Picker */
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
            Categories (Select all that apply)
          </label>
          <div className="category-tags-container">
            {EXPENDITURE_CATEGORIES.map((cat) => {
              const isChecked = categories.includes(cat.name);
              return (
                <div
                  key={cat.name}
                  className={`category-tag-checkbox ${isChecked ? 'checked' : ''}`}
                  style={{
                    borderColor: cat.color,
                    backgroundColor: isChecked ? cat.color : 'transparent',
                    color: isChecked ? 'white' : cat.color,
                  }}
                  onClick={() => {
                    setCategories((prev) => {
                      let next;
                      if (prev.includes(cat.name)) {
                        next = prev.filter((c) => c !== cat.name);
                        if (next.length === 0) next = ['Other'];
                      } else {
                        next = [...prev.filter((c) => c !== 'Other'), cat.name];
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
      )}

      <button type="submit" className="submit-button" style={{ marginTop: '1.5rem' }}>
        {mode === 'create' ? 'Create New Log' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ExpenditureForm;