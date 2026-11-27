// frontend/src/pages/certificates/CertificateForm.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountSelector from '../../components/common/AccountSelector';
import './Certificates.css';

const validateLastPayoutDate = (startDateValue, lastPayoutDateValue) => {
  if (!lastPayoutDateValue) return '';
  const lastPayout = new Date(lastPayoutDateValue);
  const start = new Date(startDateValue);
  const today = new Date();

  if (lastPayout < start) {
    return 'Last payout date cannot be earlier than certificate start date.';
  }
  if (lastPayout > today) {
    return 'Last payout date cannot be in the future.';
  }
  return '';
};

const CertificateForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    period: '',
    amount: '',
    interest: '',
    payoutInterval: 'monthly',
    lastPayoutDate: '',
    startDate: new Date().toISOString().split('T')[0],
    sourceAccount: initialData?.sourceAccount || 'Bank',
    autoReinvest: Boolean(initialData?.autoReinvest),
  });
  const [fieldErrors, setFieldErrors] = useState({ lastPayoutDate: '' });
  const [submitErrors, setSubmitErrors] = useState([]);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || '',
        period: initialData.period || '',
        amount: initialData.amount || '',
        interest: initialData.interest || '',
        payoutInterval: initialData.payoutInterval || 'monthly',
        lastPayoutDate: initialData.lastPayoutDate
          ? new Date(initialData.lastPayoutDate).toISOString().split('T')[0]
          : '',
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split('T')[0]
          : '',
        sourceAccount: initialData.sourceAccount || 'Bank',
        autoReinvest: Boolean(initialData.autoReinvest),
      });
      setFieldErrors({ lastPayoutDate: '' });
      setSubmitErrors([]);
    }
  }, [initialData, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (name === 'startDate' && (nextData.lastPayoutDate || fieldErrors.lastPayoutDate)) {
      const err = validateLastPayoutDate(value, nextData.lastPayoutDate);
      setFieldErrors({ lastPayoutDate: err });
      if (!err) setSubmitErrors([]);
    } else if (name === 'lastPayoutDate' && fieldErrors.lastPayoutDate) {
      const err = validateLastPayoutDate(nextData.startDate, value);
      setFieldErrors({ lastPayoutDate: err });
      if (!err) setSubmitErrors([]);
    }
  };

  const handleDateBlur = () => {
    const err = validateLastPayoutDate(formData.startDate, formData.lastPayoutDate);
    setFieldErrors({ lastPayoutDate: err });
    if (!err) {
      setSubmitErrors([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const dateErr = validateLastPayoutDate(formData.startDate, formData.lastPayoutDate);
    if (dateErr) {
      setFieldErrors({ lastPayoutDate: dateErr });
      setSubmitErrors([dateErr]);
      return;
    }

    setFieldErrors({ lastPayoutDate: '' });
    setSubmitErrors([]);

    onFormSubmit({
      ...formData,
      sourceAccount: formData.sourceAccount || 'Bank',
      autoReinvest: Boolean(formData.autoReinvest),
      period: parseInt(formData.period, 10),
      amount: parseFloat(formData.amount),
      interest: parseFloat(formData.interest),
      lastPayoutDate: formData.lastPayoutDate
        ? new Date(formData.lastPayoutDate).toISOString()
        : undefined,
    });
  };

  const lastPayoutDescribedBy = fieldErrors.lastPayoutDate
    ? 'cert-last-payout-help cert-last-payout-error'
    : 'cert-last-payout-help';

  return (
    <form onSubmit={handleSubmit} className="cert-form-card cert-form-stack">
      {submitErrors.length > 0 && (
        <div className="cert-form-error-summary" role="alert">
          <strong>Please correct the following before saving:</strong>
          <ul className="cert-form-error-summary-list">
            {submitErrors.map((errMsg) => (
              <li key={errMsg}>{errMsg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="cert-name">Certificate Name</label>
        <input
          id="cert-name"
          type="text"
          name="name"
          className="fs-input"
          placeholder="e.g., Platinum 3Y Certificate"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cert-period">Period (in months)</label>
        <input
          id="cert-period"
          type="number"
          name="period"
          className="fs-input"
          placeholder="e.g., 36"
          value={formData.period}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cert-amount">Principal Amount (EGP)</label>
        <input
          id="cert-amount"
          type="number"
          step="any"
          name="amount"
          className="fs-input"
          placeholder="e.g., 50000"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cert-interest">Annual Interest Rate (%)</label>
        <input
          id="cert-interest"
          type="number"
          step="any"
          name="interest"
          className="fs-input"
          placeholder="e.g., 18.5"
          value={formData.interest}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cert-payout-interval">Payout Frequency Interval</label>
        <select
          id="cert-payout-interval"
          name="payoutInterval"
          className="fs-select"
          value={formData.payoutInterval}
          onChange={handleChange}
          required
        >
          <option value="monthly">Monthly (Every 1 month)</option>
          <option value="quarterly">Quarterly (Every 3 months)</option>
          <option value="annually">Annually (Every 12 months)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cert-start-date">Start / Issue Date</label>
        <input
          id="cert-start-date"
          type="date"
          name="startDate"
          className="fs-input"
          value={formData.startDate}
          onChange={handleChange}
          onBlur={handleDateBlur}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cert-last-payout-date">Last Interest Payout Date (Optional)</label>
        <input
          id="cert-last-payout-date"
          type="date"
          name="lastPayoutDate"
          className="fs-input"
          value={formData.lastPayoutDate}
          onChange={handleChange}
          onBlur={handleDateBlur}
          aria-invalid={fieldErrors.lastPayoutDate ? 'true' : 'false'}
          aria-describedby={lastPayoutDescribedBy}
        />
        <small id="cert-last-payout-help" className="cert-field-help">
          The date of the last interest disbursement. If no payout has occurred yet, leave blank (accrual starts from start date).
        </small>
        {fieldErrors.lastPayoutDate && (
          <p id="cert-last-payout-error" className="cert-field-error form-error" role="alert">
            {fieldErrors.lastPayoutDate}
          </p>
        )}
      </div>

      <AccountSelector
        direction="source"
        value={formData.sourceAccount || 'Bank'}
        onChange={handleChange}
        name="sourceAccount"
        label="Paid From (Source Account)"
      />

      <div className="form-group cert-checkbox-group">
        <label htmlFor="cert-auto-reinvest" className="cert-checkbox-label">
          <input
            id="cert-auto-reinvest"
            type="checkbox"
            name="autoReinvest"
            className="cert-checkbox-input"
            checked={formData.autoReinvest}
            onChange={(e) => setFormData({ ...formData, autoReinvest: e.target.checked })}
          />
          <span>Auto-Reinvest Interest (Suppress periodic ledger payouts)</span>
        </label>
      </div>

      <div className="cert-form-actions">
        <Link to="/certificates" className="fs-btn fs-btn-secondary">
          Cancel
        </Link>
        <button type="submit" className="fs-btn fs-btn-primary">
          {isEdit ? 'Update' : 'Create'} Certificate
        </button>
      </div>
    </form>
  );
};

export default CertificateForm;
