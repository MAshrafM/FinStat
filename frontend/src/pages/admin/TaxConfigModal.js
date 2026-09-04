// frontend/src/pages/admin/TaxConfigModal.js
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const DEFAULT_BRACKETS = [
  { level: 1, from: 0, to: 40000, rate: 0 },
  { level: 2, from: 40001, to: 55000, rate: 10 },
  { level: 3, from: 55001, to: 70000, rate: 15 },
  { level: 4, from: 70001, to: 200000, rate: 20 },
  { level: 5, from: 200001, to: 400000, rate: 22.5 },
  { level: 6, from: 400001, to: 1200000, rate: 25 },
  { level: 7, from: 1200001, to: 100000000, rate: 27.5 },
];

const TaxConfigModal = ({ isOpen, onClose, onSave, config = null, saving = false }) => {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    year: currentYear,
    country: 'Egypt',
    personalExemption: 15000,
    isActive: true,
    brackets: DEFAULT_BRACKETS,
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (config) {
      setFormData({
        year: config.year || currentYear,
        country: config.country || 'Egypt',
        personalExemption: config.personalExemption !== undefined ? config.personalExemption : 15000,
        isActive: config.isActive !== false,
        brackets: config.brackets && config.brackets.length > 0 ? config.brackets : DEFAULT_BRACKETS,
      });
    } else {
      setFormData({
        year: currentYear,
        country: 'Egypt',
        personalExemption: 15000,
        isActive: true,
        brackets: DEFAULT_BRACKETS,
      });
    }
    setValidationError('');
  }, [config, isOpen, currentYear]);

  if (!isOpen) return null;

  const handleAddBracket = () => {
    setFormData((prev) => {
      const last = prev.brackets[prev.brackets.length - 1];
      const newFrom = last ? (last.to < 100000000 ? last.to + 1 : last.from + 50000) : 0;
      const newTo = newFrom + 50000;
      return {
        ...prev,
        brackets: [
          ...prev.brackets,
          {
            level: prev.brackets.length + 1,
            from: newFrom,
            to: newTo,
            rate: 25,
          },
        ],
      };
    });
  };

  const handleRemoveBracket = (index) => {
    setFormData((prev) => ({
      ...prev,
      brackets: prev.brackets.filter((_, i) => i !== index),
    }));
  };

  const handleBracketChange = (index, field, value) => {
    const numValue = field === 'rate' ? parseFloat(value) : parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, i) =>
        i === index ? { ...b, [field]: isNaN(numValue) ? 0 : numValue } : b
      ),
    }));
  };

  const validateBrackets = (brackets) => {
    if (!brackets || brackets.length === 0) {
      return 'At least one tax bracket is required.';
    }
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i];
      if (b.from < 0 || b.to < 0 || b.rate < 0) {
        return `Bracket #${i + 1}: Values cannot be negative.`;
      }
      if (b.to <= b.from) {
        return `Bracket #${i + 1}: 'To' (${b.to}) must be strictly greater than 'From' (${b.from}).`;
      }
    }
    const sorted = [...brackets].sort((a, b) => a.from - b.from);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].from < sorted[i - 1].to) {
        return `Overlapping range between bracket #${i} and #${i + 1}.`;
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const err = validateBrackets(formData.brackets);
    if (err) {
      setValidationError(err);
      return;
    }

    onSave({
      ...formData,
      year: parseInt(formData.year, 10),
      personalExemption: parseFloat(formData.personalExemption) || 0,
      brackets: formData.brackets.map((b, idx) => ({
        level: idx + 1,
        from: Number(b.from),
        to: Number(b.to),
        rate: Number(b.rate),
      })),
    });
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="tax-modal-title">
      <div className="admin-modal-card max-w-3xl animate-slide-up">
        <div className="admin-modal-header">
          <div>
            <h3 id="tax-modal-title" className="admin-modal-title">
              {config ? `Edit Tax Brackets (${formData.year})` : 'New Tax Bracket Configuration'}
            </h3>
            <p className="admin-modal-subtitle">
              Configure yearly progressive tax bracket levels and personal exemptions
            </p>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body">
            {validationError && (
              <div className="admin-form-alert admin-alert-danger" role="alert">
                {validationError}
              </div>
            )}

            <div className="admin-form-grid-3">
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="tax-year-input">
                  Tax Year <span className="text-danger">*</span>
                </label>
                <input
                  id="tax-year-input"
                  type="number"
                  className="admin-form-input"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  min="2000"
                  max="2100"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="tax-exemption-input">
                  Personal Exemption (EGP)
                </label>
                <input
                  id="tax-exemption-input"
                  type="number"
                  className="admin-form-input"
                  value={formData.personalExemption}
                  onChange={(e) => setFormData({ ...formData, personalExemption: e.target.value })}
                  min="0"
                  step="any"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="tax-country-input">
                  Country
                </label>
                <input
                  id="tax-country-input"
                  type="text"
                  className="admin-form-input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="admin-toggle-field-wrapper">
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span className="admin-toggle-slider"></span>
              </label>
              <div className="admin-toggle-label-group">
                <span className="toggle-main-label">Active Status</span>
                <span className="toggle-sub-label">
                  {formData.isActive
                    ? 'Currently active for automated salary tax calculations'
                    : 'Inactive (archived or pending configuration)'}
                </span>
              </div>
            </div>

            <div className="admin-section-divider">
              <div className="section-title-row">
                <h4 className="section-heading">Progressive Bracket Levels</h4>
                <button
                  type="button"
                  className="admin-btn-secondary btn-sm"
                  onClick={handleAddBracket}
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>
              <p className="section-subheading">
                Define From, To, and Rate. Ensure From &lt; To with no overlapping ranges.
              </p>
            </div>

            <div className="admin-table-container">
              <table className="admin-editable-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Tier</th>
                    <th>From (EGP)</th>
                    <th>To (EGP)</th>
                    <th style={{ width: '130px' }}>Rate (%)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.brackets.map((b, idx) => (
                    <tr key={idx}>
                      <td className="tier-cell">#{idx + 1}</td>
                      <td>
                        <input
                          type="number"
                          className="admin-table-input"
                          value={b.from}
                          onChange={(e) => handleBracketChange(idx, 'from', e.target.value)}
                          min="0"
                          required
                          aria-label={`Bracket ${idx + 1} From`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="admin-table-input"
                          value={b.to}
                          onChange={(e) => handleBracketChange(idx, 'to', e.target.value)}
                          min="0"
                          required
                          aria-label={`Bracket ${idx + 1} To`}
                        />
                      </td>
                      <td>
                        <div className="unit-input-group">
                          <input
                            type="number"
                            step="any"
                            className="admin-table-input"
                            value={b.rate}
                            onChange={(e) => handleBracketChange(idx, 'rate', e.target.value)}
                            min="0"
                            max="100"
                            required
                            aria-label={`Bracket ${idx + 1} Rate`}
                          />
                          <span className="unit-tag">%</span>
                        </div>
                      </td>
                      <td>
                        {formData.brackets.length > 1 && (
                          <button
                            type="button"
                            className="admin-row-delete-btn"
                            onClick={() => handleRemoveBracket(idx)}
                            title="Remove tier"
                            aria-label={`Remove tier ${idx + 1}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : config ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxConfigModal;
