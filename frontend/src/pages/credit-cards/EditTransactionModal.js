import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { updateTransaction } from '../../services/creditCardService';
import { getCurrencyPrice } from '../../services/currencyService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { CURRENCY_OPTIONS, DEFAULT_RATES } from '../expenditure/ExpenditureForm';

const EditTransactionModal = ({ isOpen, onClose, transaction, onTransactionUpdated }) => {
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
    amount: '',
    date: '',
    type: 'Purchase',
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

  // When the modal opens or the transaction prop changes, pre-fill the form
  useEffect(() => {
    if (transaction && isOpen) {
      const initCurr = (transaction.currency || 'EGP').toUpperCase();
      setCurrency(initCurr);

      if (transaction.foreignAmount !== undefined && transaction.foreignAmount !== null) {
        setForeignAmount(transaction.foreignAmount.toString());
      } else {
        setForeignAmount('');
      }

      if (transaction.exchangeRateSnapshot && Number(transaction.exchangeRateSnapshot) > 0) {
        setExchangeRate(Number(transaction.exchangeRateSnapshot));
      } else if (initCurr !== 'EGP') {
        setExchangeRate(DEFAULT_RATES[initCurr] || 1);
      } else {
        setExchangeRate(1);
      }

      setFormData({
        description: transaction.description || '',
        amount: transaction.amount ? transaction.amount.toString() : '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        type: transaction.type || 'Purchase',
        installmentMonths: transaction.installmentDetails?.months || '',
        installmentInterest: transaction.installmentDetails?.interest || 0,
      });
    }
  }, [transaction, isOpen]);

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      if (isNaN(parsedForeign) || parsedForeign <= 0) {
        setError(`Please enter a valid positive foreign amount in ${currency}.`);
        return;
      }
      const parsedRate = parseFloat(exchangeRate);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        setError('Please enter a valid positive exchange rate.');
        return;
      }
      finalAmount = Number((parsedForeign * parsedRate).toFixed(2));
    } else {
      if (isNaN(finalAmount) || finalAmount <= 0) {
        setError('Amount must be a positive number.');
        return;
      }
    }

    const dataToSubmit = {
      description: formData.description,
      amount: finalAmount,
      currency,
      date: formData.date,
      type: formData.type,
    };

    if (isForeign) {
      dataToSubmit.foreignAmount = parseFloat(foreignAmount);
      dataToSubmit.exchangeRateSnapshot = parseFloat(exchangeRate);
    } else {
      dataToSubmit.foreignAmount = null;
      dataToSubmit.exchangeRateSnapshot = 1;
    }

    if (formData.type === 'Installment') {
      const months = parseInt(formData.installmentMonths, 10);
      if (!months || months <= 0) {
        setError('Installment months must be a positive number.');
        return;
      }
      dataToSubmit.installmentDetails = {
        months: months,
        monthlyPrincipal: finalAmount / months,
        interest: parseFloat(formData.installmentInterest) || 0,
      };
    }

    try {
      await updateTransaction(transaction._id, dataToSubmit);
      showToast('Transaction updated successfully', 'success');
      onTransactionUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update transaction.');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction">
      <form onSubmit={handleSubmit} className="standard-form">
        <div className="form-group">
          <label htmlFor="edit-card-description">Description</label>
          <input
            id="edit-card-description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Currency Selector */}
        <div className="form-group">
          <label htmlFor="edit-card-currency">Currency</label>
          <select
            id="edit-card-currency"
            name="currency"
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
          <div className="form-group">
            <label htmlFor="edit-card-amount">Total Amount (EGP)</label>
            <input
              id="edit-card-amount"
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-card-foreign-amount">Amount ({currency})</label>
                <input
                  id="edit-card-foreign-amount"
                  type="number"
                  step="any"
                  value={foreignAmount}
                  onChange={handleForeignAmountChange}
                  placeholder={`Enter amount in ${currency}`}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-card-exchange-rate">Exchange Rate (1 {currency} in EGP)</label>
                <input
                  id="edit-card-exchange-rate"
                  type="number"
                  step="any"
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  placeholder="Exchange rate"
                  disabled={!isAdmin}
                  required
                />
                <small className="form-helper-text" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Rate is approximate for historical dates — actual rate is locked at save time based on transaction date.
                </small>
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
                This transaction will be recorded on your card statement as <strong>{formatCurrency(convertedEgpValue)}</strong>.
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="edit-card-date">Date</label>
          <input
            id="edit-card-date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-card-type">Type</label>
          <select id="edit-card-type" name="type" value={formData.type} onChange={handleChange}>
            <option value="Purchase">Standard Purchase</option>
            <option value="Installment">Installment Plan</option>
          </select>
        </div>

        {formData.type === 'Installment' && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <div className="form-group">
              <label htmlFor="edit-card-installment-months">Number of Months</label>
              <input
                id="edit-card-installment-months"
                type="number"
                name="installmentMonths"
                value={formData.installmentMonths}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-card-installment-interest">Interest Rate (%) (Optional)</label>
              <input
                id="edit-card-installment-interest"
                type="number"
                step="0.01"
                name="installmentInterest"
                value={formData.installmentInterest}
                onChange={handleChange}
              />
            </div>
            {formData.installmentMonths > 0 && convertedEgpValue > 0 && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
                💡 Monthly Principal: {formatCurrency(convertedEgpValue / parseInt(formData.installmentMonths, 10))} / mo
              </div>
            )}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="action-button">Save Changes</button>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;
