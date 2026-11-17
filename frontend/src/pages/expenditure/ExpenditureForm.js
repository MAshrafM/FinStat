// frontend/src/pages/expenditure/ExpenditureForm.js
import React, { useState, useEffect, useRef } from 'react';
import { formatDateForInput, formatCurrency } from '../../utils/formatters';
import { FaPlus, FaMinus, FaTrash, FaMagic } from 'react-icons/fa';
import './Expenditure.css';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { getRules } from '../../services/categorizationRuleService';
import { getCurrencyPrice } from '../../services/currencyService';
import { useToast } from '../../context/ToastContext';
import { Button, Badge } from '../../components/ui';
import ProtectedAction from '../../components/common/ProtectedAction';

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
  onCancel,
  initialData = {},
  mode = 'create',
  lastRecord = { bank: 0, cash: 0, prepaid: 0 },
}) => {
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;
  const categoryChipsRef = useRef([]);

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

  const handleCategoryKeyDown = (e, index) => {
    const total = EXPENDITURE_CATEGORIES.length;
    let nextIndex = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % total;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = total - 1;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setCategories([EXPENDITURE_CATEGORIES[index].name]);
      return;
    }

    if (nextIndex !== null) {
      const nextCategory = EXPENDITURE_CATEGORIES[nextIndex].name;
      setCategories([nextCategory]);
      if (categoryChipsRef.current[nextIndex]) {
        categoryChipsRef.current[nextIndex].focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isForeign = currency !== 'EGP';
    let value = parseFloat(transactionValue);

    if (isForeign) {
      const fAmount = parseFloat(foreignAmount);
      if (isNaN(fAmount) || fAmount <= 0) {
        if (notify) notify(`Please enter a valid positive foreign amount in ${currency}.`, 'error');
        return;
      }
      const rate = parseFloat(exchangeRate);
      if (isNaN(rate) || rate <= 0) {
        if (notify) notify('Please enter a valid positive exchange rate.', 'error');
        return;
      }
      value = Number((fAmount * rate).toFixed(2));
    } else {
      if (isNaN(value) || value <= 0) {
        if (notify) notify('Please enter a valid positive transaction value.', 'error');
        return;
      }
    }

    if (isSplit) {
      if (splits.length === 0) {
        if (notify) notify('Please add at least one split entry.', 'error');
        return;
      }
      for (const item of splits) {
        const amt = parseFloat(item.amount);
        if (isNaN(amt) || amt <= 0) {
          if (notify) notify('Every split item must have a positive amount.', 'error');
          return;
        }
      }
      if (!isBalanced) {
        if (notify) notify(
          `Sum of split amounts (${totalSplitAmount.toFixed(2)} EGP) must equal total transaction value (${value.toFixed(2)} EGP). Difference: ${splitDifference.toFixed(2)} EGP.`,
          'error'
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
    <form onSubmit={handleSubmit} className="fs-form-container">
      <div className="fs-form-content">
        {/* Card 1: Balances & Transaction Basics */}
        <section className="fs-section-card" aria-labelledby="section-basics-heading">
          <h3 id="section-basics-heading" className="fs-section-title">
            Balances & Basics
          </h3>

          {/* Running Balance Preview Banner */}
          <div className="fs-balance-preview-card" aria-label="Projected Balances">
            <div className="fs-balance-item">
              <span className="fs-balance-label">Bank</span>
              <strong className={`fs-balance-val fs-num ${newBank < 0 ? 'fs-delta--negative' : ''}`}>
                {formatCurrency(newBank)}
              </strong>
            </div>
            <div className="fs-balance-item">
              <span className="fs-balance-label">Cash</span>
              <strong className={`fs-balance-val fs-num ${newCash < 0 ? 'fs-delta--negative' : ''}`}>
                {formatCurrency(newCash)}
              </strong>
            </div>
            <div className="fs-balance-item">
              <span className="fs-balance-label">Prepaid</span>
              <strong className={`fs-balance-val fs-num ${newPrepaid < 0 ? 'fs-delta--negative' : ''}`}>
                {formatCurrency(newPrepaid)}
              </strong>
            </div>
          </div>

          {mode === 'edit' && (
            <div className="edit-mode-notice">
              <p>
                <em>Note: In edit mode, the balances shown reflect the target values after this transaction.</em>
              </p>
            </div>
          )}

          {/* Currency and Transaction Type Side by Side */}
          <div className="fs-grid-2col">
            <div className="fs-field">
              <label htmlFor="expenditure-currency" className="fs-field-label">
                Currency
              </label>
              <select
                id="expenditure-currency"
                className="fs-select"
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

            <div className="fs-field">
              <label htmlFor="transaction-type" className="fs-field-label">
                Transaction Type <span className="fs-req" aria-hidden="true">*</span>
              </label>
              <select
                id="transaction-type"
                className="fs-select"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                required
                aria-required="true"
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
            <div className="fs-field">
              <label htmlFor="transaction-value" className="fs-field-label">
                Transaction Value (EGP) <span className="fs-req" aria-hidden="true">*</span>
              </label>
              <input
                id="transaction-value"
                className="fs-input"
                type="number"
                step="any"
                value={transactionValue}
                onChange={(e) => setTransactionValue(e.target.value)}
                placeholder="Enter amount in EGP"
                required
                aria-required="true"
              />
            </div>
          ) : (
            <>
              <div className="fs-grid-2col">
                <div className="fs-field">
                  <label htmlFor="foreign-amount" className="fs-field-label">
                    Foreign Amount ({currency}) <span className="fs-req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="foreign-amount"
                    className="fs-input"
                    type="number"
                    step="any"
                    value={foreignAmount}
                    onChange={handleForeignAmountChange}
                    placeholder={`Enter amount in ${currency}`}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="fs-field">
                  <label htmlFor="exchange-rate" className="fs-field-label">
                    Exchange Rate (1 {currency} in EGP) <span className="fs-req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="exchange-rate"
                    className="fs-input"
                    type="number"
                    step="any"
                    value={exchangeRate}
                    onChange={handleExchangeRateChange}
                    placeholder="Exchange rate"
                    required
                    aria-required="true"
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
            <div className="fs-field">
              <label htmlFor="withdraw-source" className="fs-field-label">
                Withdraw From
              </label>
              <select
                id="withdraw-source"
                className="fs-select"
                value={withdrawSource}
                onChange={(e) => setWithdrawSource(e.target.value)}
              >
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          )}

          {transactionType === 'T' && (
            <div className="fs-field">
              <label htmlFor="topup-target" className="fs-field-label">
                Top-up Target
              </label>
              <select
                id="topup-target"
                className="fs-select"
                value={topupTarget}
                onChange={(e) => setTopupTarget(e.target.value)}
              >
                <option value="Bank">Bank</option>
                <option value="Prepaid">Prepaid</option>
              </select>
            </div>
          )}

          {transactionType === 'na' && (
            <div className="log-operations">
              <div className="operation-group">
                <h4>Bank</h4>
                <div className="radio-group" role="radiogroup" aria-label="Bank operation">
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
                      aria-label="Deposit to Bank"
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
                      aria-label="Withdraw from Bank"
                    />
                    <FaMinus />
                  </label>
                  <label
                    className={`radio-option option-off ${logBankOp === 'none' ? 'selected-off' : ''}`}
                    title="No change to Bank"
                  >
                    <input
                      type="radio"
                      name="bankOp"
                      value="none"
                      checked={logBankOp === 'none'}
                      onChange={(e) => setLogBankOp(e.target.value)}
                      aria-label="No change to Bank"
                    />
                    Off
                  </label>
                </div>
              </div>

              <div className="operation-group">
                <h4>Cash</h4>
                <div className="radio-group" role="radiogroup" aria-label="Cash operation">
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
                      aria-label="Add to Cash"
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
                      aria-label="Subtract from Cash"
                    />
                    <FaMinus />
                  </label>
                  <label
                    className={`radio-option option-off ${logCashOp === 'none' ? 'selected-off' : ''}`}
                    title="No change to Cash"
                  >
                    <input
                      type="radio"
                      name="cashOp"
                      value="none"
                      checked={logCashOp === 'none'}
                      onChange={(e) => setLogCashOp(e.target.value)}
                      aria-label="No change to Cash"
                    />
                    Off
                  </label>
                </div>
              </div>

              <div className="operation-group">
                <h4>Prepaid</h4>
                <div className="radio-group" role="radiogroup" aria-label="Prepaid operation">
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
                      aria-label="Add to Prepaid"
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
                      aria-label="Subtract from Prepaid"
                    />
                    <FaMinus />
                  </label>
                  <label
                    className={`radio-option option-off ${logPrepaidOp === 'none' ? 'selected-off' : ''}`}
                    title="No change to Prepaid"
                  >
                    <input
                      type="radio"
                      name="prepaidOp"
                      value="none"
                      checked={logPrepaidOp === 'none'}
                      onChange={(e) => setLogPrepaidOp(e.target.value)}
                      aria-label="No change to Prepaid"
                    />
                    Off
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Card 2: Transaction Details & Categorization */}
        <section className="fs-section-card" aria-labelledby="section-details-heading">
          <h3 id="section-details-heading" className="fs-section-title">
            Details & Categorization
          </h3>

          {/* Date */}
          <div className="fs-field">
            <label htmlFor="expenditure-date" className="fs-field-label">
              Date <span className="fs-req" aria-hidden="true">*</span>
            </label>
            <input
              id="expenditure-date"
              className="fs-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          {/* Description & Auto-categorization Suggestion */}
          <div className="fs-field">
            <label htmlFor="expenditure-description" className="fs-field-label">
              Description (Optional Details)
            </label>
            <textarea
              id="expenditure-description"
              className="fs-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              placeholder="e.g. Amazon order, Netflix subscription, supermarket receipt..."
            />

            {suggestedCategory && !isSplit && (
              <div className="fs-rule-pill">
                <span>
                  <FaMagic className="fs-rule-icon" />
                  Auto-categorized as <strong>{suggestedCategory.category}</strong> via rule "{suggestedCategory.ruleName}"
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCategories([suggestedCategory.category])}
                >
                  Apply Category
                </Button>
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
              <span className="fs-split-allocated-text">
                Allocated: {formatCurrency(totalSplitAmount)} / {formatCurrency(numericTxValue)}
              </span>
            )}
          </div>

          {/* If Split Enabled: Dynamic Splits Table */}
          {isSplit ? (
            <div className="fs-split-table-wrapper">
              <table className="fs-split-table">
                <thead>
                  <tr>
                    <th className="col-split-category">Category</th>
                    <th className="col-split-amount">Amount (EGP)</th>
                    <th className="col-split-note">Note</th>
                    <th className="col-split-action"><span className="fs-sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {splits.map((split, index) => (
                    <tr key={index}>
                      <td className="col-split-category">
                        <select
                          className="fs-select"
                          aria-label="Split category"
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
                      <td className="col-split-amount">
                        <input
                          type="number"
                          step="any"
                          className="fs-input"
                          aria-label="Split amount"
                          placeholder="Amount"
                          value={split.amount}
                          onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                          required
                          aria-required="true"
                        />
                      </td>
                      <td className="col-split-note">
                        <input
                          type="text"
                          className="fs-input"
                          aria-label="Split note"
                          placeholder="Note"
                          value={split.description}
                          onChange={(e) => handleSplitChange(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="col-split-action">
                        {splits.length > 1 && (
                          <button
                            type="button"
                            aria-label="Remove split row"
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

              <div className="fs-split-actions-bar">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<FaPlus />}
                  onClick={handleAddSplitRow}
                >
                  Add Split Row
                </Button>

                <div
                  className={`fs-split-balance-bar ${isBalanced ? 'balanced' : 'unbalanced'}`}
                >
                  {isBalanced ? (
                    <span>✓ Splits balanced with transaction value ({formatCurrency(numericTxValue)})</span>
                  ) : (
                    <span>
                      <Badge tone="warning">Allocation</Badge>{' '}
                      Remaining to allocate: <strong>{formatCurrency(Math.abs(splitDifference))}</strong>{' '}
                      ({splitDifference > 0 ? 'under' : 'over'})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* If Single Category: Categories Multi-Tag Picker */
            <div className="fs-field">
              <span id="category-picker-label" className="fs-field-label">
                Category
              </span>
              <div
                className="fs-category-chips-grid"
                role="radiogroup"
                aria-labelledby="category-picker-label"
              >
                {EXPENDITURE_CATEGORIES.map((cat, index) => {
                  const isSelected = categories.includes(cat.name);
                  const hasSelection = EXPENDITURE_CATEGORIES.some((c) => categories.includes(c.name));
                  return (
                    <button
                      key={cat.name}
                      ref={(el) => {
                        categoryChipsRef.current[index] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={isSelected || (!hasSelection && index === 0) ? 0 : -1}
                      className={`filter-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => setCategories([cat.name])}
                      onKeyDown={(e) => handleCategoryKeyDown(e, index)}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Footer Actions */}
        <div className="fs-form-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel || (() => { if (typeof window !== 'undefined' && window.location) { window.location.href = '/expenditures'; } })}
          >
            Cancel
          </Button>
          <ProtectedAction tooltip="View-only access">
            <Button type="submit" variant="primary">
              {mode === 'create' ? 'Create New Log' : 'Save Changes'}
            </Button>
          </ProtectedAction>
        </div>
      </div>
    </form>
  );
};

export default ExpenditureForm;
