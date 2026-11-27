// frontend/src/pages/real-estate/RealEstateForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Land', 'Villa', 'Other'];
const STATUS_OPTIONS = ['Owned', 'Sold'];
const EMPTY_INITIAL_DATA = {};

const getTodayIso = () => new Date().toISOString().split('T')[0];

const buildFormState = (initialData) => {
  const hasData = initialData && Object.keys(initialData).length > 0;
  if (!hasData) {
    return {
      name: '',
      type: 'Residential',
      area: '',
      location: '',
      purchasePrice: '',
      currentValuation: '',
      purchaseDate: getTodayIso(),
      status: 'Owned',
      sellingPrice: '',
      sellingDate: '',
      notes: '',
    };
  }

  return {
    name: initialData.name || '',
    type: initialData.type || 'Residential',
    area: initialData.area !== undefined && initialData.area !== null && initialData.area !== ''
      ? String(initialData.area)
      : '',
    location: initialData.location || '',
    purchasePrice: initialData.purchasePrice !== undefined && initialData.purchasePrice !== null
      ? String(initialData.purchasePrice)
      : '',
    currentValuation: initialData.currentValuation !== undefined && initialData.currentValuation !== null
      ? String(initialData.currentValuation)
      : '',
    purchaseDate: initialData.purchaseDate
      ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
      : getTodayIso(),
    status: initialData.status || 'Owned',
    sellingPrice: initialData.sellingPrice !== undefined && initialData.sellingPrice !== null && initialData.sellingPrice !== ''
      ? String(initialData.sellingPrice)
      : '',
    sellingDate: initialData.sellingDate
      ? new Date(initialData.sellingDate).toISOString().split('T')[0]
      : '',
    notes: initialData.notes || '',
  };
};

const validateFieldValue = (field, data) => {
  switch (field) {
    case 'name':
      if (!data.name || !data.name.trim()) {
        return 'Property name is required';
      }
      return null;
    case 'area':
      if (data.area !== '' && Number(data.area) < 0) {
        return 'Area cannot be negative';
      }
      return null;
    case 'purchasePrice':
      if (data.purchasePrice === '' || Number(data.purchasePrice) <= 0) {
        return 'Purchase price must be greater than 0';
      }
      return null;
    case 'currentValuation':
      if (data.currentValuation === '' || Number(data.currentValuation) < 0) {
        return 'Current valuation cannot be negative';
      }
      return null;
    case 'purchaseDate':
      if (!data.purchaseDate) {
        return 'Purchase date is required';
      }
      return null;
    case 'sellingPrice':
      if (data.status === 'Sold' && (data.sellingPrice === '' || Number(data.sellingPrice) <= 0)) {
        return 'Selling price is required for sold properties';
      }
      return null;
    case 'sellingDate':
      if (data.status === 'Sold' && !data.sellingDate) {
        return 'Selling date is required for sold properties';
      }
      return null;
    default:
      return null;
  }
};

const validateAll = (data) => {
  const fields = ['name', 'area', 'purchasePrice', 'currentValuation', 'purchaseDate'];
  if (data.status === 'Sold') {
    fields.push('sellingPrice', 'sellingDate');
  }
  const errors = {};
  fields.forEach((f) => {
    const msg = validateFieldValue(f, data);
    if (msg) errors[f] = msg;
  });
  return errors;
};

