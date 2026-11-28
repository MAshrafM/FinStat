// frontend/src/pages/credit-cards/AddTransactionModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { createTransaction } from '../../services/creditCardService';
import { getCurrencyPrice } from '../../services/currencyService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { EXPENDITURE_CATEGORIES } from '../../constants/categories';
import { formatCurrency } from '../../utils/formatters';
import { CURRENCY_OPTIONS, DEFAULT_RATES } from '../expenditure/ExpenditureForm';
import Badge from '../../components/ui/Badge';

const AddTransactionModal = ({ isOpen, onClose, cardId, onTransactionAdded }) => {
  const { showToast } = useToast();
  let authContext = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authContext = useAuth();
  } catch (e) {
    // Graceful fallback for test environments without AuthProvider
  }
  const isAdmin = authContext.isAdmin || authContext.user?.role === 'admin';

  const [currency, setCurrency] = useState('EGP');
  const [foreignAmount, setForeignAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [liveRates, setLiveRates] = useState({});

  const [formData, setFormData] = useState({
    description: '',
    category: 'Groceries',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Purchase',
    createExpenditure: true,
    installmentMonths: '',
    installmentInterest: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
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
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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
        const egp = Number((amt * targetRate).toFixed(2));
        setFormData((prev) => ({ ...prev, amount: egp > 0 ? egp.toString() : '' }));
      }
    }
  };

  const handleForeignAmountChange = (e) => {
    const val = e.target.value;
    setForeignAmount(val);
    const num = parseFloat(val) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const egp = Number((num * rate).toFixed(2));
    setFormData((prev) => ({ ...prev, amount: num > 0 ? egp.toString() : '' }));
  };

  const handleExchangeRateChange = (e) => {
    const newRate = e.target.value;
    setExchangeRate(newRate);
    const rateNum = parseFloat(newRate) || 0;
    const num = parseFloat(foreignAmount) || 0;
    const egp = Number((num * rateNum).toFixed(2));
    setFormData((prev) => ({ ...prev, amount: num > 0 && rateNum > 0 ? egp.toString() : '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const numericForeign = parseFloat(foreignAmount) || 0;
  const numericRate = parseFloat(exchangeRate) || 0;
  const convertedEgpValue =
    currency !== 'EGP'
      ? Number((numericForeign * numericRate).toFixed(2))
      : parseFloat(formData.amount) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isForeign = currency !== 'EGP';
    let finalAmount = parseFloat(formData.amount);

    if (isForeign) {
      const parsedForeign = parseFloat(foreignAmount);
      if (Number.isNaN(parsedForeign) || parsedForeign <= 0) {
        setError(`Please enter a valid positive foreign amount in ${currency}.`);
        return;
      }
      const parsedRate = parseFloat(exchangeRate);
      if (Number.isNaN(parsedRate) || parsedRate <= 0) {
        setError('Please enter a valid positive exchange rate.');
        return;
      }
      finalAmount = Number((parsedForeign * parsedRate).toFixed(2));
    } else if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    const dataToSubmit = {
      card: cardId,
      description: formData.description,
      category: formData.category,
      amount: finalAmount,
      currency,
      date: formData.date,
      type: formData.type,
      createExpenditure: formData.createExpenditure,
    };

    if (isForeign) {
      dataToSubmit.foreignAmount = parseFloat(foreignAmount);
      dataToSubmit.exchangeRateSnapshot = parseFloat(exchangeRate);
    }

    if (formData.type === 'Installment') {
      const months = parseInt(formData.installmentMonths, 10);
      if (!months || months <= 0) {
        setError('Installment months must be a positive number.');
        return;
      }
      dataToSubmit.installmentDetails = {
        months,
        monthlyPrincipal: finalAmount / months,
        interest: parseFloat(formData.installmentInterest) || 0,
      };
    }

    try {
      await createTransaction(dataToSubmit);
      showToast('Transaction logged successfully', 'success');
      onTransactionAdded();
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create transaction.');
      console.error(err);
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      category: 'Groceries',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Purchase',
      createExpenditure: true,
      installmentMonths: '',
      installmentInterest: 0,
    });
    setCurrency('EGP');
    setForeignAmount('');
    setExchangeRate(1);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log New Card Transaction">
      <form onSubmit={handleSubmit} className="cc-modal-form">
        <div className="cc-modal-field">
          <label htmlFor="card-description">Merchant / Description</label>
          <input
            id="card-description"
            type="text"
            name="description"
            className="cc-modal-input"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Carrefour Hypermarket"
            required
          />
        </div>

        <div className="cc-modal-field">
          <label htmlFor="card-category">Category (Real Expenditure Category)</label>
          <select
            id="card-category"
            name="category"
            className="cc-modal-select"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {EXPENDITURE_CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selector */}
        <div className="cc-modal-field">
          <label htmlFor="card-currency">Currency</label>
          <select
            id="card-currency"
            name="currency"
            className="cc-modal-select"
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

        {/* Amount Inputs: Base EGP vs Foreign Currency */}
        {currency === 'EGP' ? (
          <div className="cc-modal-field">
            <label htmlFor="card-amount">Total Amount (EGP)</label>
            <input
              id="card-amount"
              type="number"
              step="0.01"
              name="amount"
              className="cc-modal-input fs-num"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
        ) : (
          <>
            <div className="cc-modal-row">
              <div className="cc-modal-field">
                <label htmlFor="card-foreign-amount">Amount ({currency})</label>
                <input
                  id="card-foreign-amount"
                  type="number"
                  step="any"
                  className="cc-modal-input fs-num"
                  value={foreignAmount}
                  onChange={handleForeignAmountChange}
                  placeholder={`Enter amount in ${currency}`}
                  required
                />
              </div>

              <div className="cc-modal-field">
                <label htmlFor="card-exchange-rate">Exchange Rate (1 {currency} in EGP)</label>
                <input
                  id="card-exchange-rate"
                  type="number"
                  step="any"
                  className="cc-modal-input fs-num"
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  placeholder="Exchange rate"
                  disabled={!isAdmin}
                  required
                />
                <small className="cc-modal-hint">
                  Rate is approximate for historical dates — actual rate is locked at save time based on transaction date.
                </small>
              </div>
            </div>

            {/* Auto-displayed Converted EGP Equivalent Confirmation */}
            <div className="cc-conversion-card" data-testid="conversion-confirmation-card">
              <div className="cc-conversion-header">
                <span className="cc-conversion-label">Converted EGP Equivalent (Confirmation)</span>
                <Badge tone="neutral">
                  <span className="fs-num">1 {currency} = {parseFloat(exchangeRate || 0).toFixed(4)} EGP</span>
                </Badge>
              </div>
              <div className="cc-conversion-value-row">
                <span className="cc-foreign-pill fs-num">
                  {foreignAmount
                    ? `${parseFloat(foreignAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} ${currency}`
                    : `0.00 ${currency}`}
                </span>
                <span className="cc-conversion-arrow" aria-hidden="true">-&gt;</span>
                <strong className="cc-egp-equivalent fs-num" data-testid="converted-egp-value">
                  {formatCurrency(convertedEgpValue)}
                </strong>
              </div>
              <div className="cc-modal-note">
                This transaction will be recorded on your card statement as{' '}
                <strong className="fs-num">{formatCurrency(convertedEgpValue)}</strong>.
              </div>
            </div>
          </>
        )}

        <div className="cc-modal-field">
          <label htmlFor="card-date">Date</label>
          <input
            id="card-date"
            type="date"
            name="date"
            className="cc-modal-input fs-num"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="cc-modal-field">
          <label htmlFor="card-type">Transaction Type</label>
          <select
            id="card-type"
            name="type"
            className="cc-modal-select"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="Purchase">Standard Purchase</option>
            <option value="Installment">Installment Plan</option>
          </select>
        </div>

        {formData.type === 'Installment' && (
          <div className="cc-modal-panel">
            <div className="cc-modal-field">
              <label htmlFor="card-installment-months">Number of Months</label>
              <input
                id="card-installment-months"
                type="number"
                name="installmentMonths"
                className="cc-modal-input fs-num"
                value={formData.installmentMonths}
                onChange={handleChange}
                placeholder="e.g. 12"
                required
              />
            </div>
            <div className="cc-modal-field">
              <label htmlFor="card-installment-interest">Interest Rate (%) (Optional)</label>
              <input
                id="card-installment-interest"
                type="number"
                step="0.01"
                name="installmentInterest"
                className="cc-modal-input fs-num"
                value={formData.installmentInterest}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            {formData.installmentMonths > 0 && convertedEgpValue > 0 && (
              <div className="cc-modal-kv">
                Monthly Principal:{' '}
                <strong className="fs-num">
                  {formatCurrency(convertedEgpValue / parseInt(formData.installmentMonths, 10))} / mo
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Integration Toggle */}
        <div className="cc-modal-panel">
          <label className="cc-modal-check-label" htmlFor="card-create-expenditure">
            <input
              id="card-create-expenditure"
              type="checkbox"
              name="createExpenditure"
              className="cc-modal-checkbox"
              checked={formData.createExpenditure}
              onChange={handleChange}
            />
            Also record as an expenditure in Expenditure Log
          </label>

          {formData.createExpenditure && (
            <div className="cc-modal-panel-inner">
              <div className="cc-modal-kv">
                <span><strong>Category:</strong> {formData.category}</span>
                <span><strong>Method:</strong> Credit Card</span>
              </div>
              <div className="cc-modal-kv">
                <span>
                  <strong>Amount:</strong> <span className="fs-num">{formatCurrency(convertedEgpValue)}</span>
                  {currency !== 'EGP' && foreignAmount && (
                    <span className="fs-num">
                      {' '}({parseFloat(foreignAmount).toLocaleString()} {currency})
                    </span>
                  )}
                </span>
                <span>Credit Purchase (Unsettled)</span>
              </div>
              <p className="cc-modal-note">
                <strong>Ledger Rule:</strong> Bank running balance will NOT be reduced now. It will only be debited when settled via card payment.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="cc-modal-error" role="alert">
            {error}
          </p>
        )}

        <div className="cc-modal-actions">
          <button type="button" className="fs-btn fs-btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="fs-btn fs-btn-primary">
            Add Transaction
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
