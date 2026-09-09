// frontend/src/pages/profile/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Save, CheckCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [costBasisMethod, setCostBasisMethod] = useState('average');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      if (res && res.user) {
        setCostBasisMethod(res.user.costBasisMethod || 'average');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load user settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateUserProfile({ costBasisMethod });
      addToast(res.message || 'Cost-basis settings saved successfully!', 'success');
      
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.costBasisMethod = costBasisMethod;
          localStorage.setItem('user', JSON.stringify(parsed));
        } catch (ignored) {}
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p>Loading application settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container settings-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Portfolio & Accounting Settings</h1>
          <p className="page-subtitle">Configure calculation engines and accounting rules for your investment portfolio.</p>
        </div>
        <Link to="/profile" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Profile
        </Link>
      </div>

      <form onSubmit={handleSave} className="settings-card">
        <div className="settings-section">
          <div className="section-title">
            <Sliders size={20} className="section-icon" />
            <h2>Stock Cost-Basis Accounting Method</h2>
          </div>
          <p className="section-description">
            Choose how Cost of Goods Sold (COGS) and realized profit/loss are computed when you sell a portion of a stock position.
          </p>

          <div className="method-grid">
            <label className={`method-option ${costBasisMethod === 'average' ? 'active' : ''}`}>
              <input
                type="radio"
                name="costBasisMethod"
                value="average"
                checked={costBasisMethod === 'average'}
                onChange={(e) => setCostBasisMethod(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <strong>Weighted Average (Default)</strong>
                  {costBasisMethod === 'average' && <CheckCircle size={18} className="check-icon" />}
                </div>
                <p>
                  Pools all purchase tranches in the current iteration into a single blended average cost per share. Partial sales consume shares at the prevailing weighted average price.
                </p>
              </div>
            </label>

            <label className={`method-option ${costBasisMethod === 'fifo' ? 'active' : ''}`}>
              <input
                type="radio"
                name="costBasisMethod"
                value="fifo"
                checked={costBasisMethod === 'fifo'}
                onChange={(e) => setCostBasisMethod(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <strong>FIFO (First-In, First-Out)</strong>
                  {costBasisMethod === 'fifo' && <CheckCircle size={18} className="check-icon" />}
                </div>
                <p>
                  Assumes the oldest shares purchased are sold first. Maximizes realized gains in rising markets, leaving newer (higher-cost) lots as your remaining cost basis.
                </p>
              </div>
            </label>

            <label className={`method-option ${costBasisMethod === 'lifo' ? 'active' : ''}`}>
              <input
                type="radio"
                name="costBasisMethod"
                value="lifo"
                checked={costBasisMethod === 'lifo'}
                onChange={(e) => setCostBasisMethod(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <strong>LIFO (Last-In, First-Out)</strong>
                  {costBasisMethod === 'lifo' && <CheckCircle size={18} className="check-icon" />}
                </div>
                <p>
                  Assumes the newest shares purchased are sold first. Minimizes short-term realized gains during inflationary or rising prices.
                </p>
              </div>
            </label>
          </div>

          <div className="info-box">
            <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2980b9' }} />
            <div>
              <strong>On-The-Fly Accounting Integrity:</strong> Changing this method dynamically updates your portfolio analysis and trade summary without altering historical trade entries. Each trade cycle (`iteration`) respects your preferred method independently.
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
