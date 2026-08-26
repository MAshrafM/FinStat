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
} from 'react-icons/fa';

const ASSET_CATEGORIES = [
  'All',
  'Stock',
  'Mutual Fund',
  'Gold',
  'Certificate',
  'Currency',
  'Real Estate',
];

const HoldingsTable = ({ holdings = [], isLoading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'currentValue', direction: 'desc' });

  // Filter holdings
  const filteredHoldings = useMemo(() => {
    let list = holdings;

    if (selectedCategory !== 'All') {
      list = list.filter(
        (h) => h.assetType.toLowerCase() === selectedCategory.toLowerCase()
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
    if (sortConfig.key !== key) return <FaSort style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? <FaSortUp color="#38bdf8" /> : <FaSortDown color="#38bdf8" />;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <span className="status-pill live" title="Live market price from primary financial provider">
            <span className="status-dot live"></span> Live
          </span>
        );
      case 'stale':
        return (
          <span className="status-pill stale" title="Fallback price from cache/history (live provider offline)">
            <span className="status-dot stale"></span> Stale
          </span>
        );
      case 'fixed':
        return (
          <span className="status-pill fixed" title="Fixed nominal value (1:1 book balance / fixed income)">
            <span className="status-dot fixed"></span> Fixed
          </span>
        );
      case 'manual':
        return (
          <span className="status-pill manual" title="User-entered manual estimate (not automatically fetched)">
            <span className="status-dot manual"></span> Manual
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
      Gold: 'gold',
      Certificate: 'certificate',
      Currency: 'currency',
      'Real Estate': 'real-estate',
      Cash: 'cash',
    };
    return map[assetType] || 'stock';
  };

  return (
    <div className="holdings-section">
      <div className="holdings-controls">
        {/* Category Filter Pills */}
        <div className="filter-pills">
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="holdings-search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="holdings-search-input"
            placeholder="Search holdings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>Asset {getSortIcon('name')}</th>
              <th onClick={() => handleSort('assetType')}>Type {getSortIcon('assetType')}</th>
              <th onClick={() => handleSort('quantity')}>Quantity {getSortIcon('quantity')}</th>
              <th onClick={() => handleSort('avgBuyPrice')}>Avg Cost {getSortIcon('avgBuyPrice')}</th>
              <th onClick={() => handleSort('currentPrice')}>Price {getSortIcon('currentPrice')}</th>
              <th onClick={() => handleSort('totalCost')}>Total Cost {getSortIcon('totalCost')}</th>
              <th onClick={() => handleSort('currentValue')}>Market Value {getSortIcon('currentValue')}</th>
              <th onClick={() => handleSort('unrealizedPnL')}>Unrealized P&L {getSortIcon('unrealizedPnL')}</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredHoldings.length > 0 ? (
              filteredHoldings.map((h) => {
                const isProfit = h.unrealizedPnL >= 0;
                return (
                  <tr key={h.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{h.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{h.symbol}</div>
                    </td>
                    <td>
                      <span className={`asset-type-badge ${getAssetBadgeClass(h.assetType)}`}>
                        {h.assetType}
                      </span>
                    </td>
                    <td>
                      {h.quantity.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{h.unitLabel}</span>
                    </td>
                    <td>{formatCurrency(h.avgBuyPrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(h.currentPrice)}</td>
                    <td>{formatCurrency(h.totalCost)}</td>
                    <td style={{ fontWeight: 700, color: '#f8fafc' }}>{formatCurrency(h.currentValue)}</td>
                    <td>
                      <div style={{ color: isProfit ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {isProfit ? '+' : ''}
                        {formatCurrency(h.unrealizedPnL)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isProfit ? '#4ade80' : '#f87171' }}>
                        {isProfit ? '+' : ''}
                        {h.unrealizedPnLPercentage.toFixed(2)}%
                      </div>
                    </td>
                    <td>{renderStatusBadge(h.priceStatus)}</td>
                    <td>
                      {h.sourceUrl && (
                        <Link to={h.sourceUrl} className="holding-link-btn" title="Go to detailed asset summary">
                          Details <FaExternalLinkAlt size={10} />
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
  );
};

export default HoldingsTable;
