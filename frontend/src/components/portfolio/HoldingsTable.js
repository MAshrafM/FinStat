// frontend/src/components/portfolio/HoldingsTable.js
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { Loading } from '../ui';

const ASSET_CATEGORIES = [
  'All',
  'Stock',
  'Mutual Fund',
  // eslint-disable-next-line no-restricted-syntax -- 'Gold' is an asset category, not a CSS color
  'Gold',
  'Certificate',
  'Currency',
  'Cash',
  'Real Estate',
];

const HoldingsTable = ({ holdings = [], isLoading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'currentValue', direction: 'desc' });
  const [expandedIds, setExpandedIds] = useState([]);

  // Toggle card expansion for Decision D19 mobile view
  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter & sort holdings
  const filteredHoldings = useMemo(() => {
    let list = holdings;

    if (selectedCategory !== 'All') {
      list = list.filter(
        (h) => h.assetType && h.assetType.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(term)) ||
          (h.symbol && h.symbol.toLowerCase().includes(term)) ||
          (h.assetType && h.assetType.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortConfig.key) {
      list = [...list].sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [holdings, selectedCategory, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="sort-icon-muted" aria-hidden="true" />;
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="sort-icon-active" aria-hidden="true" />
    ) : (
      <FaSortDown className="sort-icon-active" aria-hidden="true" />
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <span className="status-pill live" title="Live market price from primary financial provider">
            <span className="portfolio-status-dot live" aria-hidden="true"></span> Live
          </span>
        );
      case 'stale':
        return (
          <span className="status-pill stale" title="Fallback price from cache/history (live provider offline)">
            <span className="portfolio-status-dot stale" aria-hidden="true"></span> Stale
          </span>
        );
      case 'fixed':
        return (
          <span className="status-pill fixed" title="Fixed nominal value (1:1 book balance / fixed income)">
            <span className="portfolio-status-dot fixed" aria-hidden="true"></span> Fixed
          </span>
        );
      case 'manual':
        return (
          <span className="status-pill manual" title="User-entered manual estimate (not automatically fetched)">
            <span className="portfolio-status-dot manual" aria-hidden="true"></span> Manual
          </span>
        );
      default:
        return null;
    }
  };

  const getAssetBadgeClass = (assetType) => {
    const map = {
      Stock: 'stock',
      'Mutual Fund': 'mutual-fund',
      // eslint-disable-next-line no-restricted-syntax -- 'Gold' is an asset category, not a CSS color
      Gold: 'gold',
      Certificate: 'certificate',
      Currency: 'currency',
      'Real Estate': 'real-estate',
      Cash: 'cash',
    };
    return map[assetType] || 'stock';
  };

  return (
    <div className="holdings-section" data-testid="portfolio-holdings-section">
      <div className="holdings-controls">
        {/* Category Filter Pills */}
        <div className="filter-pills" role="tablist" aria-label="Filter by asset category">
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="holdings-search-box">
          <FaSearch className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="holdings-search-input fs-input"
            placeholder="Search holdings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search holdings"
          />
        </div>
      </div>

      {/* Table / Skeleton Area */}
      {isLoading ? (
        <div className="table-responsive holdings-desktop-table">
          <div className="fs-table-container">
            <Loading variant="table" rows={5} text="Loading holdings..." />
          </div>
        </div>
      ) : (
        <>
          {/* Desktop 10-Column Table (>768px, Canonical Reference Frame 01) */}
          <div className="table-responsive holdings-desktop-table">
        <div className="fs-table-container">
          <table className="fs-table portfolio-table">
            <thead>
              <tr>
                <th scope="col" onClick={() => handleSort('name')} className="sortable-th">
                  Asset {getSortIcon('name')}
                </th>
                <th scope="col" onClick={() => handleSort('assetType')} className="sortable-th">
                  Type {getSortIcon('assetType')}
                </th>
                <th scope="col" onClick={() => handleSort('quantity')} className="sortable-th text-right">
                  Quantity {getSortIcon('quantity')}
                </th>
                <th scope="col" onClick={() => handleSort('avgBuyPrice')} className="sortable-th text-right">
                  Avg Cost {getSortIcon('avgBuyPrice')}
                </th>
                <th scope="col" onClick={() => handleSort('currentPrice')} className="sortable-th text-right">
                  Price {getSortIcon('currentPrice')}
                </th>
                <th scope="col" onClick={() => handleSort('totalCost')} className="sortable-th text-right">
                  Total Cost {getSortIcon('totalCost')}
                </th>
                <th scope="col" onClick={() => handleSort('currentValue')} className="sortable-th text-right">
                  Market Value {getSortIcon('currentValue')}
                </th>
                <th scope="col" onClick={() => handleSort('unrealizedPnL')} className="sortable-th text-right">
                  Unrealized P&amp;L {getSortIcon('unrealizedPnL')}
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.length > 0 ? (
                filteredHoldings.map((h) => {
                  const isProfit = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.id || `${h.assetType}-${h.symbol || h.name}`}>
                      <td>
                        <div className="holding-name-text">{h.name}</div>
                        <div className="holding-symbol-text">{h.symbol}</div>
                      </td>
                      <td>
                        <span className={`asset-type-badge ${getAssetBadgeClass(h.assetType)}`}>
                          {h.assetType}
                        </span>
                      </td>
                      <td className="text-right fs-num">
                        {h.quantity ? h.quantity.toLocaleString() : '0'}{' '}
                        <span className="holding-unit-label">{h.unitLabel}</span>
                      </td>
                      <td className="text-right fs-num">{formatCurrency(h.avgBuyPrice)}</td>
                      <td className="text-right fs-num font-semibold">{formatCurrency(h.currentPrice)}</td>
                      <td className="text-right fs-num">{formatCurrency(h.totalCost)}</td>
                      <td className="text-right fs-num holding-current-val">{formatCurrency(h.currentValue)}</td>
                      {/* Ordinary Unrealized P&L is neutral per §6.10 line 1746 */}
                      <td className="text-right fs-num">
                        <div>
                          {isProfit ? '+' : ''}
                          {formatCurrency(h.unrealizedPnL)}
                        </div>
                        <div className="holding-pct-sub">
                          {isProfit ? '+' : ''}
                          {(h.unrealizedPnLPercentage || 0).toFixed(2)}%
                        </div>
                      </td>
                      <td>{renderStatusBadge(h.priceStatus)}</td>
                      <td className="text-right">
                        {h.sourceUrl && (
                          <Link
                            to={h.sourceUrl}
                            className="fs-btn fs-btn-secondary holding-action-btn"
                            title="Go to detailed asset summary"
                          >
                            <span>Details</span>
                            <FaExternalLinkAlt size={10} aria-hidden="true" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10">
                    <div className="empty-holdings-box">
                      <h3>No holdings found</h3>
                      <p>{searchTerm ? 'Try adjusting your search query.' : 'No asset records match the selected filter.'}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Compact-Expand Vertical Cards (<=768px, Decision D19) */}
      <div className="holdings-mobile-cards" data-testid="holdings-mobile-card-list">
        {filteredHoldings.length > 0 ? (
          filteredHoldings.map((h) => {
            const isExpanded = expandedIds.includes(h.id);
            const isProfit = h.unrealizedPnL >= 0;

            return (
              <div key={h.id || `${h.assetType}-${h.symbol || h.name}`} className="holding-mobile-card">
                {/* Collapsed Primary Row */}
                <div className="holding-mobile-primary-row">
                  <div className="holding-mobile-info">
                    <div className="holding-mobile-title-wrap">
                      <span className="holding-name-text">{h.name}</span>
                      {h.symbol && <span className="holding-symbol-text">({h.symbol})</span>}
                    </div>
                    <span className={`asset-type-badge ${getAssetBadgeClass(h.assetType)}`}>
                      {h.assetType}
                    </span>
                  </div>

                  <div className="holding-mobile-right">
                    <div className="holding-mobile-val fs-num">{formatCurrency(h.currentValue)}</div>
                    <button
                      type="button"
                      className="holding-mobile-toggle-btn"
                      onClick={() => toggleExpand(h.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${h.name}`}
                    >
                      {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="holding-mobile-expanded-content">
                    <div className="holding-mobile-grid">
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Quantity</span>
                        <span className="holding-cell-val fs-num">
                          {h.quantity ? h.quantity.toLocaleString() : '0'} {h.unitLabel}
                        </span>
                      </div>
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Avg Buy Cost</span>
                        <span className="holding-cell-val fs-num">{formatCurrency(h.avgBuyPrice)}</span>
                      </div>
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Current Price</span>
                        <span className="holding-cell-val fs-num font-semibold">{formatCurrency(h.currentPrice)}</span>
                      </div>
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Total Cost</span>
                        <span className="holding-cell-val fs-num">{formatCurrency(h.totalCost)}</span>
                      </div>
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Unrealized P&amp;L</span>
                        <span className="holding-cell-val fs-num">
                          {isProfit ? '+' : ''}
                          {formatCurrency(h.unrealizedPnL)} ({(h.unrealizedPnLPercentage || 0).toFixed(2)}%)
                        </span>
                      </div>
                      <div className="holding-mobile-cell">
                        <span className="holding-cell-label">Price Status</span>
                        <span className="holding-cell-val">{renderStatusBadge(h.priceStatus)}</span>
                      </div>
                    </div>

                    {h.sourceUrl && (
                      <div className="holding-mobile-action-row">
                        <Link
                          to={h.sourceUrl}
                          className="fs-btn fs-btn-secondary holding-mobile-link"
                          title="Go to detailed asset summary"
                        >
                          <span>Go to Asset Details</span>
                          <FaExternalLinkAlt size={12} aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-holdings-box">
            <h3>No holdings found</h3>
            <p>{searchTerm ? 'Try adjusting your search query.' : 'No asset records match the selected filter.'}</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default HoldingsTable;
