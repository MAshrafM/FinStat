// frontend/src/pages/trades/CorporateActionWizard.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wand2, AlertCircle, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { executeCorporateActionWizard } from '../../services/corporateActionService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import './CorporateActionWizard.css';

const CorporateActionWizard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { openPosData, isLoading } = useData();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    stockCode: '',
    broker: 'Thndr',
    type: 'split', // 'split' or 'bonus'
    ratio: 2, // 2 for 2:1 split, 0.1 for 10% bonus
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Unique list of held stocks
  const availablePositions = useMemo(() => {
    if (!Array.isArray(openPosData)) return [];
    return openPosData.filter((p) => p?._id?.stockCode && (p.currentShares || 0) > 0);
  }, [openPosData]);

  // Set default selected stock if available
  useEffect(() => {
    if (!formData.stockCode && availablePositions.length > 0) {
      setFormData((prev) => ({
        ...prev,
        stockCode: availablePositions[0]._id.stockCode,
        broker: availablePositions[0]._id.broker,
      }));
    }
  }, [availablePositions, formData.stockCode]);

  // Currently selected position
  const selectedPosition = useMemo(() => {
    return availablePositions.find(
      (p) => p._id.stockCode === formData.stockCode && p._id.broker === formData.broker
    );
  }, [availablePositions, formData.stockCode, formData.broker]);

  // Calculations for preview
  const previewData = useMemo(() => {
    const currentShares = Number(selectedPosition?.currentShares || 0);
    const currentAvgPrice = Number(selectedPosition?.avgPrice || selectedPosition?.averageBuyPrice || 0);
    const ratio = Number(formData.ratio || 1);

    if (currentShares <= 0 || ratio <= 0) {
      return { newShares: 0, newAvgPrice: 0, multiplier: 1 };
    }

    let multiplier = 1;
    if (formData.type === 'split') {
      multiplier = ratio;
    } else if (formData.type === 'bonus') {
      multiplier = 1 + ratio;
    }

    const newShares = Number((currentShares * multiplier).toFixed(4));
    const newAvgPrice = multiplier > 0 ? Number((currentAvgPrice / multiplier).toFixed(4)) : currentAvgPrice;

    return {
      currentShares,
      currentAvgPrice,
      newShares,
      newAvgPrice,
      multiplier,
      totalPositionCost: Number((currentShares * currentAvgPrice).toFixed(2)),
    };
  }, [selectedPosition, formData.type, formData.ratio]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'ratio' ? Number(value) : value,
    }));
  };

  const handleStockSelection = (e) => {
    const combined = e.target.value; // e.g. "COMI_Thndr"
    const [stockCode, broker] = combined.split('_');
    setFormData((prev) => ({
      ...prev,
      stockCode,
      broker,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.stockCode) {
      addToast('Please select a stock position to apply corporate action', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await executeCorporateActionWizard({
        stockCode: formData.stockCode,
        broker: formData.broker,
        type: formData.type,
        ratio: Number(formData.ratio),
        effectiveDate: formData.effectiveDate,
        notes: formData.notes || `${formData.type === 'split' ? `${formData.ratio}:1 Stock Split` : `${(formData.ratio * 100).toFixed(0)}% Bonus Issue`} applied retroactively`,
        logTrade: true,
      });

      addToast('Corporate action applied successfully! Holdings adjusted on-the-fly.', 'success');
      navigate('/corporate-actions');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to apply corporate action', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container wizard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Corporate Action Wizard</h1>
          <p className="page-subtitle">Apply stock splits or bonus share distributions retroactively without altering historical data.</p>
        </div>
        <Link to="/corporate-actions" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> View All Actions
        </Link>
      </div>

      <div className="wizard-card">
        {/* Step Indicator */}
        <div className="wizard-steps">
          <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">{step > 1 ? '✓' : '1'}</div>
            <span>1. Select Stock</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">{step > 2 ? '✓' : '2'}</div>
            <span>2. Action & Ratio</span>
          </div>
          <div className="step-divider" />
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>3. Review & Apply</span>
          </div>
        </div>

        {/* STEP 1: SELECT STOCK */}
        {step === 1 && (
          <div className="step-content">
            <h3>Select a Position</h3>
            <p className="step-desc">Choose from your currently active stock positions to apply this corporate action.</p>

            {availablePositions.length === 0 && !isLoading ? (
              <div className="empty-notice">
                <AlertCircle size={24} style={{ color: '#e67e22' }} />
                <p>No open stock positions found in your portfolio. You must hold active shares to apply a corporate action.</p>
              </div>
            ) : (
              <div className="form-group">
                <label>Select Open Stock Holding</label>
                <select
                  value={`${formData.stockCode}_${formData.broker}`}
                  onChange={handleStockSelection}
                  className="wizard-select"
                >
                  {availablePositions.map((pos) => (
                    <option
                      key={`${pos._id.stockCode}_${pos._id.broker}`}
                      value={`${pos._id.stockCode}_${pos._id.broker}`}
                    >
                      {pos._id.stockCode} ({pos._id.broker}) - {pos.currentShares.toLocaleString()} shares @ {formatCurrency(pos.avgPrice || pos.averageBuyPrice)}
                    </option>
                  ))}
                </select>

                {selectedPosition && (
                  <div className="selected-preview-card">
                    <div className="preview-stat">
                      <span className="stat-label">Stock Code</span>
                      <strong className="stat-val">{selectedPosition._id.stockCode}</strong>
                    </div>
                    <div className="preview-stat">
                      <span className="stat-label">Broker</span>
                      <strong className="stat-val">{selectedPosition._id.broker}</strong>
                    </div>
                    <div className="preview-stat">
                      <span className="stat-label">Current Shares</span>
                      <strong className="stat-val">{selectedPosition.currentShares.toLocaleString()}</strong>
                    </div>
                    <div className="preview-stat">
                      <span className="stat-label">Avg Buy Price</span>
                      <strong className="stat-val">{formatCurrency(selectedPosition.avgPrice || selectedPosition.averageBuyPrice)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="wizard-actions">
              <span />
              <button
                type="button"
                className="btn btn-primary"
                disabled={!formData.stockCode}
                onClick={() => setStep(2)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Continue to Action Setup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIGURE ACTION */}
        {step === 2 && (
          <div className="step-content">
            <h3>Configure Corporate Action</h3>
            <p className="step-desc">Define the event type, ratio, and the date the corporate action took effect on the exchange.</p>

            <div className="form-group">
              <label>Corporate Action Type</label>
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.type === 'split' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'split', ratio: 2 }))}
                >
                  <strong>Stock Split (e.g., 2:1 or 3:1)</strong>
                  <span>Splits each share into multiple shares</span>
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.type === 'bonus' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'bonus', ratio: 0.1 }))}
                >
                  <strong>Bonus Issue (Stock Dividend)</strong>
                  <span>Issues additional free shares (e.g., 10%)</span>
                </button>
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  {formData.type === 'split' ? 'Split Ratio (Multiplier)' : 'Bonus Issue Ratio (Decimal)'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  name="ratio"
                  value={formData.ratio}
                  onChange={handleChange}
                  required
                  placeholder={formData.type === 'split' ? 'e.g. 2 for 2-for-1' : 'e.g. 0.10 for 10%'}
                  className="wizard-input"
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                  {formData.type === 'split'
                    ? 'Enter 2 for a 2:1 split, 3 for 3:1, or 0.5 for a 1:2 reverse split.'
                    : 'Enter 0.10 for a 10% bonus share issue, 0.25 for 25%.'}
                </small>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Effective Date</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  required
                  className="wizard-input"
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Trades entered prior to this date will be adjusted.
                </small>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Notes (Optional)</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g., EGX Board approved 2:1 split"
                className="wizard-input"
              />
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!formData.ratio || formData.ratio <= 0}
                onClick={() => setStep(3)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Preview Impact <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFIRM */}
        {step === 3 && (
          <div className="step-content">
            <h3>Review & Confirm Impact</h3>
            <p className="step-desc">Inspect how your position's shares and average cost basis will be adjusted on-the-fly.</p>

            <div className="impact-comparison-box">
              <div className="comparison-col before">
                <h4>Before Adjustment</h4>
                <div className="metric-row">
                  <span>Shares:</span>
                  <strong>{previewData.currentShares.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Avg Price:</span>
                  <strong>{formatCurrency(previewData.currentAvgPrice)}</strong>
                </div>
                <div className="metric-row">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(previewData.totalPositionCost)}</strong>
                </div>
              </div>

              <div className="comparison-arrow">
                <ArrowRight size={24} />
              </div>

              <div className="comparison-col after">
                <h4>After Corporate Action</h4>
                <div className="metric-row">
                  <span>Shares:</span>
                  <strong style={{ color: '#27ae60' }}>{previewData.newShares.toLocaleString()}</strong>
                </div>
                <div className="metric-row">
                  <span>Avg Price:</span>
                  <strong style={{ color: '#2980b9' }}>{formatCurrency(previewData.newAvgPrice)}</strong>
                </div>
                <div className="metric-row">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(previewData.totalPositionCost)}</strong>
                </div>
              </div>
            </div>

            <div className="confirmation-summary">
              <p>
                Applying a <strong>{formData.type === 'split' ? `${formData.ratio}:1 Stock Split` : `${(formData.ratio * 100).toFixed(0)}% Bonus Issue`}</strong> to <strong>{formData.stockCode} ({formData.broker})</strong> effective <strong>{formData.effectiveDate}</strong>.
              </p>
            </div>

            <div className="wizard-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Wand2 size={18} />
                {submitting ? 'Applying...' : 'Confirm & Apply Corporate Action'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateActionWizard;
