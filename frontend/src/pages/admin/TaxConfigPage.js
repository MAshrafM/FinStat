// frontend/src/pages/admin/TaxConfigPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, ShieldAlert, Receipt, X } from 'lucide-react';
import {
  getTaxBracketConfigs,
  createTaxBracketConfig,
  updateTaxBracketConfig,
  deleteTaxBracketConfig,
} from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import './TaxConfigPage.css';

const DEFAULT_EGYPT_BRACKETS = [
  { level: 1, from: 0, to: 40000, rate: 0 },
  { level: 2, from: 40001, to: 55000, rate: 10 },
  { level: 3, from: 55001, to: 70000, rate: 15 },
  { level: 4, from: 70001, to: 200000, rate: 20 },
  { level: 5, from: 200001, to: 400000, rate: 22.5 },
  { level: 6, from: 400001, to: 1200000, rate: 25 },
  { level: 7, from: 1200001, to: 100000000, rate: 27.5 },
];

const TaxConfigPage = () => {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    country: 'Egypt',
    year: new Date().getFullYear(),
    personalExemption: 20000,
    isActive: true,
    brackets: DEFAULT_EGYPT_BRACKETS,
  });

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTaxBracketConfigs();
      if (res && res.taxBracketConfigs) {
        setConfigs(res.taxBracketConfigs);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch tax configurations', 'error');
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
      year: new Date().getFullYear(),
      personalExemption: 20000,
      isActive: true,
      brackets: DEFAULT_EGYPT_BRACKETS,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (cfg) => {
    setEditingConfig(cfg);
    setFormData({
      country: cfg.country || 'Egypt',
      year: cfg.year || new Date().getFullYear(),
      personalExemption: cfg.personalExemption || 0,
      isActive: cfg.isActive !== false,
      brackets: cfg.brackets && cfg.brackets.length > 0 ? cfg.brackets : DEFAULT_EGYPT_BRACKETS,
    });
    setModalOpen(true);
  };

  const handleAddBracketRow = () => {
    const lastBracket = formData.brackets[formData.brackets.length - 1];
    const newFrom = lastBracket ? (lastBracket.to < 100000000 ? lastBracket.to + 1 : lastBracket.from + 50000) : 0;
    const newTo = newFrom + 50000;
    setFormData(prev => ({
      ...prev,
      brackets: [
        ...prev.brackets,
        { level: prev.brackets.length + 1, from: newFrom, to: newTo, rate: 25 },
      ],
    }));
  };

  const handleRemoveBracketRow = (index) => {
    setFormData(prev => ({
      ...prev,
      brackets: prev.brackets.filter((_, i) => i !== index),
    }));
  };

  const handleBracketChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      brackets: prev.brackets.map((b, i) => (i === index ? { ...b, [field]: parseFloat(value) || 0 } : b)),
    }));
  };

  const validateSequentialBrackets = (brackets) => {
    if (!brackets || brackets.length === 0) return 'At least one bracket is required';
    for (let i = 0; i < brackets.length; i++) {
      if (brackets[i].to <= brackets[i].from) {
        return `Bracket #${i + 1}: 'To' (${brackets[i].to}) must be greater than 'From' (${brackets[i].from})`;
      }
    }
    const sorted = [...brackets].sort((a, b) => a.from - b.from);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].from < sorted[i - 1].to) {
        return `Overlapping range between bracket #${i} and #${i + 1}`;
      }
    }
    return null;
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const errorMsg = validateSequentialBrackets(formData.brackets);
    if (errorMsg) {
      addToast(errorMsg, 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingConfig) {
        await updateTaxBracketConfig(editingConfig._id, formData);
        addToast('Tax bracket configuration updated successfully', 'success');
      } else {
        await createTaxBracketConfig(formData);
        addToast('Tax bracket configuration created successfully', 'success');
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
    if (!window.confirm('Are you sure you want to delete this tax bracket configuration?')) return;
    try {
      await deleteTaxBracketConfig(id);
      addToast('Configuration deleted', 'success');
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
            <h1 className="admin-title">Tax Bracket Configurations</h1>
            <p className="admin-subtitle">Manage official yearly Egyptian tax brackets and personal exemptions without code changes</p>
          </div>
          <button className="btn-create-admin" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>New Tax Bracket Rule</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading tax configurations...</div>
        ) : configs.length === 0 ? (
          <div className="empty-state-card">
            <Receipt size={48} className="empty-icon" />
            <h3>No Tax Configurations Configured</h3>
            <p>Add a yearly progressive tax bracket configuration for Egypt.</p>
            <button className="btn-create-admin mt-4" onClick={handleOpenCreateModal}>
              <Plus size={18} /> Add {new Date().getFullYear()} Tax Brackets
            </button>
          </div>
        ) : (
          <div className="admin-cards-grid">
            {configs.map(cfg => (
              <div key={cfg._id} className="admin-config-card">
                <div className="config-card-header">
                  <div>
                    <h3 className="config-year-title">{cfg.country} — Tax Year {cfg.year}</h3>
                    <span className="text-xs text-slate-400">
                      Personal Exemption: <strong className="text-indigo-300">{Number(cfg.personalExemption || 0).toLocaleString()} EGP / yr</strong>
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

                <div className="brackets-preview-table-wrapper">
                  <table className="brackets-mini-table">
                    <thead>
                      <tr>
                        <th>From (EGP)</th>
                        <th>To (EGP)</th>
                        <th>Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cfg.brackets || []).map((b, i) => (
                        <tr key={i}>
                          <td>{Number(b.from).toLocaleString()}</td>
                          <td>{b.to >= 100000000 ? '∞' : Number(b.to).toLocaleString()}</td>
                          <td className="font-semibold text-rose-400">{b.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create/Edit Tax Bracket Config */}
        {modalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content-card max-w-3xl">
              <div className="modal-header">
                <h3>{editingConfig ? `Edit Tax Brackets (${formData.year})` : 'New Tax Bracket Configuration'}</h3>
                <button className="close-modal-btn" onClick={() => setModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveConfig}>
                <div className="modal-form-fields">
                  <div className="form-row-grid">
                    <div className="form-group">
                      <label className="form-label">Tax Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Annual Personal Exemption (EGP) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.personalExemption}
                        onChange={(e) => setFormData({ ...formData, personalExemption: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="brackets-editor-header">
                    <h4 className="text-sm font-semibold text-slate-200">Progressive Brackets (Sequential & Non-Overlapping)</h4>
                    <button type="button" className="btn-add-tier" onClick={handleAddBracketRow}>
                      <Plus size={14} /> Add Bracket Tier
                    </button>
                  </div>

                  <div className="brackets-editor-table-container">
                    <table className="brackets-editor-table">
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>From (EGP)</th>
                          <th>To (EGP)</th>
                          <th>Rate (%)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.brackets.map((b, idx) => (
                          <tr key={idx}>
                            <td className="text-center font-bold text-slate-400">#{idx + 1}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control mini-input"
                                value={b.from}
                                onChange={(e) => handleBracketChange(idx, 'from', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control mini-input"
                                value={b.to}
                                onChange={(e) => handleBracketChange(idx, 'to', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <div className="number-input-wrapper">
                                <input
                                  type="number"
                                  step="any"
                                  className="form-control mini-input"
                                  value={b.rate}
                                  onChange={(e) => handleBracketChange(idx, 'rate', e.target.value)}
                                  required
                                />
                                <span className="unit-suffix">%</span>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="remove-row-btn"
                                onClick={() => handleRemoveBracketRow(idx)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default TaxConfigPage;
