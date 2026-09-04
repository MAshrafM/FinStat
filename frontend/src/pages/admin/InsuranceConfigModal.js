// frontend/src/pages/admin/InsuranceConfigModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const InsuranceConfigModal = ({ isOpen, onClose, onSave, config = null, saving = false }) => {
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    year: currentYear,
    country: 'Egypt',
    employeeShare: 11,
    employerShare: 18.75,
    minInsurableIncome: 2700,
    maxInsurableIncome: 16700,
    isActive: true,
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (config) {
      setFormData({
        year: config.year || currentYear,
        country: config.country || 'Egypt',
        employeeShare: config.employeeShare !== undefined ? config.employeeShare : 11,
        employerShare: config.employerShare !== undefined ? config.employerShare : 18.75,
        minInsurableIncome: config.minInsurableIncome !== undefined ? config.minInsurableIncome : 2700,
        maxInsurableIncome: config.maxInsurableIncome !== undefined ? config.maxInsurableIncome : 16700,
        isActive: config.isActive !== false,
      });
    } else {
      setFormData({
        year: currentYear,
        country: 'Egypt',
        employeeShare: 11,
        employerShare: 18.75,
        minInsurableIncome: 2700,
        maxInsurableIncome: 16700,
        isActive: true,
      });
    }
    setValidationError('');
  }, [config, isOpen, currentYear]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const min = parseFloat(formData.minInsurableIncome) || 0;
    const max = parseFloat(formData.maxInsurableIncome);

    if (isNaN(max) || max <= 0) {
      setValidationError('Maximum Insurable Income must be a positive number.');
      return;
    }

    if (max < min) {
      setValidationError('Max Insurable Income must be greater than or equal to Min Insurable Income.');
      return;
    }

    onSave({
      ...formData,
      year: parseInt(formData.year, 10),
      employeeShare: parseFloat(formData.employeeShare) || 0,
      employerShare: parseFloat(formData.employerShare) || 0,
      minInsurableIncome: min,
      maxInsurableIncome: max,
      isActive: Boolean(formData.isActive),
    });
  };

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="insurance-modal-title">
      <div className="admin-modal-card max-w-2xl animate-slide-up">
        <div className="admin-modal-header">
          <div>
            <h3 id="insurance-modal-title" className="admin-modal-title">
              {config ? `Edit Social Insurance (${formData.year})` : 'New Social Insurance Configuration'}
            </h3>
            <p className="admin-modal-subtitle">
              Set statutory contribution rates and insurable income brackets
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

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="ins-year-input">
                  Effective Year <span className="text-danger">*</span>
                </label>
                <input
                  id="ins-year-input"
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
                <label className="admin-form-label" htmlFor="ins-country-input">
                  Country
                </label>
                <input
                  id="ins-country-input"
                  type="text"
                  className="admin-form-input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="ins-employee-input">
                  Employee Contribution Share (%) <span className="text-danger">*</span>
                </label>
                <div className="unit-input-group">
                  <input
                    id="ins-employee-input"
                    type="number"
                    step="any"
                    className="admin-form-input"
                    value={formData.employeeShare}
                    onChange={(e) => setFormData({ ...formData, employeeShare: e.target.value })}
                    min="0"
                    max="100"
                    required
                  />
                  <span className="unit-tag">%</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="ins-employer-input">
                  Employer Contribution Share (%) <span className="text-danger">*</span>
                </label>
                <div className="unit-input-group">
                  <input
                    id="ins-employer-input"
                    type="number"
                    step="any"
                    className="admin-form-input"
                    value={formData.employerShare}
                    onChange={(e) => setFormData({ ...formData, employerShare: e.target.value })}
                    min="0"
                    max="100"
                    required
                  />
                  <span className="unit-tag">%</span>
                </div>
              </div>
            </div>

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="ins-min-input">
                  Min Insurable Income Floor (EGP)
                </label>
                <input
                  id="ins-min-input"
                  type="number"
                  step="any"
                  className="admin-form-input"
                  value={formData.minInsurableIncome}
                  onChange={(e) => setFormData({ ...formData, minInsurableIncome: e.target.value })}
                  min="0"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label" htmlFor="ins-max-input">
                  Max Insurable Income Ceiling (EGP) <span className="text-danger">*</span>
                </label>
                <input
                  id="ins-max-input"
                  type="number"
                  step="any"
                  className="admin-form-input"
                  value={formData.maxInsurableIncome}
                  onChange={(e) => setFormData({ ...formData, maxInsurableIncome: e.target.value })}
                  min="0"
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
                    ? 'Active rule for automated payroll and paycheck deductions'
                    : 'Inactive (archived or awaiting ratification)'}
                </span>
              </div>
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

export default InsuranceConfigModal;
