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
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import Loading from '../../components/ui/Loading';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useCanModify } from '../../context/AuthContext';
import './RealEstate.css';

const PROPERTY_TYPES = ['all', 'Residential', 'Commercial', 'Villa', 'Land', 'Other'];
const STATUS_FILTERS = ['all', 'Owned', 'Sold'];

const renderPropertyIcon = (type) => {
  switch (type) {
    case 'Commercial':
      return <FaBuilding aria-hidden="true" />;
    case 'Land':
      return <FaMapMarkerAlt aria-hidden="true" />;
    default:
      return <FaHome aria-hidden="true" />;
  }
};

const formatSignedCurrency = (amount) => {
  const num = Number(amount) || 0;
  if (num > 0) return `+${formatCurrency(num)}`;
  return formatCurrency(num);
};

const formatSignedPercent = (pct, decimals = 2) => {
  const num = Number(pct) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
};

const RealEstateLogPage = () => {
  const navigate = useNavigate();
  const { canModify } = useCanModify();
  const { showToast, addToast } = useToast();
  const notify = showToast || addToast;

  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [properties, setProperties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('valuation'); // 'valuation' | 'gain' | 'date' | 'name'
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const [propsData, summaryData] = await Promise.all([
        getRealEstates({ status: selectedStatus, type: selectedType, search: searchTerm }),
        getRealEstateSummary(),
      ]);
      setProperties(propsData || []);
      setSummary(summaryData || null);
    } catch (err) {
      console.error('Failed to load real estate properties:', err);
      setFetchError(err.message || 'Failed to load real estate portfolio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedType, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (id, name) => {
    if (!canModify) return;
    setPropertyToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteRealEstate(propertyToDelete.id);
      if (notify) notify('Real estate property deleted successfully', 'success');
      setPropertyToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete property:', err);
      if (notify) notify('Failed to delete property', 'error');
    }
  };

  const toggleMobileExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const processedProperties = useMemo(() => {
    const list = [...properties];
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

  if (isLoading && properties.length === 0 && !fetchError) {
    return (
      <div className="page-container re-page-container re-log-page">
        <Loading variant="card" text="Loading real estate portfolio..." />
      </div>
    );
  }

  const ownedSummary = summary?.owned || {};
  const hasActiveFilters = Boolean(searchTerm || selectedType !== 'all' || selectedStatus !== 'all');

  return (
    <div className="page-container re-page-container re-log-page">
      {/* 1. Header Section */}
      <nav className="re-breadcrumb" aria-label="Breadcrumb">
        <span>Assets</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Real Estate</span>
      </nav>

      <header className="re-header">
        <div className="re-header-left">
          <h1>Real Estate Portfolio</h1>
          <p className="re-header-subtitle">
            Comprehensive property registry, capital cost basis, market appreciation, and rental/resale tracking.
          </p>
        </div>

        <div className="re-header-actions">
          <button
            type="button"
            className="fs-btn fs-btn-secondary"
            onClick={fetchData}
            disabled={isLoading}
            title="Refresh real estate data"
          >
            <FaSyncAlt className={isLoading ? 're-spin' : ''} aria-hidden="true" />{' '}
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <ProtectedAction tooltip="View-only access">
            <Link to="/real-estate/new" className="fs-btn fs-btn-primary">
              <FaPlus aria-hidden="true" /> Add Property
            </Link>
          </ProtectedAction>
        </div>
      </header>

      {/* Fetch Error State */}
      {fetchError && (
        <div className="re-error-card" role="alert">
          <h2>Unable to Load Real Estate Portfolio</h2>
          <p>{fetchError}</p>
          <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {!fetchError && (
        <>
          {/* 2. Top KPI Summary Tiles (Frame 03 — Strictly Neutral per Option B') */}
          {summary && (
            <section className="re-kpi-grid" aria-label="Real estate portfolio summary">
              <div className="re-kpi-tile">
                <div className="re-kpi-header">
                  <span className="re-kpi-title">Capital Invested</span>
                  <FaHome className="re-kpi-icon" aria-hidden="true" />
                </div>
                <div className="re-kpi-value fs-num">{formatCurrency(ownedSummary.totalPaid || 0)}</div>
                <div className="re-kpi-sub">
                  <span>
                    Across <strong className="fs-num">{ownedSummary.count || 0}</strong> owned positions
                  </span>
                </div>
              </div>

              <div className="re-kpi-tile">
                <div className="re-kpi-header">
                  <span className="re-kpi-title">Current Portfolio Value</span>
                  <FaBuilding className="re-kpi-icon" aria-hidden="true" />
                </div>
                <div className="re-kpi-value fs-num">{formatCurrency(ownedSummary.totalValuation || 0)}</div>
                <div className="re-kpi-sub">
                  <Badge tone="neutral">User Valuation</Badge>
                </div>
              </div>

              <div className="re-kpi-tile">
                <div className="re-kpi-header">
                  <span className="re-kpi-title">Unrealized Capital Gain</span>
                  <FaChartLine className="re-kpi-icon" aria-hidden="true" />
                </div>
                <div className="re-kpi-value fs-num">
                  {formatSignedCurrency(ownedSummary.unrealizedGain || 0)}
                </div>
                <div className="re-kpi-sub">
                  <span className="fs-num">
                    {formatSignedPercent(ownedSummary.gainPercentage || 0, 2)} Overall Appreciation
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* 3. Toolbar: Search, Sort, View Switcher & Filter Pills */}
          <section className="re-controls-card" aria-label="Property filters and view controls">
            <div className="re-controls-top">
              <div className="re-search-wrap">
                <label className="re-sr-only" htmlFor="re-search">
                  Search properties
                </label>
                <FaSearch className="re-search-icon" aria-hidden="true" />
                <input
                  id="re-search"
                  type="text"
                  className="re-search-input"
                  placeholder="Search properties by name, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="re-controls-right">
                <div className="re-sort-group">
                  <label className="re-control-label" htmlFor="re-sort">
                    Sort By:
                  </label>
                  <select
                    id="re-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="re-sort-select"
                  >
                    <option value="valuation">Highest Valuation</option>
                    <option value="gain">Highest Profit</option>
                    <option value="date">Newest Acquired</option>
                    <option value="name">Property Name</option>
                  </select>
                </div>

                <div className="re-view-switcher" role="group" aria-label="Property view mode">
                  <button
                    type="button"
                    className="re-view-btn"
                    aria-pressed={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    title="Grid Card View"
                  >
                    <FaThLarge aria-hidden="true" /> Cards
                  </button>
                  <button
                    type="button"
                    className="re-view-btn"
                    aria-pressed={viewMode === 'table'}
                    onClick={() => setViewMode('table')}
                    title="Dense Table View"
                  >
                    <FaList aria-hidden="true" /> Table
                  </button>
                </div>
              </div>
            </div>

            <div className="re-filters-row">
              <div className="re-filter-group" role="group" aria-label="Filter by property status">
                <span className="re-control-label">Status:</span>
                {STATUS_FILTERS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className="re-pill"
                    aria-pressed={selectedStatus === st}
                    onClick={() => setSelectedStatus(st)}
                  >
                    {st === 'all' ? 'All' : st}
                  </button>
                ))}
              </div>

              <div className="re-filter-group" role="group" aria-label="Filter by property type">
                <span className="re-control-label">Type:</span>
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="re-pill"
                    aria-pressed={selectedType === t}
                    onClick={() => setSelectedType(t)}
                  >
                    {t === 'all' ? 'All Types' : t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Main Content: Cards vs Table View */}
          {processedProperties.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="re-properties-grid">
                {processedProperties.map((p) => {
                  const gain = p.currentValuation - p.purchasePrice;
                  const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;
                  const maxVal = Math.max(p.purchasePrice, p.currentValuation, 1);
                  const barPercent = Math.min(100, Math.max(10, (p.currentValuation / maxVal) * 100));

                  return (
                    <article key={p._id} className="re-prop-card">
                      <div className="re-prop-card-top">
                        <div className="re-prop-icon-box">{renderPropertyIcon(p.type)}</div>
                        <div className="re-prop-badges">
                          <Badge tone="neutral">{p.type}</Badge>
                          <Badge tone="neutral">{p.status}</Badge>
                        </div>
                      </div>

                      <div className="re-prop-title-block">
                        <h2 className="re-prop-name">{p.name}</h2>
                        <div className="re-prop-meta">
                          <span className="re-meta-item">
                            <FaMapMarkerAlt aria-hidden="true" />
                            <span>{p.location || 'No location specified'}</span>
                          </span>
                          {p.area > 0 && (
                            <span className="re-meta-item fs-num">
                              <FaRulerCombined aria-hidden="true" /> {p.area} m²
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="re-appreciation-box">
                        <div className="re-appreciation-header">
                          <span>Valuation Change</span>
                          <span className="re-appreciation-pct fs-num">
                            {formatSignedPercent(gainPct, 1)}
                          </span>
                        </div>
                        <progress
                          className="re-appreciation-progress"
                          aria-label={`Valuation change for ${p.name}`}
                          aria-valuetext={formatSignedPercent(gainPct, 1)}
                          value={Math.round(barPercent)}
                          max={100}
                        />
                      </div>

                      <div className="re-metrics-grid">
                        <div className="re-metric-cell">
                          <span className="re-metric-label">Purchase Price</span>
                          <span className="re-metric-val fs-num">{formatCurrency(p.purchasePrice)}</span>
                        </div>
                        <div className="re-metric-cell">
                          <span className="re-metric-label">Current Valuation</span>
                          <span className="re-metric-val fs-num">{formatCurrency(p.currentValuation)}</span>
                        </div>
                        <div className="re-metric-cell re-metric-cell-full">
                          <span className="re-metric-label">Net Capital Gain</span>
                          <span className="re-metric-val fs-num">{formatSignedCurrency(gain)}</span>
                        </div>
                      </div>

                      {p.notes && <p className="re-prop-notes">&ldquo;{p.notes}&rdquo;</p>}

                      <div className="re-prop-footer">
                        <span className="re-date-tag">
                          <FaCalendarAlt aria-hidden="true" />
                          Acquired {formatDate(p.purchaseDate)}
                        </span>

                        <div className="re-card-actions">
                          <ProtectedAction tooltip="View-only access">
                            <button
                              type="button"
                              onClick={() => navigate(`/real-estate/edit/${p._id}`)}
                              className="re-icon-btn"
                              aria-label={`Edit ${p.name}`}
                              title="Edit property"
                            >
                              <FaEdit aria-hidden="true" />
                            </button>
                          </ProtectedAction>
                          <ProtectedAction tooltip="View-only access">
                            <button
                              type="button"
                              onClick={() => handleDelete(p._id, p.name)}
                              className="re-icon-btn re-icon-btn-danger"
                              aria-label={`Delete ${p.name}`}
                              title="Delete property"
                            >
                              <FaTrash aria-hidden="true" />
                            </button>
                          </ProtectedAction>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Dense Table View (Waiver W-8E-1, > 768px) */}
                <div className="re-table-wrap">
                  <table className="re-table">
                    <thead>
                      <tr>
                        <th scope="col">Property Name</th>
                        <th scope="col">Type</th>
                        <th scope="col" className="re-th-num">Area</th>
                        <th scope="col" className="re-th-num">Purchase Price</th>
                        <th scope="col" className="re-th-num">Current Valuation</th>
                        <th scope="col" className="re-th-num">Capital Gain</th>
                        <th scope="col">Acquisition Date</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedProperties.map((p) => {
                        const gain = p.currentValuation - p.purchasePrice;
                        const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;

                        return (
                          <tr key={p._id}>
                            <td>
                              <div className="re-cell-name">{p.name}</div>
                              {p.location && (
                                <div className="re-cell-sub">
                                  <FaMapMarkerAlt aria-hidden="true" /> {p.location}
                                </div>
                              )}
                            </td>
                            <td>
                              <Badge tone="neutral">{p.type}</Badge>
                            </td>
                            <td className="re-td-num fs-num">{p.area > 0 ? `${p.area} m²` : '—'}</td>
                            <td className="re-td-num fs-num">{formatCurrency(p.purchasePrice)}</td>
                            <td className="re-td-num fs-num">{formatCurrency(p.currentValuation)}</td>
                            <td className="re-td-num fs-num">
                              <div>{formatSignedCurrency(gain)}</div>
                              <div className="re-gain-sub">{formatSignedPercent(gainPct, 2)}</div>
                            </td>
                            <td>{formatDate(p.purchaseDate)}</td>
                            <td>
                              <Badge tone="neutral">{p.status}</Badge>
                            </td>
                            <td>
                              <div className="re-card-actions">
                                <ProtectedAction tooltip="View-only access">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/real-estate/edit/${p._id}`)}
                                    className="re-icon-btn"
                                    aria-label={`Edit ${p.name}`}
                                    title="Edit property"
                                  >
                                    <FaEdit aria-hidden="true" />
                                  </button>
                                </ProtectedAction>
                                <ProtectedAction tooltip="View-only access">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(p._id, p.name)}
                                    className="re-icon-btn re-icon-btn-danger"
                                    aria-label={`Delete ${p.name}`}
                                    title="Delete property"
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

                {/* Mobile D19 Compact-Expand Cards (<= 768px) */}
                <div className="re-mobile-cards" data-testid="real-estate-mobile-cards">
                  {processedProperties.map((p) => {
                    const gain = p.currentValuation - p.purchasePrice;
                    const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;
                    const isExpanded = expandedIds.has(p._id);

                    return (
                      <article key={p._id} className="re-mobile-card">
                        <div className="re-mobile-card-summary">
                          <div className="re-mobile-card-main">
                            <span className="re-cell-name">{p.name}</span>
                            <div className="re-prop-badges">
                              <Badge tone="neutral">{p.type}</Badge>
                              <Badge tone="neutral">{p.status}</Badge>
                            </div>
                          </div>
                          <div className="re-mobile-card-val">
                            <div className="re-cell-name fs-num">{formatCurrency(p.currentValuation)}</div>
                            <div className="re-gain-sub fs-num">
                              {formatSignedCurrency(gain)} ({formatSignedPercent(gainPct, 1)})
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="re-mobile-expand-btn"
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${p.name}`}
                          onClick={() => toggleMobileExpand(p._id)}
                        >
                          <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>

                        {isExpanded && (
                          <div className="re-mobile-details">
                            <div className="re-mobile-detail-item">
                              <span className="re-mobile-detail-label">Purchase Price</span>
                              <span className="re-mobile-detail-value fs-num">
                                {formatCurrency(p.purchasePrice)}
                              </span>
                            </div>
                            <div className="re-mobile-detail-item">
                              <span className="re-mobile-detail-label">Area</span>
                              <span className="re-mobile-detail-value fs-num">
                                {p.area > 0 ? `${p.area} m²` : '—'}
                              </span>
                            </div>
                            <div className="re-mobile-detail-item">
                              <span className="re-mobile-detail-label">Location</span>
                              <span className="re-mobile-detail-value">
                                {p.location || 'No location specified'}
                              </span>
                            </div>
                            <div className="re-mobile-detail-item">
                              <span className="re-mobile-detail-label">Acquisition Date</span>
                              <span className="re-mobile-detail-value">{formatDate(p.purchaseDate)}</span>
                            </div>
                            <div className="re-card-actions">
                              <ProtectedAction tooltip="View-only access">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/real-estate/edit/${p._id}`)}
                                  className="re-icon-btn"
                                  aria-label={`Edit ${p.name}`}
                                  title="Edit property"
                                >
                                  <FaEdit aria-hidden="true" />
                                </button>
                              </ProtectedAction>
                              <ProtectedAction tooltip="View-only access">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p._id, p.name)}
                                  className="re-icon-btn re-icon-btn-danger"
                                  aria-label={`Delete ${p.name}`}
                                  title="Delete property"
                                >
                                  <FaTrash aria-hidden="true" />
                                </button>
                              </ProtectedAction>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </>
            )
          ) : (
            <div className="re-empty-card">
              <div className="re-state-icon">
                <FaBuilding aria-hidden="true" />
              </div>
              <h2>No Real Estate Properties Found</h2>
              <p>
                {hasActiveFilters
                  ? 'No property records match your current filters. Try resetting the filters or search term.'
                  : 'You have not recorded any real estate properties yet. Start tracking your properties, market valuations, and capital gains.'}
              </p>
              <ProtectedAction tooltip="View-only access">
                <Link to="/real-estate/new" className="fs-btn fs-btn-primary">
                  <FaPlus aria-hidden="true" /> Add Your First Property
                </Link>
              </ProtectedAction>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(propertyToDelete)}
        title="Delete Real Estate Property"
        message={`Are you sure you want to delete "${propertyToDelete?.name || ''}"?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPropertyToDelete(null)}
      />
    </div>
  );
};

export default RealEstateLogPage;
