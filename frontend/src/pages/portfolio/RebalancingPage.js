// frontend/src/pages/portfolio/RebalancingPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { getRebalancingData, updateRebalancingTarget } from '../../services/portfolioService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import './RebalancingPage.css';

const ASSET_LABELS = {
  stocks: 'Stocks (Equities)',
  mutualFunds: 'Mutual Funds',
  gold: 'Gold (Precious Metals)',
  cash: 'Cash & Foreign Currencies',
  certificates: 'Bank Certificates',
};

const ASSET_COLORS = {
  stocks: '#3498db',
  mutualFunds: '#9b59b6',
  gold: '#f1c40f',
  cash: '#2ecc71',
  certificates: '#e67e22',
};

const RebalancingPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebalancingData, setRebalancingData] = useState(null);

  // Target editable state
  const [targetName, setTargetName] = useState('My Target');
  const [excludeRealEstate, setExcludeRealEstate] = useState(true);
  const [targetPercentages, setTargetPercentages] = useState({
    stocks: 40,
    gold: 20,
    mutualFunds: 20,
    cash: 10,
    certificates: 10,
  });

  const fetchData = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      const res = await getRebalancingData(refresh);
      const data = res?.data || res;
      setRebalancingData(data);

      if (data?.target) {
        setTargetName(data.target.name || 'Default Target');
        setExcludeRealEstate(data.target.excludeRealEstate !== false);
        const map = { stocks: 0, gold: 0, mutualFunds: 0, cash: 0, certificates: 0 };
        if (Array.isArray(data.target.targets)) {
          data.target.targets.forEach((t) => {
            if (map[t.assetType] !== undefined) map[t.assetType] = t.percentage;
          });
        }
        setTargetPercentages(map);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load rebalancing data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute sum of target percentages
  const targetSum = useMemo(() => {
    return Object.values(targetPercentages).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [targetPercentages]);

  const isSumValid = Math.abs(targetSum - 100) < 0.1;

  const handlePercentageChange = (assetType, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setTargetPercentages((prev) => ({
      ...prev,
      [assetType]: num,
    }));
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!isSumValid) {
      addToast(`Target allocation must sum to exactly 100% (currently ${targetSum.toFixed(1)}%)`, 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: targetName,
        excludeRealEstate,
        targets: Object.entries(targetPercentages).map(([assetType, percentage]) => ({
          assetType,
          percentage: Number(percentage),
        })),
      };

      await updateRebalancingTarget(payload);
      addToast('Rebalancing target updated successfully!', 'success');
      fetchData(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update rebalancing target', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTrade = (suggestion) => {
    // Advisory shortcut: opens relevant trade logging form pre-filled
    const cat = suggestion.assetType;
    if (cat === 'stocks') {
      navigate('/trades/new');
    } else if (cat === 'mutualFunds') {
      navigate('/mutual-funds/new');
    } else if (cat === 'gold') {
      navigate('/gold-wallet/new');
    } else if (cat === 'certificates') {
      navigate('/certificates/new');
    } else if (cat === 'cash') {
      navigate('/trades/new');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3.5rem 0', color: '#64748b' }}>
        <p>Analyzing asset allocation and generating rebalancing suggestions...</p>
      </div>
    );
  }

  const totalVal = rebalancingData?.totalPortfolioValue || 0;
  const allocations = rebalancingData?.allocations || [];
  const suggestions = rebalancingData?.suggestions || [];

  return (
    <div className="page-container rebalancing-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Portfolio Rebalancing & Advisory</h1>
          <p className="page-subtitle">
            Compare your active asset allocation against desired target weights and review suggested trades.
          </p>
        </div>
        <button onClick={() => fetchData(true)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={16} /> Refresh Valuation
        </button>
      </div>

      {/* Top Banner Stats */}
      <div className="rebalance-summary-cards">
        <div className="rebalance-card">
          <span className="card-label">Investable Portfolio Valuation</span>
          <strong className="card-val">{formatCurrency(totalVal)}</strong>
          <span className="card-sub">{excludeRealEstate ? 'Excludes Real Estate' : 'Includes Real Estate'}</span>
        </div>
        <div className="rebalance-card">
          <span className="card-label">Allocation Status</span>
          <strong className="card-val" style={{ color: suggestions.some((s) => s.action !== 'Hold') ? '#e67e22' : '#27ae60' }}>
            {suggestions.some((s) => s.action !== 'Hold') ? 'Rebalancing Recommended' : 'Balanced on Target'}
          </strong>
          <span className="card-sub">{suggestions.filter((s) => s.action !== 'Hold').length} adjustment(s) suggested</span>
        </div>
      </div>

      {/* Grid: Current vs Target */}
      <div className="rebalancing-grid">
        {/* Current Allocation Breakdown */}
        <div className="grid-box">
          <h2>Current Asset Allocation</h2>
          <div className="allocation-list">
            {allocations.map((item) => (
              <div key={item.assetType} className="allocation-row">
                <div className="row-header">
                  <span className="asset-dot" style={{ backgroundColor: ASSET_COLORS[item.assetType] || '#94a3b8' }} />
                  <span className="asset-name">{ASSET_LABELS[item.assetType] || item.assetType}</span>
                  <strong className="asset-pct">{item.currentPercentage.toFixed(1)}%</strong>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, item.currentPercentage)}%`,
                      backgroundColor: ASSET_COLORS[item.assetType] || '#3498db',
                    }}
                  />
                </div>
                <div className="row-footer">
                  <span>Current Value: {formatCurrency(item.currentValue)}</span>
                  <span>Target: {item.targetPercentage?.toFixed(1) || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Allocation Form */}
        <div className="grid-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Target Allocation Setup</h2>
            <span
              className="sum-badge"
              style={{
                background: isSumValid ? '#e8f8f5' : '#fee2e2',
                color: isSumValid ? '#27ae60' : '#dc2626',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
              }}
            >
              Total: {targetSum.toFixed(1)}% / 100%
            </span>
          </div>

          <form onSubmit={handleSaveTarget}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label>Target Name</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                required
                className="target-input"
              />
            </div>

            <div className="target-sliders-list">
              {Object.keys(targetPercentages).map((cat) => (
                <div key={cat} className="slider-group">
                  <div className="slider-label-row">
                    <span>{ASSET_LABELS[cat] || cat}</span>
                    <div className="slider-val-input">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={targetPercentages[cat]}
                        onChange={(e) => handlePercentageChange(cat, e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={targetPercentages[cat]}
                    onChange={(e) => handlePercentageChange(cat, e.target.value)}
                    className="range-slider"
                  />
                </div>
              ))}
            </div>

            <div className="form-checkbox" style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="excludeRealEstateCheck"
                checked={excludeRealEstate}
                onChange={(e) => setExcludeRealEstate(e.target.checked)}
              />
              <label htmlFor="excludeRealEstateCheck" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
                Exclude Real Estate from liquid rebalancing targets
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !isSumValid}
              style={{ width: '100%', marginTop: '20px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {saving ? 'Saving...' : 'Update & Recalculate Target'}
            </button>
          </form>
        </div>
      </div>

      {/* Suggested Trades Table */}
      <div className="table-container" style={{ marginTop: '30px' }}>
        <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Actionable Rebalancing Suggestions</h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Advisory trades calculated to realign your portfolio weights. No automated orders are placed.
            </p>
          </div>
        </div>

        <table className="styled-table">
          <thead>
            <tr>
              <th>Asset Category</th>
              <th>Action</th>
              <th>Suggested Amount</th>
              <th>Current Weight</th>
              <th>Target Weight</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Log Trade</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((sug) => (
              <tr key={sug.assetType}>
                <td data-label="Category" style={{ fontWeight: 'bold' }}>
                  {ASSET_LABELS[sug.assetType] || sug.assetType}
                </td>
                <td data-label="Action">
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: sug.action === 'Buy' ? '#e8f8f5' : sug.action === 'Sell' ? '#fee2e2' : '#f1f5f9',
                      color: sug.action === 'Buy' ? '#27ae60' : sug.action === 'Sell' ? '#dc2626' : '#64748b',
                    }}
                  >
                    {sug.action}
                  </span>
                </td>
                <td data-label="Amount" style={{ fontWeight: 'bold' }}>
                  {sug.amount > 0 ? formatCurrency(sug.amount) : '-'}
                </td>
                <td data-label="Current %">{sug.currentPercentage?.toFixed(1) || 0}%</td>
                <td data-label="Target %">{sug.targetPercentage?.toFixed(1) || 0}%</td>
                <td data-label="Description" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {sug.description}
                </td>
                <td data-label="Log Trade" style={{ textAlign: 'right' }}>
                  {sug.action !== 'Hold' ? (
                    <button
                      type="button"
                      onClick={() => handleApplyTrade(sug)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Log {sug.action} <ExternalLink size={12} />
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Balanced</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RebalancingPage;
