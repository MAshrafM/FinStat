// frontend/src/pages/real-estate/RealEstateLogPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getRealEstates,
  getRealEstateSummary,
  deleteRealEstate,
} from '../../services/realEstateService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaHome,
  FaSearch,
  FaSyncAlt,
  FaThLarge,
  FaList,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaCalendarAlt,
  FaChartLine,
} from 'react-icons/fa';
import './RealEstate.css';

const PROPERTY_TYPES = ['all', 'Residential', 'Commercial', 'Villa', 'Land', 'Other'];

const RealEstateLogPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('valuation'); // 'valuation' | 'gain' | 'date' | 'name'

  // Check viewer role
  const [canModify, setCanModify] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.role === 'viewer') setCanModify(false);
      } catch (e) {}
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [propsData, summaryData] = await Promise.all([
        getRealEstates({ status: selectedStatus, type: selectedType, search: searchTerm }),
        getRealEstateSummary(),
      ]);
      setProperties(propsData || []);
      setSummary(summaryData || null);
    } catch (err) {
      console.error('Failed to load real estate properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedType, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id, name) => {
    if (!canModify) return;
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteRealEstate(id);
        fetchData();
      } catch (err) {
        console.error('Failed to delete property:', err);
      }
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Residential':
        return 'residential';
      case 'Commercial':
        return 'commercial';
      case 'Villa':
        return 'villa';
      case 'Land':
        return 'land';
      default:
        return 'other';
    }
  };

  const getPropertyIcon = (type) => {
    switch (type) {
      case 'Residential':
        return '🏠';
      case 'Commercial':
        return '🏢';
      case 'Villa':
        return '🏰';
      case 'Land':
        return '🏞️';
      default:
        return '🏘️';
    }
  };

  // Filtered & Sorted properties
  const processedProperties = useMemo(() => {
    let list = [...properties];

    list.sort((a, b) => {
      if (sortBy === 'valuation') {
        return (b.currentValuation || 0) - (a.currentValuation || 0);
      }
      if (sortBy === 'gain') {
        const gainA = (a.currentValuation || 0) - (a.purchasePrice || 0);
        const gainB = (b.currentValuation || 0) - (b.purchasePrice || 0);
        return gainB - gainA;
      }
      if (sortBy === 'date') {
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return list;
  }, [properties, sortBy]);

  if (isLoading && properties.length === 0) {
    return (
      <div className="real-estate-page-wrapper">
        <div className="real-estate-container">
          <div className="empty-holdings-box" style={{ paddingTop: '100px' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Loading Real Estate Portfolio...</h2>
            <p>Fetching properties, locations, and market valuations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="real-estate-page-wrapper">
      <div className="real-estate-container">
      {/* 1. Header Section */}
      <div className="real-estate-header">
        <div className="real-estate-header-left">
          <h1>Real Estate Portfolio</h1>
          <p>Comprehensive property registry, capital cost basis, market appreciation, and rental/resale tracking.</p>
        </div>

        <div className="header-actions-group">
          <button className="btn-refresh" onClick={fetchData} disabled={isLoading} title="Refresh real estate data">
            <FaSyncAlt className={isLoading ? 'fa-spin' : ''} /> {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          {canModify && (
            <Link to="/real-estate/new" className="btn-primary-add">
              <FaPlus /> Add Property
            </Link>
          )}
        </div>
      </div>

      {/* 2. Top KPI Summary Cards */}
      {summary && (
        <div className="re-kpi-grid">
          {/* Total Invested */}
          <div className="re-kpi-card">
            <div className="re-kpi-glow" style={{ background: '#ec4899' }}></div>
            <div className="re-kpi-header">
              <span className="re-kpi-title">Capital Invested</span>
              <div className="re-kpi-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                <FaHome />
              </div>
            </div>
            <div className="re-kpi-value">{formatCurrency(summary.owned?.totalPaid || 0)}</div>
            <div className="re-kpi-sub">
              <span>Across <strong>{summary.owned?.count || 0}</strong> owned positions</span>
            </div>
          </div>

          {/* Current Valuation */}
          <div className="re-kpi-card">
            <div className="re-kpi-glow" style={{ background: '#a855f7' }}></div>
            <div className="re-kpi-header">
              <span className="re-kpi-title">Current Portfolio Value</span>
              <div className="re-kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <FaBuilding />
              </div>
            </div>
            <div className="re-kpi-value">{formatCurrency(summary.owned?.totalValuation || 0)}</div>
            <div className="re-kpi-sub">
              <span className="status-pill manual">
                <span className="status-dot manual"></span> User Valuation
              </span>
            </div>
          </div>

          {/* Unrealized Gain */}
          <div className="re-kpi-card">
            <div className="re-kpi-glow" style={{ background: '#22c55e' }}></div>
            <div className="re-kpi-header">
              <span className="re-kpi-title">Unrealized Capital Gain</span>
              <div className="re-kpi-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                <FaChartLine />
              </div>
            </div>
            <div
              className="re-kpi-value"
              style={{ color: (summary.owned?.unrealizedGain || 0) >= 0 ? '#4ade80' : '#f87171' }}
            >
              {(summary.owned?.unrealizedGain || 0) >= 0 ? '+' : ''}
              {formatCurrency(summary.owned?.unrealizedGain || 0)}
            </div>
            <div className="re-kpi-sub">
              <span
                className={`re-trend-pill ${(summary.owned?.unrealizedGain || 0) >= 0 ? 'positive' : 'negative'}`}
              >
                {(summary.owned?.unrealizedGain || 0) >= 0 ? '+' : ''}
                {(summary.owned?.gainPercentage || 0).toFixed(2)}% Overall Appreciation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Toolbar: Search, Filters & View Toggle */}
      <div className="re-controls-wrapper">
        <div className="re-controls-top">
          {/* Search Box */}
          <div className="re-search-input-wrap">
            <FaSearch className="re-search-icon" />
            <input
              type="text"
              className="re-search-input"
              placeholder="Search properties by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.86rem', width: 'auto' }}
              >
                <option value="valuation">Highest Valuation</option>
                <option value="gain">Highest Profit</option>
                <option value="date">Newest Acquired</option>
                <option value="name">Property Name</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="re-view-switcher">
              <button
                className={`re-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
              >
                <FaThLarge /> Cards
              </button>
              <button
                className={`re-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Dense Table View"
              >
                <FaList /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="re-filter-pills-row">
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
          {['all', 'Owned', 'Sold'].map((st) => (
            <button
              key={st}
              className={`re-pill ${selectedStatus === st ? 'active' : ''}`}
              onClick={() => setSelectedStatus(st)}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}

          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginLeft: '12px' }}>Type:</span>
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              className={`re-pill ${selectedType === t ? 'active' : ''}`}
              onClick={() => setSelectedType(t)}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Content: Grid vs Table View */}
      {processedProperties.length > 0 ? (
        viewMode === 'grid' ? (
          /* --- Grid Cards View --- */
          <div className="re-properties-grid">
            {processedProperties.map((p) => {
              const gain = p.currentValuation - p.purchasePrice;
              const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;
              const isProfit = gain >= 0;
              const maxVal = Math.max(p.purchasePrice, p.currentValuation, 1);
              const barPercent = Math.min(100, Math.max(10, (p.currentValuation / maxVal) * 100));

              return (
                <div key={p._id} className="prop-card">
                  <div className="prop-card-banner">
                    <div className="prop-icon-badge">{getPropertyIcon(p.type)}</div>
                    <div className="prop-card-badges">
                      <span className={`prop-badge ${getBadgeClass(p.type)}`}>{p.type}</span>
                      <span className={`status-pill ${p.status === 'Owned' ? 'live' : 'stale'}`}>
                        <span className={`status-dot ${p.status === 'Owned' ? 'live' : 'stale'}`}></span>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="prop-name">{p.name}</h3>

                  <div className="prop-location">
                    {p.location ? (
                      <>
                        <FaMapMarkerAlt color="#ec4899" /> <span>{p.location}</span>
                      </>
                    ) : (
                      <span>No location specified</span>
                    )}
                    {p.area > 0 && (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaRulerCombined size={12} color="#38bdf8" /> {p.area} m²
                      </span>
                    )}
                  </div>

                  {/* Appreciation Bar */}
                  <div className="appreciation-box">
                    <div className="appreciation-header">
                      <span>Valuation Growth</span>
                      <span style={{ color: isProfit ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                        {isProfit ? '+' : ''}
                        {gainPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="appreciation-bar-bg">
                      <div className="appreciation-bar-fill" style={{ width: `${barPercent}%` }}></div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="prop-metrics-grid">
                    <div className="prop-metric-cell">
                      <div className="prop-metric-label">Purchase Price</div>
                      <div className="prop-metric-val">{formatCurrency(p.purchasePrice)}</div>
                    </div>
                    <div className="prop-metric-cell">
                      <div className="prop-metric-label">Current Valuation</div>
                      <div className="prop-metric-val" style={{ color: '#38bdf8' }}>
                        {formatCurrency(p.currentValuation)}
                      </div>
                    </div>
                    <div className="prop-metric-cell" style={{ gridColumn: '1 / -1' }}>
                      <div className="prop-metric-label">Net Capital Gain</div>
                      <div
                        className="prop-metric-val"
                        style={{ color: isProfit ? '#4ade80' : '#f87171' }}
                      >
                        {isProfit ? '+' : ''}
                        {formatCurrency(gain)}
                      </div>
                    </div>
                  </div>

                  {p.notes && (
                    <div style={{ fontSize: '0.83rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '14px', lineHeight: 1.4 }}>
                      "{p.notes}"
                    </div>
                  )}

                  {/* Footer */}
                  <div className="prop-card-footer">
                    <div className="prop-date-tag">
                      <FaCalendarAlt style={{ marginRight: '5px' }} />
                      Acquired {formatDate(p.purchaseDate)}
                    </div>

                    {canModify && (
                      <div className="prop-card-actions">
                        <button
                          onClick={() => navigate(`/real-estate/edit/${p._id}`)}
                          className="btn-icon-action"
                          title="Edit property"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="btn-icon-action delete"
                          title="Delete property"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* --- Dense Table View --- */
          <div className="holdings-section">
            <div className="table-responsive">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Property Name</th>
                    <th>Type</th>
                    <th>Area</th>
                    <th>Purchase Price</th>
                    <th>Current Valuation</th>
                    <th>Capital Gain</th>
                    <th>Acquisition Date</th>
                    <th>Status</th>
                    {canModify && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {processedProperties.map((p) => {
                    const gain = p.currentValuation - p.purchasePrice;
                    const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;
                    const isProfit = gain >= 0;

                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                          {p.location && (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📍 {p.location}</div>
                          )}
                        </td>
                        <td>
                          <span className={`prop-badge ${getBadgeClass(p.type)}`}>{p.type}</span>
                        </td>
                        <td>{p.area > 0 ? `${p.area} m²` : '—'}</td>
                        <td>{formatCurrency(p.purchasePrice)}</td>
                        <td style={{ fontWeight: 700, color: '#38bdf8' }}>
                          {formatCurrency(p.currentValuation)}
                        </td>
                        <td>
                          <div style={{ color: isProfit ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                            {isProfit ? '+' : ''}
                            {formatCurrency(gain)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: isProfit ? '#4ade80' : '#f87171' }}>
                            {isProfit ? '+' : ''}
                            {gainPct.toFixed(2)}%
                          </div>
                        </td>
                        <td>{formatDate(p.purchaseDate)}</td>
                        <td>
                          <span className={`status-pill ${p.status === 'Owned' ? 'live' : 'stale'}`}>
                            <span className={`status-dot ${p.status === 'Owned' ? 'live' : 'stale'}`}></span>
                            {p.status}
                          </span>
                        </td>
                        {canModify && (
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => navigate(`/real-estate/edit/${p._id}`)}
                                className="holding-link-btn"
                                title="Edit property"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(p._id, p.name)}
                                className="holding-link-btn"
                                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                title="Delete property"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="empty-holdings-box" style={{ padding: '60px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🏘️</div>
          <h3 style={{ fontSize: '1.4rem', color: '#f8fafc', marginBottom: '8px' }}>No Real Estate Properties Found</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 24px', color: '#94a3b8', lineHeight: 1.5 }}>
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'No property records match your current filters. Try resetting the filters or search term.'
              : 'You have not recorded any real estate properties yet. Start tracking your properties, market valuations, and capital gains.'}
          </p>
          {canModify && (
            <Link to="/real-estate/new" className="btn-primary-add">
              <FaPlus /> Add Your First Property
            </Link>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default RealEstateLogPage;
