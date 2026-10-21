import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCurrency, deleteCurrency, revalueCurrency } from '../../services/currencyService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { FaEdit, FaTrash, FaEye, FaSync, FaPlus, FaCheckCircle, FaExclamationCircle, FaUserEdit } from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import { useCanModify } from '../../context/AuthContext';
import '../trades/Trades.css';

const CurrencyLogPage = () => {
    const canModify = useCanModify();
    const { showToast } = useToast();
    const [currencyList, setCurrencyList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRevaluing, setIsRevaluing] = useState(false);

    const fetchCurrencyData = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getCurrency();
            setCurrencyList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load currency holdings:', err);
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

    const handleDelete = async (id) => {
        if (!canModify) return;
        if (window.confirm('Are you sure you want to delete this currency holding?')) {
            try {
                await deleteCurrency(id);
                showToast('Currency entry deleted successfully', 'success');
                setCurrencyList(prev => prev.filter(c => c._id !== id));
            } catch (err) {
                console.error('Failed to delete currency:', err);
                showToast(err.response?.data?.message || 'Failed to delete currency', 'error');
            }
        }
    };

    const renderHealthBadge = (holding) => {
        if (holding.rateSource === 'manual') {
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    <FaUserEdit size={10} /> Manual
                </span>
            );
        }
        if (holding.isStale || holding.rateSource === 'fallback') {
            return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                    <FaExclamationCircle size={10} /> Stale
                </span>
            );
        }
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                <FaCheckCircle size={10} /> Live
            </span>
        );
    };

    // Calculate aggregated metrics
    const totalCostBasis = currencyList.reduce((acc, c) => acc + Number(c.costBasis || c.price || 0), 0);
    const totalCurrentVal = currencyList.reduce((acc, c) => acc + Number(c.currentValue || (c.amount * (c.currentRate || c.purchaseRate || 0)) || 0), 0);
    const totalPnL = totalCurrentVal - totalCostBasis;
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    if (isLoading) {
        return <p className="page-container">Loading Foreign Currency...</p>;
    }

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ margin: 0 }}>Foreign Currency Wallet</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <ProtectedAction tooltip="View-only access">
                        <button
                            onClick={handleRevalueNow}
                            disabled={isRevaluing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#059669',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                cursor: isRevaluing ? 'not-allowed' : 'pointer',
                                opacity: isRevaluing ? 0.75 : 1,
                            }}
                        >
                            <FaSync className={isRevaluing ? 'spin' : ''} size={12} />
                            {isRevaluing ? 'Revaluing...' : 'Revalue Now'}
                        </button>
                    </ProtectedAction>
                    <ProtectedAction tooltip="View-only access">
                        <Link
                            to="/currency/new"
                            className="action-button"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#2563eb',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600'
                            }}
                        >
                            <FaPlus size={12} /> Add Currency
                        </Link>
                    </ProtectedAction>
                </div>
            </div>

            {/* Portfolio Summary Card */}
            <div style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Forex Portfolio Overview</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Total Cost Basis</div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(totalCostBasis)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>Paid acquisition cost</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Current Valuation (EGP)</div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(totalCurrentVal)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>Latest CIB market value</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Unrealized Gain / Loss</div>
                        <div style={{
                            fontSize: '22px',
                            fontWeight: 'bold',
                            margin: '5px 0',
                            color: totalPnL >= 0 ? '#4ade80' : '#f87171'
                        }}>
                            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% net change
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Holdings Count</div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '5px 0' }}>
                            {currencyList.length}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>active currency positions</div>
                    </div>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Currency</th>
                            <th>Amount</th>
                            <th>Purchase Rate</th>
                            <th>Current Rate</th>
                            <th>Rate Status</th>
                            <th>Current Value (EGP)</th>
                            <th>Unrealized Gain / Loss</th>
                            <th>Date / Revalued</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencyList.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                                    No foreign currency holdings found. Click <strong>Add Currency</strong> above to record your first holding.
                                </td>
                            </tr>
                        ) : (
                            currencyList.map(curr => {
                                const code = curr.currencyCode || curr.name;
                                const amount = Number(curr.amount) || 0;
                                const purchaseRate = Number(curr.purchaseRate || (amount > 0 ? curr.price / amount : 0));
                                const currentRate = Number(curr.currentRate || purchaseRate);
                                const currentVal = Number(curr.currentValue || (amount * currentRate));
                                const gainLoss = Number(curr.unrealizedGainLoss ?? (currentVal - (curr.costBasis || curr.price || 0)));
                                const gainLossPct = Number(curr.gainLossPercentage ?? ((purchaseRate > 0 ? ((currentRate - purchaseRate) / purchaseRate) * 100 : 0)));

                                return (
                                    <tr key={curr._id}>
                                        <td style={{ fontWeight: 'bold' }} data-label="Currency">
                                            <Link to={`/currency/${curr._id}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                                                {curr.name} {code && code !== curr.name ? `(${code})` : ''}
                                            </Link>
                                        </td>
                                        <td className="total-value" data-label="Amount">
                                            {amount.toLocaleString()} {code}
                                        </td>
                                        <td data-label="Purchase Rate">
                                            {purchaseRate.toFixed(2)} EGP
                                        </td>
                                        <td data-label="Current Rate" style={{ fontWeight: '600' }}>
                                            {currentRate.toFixed(2)} EGP
                                        </td>
                                        <td data-label="Rate Status">
                                            {renderHealthBadge(curr)}
                                        </td>
                                        <td data-label="Current Value" style={{ fontWeight: 'bold', color: '#111827' }}>
                                            {formatCurrency(currentVal)}
                                        </td>
                                        <td data-label="Gain / Loss">
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: gainLoss >= 0 ? '#10b981' : '#ef4444'
                                            }}>
                                                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainLossPct >= 0 ? '+' : ''}{gainLossPct.toFixed(2)}%)
                                            </span>
                                        </td>
                                        <td data-label="Date">
                                            {curr.lastRevaluationDate ? formatDate(curr.lastRevaluationDate) : formatDate(curr.date)}
                                        </td>
                                        <td className="action-icons" data-label="Actions">
                                            <Link className="action-icon view-icon" to={`/currency/${curr._id}`} title="View Details" style={{ color: '#0284c7', marginRight: '8px' }}>
                                                <FaEye />
                                            </Link>
                                            <ProtectedAction tooltip="View-only access">
                                                <Link className="action-icon edit-icon" to={`/currency/edit/${curr._id}`} title="Edit" style={{ marginRight: '8px' }}>
                                                    <FaEdit />
                                                </Link>
                                            </ProtectedAction>
                                            <ProtectedAction tooltip="View-only access">
                                                <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(curr._id)} title="Delete" style={{ cursor: 'pointer', color: '#ef4444' }} />
                                            </ProtectedAction>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CurrencyLogPage;
