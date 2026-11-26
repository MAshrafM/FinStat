// frontend/src/pages/mutual-funds/MutualFundSummaryPage.js
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useMFData } from '../../context/MFContext';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Delta } from '../../components/ui';
import Loading from '../../components/ui/Loading';
import './MutualFunds.css';

const profitTone = (value) => {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
};

const profitLabel = (value) => (value < 0 ? 'Loss' : 'Gain');

const MutualFundSummaryPage = () => {
  const { mfSummaryData, overallTotals, lastPriceData, isLoading, error } = useMFData();
  const [expandedCardIds, setExpandedCardIds] = useState(new Set());

  const toggleCardExpand = (id) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const profitValue = Number(overallTotals?.totalProfit) || 0;

  if (isLoading) {
    return (
      <div className="page-container mf-page-container mf-summary-page">
        <div className="mf-loading-wrap">
          <Loading variant="card" text="Loading mutual fund holdings..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container mf-page-container mf-summary-page">
      <div className="mf-header">
        <div className="mf-header-title-group">
          <p className="mf-breadcrumb">Mutual Funds &gt; Holdings Summary</p>
          <h1>Mutual Fund Holdings Summary</h1>
        </div>
      </div>

      {error && (
        <div className="mf-error-card" role="alert">
          <h2>Unable to load holdings</h2>
          <p>Failed to load mutual fund holdings.</p>
        </div>
      )}

      <div className="mf-kpi-grid">
        <div className="mf-kpi-card">
          <span className="mf-kpi-label">Total of all MF</span>
          <span className="mf-kpi-value fs-num">
            {formatCurrency(overallTotals?.totalOfAllMF)}
          </span>
        </div>
        <div className="mf-kpi-card">
          <span className="mf-kpi-label">Total of all Coupons</span>
          <span className="mf-kpi-value fs-num">
            {formatCurrency(overallTotals?.totalOfAllCoupons)}
          </span>
        </div>
        <div className="mf-kpi-card">
          <span className="mf-kpi-label">New Total</span>
          <span className="mf-kpi-value fs-num">{formatCurrency(overallTotals?.newTotal)}</span>
        </div>
        <div className="mf-kpi-card">
          <span className="mf-kpi-label">Selling Value</span>
          <span className="mf-kpi-value fs-num">
            {formatCurrency(overallTotals?.totalSellingValue)}
          </span>
        </div>
        <div className="mf-kpi-card">
          <span className="mf-kpi-label">Profit</span>
          <Delta
            className="mf-kpi-delta fs-num"
            value={`${profitValue.toFixed(2)}%`}
            tone={profitTone(profitValue)}
            label={profitLabel(profitValue)}
          />
        </div>
      </div>

      <div className="mf-desktop-table">
        <div
          className="mf-table-wrap"
          role="region"
          aria-label="Mutual fund holdings table"
          tabIndex={0}
        >
          <table className="mf-table">
            <thead>
              <tr>
                <th>Fund Name / Code</th>
                <th className="mf-th-num">Current Units</th>
                <th className="mf-th-num">Avg. Price Paid</th>
                <th className="mf-th-num">Total Value (Cost Basis)</th>
                <th className="mf-th-num">Total Coupons</th>
                <th className="mf-th-num">Value (Excluding Coupons)</th>
                <th className="mf-th-num">Current Prices</th>
                <th className="mf-th-num">Selling Value</th>
                <th className="mf-th-num">% Profit</th>
              </tr>
            </thead>
            <tbody>
              {mfSummaryData.map((item, index) => {
                const valueWithoutCoupons = item.totalValue - item.totalCouponValue;
                const row = lastPriceData?.find((n) => n?.name === item._id?.name);
                const currentPrice =
                  row?.lastPrice != null && row.lastPrice > 0 ? row.lastPrice : null;
                const sellingValue =
                  currentPrice != null
                    ? currentPrice * (item.currentUnits || 0)
                    : item.totalValue || 0;
                const totalProfit =
                  valueWithoutCoupons > 0 && currentPrice != null
                    ? (sellingValue / valueWithoutCoupons - 1) * 100
                    : 0;

                return (
                  <tr key={index}>
                    <td data-label="Code">
                      <span className="mf-fund-cell">
                        <span className="mf-fund-name">{item._id?.name}</span>
                        <span className="mf-fund-code fs-code">{item._id?.code}</span>
                      </span>
                    </td>
                    <td data-label="Units" className="fs-num">
                      {item.currentUnits}
                    </td>
                    <td data-label="Price" className="fs-num">
                      {formatCurrency(item.averagePrice)}
                    </td>
                    <td data-label="Value" className="fs-num">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td data-label="Coupons" className="fs-num">
                      {formatCurrency(item.totalCouponValue)}
                    </td>
                    <td data-label="Value w/ Coupons" className="fs-num">
                      {formatCurrency(valueWithoutCoupons)}
                    </td>
                    <td data-label="Curr. Price" className="fs-num">
                      {currentPrice != null ? (
                        formatCurrency(currentPrice)
                      ) : (
                        <Badge label="Price Unavailable" />
                      )}
                    </td>
                    <td data-label="Selling Value" className="fs-num">
                      {currentPrice != null ? formatCurrency(sellingValue) : '—'}
                    </td>
                    <td data-label="Profit" className="fs-num">
                      {currentPrice != null ? (
                        <Delta
                          value={`${totalProfit.toFixed(2)}%`}
                          tone={profitTone(totalProfit)}
                          label={profitLabel(totalProfit)}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mf-mobile-cards" data-testid="mf-summary-mobile-card-list">
        {mfSummaryData.map((item, index) => {
          const valueWithoutCoupons = item.totalValue - item.totalCouponValue;
          const row = lastPriceData?.find((n) => n?.name === item._id?.name);
          const currentPrice =
            row?.lastPrice != null && row.lastPrice > 0 ? row.lastPrice : null;
          const sellingValue =
            currentPrice != null
              ? currentPrice * (item.currentUnits || 0)
              : item.totalValue || 0;
          const totalProfit =
            valueWithoutCoupons > 0 && currentPrice != null
              ? (sellingValue / valueWithoutCoupons - 1) * 100
              : 0;
          const cardKey = item._id?.code || `mf-card-${index}`;
          const isExpanded = expandedCardIds.has(cardKey);

          return (
            <article key={cardKey} className="mf-mobile-card">
              <div className="mf-card-compact-row">
                <div className="mf-card-primary">
                  <span className="mf-card-name">{item._id?.name}</span>
                  <span className="mf-fund-code fs-code">{item._id?.code}</span>
                </div>
                <div className="mf-card-metrics">
                  <span className="mf-card-value fs-num">
                    {currentPrice != null ? formatCurrency(sellingValue) : '—'}
                  </span>
                  {currentPrice != null ? (
                    <Delta
                      value={`${totalProfit.toFixed(2)}%`}
                      tone={profitTone(totalProfit)}
                      label={profitLabel(totalProfit)}
                    />
                  ) : (
                    <span className="fs-num">—</span>
                  )}
                </div>
                <button
                  type="button"
                  className="mf-card-expander-btn"
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded
                      ? 'Collapse fund details'
                      : 'Expand fund details'
                  }
                  onClick={() => toggleCardExpand(cardKey)}
                >
                  {isExpanded ? (
                    <FaChevronUp aria-hidden="true" />
                  ) : (
                    <FaChevronDown aria-hidden="true" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="mf-card-expanded">
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Current Units</span>
                    <span className="mf-card-detail-val fs-num">{item.currentUnits}</span>
                  </div>
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Avg. Price Paid</span>
                    <span className="mf-card-detail-val fs-num">
                      {formatCurrency(item.averagePrice)}
                    </span>
                  </div>
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Total Value (Cost Basis)</span>
                    <span className="mf-card-detail-val fs-num">
                      {formatCurrency(item.totalValue)}
                    </span>
                  </div>
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Total Coupons</span>
                    <span className="mf-card-detail-val fs-num">
                      {formatCurrency(item.totalCouponValue)}
                    </span>
                  </div>
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Value (Excluding Coupons)</span>
                    <span className="mf-card-detail-val fs-num">
                      {formatCurrency(valueWithoutCoupons)}
                    </span>
                  </div>
                  <div className="mf-card-detail-item">
                    <span className="mf-card-detail-label">Current Price</span>
                    <span className="mf-card-detail-val fs-num">
                      {currentPrice != null ? (
                        formatCurrency(currentPrice)
                      ) : (
                        <Badge label="Price Unavailable" />
                      )}
                    </span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default MutualFundSummaryPage;
