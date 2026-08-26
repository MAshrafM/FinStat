// frontend/src/pages/real-estate/RealEstateForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Land', 'Villa', 'Other'];
const STATUS_OPTIONS = ['Owned', 'Sold'];

const RealEstateForm = ({ initialData = {}, onSubmit, isEditing = false, isSubmitting = false }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    type: 'Residential',
    area: '',
    location: '',
    purchasePrice: '',
    currentValuation: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'Owned',
    sellingPrice: '',
    sellingDate: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || 'Residential',
        area: initialData.area || '',
        location: initialData.location || '',
        purchasePrice: initialData.purchasePrice || '',
        currentValuation: initialData.currentValuation || '',
        purchaseDate: initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: initialData.status || 'Owned',
        sellingPrice: initialData.sellingPrice || '',
        sellingDate: initialData.sellingDate
          ? new Date(initialData.sellingDate).toISOString().split('T')[0]
          : '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Property name is required';
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      errors.purchasePrice = 'Purchase price must be greater than 0';
    }
    if (formData.currentValuation === '' || Number(formData.currentValuation) < 0) {
      errors.currentValuation = 'Current valuation cannot be negative';
    }
    if (!formData.purchaseDate) errors.purchaseDate = 'Purchase date is required';

    if (formData.status === 'Sold') {
      if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
        errors.sellingPrice = 'Selling price is required for sold properties';
      }
      if (!formData.sellingDate) {
        errors.sellingDate = 'Selling date is required for sold properties';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

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

  return (
    <form onSubmit={handleSubmit} className="real-estate-form-card">
      <div className="real-estate-form-grid">
        {/* Name */}
        <div className="form-group-full">
          <label className="form-label">Property Name *</label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. New Cairo Apartment, North Coast Chalet"
            value={formData.name}
            onChange={handleChange}
          />
          {formErrors.name && <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.name}</span>}
        </div>

        {/* Type */}
        <div>
          <label className="form-label">Property Type</label>
          <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Area (m²) */}
        <div>
          <label className="form-label">Area (m²)</label>
          <input
            type="number"
            step="any"
            name="area"
            className="form-input"
            placeholder="e.g. 120"
            value={formData.area}
            onChange={handleChange}
          />
        </div>

        {/* Location */}
        <div className="form-group-full">
          <label className="form-label">Location / Address</label>
          <input
            type="text"
            name="location"
            className="form-input"
            placeholder="e.g. 5th Settlement, New Cairo, Egypt"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        {/* Purchase Price */}
        <div>
          <label className="form-label">Purchase Price (EGP) *</label>
          <input
            type="number"
            step="any"
            name="purchasePrice"
            className="form-input"
            placeholder="e.g. 1500000"
            value={formData.purchasePrice}
            onChange={handleChange}
          />
          {formErrors.purchasePrice && (
            <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.purchasePrice}</span>
          )}
        </div>

        {/* Current Valuation */}
        <div>
          <label className="form-label">Current Market Valuation (EGP) *</label>
          <input
            type="number"
            step="any"
            name="currentValuation"
            className="form-input"
            placeholder="e.g. 2500000"
            value={formData.currentValuation}
            onChange={handleChange}
          />
          {formErrors.currentValuation && (
            <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.currentValuation}</span>
          )}
        </div>

        {/* Purchase Date */}
        <div>
          <label className="form-label">Purchase Date *</label>
          <input
            type="date"
            name="purchaseDate"
            className="form-input"
            value={formData.purchaseDate}
            onChange={handleChange}
          />
          {formErrors.purchaseDate && (
            <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.purchaseDate}</span>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="form-label">Status</label>
          <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Sold Fields conditional */}
        {formData.status === 'Sold' && (
          <>
            <div>
              <label className="form-label">Selling Price (EGP) *</label>
              <input
                type="number"
                step="any"
                name="sellingPrice"
                className="form-input"
                placeholder="e.g. 2800000"
                value={formData.sellingPrice}
                onChange={handleChange}
              />
              {formErrors.sellingPrice && (
                <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.sellingPrice}</span>
              )}
            </div>

            <div>
              <label className="form-label">Selling Date *</label>
              <input
                type="date"
                name="sellingDate"
                className="form-input"
                value={formData.sellingDate}
                onChange={handleChange}
              />
              {formErrors.sellingDate && (
                <span style={{ color: '#f87171', fontSize: '0.82rem' }}>{formErrors.sellingDate}</span>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        <div className="form-group-full">
          <label className="form-label">Notes &amp; Details</label>
          <textarea
            name="notes"
            className="form-textarea"
            placeholder="Additional details, mortgage notes, maintenance costs, etc."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => navigate('/real-estate')}
          className="refresh-btn"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary-add" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Property' : 'Add Property'}
        </button>
      </div>
    </form>
  );
};

export default RealEstateForm;
