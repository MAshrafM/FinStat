// frontend/src/pages/gold/GoldLogPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getGoldLogs, deleteGoldLog } from '../../services/goldService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import PaginationControls from '../../components/PaginationControls';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { Badge, Delta, Loading } from '../../components/ui';
import './GoldWallet.css';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'hold', label: 'Hold' },
  { value: 'sold', label: 'Sold' },
];

const ariaSortFor = (sortConfig, key) => {
  if (sortConfig.key !== key) return 'none';
  return sortConfig.direction === 'asc' ? 'ascending' : 'descending';
};

const GoldLogPage = () => {
    const { showToast, addToast } = useToast();
    const notify = showToast || addToast;
    const [logToDelete, setLogToDelete] = useState(null);
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [expandedLogId, setExpandedLogId] = useState(null);

    const fetchLogs = useCallback((page, status, sortKey, sortDir) => {
        setIsLoading(true);
        setLoadError('');
        return getGoldLogs(page, status, sortKey, sortDir)
            .then(data => {
                setLogs(data.data);
                setTotalPages(data.totalPages);
                setCurrentPage(data.currentPage);
            })
            .catch(err => {
                setLoadError(err?.message || 'Failed to load gold logs.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchLogs(currentPage, filterStatus, sortConfig.key, sortConfig.direction);
    }, [currentPage, filterStatus, sortConfig.key, sortConfig.direction, fetchLogs]);

    const handleDelete = (id) => {
        setLogToDelete(id);
    };

    const handleConfirmDelete = async () => {
        if (!logToDelete) return;
        try {
            await deleteGoldLog(logToDelete);
            if (notify) notify('Gold log deleted successfully', 'success');
            setLogToDelete(null);
            fetchLogs(currentPage, filterStatus, sortConfig.key, sortConfig.direction);
        } catch (err) {
            if (notify) notify('Failed to delete gold log', 'error');
        }
    };

    const handleFilterChange = (newStatus) => {
        setFilterStatus(newStatus);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig(prevSortConfig => {
            const newDirection = prevSortConfig.key === key && prevSortConfig.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction: newDirection };
        });
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <FaSort aria-hidden="true" />;
        }
        return sortConfig.direction === 'asc'
            ? <FaSortUp aria-hidden="true" />
            : <FaSortDown aria-hidden="true" />;
    };

    const renderStatus = (status) => (
        <Badge label={status === 'sold' ? 'Sold' : 'Hold'} />
    );

    const renderGain = (gain) => {
        if (gain === null) return '—';
        return (
            <Delta
                value={formatCurrency(Math.abs(gain))}
                tone={gain >= 0 ? 'positive' : 'negative'}
                sign={gain >= 0 ? 'positive' : 'negative'}
                label="Gain"
            />
        );
    };

    const renderActions = (log, mobile = false) => (
        <div className={mobile ? 'gold-card-actions' : 'gold-actions'}>
            <ProtectedAction tooltip="View-only access">
                <Link
                    className={mobile ? 'fs-btn fs-btn-secondary' : 'gold-icon-btn'}
                    to={`/gold-wallet/edit/${log._id}`}
                    aria-label={`Edit gold log for ${log.item}`}
                >
                    <FaEdit aria-hidden="true" />
                    {mobile ? 'Edit' : null}
                </Link>
            </ProtectedAction>
            <ProtectedAction tooltip="View-only access">
                <button
                    type="button"
                    className={mobile ? 'gold-icon-btn gold-icon-btn-danger' : 'gold-icon-btn gold-icon-btn-danger'}
                    onClick={() => handleDelete(log._id)}
                    aria-label={`Delete gold log for ${log.item}`}
                >
                    <FaTrash aria-hidden="true" />
                    {mobile ? 'Delete' : null}
                </button>
            </ProtectedAction>
        </div>
    );

    const renderSortableHeader = (key, label) => (
        <th className="gold-sort-th gold-th-num" aria-sort={ariaSortFor(sortConfig, key)}>
            <button type="button" className="gold-sort-btn" onClick={() => handleSort(key)}>
                {label} {getSortIcon(key)}
            </button>
        </th>
    );

    return (
        <div className="page-container gold-page-container gold-log-page">
            <header className="gold-header">
                <div className="gold-header-title-group">
                    <p className="gold-breadcrumb">Gold &gt; Transaction Log</p>
                    <h1>Gold Wallet Log</h1>
                </div>
                <div className="gold-header-actions">
                    <Link to="/analytics/purchasing-power" className="fs-btn fs-btn-secondary">
                        Purchasing Power Analytics
                    </Link>
                    <ProtectedAction tooltip="View-only access">
                        <Link to="/gold-wallet/new" className="fs-btn fs-btn-primary">
                            + Add Gold Entry
                        </Link>
                    </ProtectedAction>
                </div>
            </header>

            <section className="gold-filter-card">
                <span id="gold-filter-label" className="gold-filter-title">Status</span>
                <div className="gold-filter-buttons" role="group" aria-labelledby="gold-filter-label">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            type="button"
                            className={`gold-filter-btn ${filterStatus === filter.value ? 'is-active' : ''}`.trim()}
                            aria-pressed={filterStatus === filter.value}
                            onClick={() => handleFilterChange(filter.value)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                {filterStatus !== 'all' && (
                    <p className="gold-filter-active-note">Showing {filterStatus} gold entries only</p>
                )}
            </section>

            {isLoading ? (
                <Loading variant="table" text="Loading gold transactions..." rows={4} />
            ) : loadError ? (
                <div className="gold-error-card" role="alert">
                    <h2>Unable to load transactions</h2>
                    <p>{loadError}</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="gold-empty-card">
                    <h2>No gold transactions</h2>
                    <p>Record your first purchase to begin tracking weight, cost, and realised gain.</p>
                </div>
            ) : (
                <>
                    <div className="gold-table-wrap">
                        <table className="gold-table gold-desktop-table">
                            <thead>
                                <tr>
                                    {renderSortableHeader('date', 'Date')}
                                    <th>Item</th>
                                    {renderSortableHeader('karat', 'Karat')}
                                    {renderSortableHeader('weight', 'Weight (g)')}
                                    <th className="gold-th-num">Price/g</th>
                                    <th className="gold-th-num">Price</th>
                                    <th className="gold-th-num">Paid</th>
                                    <th className="gold-th-num">Taxes/Fees</th>
                                    <th className="gold-th-num">Cost/g</th>
                                    <th className="gold-th-num">Selling Price</th>
                                    <th className="gold-th-num">Gain</th>
                                    <th>Status</th>
                                    <th className="gold-th-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const totalPrice = log.weight * log.price;
                                    const taxes = log.paid - totalPrice;
                                    const feesPerGram = taxes / log.weight;
                                    const totalSellingPrice = log.status === 'sold' ? log.sellingPrice * log.weight : null;
                                    const gain = log.status === 'sold' ? (log.sellingPrice - log.price) * log.weight : null;
                                    return (
                                        <tr key={log._id}>
                                            <td data-label="Date">{formatDate(log.date)}</td>
                                            <td data-label="Item">
                                                <span className="gold-item-name">{log.item}</span>
                                                <p className="gold-broker">by {log.seller || 'N/A'}</p>
                                            </td>
                                            <td data-label="Karat" className="fs-num">{log.karat}K</td>
                                            <td data-label="Weight" className="fs-num">{log.weight.toFixed(4)}g</td>
                                            <td data-label="Price/g" className="fs-num">{formatCurrency(log.price)}</td>
                                            <td data-label="Price" className="fs-num">{formatCurrency(totalPrice)}</td>
                                            <td data-label="Paid" className="fs-num">{formatCurrency(log.paid)}</td>
                                            <td data-label="Taxes" className="fs-num">{formatCurrency(taxes)}</td>
                                            <td data-label="Cost/g" className="fs-num">{formatCurrency(feesPerGram)}</td>
                                            <td data-label="Selling Price" className="fs-num">
                                                {totalSellingPrice !== null ? formatCurrency(totalSellingPrice) : '—'}
                                            </td>
                                            <td data-label="Gain" className="fs-num">{renderGain(gain)}</td>
                                            <td data-label="Status">{renderStatus(log.status)}</td>
                                            <td data-label="Actions" className="gold-th-actions">{renderActions(log)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="gold-mobile-cards">
                        {logs.map((log) => {
                            const totalPrice = log.weight * log.price;
                            const taxes = log.paid - totalPrice;
                            const feesPerGram = taxes / log.weight;
                            const totalSellingPrice = log.status === 'sold' ? log.sellingPrice * log.weight : null;
                            const gain = log.status === 'sold' ? (log.sellingPrice - log.price) * log.weight : null;
                            const isExpanded = expandedLogId === log._id;
                            return (
                                <article className="gold-mobile-card" key={`mobile-${log._id}`}>
                                    <div className="gold-card-compact-row">
                                        <div className="gold-card-primary">
                                            <span className="gold-card-name">{log.item}</span>
                                            <span className="gold-card-value">{log.karat}K · {log.weight.toFixed(4)}g</span>
                                        </div>
                                        <div className="gold-card-metrics">
                                            {renderStatus(log.status)}
                                            <span className="gold-card-value">{gain === null ? '—' : formatCurrency(gain)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="gold-card-expander-btn"
                                            aria-label={isExpanded ? 'Collapse gold log details' : 'Expand gold log details'}
                                            aria-expanded={isExpanded}
                                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                                        >
                                            <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="gold-card-expanded">
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Date</span><span className="gold-card-detail-val fs-num">{formatDate(log.date)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Item</span><span className="gold-card-detail-val">{log.item}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Karat</span><span className="gold-card-detail-val fs-num">{log.karat}K</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Weight</span><span className="gold-card-detail-val fs-num">{log.weight.toFixed(4)}g</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Price/g</span><span className="gold-card-detail-val fs-num">{formatCurrency(log.price)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Price</span><span className="gold-card-detail-val fs-num">{formatCurrency(totalPrice)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Paid</span><span className="gold-card-detail-val fs-num">{formatCurrency(log.paid)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Taxes/Fees</span><span className="gold-card-detail-val fs-num">{formatCurrency(taxes)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Cost/g</span><span className="gold-card-detail-val fs-num">{formatCurrency(feesPerGram)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Selling Price</span><span className="gold-card-detail-val fs-num">{totalSellingPrice !== null ? formatCurrency(totalSellingPrice) : '—'}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Gain</span><span className="gold-card-detail-val fs-num">{renderGain(gain)}</span></div>
                                            <div className="gold-card-detail-item"><span className="gold-card-detail-label">Status</span><span className="gold-card-detail-val">{renderStatus(log.status)}</span></div>
                                            {renderActions(log, true)}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    <PaginationControls page={currentPage} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            )}

            <ConfirmModal
                isOpen={Boolean(logToDelete)}
                title="Delete Gold Log"
                message="Are you sure you want to delete this gold log?"
                confirmText="Delete"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setLogToDelete(null)}
            />
        </div>
    );
};
export default GoldLogPage;
