// frontend/src/pages/currency/CurrencyForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { currencyMap } from '../../context/CurrContext';
import AccountSelector from '../../components/common/AccountSelector';

const CURRENCY_OPTIONS = Object.keys(currencyMap);

const FIELD_LABELS = {
  name: 'Currency Name',
  amount: 'Principal Amount',
  price: 'Price Paid',
  date: 'Date',
};

const EMPTY_INITIAL_DATA = {};

const buildFormState = (initialData, isEdit) => {
  if (isEdit && initialData) {
    return {
      name: initialData.name || CURRENCY_OPTIONS[0] || '',
      amount: initialData.amount ?? '',
      price: initialData.price ?? '',
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      sourceAccount: initialData.sourceAccount || 'Bank',
    };
  }
  return {
    name: CURRENCY_OPTIONS[0] || '',
    amount: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    sourceAccount: initialData?.sourceAccount || 'Bank',
  };
};

const CurrencyForm = ({ initialData = EMPTY_INITIAL_DATA, onFormSubmit, isEdit = false, isSubmitting = false }) => {
  const [formData, setFormData] = useState(() => buildFormState(initialData, isEdit));
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitErrors, setSubmitErrors] = useState([]);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData(buildFormState(initialData, true));
      setFieldErrors({});
      setSubmitErrors([]);
    }
  }, [initialData, isEdit]);

  const validateField = useCallback((name, value) => {
    if (name === 'name') {
      if (!String(value || '').trim()) {
        return 'Currency name is required.';
      }
      return '';
    }
    if (name === 'amount') {
      const parsed = Number(value);
      if (value === '' || value === null || value === undefined || !Number.isFinite(parsed) || parsed <= 0) {
        return 'Principal amount must be greater than 0.';
      }
      return '';
    }
    if (name === 'price') {
      const parsed = Number(value);
      if (value === '' || value === null || value === undefined || !Number.isFinite(parsed) || parsed <= 0) {
        return 'Price paid must be greater than 0.';
      }
      return '';
    }
    if (name === 'date') {
      if (!String(value || '').trim()) {
        return 'Purchase date is required.';
      }
      return '';
    }
    return '';
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      const nextErr = validateField(name, value);
      setFieldErrors((prev) => {
        const updated = { ...prev };
        if (nextErr) {
          updated[name] = nextErr;
        } else {
          delete updated[name];
        }
        return updated;
      });
      if (!nextErr && submitErrors.length > 0) {
        setSubmitErrors((prev) => prev.filter((item) => item.field !== name));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (errorMsg) {
        updated[name] = errorMsg;
      } else {
        delete updated[name];
      }
      return updated;
    });
    if (!errorMsg && submitErrors.length > 0) {
      setSubmitErrors((prev) => prev.filter((item) => item.field !== name));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    const orderedErrors = [];

    ['name', 'amount', 'price', 'date'].forEach((field) => {
      const errMsg = validateField(field, formData[field]);
      if (errMsg) {
        errors[field] = errMsg;
        orderedErrors.push({ field, label: FIELD_LABELS[field], message: errMsg });
      }
    });

    if (orderedErrors.length > 0) {
      setFieldErrors(errors);
      setSubmitErrors(orderedErrors);
      return;
    }

    setFieldErrors({});
    setSubmitErrors([]);
    onFormSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      price: parseFloat(formData.price),
      sourceAccount: formData.sourceAccount || 'Bank',
    });
  };

  const parsedAmount = parseFloat(formData.amount);
  const parsedPrice = parseFloat(formData.price);
  const impliedRate = (
    Number.isFinite(parsedAmount) && parsedAmount > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0
      ? (parsedPrice / parsedAmount)
      : null
  );
  const currencyCode = currencyMap[formData.name] || formData.name || 'USD';

  return (
    <div className="curr-form-card">
      <form onSubmit={handleSubmit} className="curr-form-stack" noValidate>
        {submitErrors.length > 0 && (
          <div className="curr-form-error-summary" role="alert">
            <strong>Please resolve {submitErrors.length} validation error(s) before submitting:</strong>
            <ul className="curr-form-error-summary-list">
              {submitErrors.map((err) => (
                <li key={err.field}>{err.label}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="curr-form-group">
          <label htmlFor="curr-name">Currency Name</label>
          <select
            id="curr-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'curr-name-error' : undefined}
            required
          >
            {CURRENCY_OPTIONS.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
          {fieldErrors.name && (
            <p id="curr-name-error" className="curr-field-error" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="curr-form-group">
          <label htmlFor="curr-amount">Principal Amount</label>
          <input
            id="curr-amount"
            type="number"
            step="any"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.amount)}
            aria-describedby={fieldErrors.amount ? 'curr-amount-help curr-amount-error' : 'curr-amount-help'}
            required
          />
          <p id="curr-amount-help" className="curr-field-help">
            Units of foreign currency acquired in this position.
          </p>
          {fieldErrors.amount && (
            <p id="curr-amount-error" className="curr-field-error" role="alert">
              {fieldErrors.amount}
            </p>
          )}
        </div>

        <div className="curr-form-group">
          <label htmlFor="curr-price">Price Paid</label>
          <input
            id="curr-price"
            type="number"
            step="any"
            name="price"
            placeholder="e.g., 51.0"
            value={formData.price}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.price)}
            aria-describedby={fieldErrors.price ? 'curr-price-help curr-price-error' : 'curr-price-help'}
            required
          />
          <p id="curr-price-help" className="curr-field-help">
            Total acquisition cost paid in EGP for the holding.
          </p>
          {fieldErrors.price && (
            <p id="curr-price-error" className="curr-field-error" role="alert">
              {fieldErrors.price}
            </p>
          )}
        </div>

        {impliedRate !== null && (
          <div className="curr-implied-rate-box" data-testid="curr-implied-rate">
            <span className="curr-implied-rate-label">Implied Purchase Rate</span>
            <span className="curr-implied-rate-val fs-num">
              1 {currencyCode} = {impliedRate.toFixed(4)} EGP
            </span>
          </div>
        )}

        <div className="curr-form-group">
          <label htmlFor="curr-date">Date</label>
          <input
            id="curr-date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.date)}
            aria-describedby={fieldErrors.date ? 'curr-date-error' : undefined}
            required
          />
          {fieldErrors.date && (
            <p id="curr-date-error" className="curr-field-error" role="alert">
              {fieldErrors.date}
            </p>
          )}
        </div>

        <div className="curr-form-group">
          <AccountSelector
            direction="source"
            value={formData.sourceAccount || 'Bank'}
            onChange={handleChange}
            name="sourceAccount"
            label="Paid From (Source Account)"
          />
        </div>

        <div className="curr-form-actions">
          <Link to="/currency" className="fs-btn fs-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="fs-btn fs-btn-primary"
            disabled={isSubmitting}
          >
            {isEdit ? 'Update' : 'Create'} Currency
          </button>
        </div>
      </form>
    </div>
  );
};

export default CurrencyForm;