const RealEstateForm = ({
  initialData = EMPTY_INITIAL_DATA,
  onSubmit,
  isEditing = false,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => buildFormState(initialData));
  const [formErrors, setFormErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(buildFormState(initialData));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      if (next[name]) {
        delete next[name];
      }
      if (name === 'status' && value !== 'Sold') {
        delete next.sellingPrice;
        delete next.sellingDate;
      }
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const msg = validateFieldValue(name, formData);
    setFormErrors((prev) => {
      const next = { ...prev };
      if (msg) {
        next[name] = msg;
      } else {
        delete next[name];
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    const errors = validateAll(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      ...formData,
      area: formData.area ? Number(formData.area) : 0,
      purchasePrice: Number(formData.purchasePrice),
      currentValuation: Number(formData.currentValuation),
      sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : 0,
      sellingDate: formData.sellingDate ? formData.sellingDate : undefined,
    };

    onSubmit(payload);
  };

  const errorCount = Object.keys(formErrors).length;

  return (
    <form onSubmit={handleSubmit} className="re-form-card" noValidate>
      {hasSubmitted && errorCount > 0 && (
        <div className="re-form-error-summary" role="alert">
          Please fix the {errorCount} highlighted {errorCount === 1 ? 'field' : 'fields'} before saving.
        </div>
      )}

      <div className="re-form-stack">
        {/* Name */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-name">
            Property Name *
          </label>
          <input
            id="re-name"
            type="text"
            name="name"
            className="re-field-input"
            placeholder="e.g. New Cairo Apartment, North Coast Chalet"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(formErrors.name)}
            aria-describedby={formErrors.name ? 're-name-error' : undefined}
          />
          {formErrors.name && (
            <span id="re-name-error" className="re-field-error">
              {formErrors.name}
            </span>
          )}
        </div>

        {/* Type */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-type">
            Property Type
          </label>
          <select
            id="re-type"
            name="type"
            className="re-field-select"
            value={formData.type}
            onChange={handleChange}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Area */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-area">
            Area (m²)
          </label>
          <input
            id="re-area"
            type="number"
            step="any"
            min="0"
            name="area"
            className="re-field-input fs-num"
            placeholder="e.g. 120"
            value={formData.area}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(formErrors.area)}
            aria-describedby={formErrors.area ? 're-area-error' : 're-area-hint'}
          />
          <span id="re-area-hint" className="re-field-hint">
            Optional floor or land area in square meters.
          </span>
          {formErrors.area && (
            <span id="re-area-error" className="re-field-error">
              {formErrors.area}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-location">
            Location / Address
          </label>
          <input
            id="re-location"
            type="text"
            name="location"
            className="re-field-input"
            placeholder="e.g. 5th Settlement, New Cairo, Egypt"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        {/* Purchase Price */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-purchase-price">
            Purchase Price (EGP) *
          </label>
          <input
            id="re-purchase-price"
            type="number"
            step="any"
            name="purchasePrice"
            className="re-field-input fs-num"
            placeholder="e.g. 1500000"
            value={formData.purchasePrice}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(formErrors.purchasePrice)}
            aria-describedby={formErrors.purchasePrice ? 're-purchase-price-error' : undefined}
          />
          {formErrors.purchasePrice && (
            <span id="re-purchase-price-error" className="re-field-error">
              {formErrors.purchasePrice}
            </span>
          )}
        </div>

        {/* Current Valuation */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-current-valuation">
            Current Market Valuation (EGP) *
          </label>
          <input
            id="re-current-valuation"
            type="number"
            step="any"
            name="currentValuation"
            className="re-field-input fs-num"
            placeholder="e.g. 2500000"
            value={formData.currentValuation}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(formErrors.currentValuation)}
            aria-describedby={formErrors.currentValuation ? 're-current-valuation-error' : undefined}
          />
          {formErrors.currentValuation && (
            <span id="re-current-valuation-error" className="re-field-error">
              {formErrors.currentValuation}
            </span>
          )}
        </div>

        {/* Purchase Date */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-purchase-date">
            Purchase Date *
          </label>
          <input
            id="re-purchase-date"
            type="date"
            name="purchaseDate"
            className="re-field-input fs-num"
            value={formData.purchaseDate}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(formErrors.purchaseDate)}
            aria-describedby={formErrors.purchaseDate ? 're-purchase-date-error' : undefined}
          />
          {formErrors.purchaseDate && (
            <span id="re-purchase-date-error" className="re-field-error">
              {formErrors.purchaseDate}
            </span>
          )}
        </div>

        {/* Status */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-status">
            Status
          </label>
          <select
            id="re-status"
            name="status"
            className="re-field-select"
            value={formData.status}
            onChange={handleChange}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional Sold Fields */}
        {formData.status === 'Sold' && (
          <>
            <div className="re-field-group">
              <label className="re-field-label" htmlFor="re-selling-price">
                Selling Price (EGP) *
              </label>
              <input
                id="re-selling-price"
                type="number"
                step="any"
                name="sellingPrice"
                className="re-field-input fs-num"
                placeholder="e.g. 2800000"
                value={formData.sellingPrice}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(formErrors.sellingPrice)}
                aria-describedby={formErrors.sellingPrice ? 're-selling-price-error' : undefined}
              />
              {formErrors.sellingPrice && (
                <span id="re-selling-price-error" className="re-field-error">
                  {formErrors.sellingPrice}
                </span>
              )}
            </div>

            <div className="re-field-group">
              <label className="re-field-label" htmlFor="re-selling-date">
                Selling Date *
              </label>
              <input
                id="re-selling-date"
                type="date"
                name="sellingDate"
                className="re-field-input fs-num"
                value={formData.sellingDate}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(formErrors.sellingDate)}
                aria-describedby={formErrors.sellingDate ? 're-selling-date-error' : undefined}
              />
              {formErrors.sellingDate && (
                <span id="re-selling-date-error" className="re-field-error">
                  {formErrors.sellingDate}
                </span>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        <div className="re-field-group">
          <label className="re-field-label" htmlFor="re-notes">
            Notes &amp; Details
          </label>
          <textarea
            id="re-notes"
            name="notes"
            className="re-field-textarea"
            placeholder="Additional details, mortgage notes, maintenance costs, etc."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="re-form-actions">
        <button
          type="button"
          onClick={() => navigate('/real-estate')}
          className="fs-btn fs-btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="fs-btn fs-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Property' : 'Add Property'}
        </button>
      </div>
    </form>
  );
};

export default RealEstateForm;
