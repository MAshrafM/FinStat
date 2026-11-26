// frontend/src/pages/gold/GoldForm.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountSelector from '../../components/common/AccountSelector';
import { Loading } from '../../components/ui';

const FIELD_LABELS = {
  date: 'Date',
  item: 'Item Description',
  karat: 'Karat',
  weight: 'Weight (grams)',
  price: 'Price per Gram',
  paid: 'Total Amount Paid',
  seller: 'Seller (Optional)',
  sourceAccount: 'Paid From (Source Account)',
  status: 'Status',
  sellingPrice: 'Selling Price',
  sellingDate: 'Selling Date',
  destinationAccount: 'Deposit Proceeds To',
};

const REQUIRED_FIELDS = ['date', 'item', 'karat', 'weight', 'price', 'paid'];
const NUMERIC_FIELDS = ['karat', 'weight', 'price', 'paid', 'sellingPrice'];

const validateField = (name, value, status) => {
  const required = REQUIRED_FIELDS.includes(name)
    || (status === 'sold' && ['sellingPrice', 'sellingDate'].includes(name));
  const normalized = typeof value === 'string' ? value.trim() : value;

  if (!required && name !== 'item') return '';
  if (name === 'seller') return '';
  if (!normalized && String(normalized) !== '0') {
    return `${FIELD_LABELS[name]} is required.`;
  }
  if (NUMERIC_FIELDS.includes(name) && Number.isNaN(Number(normalized))) {
    return `${FIELD_LABELS[name]} must be a number.`;
  }
  if (NUMERIC_FIELDS.includes(name) && Number(normalized) < 0) {
    return `${FIELD_LABELS[name]} cannot be negative.`;
  }
  return '';
};

