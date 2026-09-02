// frontend/src/pages/admin/InsuranceConfigPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import {
  getSocialInsuranceConfigs,
  createSocialInsuranceConfig,
  updateSocialInsuranceConfig,
  deleteSocialInsuranceConfig,
} from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import './InsuranceConfigPage.css';

const InsuranceConfigPage = () => {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    country: 'Egypt',
    year: currentYear,
    employeeShare: 11,
    employerShare: 18.75,
    maxInsurableIncome: 16700,
    minInsurableIncome: 2700,
    isActive: true,
  });

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSocialInsuranceConfigs();
      if (res && res.socialInsuranceConfigs) {
        setConfigs(res.socialInsuranceConfigs);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch social insurance configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleOpenCreateModal = () => {
    setEditingConfig(null);
    setFormData({
      country: 'Egypt',
      year: currentYear,
      employeeShare: 11,
      employerShare: 18.75,
      maxInsurableIncome: 16700,
      minInsurableIncome: 2700,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (cfg) => {
    setEditingConfig(cfg);
    setFormData({
      country: cfg.country || 'Egypt',
      year: cfg.year || new Date().getFullYear(),
      employeeShare: cfg.employeeShare !== undefined ? cfg.employeeShare : 11,
      employerShare: cfg.employerShare !== undefined ? cfg.employerShare : 18.75,
      maxInsurableIncome: cfg.maxInsurableIncome || 14500,
      minInsurableIncome: cfg.minInsurableIncome || 2300,
      isActive: cfg.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (formData.maxInsurableIncome < formData.minInsurableIncome) {
      addToast('Max Insurable Income must be greater than or equal to Min Insurable Income', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingConfig) {
        await updateSocialInsuranceConfig(editingConfig._id, formData);
        addToast('Social insurance configuration updated successfully', 'success');
      } else {
        await createSocialInsuranceConfig(formData);
        addToast('Social insurance configuration created successfully', 'success');
      }
      setModalOpen(false);
      loadConfigs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm('Are you sure you want to delete this insurance configuration?')) return;
    try {
      await deleteSocialInsuranceConfig(id);
      addToast('Configuration deleted successfully', 'success');
      loadConfigs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete configuration', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header-section">
          <div>
            <div className="admin-badge-indicator">
              <ShieldAlert size={14} /> Admin System Configuration
            </div>
            <h1 className="admin-title">Social Insurance Configurations</h1>
            <p className="admin-subtitle">Manage Egyptian social insurance deduction rates, caps, and legal thresholds</p>
          </div>
          <button className="btn-create-admin" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>New Insurance Rule</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading configurations...</div>
        ) : configs.length === 0 ? (
          <div className="empty-state-card">
            <ShieldCheck size={48} className="empty-icon" />
            <h3>No Social Insurance Configurations Configured</h3>
            <p>Add official insurance rules and contribution caps for Egypt.</p>
            <button className="btn-create-admin mt-4" onClick={handleOpenCreateModal}>
              <Plus size={18} /> Add {currentYear} Insurance Rates
            </button>
          </div>
        ) : (
          <div className="admin-cards-grid">
            {configs.map(cfg => (
              <div key={cfg._id} className="admin-config-card">
                <div className="config-card-header">
                  <div>
                    <h3 className="config-year-title">{cfg.country} — Year {cfg.year}</h3>
                    <span className="text-xs text-slate-400">
                      Cap: <strong className="text-amber-300">{Number(cfg.maxInsurableIncome).toLocaleString()} EGP / mo</strong>
                    </span>
                  </div>
                  <div className="card-actions-row">
                    <button className="action-btn edit-btn" onClick={() => handleOpenEditModal(cfg)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteConfig(cfg._id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="insurance-params-grid">
                  <div className="param-item">
                    <span className="param-label">Employee Share</span>
                    <span className="param-val text-orange-400 font-bold">{cfg.employeeShare}%</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Employer Share</span>
                    <span className="param-val text-indigo-400 font-bold">{cfg.employerShare}%</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Min Insurable Floor</span>
                    <span className="param-val text-slate-200 font-semibold">{Number(cfg.minInsurableIncome || 0).toLocaleString()} EGP</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">Max Insurable Ceiling</span>
                    <span className="param-val text-slate-200 font-semibold">{Number(cfg.maxInsurableIncome).toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create/Edit Social Insurance Config */}
        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content-card max-w-2xl">
              <div className="modal-header">
                <h3>{editingConfig ? `Edit Insurance Rates (${formData.year})` : 'New Insurance Configuration'}</h3>
                <button className="close-modal-btn" onClick={() => setModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveConfig}>
                <div className="modal-form-fields">
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label className="form-label">Effective Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || currentYear })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group">
                      <label className="form-label">Employee Contribution Share (%) *</label>
                      <div className="number-input-wrapper">
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="e.g. 11"
                          value={formData.employeeShare}
                          onChange={(e) => setFormData({ ...formData, employeeShare: parseFloat(e.target.value) || 0 })}
                          required
                        />
                        <span className="unit-suffix">%</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employer Contribution Share (%) *</label>
                      <div className="number-input-wrapper">
                        <input
                          type="number"
                          step="any"
                          className="form-control"
                          placeholder="e.g. 18.75"
                          value={formData.employerShare}
                          onChange={(e) => setFormData({ ...formData, employerShare: parseFloat(e.target.value) || 0 })}
                          required
                        />
                        <span className="unit-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-row-grid">
                    <div className="form-group">
                      <label className="form-label">Minimum Insurable Income Floor (EGP)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 2300"
                        value={formData.minInsurableIncome}
                        onChange={(e) => setFormData({ ...formData, minInsurableIncome: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Maximum Insurable Income Ceiling (EGP) *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 14500"
                        value={formData.maxInsurableIncome}
                        onChange={(e) => setFormData({ ...formData, maxInsurableIncome: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editingConfig ? 'Update Configuration' : 'Create Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
};

export default InsuranceConfigPage;
