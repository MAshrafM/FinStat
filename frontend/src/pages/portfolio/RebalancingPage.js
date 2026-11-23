// frontend/src/pages/portfolio/RebalancingPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getRebalancingData, updateRebalancingTarget } from '../../services/portfolioService';
import { useToast } from '../../context/ToastContext';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Button, Loading } from '../../components/ui';
import './RebalancingPage.css';

const ASSET_LABELS = {
  stocks: 'Stocks (Equities)',
  mutualFunds: 'Mutual Funds',
  // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category, not a CSS color
  gold: 'Gold (Precious Metals)',
  cash: 'Cash & Foreign Currencies',
  certificates: 'Bank Certificates',
};

const RebalancingPage = () => {
  const canModifyHook = useCanModify();
  const canModify = typeof canModifyHook === 'boolean' ? canModifyHook : (canModifyHook?.canModify ?? true);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebalancingData, setRebalancingData] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  // Target editable state
  const [targetName, setTargetName] = useState('My Target');
  const [excludeRealEstate, setExcludeRealEstate] = useState(true);
  const [targetPercentages, setTargetPercentages] = useState({
    stocks: 40,
    // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category, not a CSS color
    gold: 20,
    mutualFunds: 20,
    cash: 10,
    certificates: 10,
  });

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const fetchData = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      const res = await getRebalancingData(refresh);
      const data = res?.data || res;
      setRebalancingData(data);

      if (data?.target) {
        setTargetName(data.target.name || 'Default Target');
        setExcludeRealEstate(data.target.excludeRealEstate !== false);
        // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category, not a CSS color
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
    if (!canModify) return;
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
    if (!canModify) return;
    // Advisory shortcut: opens relevant trade logging form pre-filled
    const cat = suggestion.assetType;
    const action = suggestion.action === 'Sell' ? 'Sell' : 'Buy';
    const prefill = {
      action,
      type: action,
      ticker: suggestion.ticker || '',
      stockCode: suggestion.ticker || '',
      shares: suggestion.shares || undefined,
      price: suggestion.price || undefined,
      totalValue: suggestion.amount || undefined,
      amount: suggestion.amount || undefined,
    };

    if (cat === 'stocks') {
      navigate('/trades/add', { state: { prefill } });
    } else if (cat === 'mutualFunds') {
      navigate('/mutual-funds/new', { state: { prefill } });
    // eslint-disable-next-line no-restricted-syntax -- 'gold' is an asset category, not a CSS color
    } else if (cat === 'gold') {
      navigate('/gold-wallet/new', { state: { prefill } });
    } else if (cat === 'certificates') {
      navigate('/certificates/new', { state: { prefill } });
    } else if (cat === 'cash') {
      navigate('/trades/add', { state: { prefill: { ...prefill, type: action === 'Buy' ? 'TopUp' : 'Withdraw' } } });
    } else {
      navigate('/trades/add', { state: { prefill } });
    }
  };

  const totalVal = rebalancingData?.totalPortfolioValue || 0;
  const allocations = rebalancingData?.allocations || [];
  const suggestions = rebalancingData?.suggestions || [];
  const hasDrift = suggestions.some((s) => s.action !== 'Hold');

  const getActionBadgeClass = (action) => {
    if (action === 'Buy') return 'rebalance-action-buy';
    if (action === 'Sell') return 'rebalance-action-sell';
    return 'rebalance-action-hold';
  };

  return (
    <div className="fs-page rebalancing-page" data-testid="portfolio-rebalancing-page">
      <div className="rebalancing-page-header">
        <div>
          <h1>Portfolio Rebalancing &amp; Advisory</h1>
          <p className="rebalancing-page-subtitle">
            Compare your active asset allocation against desired target weights and review suggested trades.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchData(true)}
          isLoading={loading}
          icon={<RefreshCw size={16} aria-hidden="true" />}
        >
          <span>Refresh Valuation</span>
        </Button>
      </div>

      {loading ? (
        <div className="rebalancing-loading-shell" data-testid="rebalancing-loading-shell">
          <div className="rebalance-summary-cards">
            <Loading variant="card" text="Analyzing asset allocation and generating rebalancing suggestions..." />
            <Loading variant="card" text="Calculating target weights..." />
          </div>
          <div className="rebalancing-grid">
            <div className="rebalancing-grid-box">
              <Loading variant="card" text="Loading current allocation..." />
            </div>
            <div className="rebalancing-grid-box">
              <Loading variant="card" text="Loading target setup..." />
            </div>
          </div>
          <div className="rebalance-suggestions-section">
            <Loading variant="table" rows={4} text="Loading actionable suggestions..." />
          </div>
        </div>
      ) : (
        <>
          {/* Top Banner Stats */}
          <div className="rebalance-summary-cards">
            <div className="rebalance-card">
              <span className="card-label">Investable Portfolio Valuation</span>
              <strong className="card-val fs-num">{formatCurrency(totalVal)}</strong>
              <span className="card-sub">{excludeRealEstate ? 'Excludes Real Estate' : 'Includes Real Estate'}</span>
            </div>
            <div className="rebalance-card">
              <span className="card-label">Allocation Status</span>
              <div className="card-val">
                <span className={`fs-badge ${hasDrift ? 'fs-badge--warning' : 'fs-badge--neutral'}`}>
                  {hasDrift ? 'Rebalancing Recommended' : 'Balanced on Target'}
                </span>
              </div>
              <span className="card-sub">{suggestions.filter((s) => s.action !== 'Hold').length} adjustment(s) suggested</span>
            </div>
          </div>

          {/* Grid: Current vs Target */}
          <div className="rebalancing-grid">
            {/* Current Allocation Breakdown */}
            <div className="rebalancing-grid-box">
              <h2>Current Asset Allocation</h2>
              <div className="allocation-list">
                {allocations.map((item) => (
                  <div key={item.assetType} className="allocation-row">
                    <div className="row-header">
                      <span className="asset-dot" aria-hidden="true" />
                      <span className="asset-name">{ASSET_LABELS[item.assetType] || item.assetType}</span>
                      <strong className="asset-pct fs-num">{item.currentPercentage.toFixed(1)}%</strong>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, item.currentPercentage)}%`,
                        }}
                      />
                    </div>
                    <div className="row-footer">
                      <span className="fs-num">Current Value: {formatCurrency(item.currentValue)}</span>
                      <span className="fs-num">Target: {item.targetPercentage?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Allocation Form */}
            <div className="rebalancing-grid-box">
              <div className="target-setup-header">
                <h2>Target Allocation Setup</h2>
                <span
                  className={`sum-badge fs-num ${isSumValid ? 'sum-badge--valid' : 'sum-badge--invalid'}`}
                >
                  Total: {targetSum.toFixed(1)}% / 100%
                </span>
              </div>

              <form onSubmit={handleSaveTarget}>
                <div className="form-group">
                  <label htmlFor="targetNameInput">Target Name</label>
                  <input
                    id="targetNameInput"
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
                            aria-label={`${ASSET_LABELS[cat] || cat} target percentage`}
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
                        aria-label={`${ASSET_LABELS[cat] || cat} range slider`}
                      />
                    </div>
                  ))}
                </div>

                <div className="rebalance-form-checkbox">
                  <input
                    type="checkbox"
                    id="excludeRealEstateCheck"
                    checked={excludeRealEstate}
                    onChange={(e) => setExcludeRealEstate(e.target.checked)}
                  />
                  <label htmlFor="excludeRealEstateCheck">
                    Exclude Real Estate from liquid rebalancing targets
                  </label>
                </div>

                <div className="rebalance-form-submit-row">
                  <ProtectedAction tooltip="View-only access">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving || !isSumValid}
                      isLoading={saving}
                      className="rebalance-submit-btn"
                    >
                      <span>Update &amp; Recalculate Target</span>
                    </Button>
                  </ProtectedAction>
                </div>
              </form>
            </div>
          </div>

          {/* Suggested Trades Section */}
          <div className="rebalance-suggestions-section">
            <div className="rebalance-section-header">
              <h2>Actionable Rebalancing Suggestions</h2>
              <p>
                Advisory trades calculated to realign your portfolio weights. No automated orders are placed.
              </p>
            </div>

            {/* Desktop Table (Canonical Reference Frame 01) */}
            <div className="rebalance-desktop-table">
              <div className="fs-table-container">
                <table className="fs-table rebalance-table">
                  <thead>
                    <tr>
                      <th scope="col">Asset Category</th>
                      <th scope="col">Action</th>
                      <th scope="col" className="text-right">Suggested Amount</th>
                      <th scope="col" className="text-right">Current Weight</th>
                      <th scope="col" className="text-right">Target Weight</th>
                      <th scope="col">Description</th>
                      <th scope="col" className="text-right">Log Trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((sug) => (
                      <tr key={sug.assetType}>
                        <td data-label="Category" className="font-semibold">
                          {ASSET_LABELS[sug.assetType] || sug.assetType}
                        </td>
                        <td data-label="Action">
                          <span
                            className={`rebalance-action-badge ${getActionBadgeClass(sug.action)}`}
                          >
                            {sug.action}
                          </span>
                        </td>
                        <td data-label="Amount" className="text-right font-semibold fs-num">
                          {sug.amount > 0 ? formatCurrency(sug.amount) : '-'}
                        </td>
                        <td data-label="Current %" className="text-right fs-num">{sug.currentPercentage?.toFixed(1) || 0}%</td>
                        <td data-label="Target %" className="text-right fs-num">{sug.targetPercentage?.toFixed(1) || 0}%</td>
                        <td data-label="Description" className="text-muted">
                          {sug.description}
                        </td>
                        <td data-label="Log Trade" className="text-right">
                          {sug.action !== 'Hold' ? (
                            <ProtectedAction tooltip="View-only access">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleApplyTrade(sug)}
                                iconRight={<ExternalLink size={12} aria-hidden="true" />}
                              >
                                <span>Log {sug.action}</span>
                              </Button>
                            </ProtectedAction>
                          ) : (
                            <span className="text-muted fs-num">Balanced</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Compact-Expand Cards (Decision D19 at <= 768px) */}
            <div className="rebalance-mobile-cards">
              {suggestions.map((sug) => {
                const isExpanded = expandedIds.includes(sug.assetType);
                return (
                  <div key={sug.assetType} className="rebalance-mobile-card">
                    {/* Collapsed Primary Row */}
                    <div className="rebalance-mobile-primary-row">
                      <div className="rebalance-mobile-info">
                        <span className="rebalance-mobile-category">
                          {ASSET_LABELS[sug.assetType] || sug.assetType}
                        </span>
                        <div>
                          <span className={`rebalance-action-badge ${getActionBadgeClass(sug.action)}`}>
                            {sug.action}
                          </span>
                        </div>
                      </div>

                      <div className="rebalance-mobile-right">
                        <span className="rebalance-mobile-amount fs-num">
                          {sug.amount > 0 ? formatCurrency(sug.amount) : '-'}
                        </span>
                        <button
                          type="button"
                          className="rebalance-mobile-toggle-btn"
                          onClick={() => toggleExpand(sug.assetType)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${ASSET_LABELS[sug.assetType] || sug.assetType}`}
                        >
                          {isExpanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="rebalance-mobile-expanded-content">
                        <div className="rebalance-mobile-grid">
                          <div className="rebalance-mobile-cell">
                            <span className="rebalance-mobile-cell-label">Current Weight</span>
                            <span className="rebalance-mobile-cell-val fs-num">
                              {sug.currentPercentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <div className="rebalance-mobile-cell">
                            <span className="rebalance-mobile-cell-label">Target Weight</span>
                            <span className="rebalance-mobile-cell-val fs-num">
                              {sug.targetPercentage?.toFixed(1) || 0}%
                            </span>
                          </div>
                          <div className="rebalance-mobile-desc">
                            {sug.description}
                          </div>
                        </div>

                        {sug.action !== 'Hold' && (
                          <div className="rebalance-mobile-action-row">
                            <ProtectedAction tooltip="View-only access">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleApplyTrade(sug)}
                                iconRight={<ExternalLink size={12} aria-hidden="true" />}
                                className="rebalance-mobile-action-btn"
                              >
                                <span>Log {sug.action}</span>
                              </Button>
                            </ProtectedAction>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RebalancingPage;