const GoldForm = ({ initialData = {}, onFormSubmit, isEdit = false }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        item: '',
        karat: '24',
        weight: '',
        price: '',
        paid: '',
        seller: '',
        status: 'hold',
        sellingPrice: '',
        sellingDate: '',
        destinationAccount: 'Cash',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEdit && initialData) {
            setFormData({
                date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
                item: initialData.item || '',
                karat: initialData.karat || '24',
                weight: initialData.weight || '',
                price: initialData.price || '',
                paid: initialData.paid || '',
                seller: initialData.seller || '',
                status: initialData.status || 'hold',
                sellingPrice: initialData.sellingPrice || '',
                sellingDate: initialData.sellingDate ? new Date(initialData.sellingDate).toISOString().split('T')[0] : '',
                destinationAccount: initialData.destinationAccount || 'Cash',
            });
        }
    }, [initialData, isEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({
                ...prev,
                [name]: validateField(name, value, name === 'status' ? value : formData.status),
            }));
        }
        if (submitError) setSubmitError('');
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setFieldErrors((prev) => ({
            ...prev,
            [name]: validateField(name, value, formData.status),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const required = [...REQUIRED_FIELDS];
        if (formData.status === 'sold') required.push('sellingPrice', 'sellingDate');
        const nextErrors = {};
        required.forEach((name) => {
            const message = validateField(name, formData[name], formData.status);
            if (message) nextErrors[name] = message;
        });

        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setSubmitError('Please correct the highlighted fields before submitting.');
            return;
        }

        const payload = {
            date: formData.date,
            item: formData.item.trim(),
            karat: Number(formData.karat),
            weight: parseFloat(formData.weight),
            price: parseFloat(formData.price),
            paid: parseFloat(formData.paid),
            status: formData.status,
        };

        if (formData.seller && formData.seller.trim()) {
            payload.seller = formData.seller.trim();
        }

        if (formData.status === 'sold') {
            if (formData.sellingPrice !== '' && formData.sellingPrice !== undefined && formData.sellingPrice !== null) {
                payload.sellingPrice = parseFloat(formData.sellingPrice);
            }
            if (formData.sellingDate) {
                payload.sellingDate = formData.sellingDate;
            }
            payload.destinationAccount = formData.destinationAccount || 'Cash';
        }

        payload.sourceAccount = formData.sourceAccount || 'Bank';

        setSubmitError('');
        setIsSubmitting(true);
        try {
            await onFormSubmit(payload);
        } catch (err) {
            setSubmitError(err?.message || 'Unable to save this gold entry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const describedBy = (name) => [
        fieldErrors[name] ? `gold-${name}-error` : null,
        `gold-${name}-hint`,
    ].filter(Boolean).join(' ');

    const renderFieldError = (name) => fieldErrors[name] ? (
        <p id={`gold-${name}-error`} className="form-error" aria-live="polite">
            {fieldErrors[name]}
        </p>
    ) : null;

    const fieldProps = (name) => ({
        id: `gold-${name}`,
        name,
        value: formData[name],
        onChange: handleChange,
        onBlur: handleBlur,
        disabled: isSubmitting,
        'aria-invalid': Boolean(fieldErrors[name]),
        'aria-describedby': describedBy(name),
        className: 'fs-input',
    });

    return (
        <form className="gold-form-card" onSubmit={handleSubmit} noValidate>
            {submitError && (
                <div className="form-error gold-form-error-summary" role="alert">
                    {submitError}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="gold-date">Date</label>
                <input {...fieldProps('date')} type="date" required />
                <p id="gold-date-hint" className="gold-field-hint">Purchase date recorded in the ledger.</p>
                {renderFieldError('date')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-item">Item Description</label>
                <input {...fieldProps('item')} type="text" placeholder="e.g., 1oz Bar, Wedding Ring" required />
                <p id="gold-item-hint" className="gold-field-hint">Use a description that identifies the physical item.</p>
                {renderFieldError('item')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-karat">Karat</label>
                <input {...fieldProps('karat')} type="number" placeholder="24, 22, 21, 18..." required />
                <p id="gold-karat-hint" className="gold-field-hint">Enter 24 for pure gold.</p>
                {renderFieldError('karat')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-weight">Weight (grams)</label>
                <input {...fieldProps('weight')} type="number" step="any" required />
                <p id="gold-weight-hint" className="gold-field-hint">Weight in grams to four decimal places.</p>
                {renderFieldError('weight')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-price">Price per Gram</label>
                <input {...fieldProps('price')} type="number" step="any" required />
                <p id="gold-price-hint" className="gold-field-hint">Spot or purchase price per gram.</p>
                {renderFieldError('price')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-paid">Total Amount Paid</label>
                <input {...fieldProps('paid')} type="number" step="any" required />
                <p id="gold-paid-hint" className="gold-field-hint">Includes any taxes or fees paid.</p>
                {renderFieldError('paid')}
            </div>

            <div className="form-group">
                <label htmlFor="gold-seller">Seller (Optional)</label>
                <input {...fieldProps('seller')} type="text" />
                <p id="gold-seller-hint" className="gold-field-hint">Optional broker or counterparty name.</p>
                {renderFieldError('seller')}
            </div>

            <AccountSelector
                direction="source"
                value={formData.sourceAccount || 'Bank'}
                onChange={handleChange}
                name="sourceAccount"
                label="Paid From (Source Account)"
                id="gold-sourceAccount"
                selectClassName="fs-select"
                disabled={isSubmitting}
            />
            <p id="gold-sourceAccount-hint" className="gold-field-hint">Account used to fund this purchase.</p>

            <div className="form-group">
                <label htmlFor="gold-status">Status</label>
                <select {...fieldProps('status')} className="fs-select" required>
                    <option value="hold">Hold</option>
                    <option value="sold">Sold</option>
                </select>
                <p id="gold-status-hint" className="gold-field-hint">Choose Sold to reveal disposal fields.</p>
                {renderFieldError('status')}
            </div>

            {formData.status === 'sold' && (
                <>
                    <div className="form-group">
                        <label htmlFor="gold-sellingPrice">Selling Price</label>
                        <input {...fieldProps('sellingPrice')} type="number" step="any" required />
                        <p id="gold-sellingPrice-hint" className="gold-field-hint">Sale price per gram.</p>
                        {renderFieldError('sellingPrice')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="gold-sellingDate">Selling Date</label>
                        <input {...fieldProps('sellingDate')} type="date" required />
                        <p id="gold-sellingDate-hint" className="gold-field-hint">Date the gold was sold.</p>
                        {renderFieldError('sellingDate')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="gold-destinationAccount">Deposit Proceeds To</label>
                        <select
                            id="gold-destinationAccount"
                            name="destinationAccount"
                            value={formData.destinationAccount || 'Cash'}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isSubmitting}
                            className="fs-select"
                            aria-invalid={Boolean(fieldErrors.destinationAccount)}
                            aria-describedby="gold-destinationAccount-hint"
                        >
                            <option value="Cash">Cash Ledger</option>
                            <option value="Bank">Bank Account</option>
                            <option value="Prepaid">Prepaid Card</option>
                        </select>
                        <p id="gold-destinationAccount-hint" className="gold-field-hint">Account receiving the sale proceeds.</p>
                    </div>
                </>
            )}

            <div className="gold-form-actions">
                <Link to="/gold-wallet" className="fs-btn fs-btn-secondary gold-cancel-link">Cancel</Link>
                <button type="submit" className="fs-btn fs-btn-primary gold-submit-btn" disabled={isSubmitting}>
                    {isEdit ? 'Update' : 'Create'} Log
                </button>
            </div>
            {isSubmitting && <Loading variant="form-field" text="Saving gold entry..." />}
        </form>
    );
};
export default GoldForm;
