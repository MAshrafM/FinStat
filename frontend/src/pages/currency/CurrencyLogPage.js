// frontend/src/pages/currency/CurrencyLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCurrency, deleteCurrency, revalueCurrency } from '../../services/currencyService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaSync,
  FaPlus,
  FaCheckCircle,
  FaExclamationCircle,
  FaUserEdit,
} from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import { Badge, Delta, Loading } from '../../components/ui';
import './Currency.css';

const getPnlDeltaProps = (value) => {
  if (value > 0) return { tone: 'positive', sign: 'positive', label: 'Gain' };
  if (value < 0) return { tone: 'negative', sign: 'negative', label: 'Loss' };
  return { tone: 'neutral', sign: 'none', label: 'No change' };
};

const formatSignedPct = (pct) => {
  const num = Number(pct) || 0;
  if (num > 0) return `+${num.toFixed(2)}%`;
  if (num < 0) return `\u2212${Math.abs(num).toFixed(2)}%`;
  return '0.00%';
};

const CurrencyLogPage = () => {
  const { canModify } = useCanModify();
  const { showToast } = useToast();
  const [currencyList, setCurrencyList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isRevaluing, setIsRevaluing] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  const fetchCurrencyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await getCurrency();
      setCurrencyList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load currency holdings:', err);
      const message = err.response?.data?.message || 'Failed to load foreign currency holdings';
      setFetchError(message);
      showToast('Failed to load foreign currency holdings', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCurrencyData();
  }, [fetchCurrencyData]);

  const handleRevalueNow = async () => {
    if (!canModify) return;
    try {
      setIsRevaluing(true);
      const res = await revalueCurrency();
      showToast(res.message || 'Forex holdings revalued successfully with latest rates', 'success');
      if (res.holdings && Array.isArray(res.holdings)) {
        setCurrencyList(res.holdings);
      } else {
        await fetchCurrencyData();
      }
    } catch (err) {
      console.error('Failed to revalue currency:', err);
      showToast(err.response?.data?.message || 'Forex revaluation failed', 'error');
    } finally {
      setIsRevaluing(false);
    }
  };

  const handleDelete = (id) => {
    if (!canModify) return;
    setHoldingToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!holdingToDelete) return;
    try {
      await deleteCurrency(holdingToDelete);
      showToast('Currency entry deleted successfully', 'success');
      setCurrencyList((prev) => prev.filter((c) => c._id !== holdingToDelete));
      setHoldingToDelete(null);
    } catch (err) {
      console.error('Failed to delete currency:', err);
      showToast(err.response?.data?.message || 'Failed to delete currency', 'error');
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const renderHealthBadge = (holding) => {
    if (holding.rateSource === 'manual') {
      return (
        <Badge tone="neutral" className="curr-health-badge">
          <FaUserEdit aria-hidden="true" /> Manual
        </Badge>
      );
    }
    if (holding.isStale || holding.rateSource === 'fallback') {
      return (
        <Badge tone="neutral" className="curr-health-badge">
          <FaExclamationCircle aria-hidden="true" /> Stale
        </Badge>
      );
    }
    return (
      <Badge tone="neutral" className="curr-health-badge">
        <FaCheckCircle aria-hidden="true" /> Live
      </Badge>
    );
  };

  const renderHeader = () => (
    <div className="curr-header">
      <div className="curr-header-title-group">
        <p className="curr-breadcrumb">Assets / Foreign Currency</p>
        <h1>Foreign Currency Wallet</h1>
      </div>
      <div className="curr-header-actions">
        <ProtectedAction tooltip="View-only access">
          <button
            type="button"
            className="fs-btn fs-btn-secondary"
            onClick={handleRevalueNow}
            disabled={isRevaluing}
          >
            <FaSync aria-hidden="true" className={isRevaluing ? 'curr-spin' : ''} />
            {isRevaluing ? 'Revaluing...' : 'Revalue Now'}
          </button>
        </ProtectedAction>
        <ProtectedAction tooltip="View-only access">
          <Link to="/currency/new" className="fs-btn fs-btn-primary">
            <FaPlus aria-hidden="true" /> Add Currency
          </Link>
        </ProtectedAction>
      </div>
    </div>
  );

  // Calculate aggregated metrics
  const totalCostBasis = currencyList.reduce((acc, c) => acc + Number(c.costBasis || c.price || 0), 0);
  const totalCurrentVal = currencyList.reduce(
    (acc, c) => acc + Number(c.currentValue || (c.amount * (c.currentRate || c.purchaseRate || 0)) || 0),
    0
  );
  const totalPnL = totalCurrentVal - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  if (isLoading) {
    return (
      <div className="page-container curr-page-container curr-log-page">
        <Loading variant="table" rows={5} text="Loading foreign currency holdings..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container curr-page-container curr-log-page">
        {renderHeader()}
        <div className="curr-error-card" role="alert">
          <h2>Unable to Load Currency Holdings</h2>
          <p>{fetchError}</p>
          <div className="curr-error-actions">
            <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchCurrencyData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const enrichedRows = currencyList.map((curr) => {
    const code = curr.currencyCode || curr.name;
    const amount = Number(curr.amount) || 0;
    const purchaseRate = Number(curr.purchaseRate || (amount > 0 ? curr.price / amount : 0));
    const currentRate = Number(curr.currentRate || purchaseRate);
    const costBasis = Number(curr.costBasis || curr.price || 0);
    const currentVal = Number(curr.currentValue || (amount * currentRate));
    const gainLoss = Number(curr.unrealizedGainLoss ?? (currentVal - costBasis));
    const gainLossPct = Number(
      curr.gainLossPercentage ?? (purchaseRate > 0 ? ((currentRate - purchaseRate) / purchaseRate) * 100 : 0)
    );
    const displayDate = curr.lastRevaluationDate ? formatDate(curr.lastRevaluationDate) : formatDate(curr.date);
    return {
      curr,
      code,
      amount,
      purchaseRate,
      currentRate,
      costBasis,
      currentVal,
      gainLoss,
      gainLossPct,
      displayDate,
    };
  });

  return (
    <div className="page-container curr-page-container curr-log-page">
      {renderHeader()}

      <section className="curr-overview-section" aria-label="Forex Portfolio Overview">
        <h2 className="curr-section-heading">Forex Portfolio Overview</h2>
        <div className="curr-kpi-grid">
          <div className="curr-kpi-tile">
            <span className="curr-kpi-label">Total Cost Basis</span>
            <span className="curr-kpi-value fs-num">{formatCurrency(totalCostBasis)}</span>
            <span className="curr-kpi-sub">Paid acquisition cost</span>
          </div>

          <div className="curr-kpi-tile">
            <span className="curr-kpi-label">Current Valuation (EGP)</span>
            <span className="curr-kpi-value fs-num">{formatCurrency(totalCurrentVal)}</span>
            <span className="curr-kpi-sub">Latest CIB market value</span>
          </div>

          <div className="curr-kpi-tile">
            <span className="curr-kpi-label">Unrealized Gain / Loss</span>
            <span className="curr-kpi-value fs-num">
              <Delta
                value={formatCurrency(Math.abs(totalPnL))}
                {...getPnlDeltaProps(totalPnL)}
              />
            </span>
            <span className="curr-kpi-sub fs-num">{formatSignedPct(totalPnLPercent)} net change</span>
          </div>

          <div className="curr-kpi-tile">
            <span className="curr-kpi-label">Holdings Count</span>
            <span className="curr-kpi-value fs-num">{currencyList.length}</span>
            <span className="curr-kpi-sub">active currency positions</span>
          </div>
        </div>
      </section>

      {enrichedRows.length === 0 ? (
        <div className="curr-empty-card">
          <h2>No Foreign Currency Holdings Found</h2>
          <p>
            No foreign currency holdings found. Use <strong>Add Currency</strong> to record your first position.
          </p>
          <div className="curr-error-actions">
            <ProtectedAction tooltip="View-only access">
              <Link to="/currency/new" className="fs-btn fs-btn-secondary">
                <FaPlus aria-hidden="true" /> Add Currency
              </Link>
            </ProtectedAction>
          </div>
        </div>
      ) : (
        <>
          <div className="curr-table-wrap">
            <table className="curr-table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th className="curr-th-num">Amount</th>
                  <th className="curr-th-num">Purchase Rate</th>
                  <th className="curr-th-num">Current Rate</th>
                  <th>Rate Status</th>
                  <th className="curr-th-num">Current Value (EGP)</th>
                  <th className="curr-th-num">Unrealized Gain / Loss</th>
                  <th>Date / Revalued</th>
                  <th className="curr-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedRows.map(({
                  curr,
                  code,
                  amount,
                  purchaseRate,
                  currentRate,
                  currentVal,
                  gainLoss,
                  gainLossPct,
                  displayDate,
                }) => {
                  const displayName = `${curr.name}${code && code !== curr.name ? ` (${code})` : ''}`;
                  const deltaValue = `${formatCurrency(Math.abs(gainLoss))} (${formatSignedPct(gainLossPct)})`;
                  return (
                    <tr key={curr._id}>
                      <td data-label="Currency">
                        <Link to={`/currency/${curr._id}`} className="curr-name-link">
                          {displayName}
                        </Link>
                      </td>
                      <td className="curr-td-num fs-num" data-label="Amount">
                        {amount.toLocaleString()} {code}
                      </td>
                      <td className="curr-td-num fs-num" data-label="Purchase Rate">
                        {purchaseRate.toFixed(2)} EGP
                      </td>
                      <td className="curr-td-num fs-num" data-label="Current Rate">
                        {currentRate.toFixed(2)} EGP
                      </td>
                      <td data-label="Rate Status">
                        {renderHealthBadge(curr)}
                      </td>
                      <td className="curr-td-num fs-num" data-label="Current Value">
                        {formatCurrency(currentVal)}
                      </td>
                      <td className="curr-td-num fs-num" data-label="Gain / Loss">
                        <Delta
                          value={deltaValue}
                          {...getPnlDeltaProps(gainLoss)}
                        />
                      </td>
                      <td data-label="Date">
                        {displayDate}
                      </td>
                      <td className="curr-th-actions" data-label="Actions">
                        <div className="curr-actions">
                          <Link
                            className="curr-icon-btn"
                            to={`/currency/${curr._id}`}
                            title="View Details"
                            aria-label={`View details for ${displayName}`}
                          >
                            <FaEye aria-hidden="true" />
                          </Link>
                          <ProtectedAction tooltip="View-only access">
                            <Link
                              className="curr-icon-btn"
                              to={`/currency/edit/${curr._id}`}
                              title="Edit"
                              aria-label={`Edit ${displayName}`}
                            >
                              <FaEdit aria-hidden="true" />
                            </Link>
                          </ProtectedAction>
                          <ProtectedAction tooltip="View-only access">
                            <button
                              type="button"
                              className="curr-icon-btn curr-icon-btn-danger"
                              onClick={() => handleDelete(curr._id)}
                              title="Delete"
                              aria-label={`Delete ${displayName}`}
                            >
                              <FaTrash aria-hidden="true" />
                            </button>
                          </ProtectedAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section
            className="curr-mobile-cards"
            aria-label="Foreign currency compact cards"
            data-testid="currency-mobile-cards"
          >
            {enrichedRows.map(({
              curr,
              code,
              amount,
              purchaseRate,
              currentRate,
              costBasis,
              currentVal,
              gainLoss,
              gainLossPct,
              displayDate,
            }) => {
              const isExpanded = expandedIds.includes(curr._id);
              const panelId = `curr-card-details-${curr._id}`;
              const displayName = `${curr.name}${code && code !== curr.name ? ` (${code})` : ''}`;

              return (
                <article key={curr._id} className="curr-mobile-card">
                  <div className="curr-card-compact-row">
                    <div className="curr-card-primary">
                      <Link to={`/currency/${curr._id}`} className="curr-name-link">
                        {displayName}
                      </Link>
                      {renderHealthBadge(curr)}
                    </div>
                    <div className="curr-card-metrics">
                      <div className="curr-card-val-stack">
                        <span className="curr-card-value fs-num">{formatCurrency(currentVal)}</span>
                        <Delta
                          value={`${formatCurrency(Math.abs(gainLoss))} (${formatSignedPct(gainLossPct)})`}
                          {...getPnlDeltaProps(gainLoss)}
                        />
                      </div>
                      <button
                        type="button"
                        className="curr-card-expander"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${displayName}`}
                        onClick={() => toggleExpand(curr._id)}
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div id={panelId} className="curr-card-expanded">
                      <div className="curr-card-detail-item">
                        <span className="curr-card-detail-label">Amount</span>
                        <span className="curr-card-detail-val fs-num">{amount.toLocaleString()} {code}</span>
                      </div>
                      <div className="curr-card-detail-item">
                        <span className="curr-card-detail-label">Purchase Rate</span>
                        <span className="curr-card-detail-val fs-num">{purchaseRate.toFixed(2)} EGP</span>
                      </div>
                      <div className="curr-card-detail-item">
                        <span className="curr-card-detail-label">Current Rate</span>
                        <span className="curr-card-detail-val fs-num">{currentRate.toFixed(2)} EGP</span>
                      </div>
                      <div className="curr-card-detail-item">
                        <span className="curr-card-detail-label">Cost Basis</span>
                        <span className="curr-card-detail-val fs-num">{formatCurrency(costBasis)}</span>
                      </div>
                      <div className="curr-card-detail-item">
                        <span className="curr-card-detail-label">Date / Revalued</span>
                        <span className="curr-card-detail-val">{displayDate}</span>
                      </div>
                      <div className="curr-card-actions">
                        <Link
                          className="fs-btn fs-btn-secondary"
                          to={`/currency/${curr._id}`}
                        >
                          <FaEye aria-hidden="true" /> View Details
                        </Link>
                        <ProtectedAction tooltip="View-only access">
                          <Link
                            className="fs-btn fs-btn-secondary"
                            to={`/currency/edit/${curr._id}`}
                          >
                            <FaEdit aria-hidden="true" /> Edit
                          </Link>
                        </ProtectedAction>
                        <ProtectedAction tooltip="View-only access">
                          <button
                            type="button"
                            className="fs-btn fs-btn-secondary curr-icon-btn-danger"
                            onClick={() => handleDelete(curr._id)}
                          >
                            <FaTrash aria-hidden="true" /> Delete
                          </button>
                        </ProtectedAction>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(holdingToDelete)}
        title="Delete Currency Entry"
        message="Are you sure you want to delete this currency holding?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setHoldingToDelete(null)}
      />
    </div>
  );
};

export default CurrencyLogPage;
