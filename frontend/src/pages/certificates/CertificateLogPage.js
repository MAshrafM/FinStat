// frontend/src/pages/certificates/CertificateLogPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteCertificate, withdrawCertificate } from '../../services/certificateService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCertData } from '../../context/CertContext';
import { useToast } from '../../context/ToastContext';
import { FaEdit, FaTrash, FaEye, FaHandHoldingUsd, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import '../trades/Trades.css';

const CertificateLogPage = () => {
    const { certificates = [], certificateSummary = {}, isLoading, refreshCertificates } = useCertData();
    const { showToast } = useToast();

    const [statusFilter, setStatusFilter] = useState('all');
    const [withdrawingCert, setWithdrawingCert] = useState(null);
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
    const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            try {
                await deleteCertificate(id);
                showToast('Certificate deleted successfully', 'success');
                if (typeof refreshCertificates === 'function') {
                    refreshCertificates();
                }
            } catch (err) {
                console.error("Failed to delete certificate:", err);
                showToast(err.response?.data?.message || 'Failed to delete certificate', 'error');
            }
        }
    };

    const handleOpenWithdrawModal = (cert) => {
        setWithdrawingCert(cert);
        setWithdrawalReason('');
        setConfirmedCheckbox(false);
    };

    const handleCloseWithdrawModal = () => {
        setWithdrawingCert(null);
        setWithdrawalReason('');
        setConfirmedCheckbox(false);
    };

    const handleConfirmWithdraw = async () => {
        if (!withdrawingCert || !confirmedCheckbox) return;

        try {
            setIsSubmittingWithdraw(true);
            await withdrawCertificate(withdrawingCert._id, {
                withdrawalDate: new Date().toISOString(),
                withdrawalReason: withdrawalReason.trim() || undefined,
                confirmWithdrawal: true,
            });
            showToast('Certificate marked as withdrawn', 'success');
            handleCloseWithdrawModal();
            if (typeof refreshCertificates === 'function') {
                refreshCertificates();
            }
        } catch (err) {
            console.error('Failed to withdraw certificate:', err);
            showToast(err.response?.data?.message || 'Failed to withdraw certificate', 'error');
        } finally {
            setIsSubmittingWithdraw(false);
        }
    };

    const renderStatusBadge = (cert) => {
        const status = cert.displayStatus || cert.status || 'active';
        switch (status) {
            case 'withdrawn':
                return <span style={{ backgroundColor: '#64748b', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>⚪ Withdrawn</span>;
            case 'matured':
                return <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🔴 Matured</span>;
            case 'maturing_soon':
                return <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🟡 Maturing Soon</span>;
            case 'future':
                return <span style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Future</span>;
            case 'active':
            default:
                return <span style={{ backgroundColor: '#10b981', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🟢 Active</span>;
        }
    };

    if (isLoading) {
        return <p className="page-container">Loading Certificates...</p>;
    }

    const safeCertList = Array.isArray(certificates) ? certificates : [];

    const filteredCertificates = safeCertList.filter(cert => {
        if (statusFilter === 'all') return true;
        const currentStatus = cert.displayStatus || cert.status || 'active';
        return currentStatus === statusFilter;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0 }}>Bank Certificates</h1>
                <Link
                    to="/certificates/new"
                    className="action-button"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#4f46e5',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    <FaPlus size={12} /> Add Certificate
                </Link>
            </div>

            {/* Portfolio Summary Card */}
            <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Certificate Portfolio Overview</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Active Certificates</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {certificateSummary.activeCertificates ?? safeCertList.filter(c => c.displayStatus === 'active' || c.displayStatus === 'maturing_soon').length}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            out of {safeCertList.length} total
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Active Principal Invested</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(certificateSummary.totalActiveAmount || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            guaranteed fixed-income
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Total Expected Yield</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                            {formatCurrency(certificateSummary.totalExpectedReturns || 0)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.8' }}>
                            at maturity date
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', opacity: '0.9' }}>Status Breakdown</div>
                        <div style={{ fontSize: '13px', margin: '5px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span>🟢 Active: {safeCertList.filter(c => c.displayStatus === 'active').length}</span>
                            <span>🟡 Maturing Soon: {safeCertList.filter(c => c.displayStatus === 'maturing_soon').length}</span>
                            <span>⏳ Future: {safeCertList.filter(c => c.displayStatus === 'future').length}</span>
                            <span>🔴 Matured: {safeCertList.filter(c => c.displayStatus === 'matured' || c.status === 'matured').length}</span>
                            <span>⚪ Withdrawn: {safeCertList.filter(c => c.status === 'withdrawn').length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginRight: '6px' }}>Filter by Status:</span>
                {[
                    { id: 'all', label: 'All' },
                    { id: 'active', label: '🟢 Active' },
                    { id: 'maturing_soon', label: '🟡 Maturing Soon' },
                    { id: 'future', label: '⏳ Future' },
                    { id: 'matured', label: '🔴 Matured' },
                    { id: 'withdrawn', label: '⚪ Withdrawn' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: statusFilter === tab.id ? '2px solid #4f46e5' : '1px solid #d1d5db',
                            background: statusFilter === tab.id ? '#eef2ff' : '#ffffff',
                            color: statusFilter === tab.id ? '#4338ca' : '#4b5563',
                            fontWeight: statusFilter === tab.id ? '700' : '500',
                            cursor: 'pointer',
                            fontSize: '13px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Certificates Table */}
            <div className="table-container">
                <table className="styled-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Principal Amount</th>
                            <th>Interest Rate</th>
                            <th>Period</th>
                            <th>Status</th>
                            <th>Days Left</th>
                            <th>Maturity Date</th>
                            <th>Accrued Interest</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCertificates.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                                    No bank certificates match the selected filter.
                                </td>
                            </tr>
                        ) : (
                            filteredCertificates.map(cert => {
                                const amount = Number(cert.amount) || 0;
                                const interestRate = Number(cert.interest) || 0;
                                const period = Number(cert.period) || 0;
                                const maturityDate = cert.maturityDate ? new Date(cert.maturityDate) : null;
                                const daysRemaining = cert.daysRemaining !== undefined ? cert.daysRemaining : (maturityDate ? Math.ceil((maturityDate - new Date()) / (1000 * 60 * 60 * 24)) : 0);
                                const isWithdrawn = cert.status === 'withdrawn';

                                return (
                                    <tr key={cert._id} style={{ opacity: isWithdrawn ? 0.75 : 1 }}>
                                        <td style={{ fontWeight: 'bold' }} data-label="Name">
                                            <Link to={`/certificates/${cert._id}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
                                                {cert.name || 'Unnamed'}
                                            </Link>
                                        </td>
                                        <td className="total-value" data-label="Amount">{formatCurrency(amount)}</td>
                                        <td data-label="Interest">{interestRate.toFixed(2)}%</td>
                                        <td data-label="Period">{period}m ({cert.payoutInterval || 'monthly'})</td>
                                        <td data-label="Status">{renderStatusBadge(cert)}</td>
                                        <td data-label="Days Left">
                                            {isWithdrawn ? (
                                                <span style={{ color: '#6b7280' }}>Liquidated</span>
                                            ) : cert.displayStatus === 'future' ? (
                                                <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                                                    Starts in {Math.max(1, Math.ceil((new Date(cert.startDate) - new Date()) / (1000 * 60 * 60 * 24)))}d
                                                </span>
                                            ) : daysRemaining <= 0 ? (
                                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Completed</span>
                                            ) : (
                                                <span>{daysRemaining} day(s)</span>
                                            )}
                                        </td>
                                        <td data-label="Maturity Date">
                                            {maturityDate ? formatDate(maturityDate) : '-'}
                                        </td>
                                        <td data-label="Accrued Interest" style={{ color: '#10b981', fontWeight: '600' }}>
                                            {cert.displayStatus === 'future' ? (
                                                <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not started yet</span>
                                            ) : cert.accruedInterest !== undefined ? (
                                                formatCurrency(cert.accruedInterest)
                                            ) : (
                                                'Calculating...'
                                            )}
                                        </td>
                                        <td className="action-icons" data-label="Actions">
                                            <Link className="action-icon view-icon" to={`/certificates/${cert._id}`} title="View Details" style={{ color: '#3b82f6', marginRight: '8px' }}>
                                                <FaEye />
                                            </Link>
                                            <Link className="action-icon edit-icon" to={`/certificates/edit/${cert._id}`} title="Edit Certificate" style={{ marginRight: '8px' }}>
                                                <FaEdit />
                                            </Link>
                                            {!isWithdrawn && (
                                                <button
                                                    onClick={() => handleOpenWithdrawModal(cert)}
                                                    title="Withdraw Certificate"
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#f59e0b',
                                                        padding: 0,
                                                        marginRight: '8px',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    <FaHandHoldingUsd />
                                                </button>
                                            )}
                                            <FaTrash
                                                className="action-icon delete-icon"
                                                onClick={() => handleDelete(cert._id)}
                                                title="Delete"
                                                style={{ cursor: 'pointer', color: '#ef4444' }}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Withdrawal Confirmation Modal with Live Impact Preview */}
            {withdrawingCert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '100%',
                        padding: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={handleCloseWithdrawModal}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '18px',
                                color: '#6b7280'
                            }}
                        >
                            <FaTimes />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#b45309' }}>
                            <FaExclamationTriangle size={24} />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Withdraw Certificate Early</h2>
                        </div>

                        <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '16px' }}>
                            You are requesting to withdraw <strong>{withdrawingCert.name}</strong>. Review the financial payout calculation below:
                        </p>

                        <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#64748b' }}>Principal Returned:</span>
                                <strong>{formatCurrency(withdrawingCert.amount)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#64748b' }}>Live Accrued Interest (as of today):</span>
                                <strong style={{ color: '#10b981' }}>{formatCurrency(withdrawingCert.accruedInterest || 0)}</strong>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                paddingTop: '8px',
                                borderTop: '1px solid #cbd5e1',
                                fontSize: '16px'
                            }}>
                                <span style={{ fontWeight: '600' }}>Estimated Total Payout:</span>
                                <strong style={{ color: '#4f46e5' }}>
                                    {formatCurrency((withdrawingCert.amount || 0) + (withdrawingCert.accruedInterest || 0))}
                                </strong>
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                Withdrawal Reason (Optional):
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Early liquidity, rate switch"
                                value={withdrawalReason}
                                onChange={(e) => setWithdrawalReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#1f2937', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={confirmedCheckbox}
                                    onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                                    style={{ marginTop: '3px' }}
                                />
                                <span>I understand this certificate will be marked as withdrawn and no further interest will accrue.</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={handleCloseWithdrawModal}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmWithdraw}
                                disabled={!confirmedCheckbox || isSubmittingWithdraw}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: confirmedCheckbox ? '#ef4444' : '#9ca3af',
                                    color: 'white',
                                    cursor: confirmedCheckbox ? 'pointer' : 'not-allowed',
                                    fontWeight: '600'
                                }}
                            >
                                {isSubmittingWithdraw ? 'Processing...' : 'Confirm Withdrawal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateLogPage;
