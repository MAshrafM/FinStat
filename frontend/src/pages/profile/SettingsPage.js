// frontend/src/pages/profile/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Sliders, Save, CheckCircle, HelpCircle, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../../components/ui';
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
        } catch (ignored) { }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container settings-page">
        <Loading variant="card" text="Loading application settings..." />
      </div>
    );
  }

  return (
    <div className="page-container settings-page">
      <div className="settings-shell">
        <div className="settings-header">
          <div className="settings-header-text">
            <h1>Portfolio &amp; Accounting Settings</h1>
            <p className="page-subtitle">Configure calculation engines and accounting rules for your investment portfolio.</p>
          </div>
          <Link to="/profile" className="fs-btn fs-btn-secondary settings-nav-link">
            <ArrowLeft size={16} aria-hidden="true" /> Back to Profile
          </Link>
        </div>

        <div className="settings-body">
          <form onSubmit={handleSave} className="settings-card">
            <div className="settings-section">
              <div className="section-title">
                <Sliders size={20} className="section-icon" aria-hidden="true" />
                <h2>Stock Cost-Basis Accounting Method</h2>
              </div>
              <p className="section-description">
                Choose how Cost of Goods Sold (COGS) and realized profit/loss are computed when you sell a portion of a stock position.
              </p>

              <div className="method-grid">
                <label
                  htmlFor="cost-basis-average"
                  aria-label="Weighted Average (Default)"
                  className={`method-option ${costBasisMethod === 'average' ? 'active' : ''}`}
                >
                  <input
                    id="cost-basis-average"
                    type="radio"
                    name="costBasisMethod"
                    value="average"
                    checked={costBasisMethod === 'average'}
                    onChange={(e) => setCostBasisMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <strong>Weighted Average (Default)</strong>
                      {costBasisMethod === 'average' && <CheckCircle size={18} className="check-icon" aria-hidden="true" />}
                    </div>
                    <p>
                      Pools all purchase tranches in the current iteration into a single blended average cost per share. Partial sales consume shares at the prevailing weighted average price.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="cost-basis-fifo"
                  aria-label="FIFO (First-In, First-Out)"
                  className={`method-option ${costBasisMethod === 'fifo' ? 'active' : ''}`}
                >
                  <input
                    id="cost-basis-fifo"
                    type="radio"
                    name="costBasisMethod"
                    value="fifo"
                    checked={costBasisMethod === 'fifo'}
                    onChange={(e) => setCostBasisMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <strong>FIFO (First-In, First-Out)</strong>
                      {costBasisMethod === 'fifo' && <CheckCircle size={18} className="check-icon" aria-hidden="true" />}
                    </div>
                    <p>
                      Assumes the oldest shares purchased are sold first. Maximizes realized gains in rising markets, leaving newer (higher-cost) lots as your remaining cost basis.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="cost-basis-lifo"
                  aria-label="LIFO (Last-In, First-Out)"
                  className={`method-option ${costBasisMethod === 'lifo' ? 'active' : ''}`}
                >
                  <input
                    id="cost-basis-lifo"
                    type="radio"
                    name="costBasisMethod"
                    value="lifo"
                    checked={costBasisMethod === 'lifo'}
                    onChange={(e) => setCostBasisMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-header">
                      <strong>LIFO (Last-In, First-Out)</strong>
                      {costBasisMethod === 'lifo' && <CheckCircle size={18} className="check-icon" aria-hidden="true" />}
                    </div>
                    <p>
                      Assumes the newest shares purchased are sold first. Minimizes short-term realized gains during inflationary or rising prices.
                    </p>
                  </div>
                </label>
              </div>

              <div className="info-box">
                <HelpCircle size={18} className="settings-info-icon" aria-hidden="true" />
                <div>
                  <strong>On-The-Fly Accounting Integrity:</strong> Changing this method dynamically updates your portfolio analysis and trade summary without altering historical trade entries. Each trade cycle (`iteration`) respects your preferred method independently.
                </div>
              </div>
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="fs-btn fs-btn-primary settings-save-btn" disabled={saving}>
                <Save size={18} aria-hidden="true" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          <div className="settings-card settings-card--spaced">
            <div className="settings-section">
              <div className="section-title">
                <Trash2 size={20} className="section-icon" aria-hidden="true" />
                <h2>Data Safety &amp; Soft-Delete Recycle Bin</h2>
              </div>
              <p className="section-description">
                Recover soft-deleted expenditures and investment trades with automated ledger balance re-propagation and bridge restoration.
              </p>
              <div className="settings-recycle-actions">
                <Link
                  to="/settings/recycle-bin"
                  className="fs-btn fs-btn-secondary settings-nav-link"
                  data-testid="link-recycle-bin"
                >
                  <Trash2 size={16} aria-hidden="true" /> Open Recycle Bin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
