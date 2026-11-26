// frontend/src/pages/certificates/CertificateLogPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    deleteCertificate,
    withdrawCertificate,
    processCertificatePayout,
    processDuePayouts,
} from '../../services/certificateService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCertData } from '../../context/CertContext';
import { useToast } from '../../context/ToastContext';
import {
    FaEdit,
    FaTrash,
    FaEye,
    FaHandHoldingUsd,
    FaPlus,
    FaTimes,
    FaExclamationTriangle,
    FaCoins,
    FaChevronDown,
    FaChevronUp,
    FaCheckCircle,
    FaClock,
    FaHourglassHalf,
    FaFlagCheckered,
    FaUndoAlt,
} from 'react-icons/fa';
import ProtectedAction from '../../components/common/ProtectedAction';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useCanModify } from '../../context/AuthContext';
import { Loading, Badge } from '../../components/ui';
import './Certificates.css';

const STATUS_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'maturing_soon', label: 'Maturing Soon' },
    { id: 'future', label: 'Future' },
    { id: 'matured', label: 'Matured' },
    { id: 'withdrawn', label: 'Withdrawn' },
];

const STATUS_META = {
    active: { label: 'Active', Icon: FaCheckCircle },
    maturing_soon: { label: 'Maturing Soon', Icon: FaClock },
    future: { label: 'Future', Icon: FaHourglassHalf },
    matured: { label: 'Matured', Icon: FaFlagCheckered },
    withdrawn: { label: 'Withdrawn', Icon: FaUndoAlt },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.active;

const getCertificateDisplayMetrics = (cert) => {
    const amount = Number(cert.amount) || 0;
    const interestRate = Number(cert.interest) || 0;
    const period = Number(cert.period) || 0;
    const maturityDate = cert.maturityDate ? new Date(cert.maturityDate) : null;
    const daysRemaining = cert.daysRemaining !== undefined
        ? cert.daysRemaining
        : (maturityDate ? Math.ceil((maturityDate - new Date()) / (1000 * 60 * 60 * 24)) : 0);
    const status = cert.displayStatus || cert.status || 'active';
    const isWithdrawn = cert.status === 'withdrawn' || status === 'withdrawn';

    let daysLeftLabel = `${daysRemaining} day(s)`;
    if (isWithdrawn) {
        daysLeftLabel = 'Liquidated';
    } else if (status === 'future') {
        const startDays = Math.max(1, Math.ceil((new Date(cert.startDate) - new Date()) / (1000 * 60 * 60 * 24)));
        daysLeftLabel = `Starts in ${startDays}d`;
    } else if (daysRemaining <= 0) {
        daysLeftLabel = 'Completed';
    }

    let accruedText = 'Calculating...';
    let isAccruedMuted = false;
    if (status === 'future') {
        accruedText = 'Not started yet';
        isAccruedMuted = true;
    } else if (cert.accruedInterest !== undefined) {
        accruedText = formatCurrency(cert.accruedInterest);
    }

    return {
        amount,
        interestRate,
        period,
        maturityDate,
        status,
        isWithdrawn,
        daysLeftLabel,
        accruedText,
        isAccruedMuted,
    };
};

const useDialogAccessibility = (isOpen, isBusy, onClose, dialogRef, closeBtnRef, triggerRef) => {
    useEffect(() => {
        if (!isOpen) return undefined;

        const fallbackPrevious = document.activeElement;
        const focusTimer = setTimeout(() => {
            if (closeBtnRef.current) {
                closeBtnRef.current.focus();
            } else if (dialogRef.current) {
                dialogRef.current.focus();
            }
        }, 0);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (!isBusy && onClose) {
                    e.preventDefault();
                    onClose();
                }
                return;
            }

            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);
            const restoreTarget = triggerRef.current || fallbackPrevious;
            triggerRef.current = null;
            if (restoreTarget && typeof restoreTarget.focus === 'function') {
                restoreTarget.focus();
            }
        };
    }, [isOpen, isBusy, onClose, dialogRef, closeBtnRef, triggerRef]);
};

const CertificateLogPage = () => {
    const canModify = useCanModify();
    const {
        certificates = [],
        certificateSummary = {},
        isLoading,
        error,
        refreshCertificates,
    } = useCertData();
    const { showToast } = useToast();

    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState({});
    const [withdrawingCert, setWithdrawingCert] = useState(null);
    const [withdrawalReason, setWithdrawalReason] = useState('');
    const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
    const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
    const [deletingCertId, setDeletingCertId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [payoutCert, setPayoutCert] = useState(null);
    const [payoutDate, setPayoutDate] = useState('');
    const [payoutAccount, setPayoutAccount] = useState('Bank');
    const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
    const [isProcessingDue, setIsProcessingDue] = useState(false);

    const withdrawDialogRef = useRef(null);
    const withdrawCloseRef = useRef(null);
    const withdrawTriggerRef = useRef(null);
    const payoutDialogRef = useRef(null);
    const payoutCloseRef = useRef(null);
    const payoutTriggerRef = useRef(null);

    const handleCloseWithdrawModal = () => {
        setWithdrawingCert(null);
        setWithdrawalReason('');
        setConfirmedCheckbox(false);
    };

    const handleClosePayoutModal = () => {
        setPayoutCert(null);
    };

    useDialogAccessibility(
        Boolean(withdrawingCert),
        isSubmittingWithdraw,
        handleCloseWithdrawModal,
        withdrawDialogRef,
        withdrawCloseRef,
        withdrawTriggerRef
    );

    useDialogAccessibility(
        Boolean(payoutCert),
        isSubmittingPayout,
        handleClosePayoutModal,
        payoutDialogRef,
        payoutCloseRef,
        payoutTriggerRef
    );

    const handleOpenPayoutModal = (cert, event) => {
        if (event && event.currentTarget) {
            payoutTriggerRef.current = event.currentTarget;
        }
        setPayoutCert(cert);
        const defaultDate = cert.nextDuePayoutDate
            ? new Date(cert.nextDuePayoutDate).toISOString().split('T')[0]
            : (cert.nextPayoutDate ? new Date(cert.nextPayoutDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setPayoutDate(defaultDate);
        setPayoutAccount('Bank');
    };

    const handleConfirmPayout = async () => {
        if (!canModify || !payoutCert) return;
        try {
            setIsSubmittingPayout(true);
            const res = await processCertificatePayout(payoutCert._id, {
                payoutDate: payoutDate || undefined,
                destinationAccount: payoutAccount,
            });
            showToast(res.message || 'Interest payout processed successfully!', 'success');
            setPayoutCert(null);
            if (typeof refreshCertificates === 'function') {
                refreshCertificates();
            }
        } catch (err) {
            console.error('Failed to process payout:', err);
            showToast(err.response?.data?.message || err.message || 'Failed to process interest payout', 'error');
        } finally {
            setIsSubmittingPayout(false);
        }
    };

    const handleProcessDuePayouts = async () => {
        if (!canModify) return;
        try {
            setIsProcessingDue(true);
            const res = await processDuePayouts();
            showToast(
                res.message || `Processed ${res.processedCount} due payout(s) totaling ${res.totalDisbursedEgp} EGP`,
                res.processedCount > 0 ? 'success' : 'info'
            );
            if (typeof refreshCertificates === 'function') {
                refreshCertificates();
            }
        } catch (err) {
            console.error('Failed to process due payouts:', err);
            showToast(err.response?.data?.message || err.message || 'Failed to process due payouts', 'error');
        } finally {
            setIsProcessingDue(false);
        }
    };

    const handleDeleteClick = (id) => {
        if (!canModify) return;
        setDeletingCertId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCertId || !canModify) return;
        setIsDeleting(true);
        try {
            await deleteCertificate(deletingCertId);
            showToast('Certificate deleted successfully', 'success');
            setDeletingCertId(null);
            if (typeof refreshCertificates === 'function') {
                refreshCertificates();
            }
        } catch (err) {
            console.error('Failed to delete certificate:', err);
            showToast(err.response?.data?.message || 'Failed to delete certificate', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenWithdrawModal = (cert, event) => {
        if (event && event.currentTarget) {
            withdrawTriggerRef.current = event.currentTarget;
        }
        setWithdrawingCert(cert);
        setWithdrawalReason('');
        setConfirmedCheckbox(false);
    };

    const handleConfirmWithdraw = async () => {
        if (!canModify) return;
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

    const toggleMobileCard = (id) => {
        setExpandedCards((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const renderStatusBadge = (cert) => {
        const status = cert.displayStatus || cert.status || 'active';
        const { label, Icon } = getStatusMeta(status);
        return (
            <Badge tone="neutral" className="cert-status-badge">
                <Icon aria-hidden="true" size={11} />
                <span>{label}</span>
            </Badge>
        );
    };

    const renderRowActions = (cert, isWithdrawn, showTextLabels = false) => {
        const certLabel = cert.name || 'certificate';
        const payoutActionLabel = cert.isPayoutDue
            ? `Interest payout due — process payout for ${certLabel}`
            : `Add interest payout for ${certLabel}`;
        const payoutTitle = cert.isPayoutDue
            ? 'Interest Payout Due! Click to process'
            : 'Add Interest Payout';

        return (
            <>
                <Link
                    className="cert-icon-btn"
                    to={`/certificates/${cert._id}`}
                    title="View Details"
                    aria-label={`View details for ${certLabel}`}
                >
                    <FaEye aria-hidden="true" />
                    {showTextLabels && <span>View</span>}
                </Link>
                <ProtectedAction tooltip="View-only access">
                    <Link
                        className="cert-icon-btn"
                        to={`/certificates/edit/${cert._id}`}
                        title="Edit Certificate"
                        aria-label={`Edit ${certLabel}`}
                    >
                        <FaEdit aria-hidden="true" />
                        {showTextLabels && <span>Edit</span>}
                    </Link>
                </ProtectedAction>
                {!isWithdrawn && !cert.autoReinvest && (
                    <ProtectedAction tooltip="View-only access">
                        <button
                            type="button"
                            onClick={(e) => handleOpenPayoutModal(cert, e)}
                            title={payoutTitle}
                            aria-label={payoutActionLabel}
                            className={`cert-icon-btn${cert.isPayoutDue ? ' cert-icon-btn--due' : ''}`}
                            data-payout-due={cert.isPayoutDue ? 'true' : 'false'}
                        >
                            <FaCoins aria-hidden="true" />
                            {showTextLabels && <span>{cert.isPayoutDue ? 'Payout Due' : 'Payout'}</span>}
                        </button>
                    </ProtectedAction>
                )}
                {!isWithdrawn && (
                    <ProtectedAction tooltip="View-only access">
                        <button
                            type="button"
                            onClick={(e) => handleOpenWithdrawModal(cert, e)}
                            title="Withdraw Certificate"
                            aria-label={`Withdraw ${certLabel}`}
                            className="cert-icon-btn"
                        >
                            <FaHandHoldingUsd aria-hidden="true" />
                            {showTextLabels && <span>Withdraw</span>}
                        </button>
                    </ProtectedAction>
                )}
                <ProtectedAction tooltip="View-only access">
                    <button
                        type="button"
                        onClick={() => handleDeleteClick(cert._id)}
                        title="Delete"
                        aria-label={`Delete ${certLabel}`}
                        className="cert-icon-btn cert-icon-btn-danger"
                    >
                        <FaTrash aria-hidden="true" />
                        {showTextLabels && <span>Delete</span>}
                    </button>
                </ProtectedAction>
            </>
        );
    };

    if (isLoading) {
        return (
            <div className="page-container cert-page-container cert-log-page">
                <Loading variant="table" text="Loading Certificates..." rows={4} />
            </div>
        );
    }

    const safeCertList = Array.isArray(certificates) ? certificates : [];

    const statusCounts = {
        active: safeCertList.filter((c) => c.displayStatus === 'active').length,
        maturing_soon: safeCertList.filter((c) => c.displayStatus === 'maturing_soon').length,
        future: safeCertList.filter((c) => c.displayStatus === 'future').length,
        matured: safeCertList.filter((c) => c.displayStatus === 'matured' || c.status === 'matured').length,
        withdrawn: safeCertList.filter((c) => c.status === 'withdrawn' || c.displayStatus === 'withdrawn').length,
    };

    const filteredCertificates = safeCertList.filter((cert) => {
        if (statusFilter === 'all') return true;
        const currentStatus = cert.displayStatus || cert.status || 'active';
        return currentStatus === statusFilter;
    });

    const activeCertificatesCount =
        certificateSummary.activeCertificates ??
        safeCertList.filter((c) => c.displayStatus === 'active' || c.displayStatus === 'maturing_soon').length;

    return (
        <div className="page-container cert-page-container cert-log-page">
            <header className="cert-header">
                <div className="cert-header-title-group">
                    <p className="cert-breadcrumb">Assets &gt; Bank Certificates</p>
                    <h1>Bank Certificates</h1>
                </div>
                <div className="cert-header-actions">
                    <ProtectedAction tooltip="View-only access">
                        <button
                            type="button"
                            onClick={handleProcessDuePayouts}
                            disabled={isProcessingDue}
                            className="fs-btn fs-btn-secondary"
                            title="Scan and disburse all due interest payouts across certificates"
                        >
                            <FaCoins aria-hidden="true" size={12} />{' '}
                            {isProcessingDue ? 'Processing...' : 'Process Due Payouts'}
                        </button>
                    </ProtectedAction>
                    <ProtectedAction tooltip="View-only access">
                        <Link to="/certificates/new" className="fs-btn fs-btn-primary">
                            <FaPlus aria-hidden="true" size={12} /> Add Certificate
                        </Link>
                    </ProtectedAction>
                </div>
            </header>

            {error ? (
                <div className="cert-error-card" role="alert">
                    <h2>Could not load bank certificates</h2>
                    <p>Could not load bank certificates. Please try again.</p>
                    {typeof refreshCertificates === 'function' && (
                        <div className="cert-error-actions">
                            <button
                                type="button"
                                className="fs-btn fs-btn-secondary"
                                onClick={refreshCertificates}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Portfolio Overview KPI Grid (Reference Frame 03 Variant B) */}
                    <section className="cert-overview-section" aria-label="Certificate Portfolio Overview">
                        <h2 className="cert-section-heading">Certificate Portfolio Overview</h2>
                        <div className="cert-kpi-grid">
                            <div className="cert-kpi-tile">
                                <span className="cert-kpi-label">Active Certificates</span>
                                <span className="cert-kpi-value fs-num">{activeCertificatesCount}</span>
                                <span className="cert-kpi-sub">out of {safeCertList.length} total</span>
                            </div>

                            <div className="cert-kpi-tile">
                                <span className="cert-kpi-label">Active Principal Invested</span>
                                <span className="cert-kpi-value fs-num">
                                    {formatCurrency(certificateSummary.totalActiveAmount || 0)}
                                </span>
                                <span className="cert-kpi-sub">guaranteed fixed-income</span>
                            </div>

                            <div className="cert-kpi-tile">
                                <span className="cert-kpi-label">Total Expected Yield</span>
                                <span className="cert-kpi-value fs-num">
                                    {formatCurrency(certificateSummary.totalExpectedReturns || 0)}
                                </span>
                                <span className="cert-kpi-sub">at maturity date</span>
                            </div>

                            <div className="cert-kpi-tile">
                                <span className="cert-kpi-label">Status Breakdown</span>
                                <ul className="cert-breakdown-list">
                                    <li className="cert-breakdown-row">
                                        <span>Active</span>
                                        <span className="fs-num">{statusCounts.active}</span>
                                    </li>
                                    <li className="cert-breakdown-row">
                                        <span>Maturing Soon</span>
                                        <span className="fs-num">{statusCounts.maturing_soon}</span>
                                    </li>
                                    <li className="cert-breakdown-row">
                                        <span>Future</span>
                                        <span className="fs-num">{statusCounts.future}</span>
                                    </li>
                                    <li className="cert-breakdown-row">
                                        <span>Matured</span>
                                        <span className="fs-num">{statusCounts.matured}</span>
                                    </li>
                                    <li className="cert-breakdown-row">
                                        <span>Withdrawn</span>
                                        <span className="fs-num">{statusCounts.withdrawn}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Filter Toolbar */}
                    <div className="cert-filter-card">
                        <span className="cert-filter-title">Filter by Status</span>
                        <div className="cert-filter-buttons" role="group" aria-label="Filter by Status">
                            {STATUS_FILTERS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    aria-pressed={statusFilter === tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`cert-filter-btn${statusFilter === tab.id ? ' is-active' : ''}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredCertificates.length === 0 ? (
                        <div className="cert-empty-card">
                            <h2>No bank certificates found</h2>
                            <p>No bank certificates match the selected filter.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop & Tablet 9-column Table (Waiver W-8B-1) */}
                            <div className="cert-table-wrap cert-desktop-table">
                                <table className="cert-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th className="cert-th-num">Principal Amount</th>
                                            <th className="cert-th-num">Interest Rate</th>
                                            <th>Period</th>
                                            <th>Status</th>
                                            <th>Days Left</th>
                                            <th>Maturity Date</th>
                                            <th className="cert-th-num">Accrued Interest</th>
                                            <th className="cert-th-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCertificates.map((cert) => {
                                            const {
                                                amount,
                                                interestRate,
                                                period,
                                                maturityDate,
                                                isWithdrawn,
                                                daysLeftLabel,
                                                accruedText,
                                                isAccruedMuted,
                                            } = getCertificateDisplayMetrics(cert);

                                            return (
                                                <tr
                                                    key={cert._id}
                                                    className={isWithdrawn ? 'cert-row--withdrawn' : undefined}
                                                >
                                                    <td data-label="Name">
                                                        <Link
                                                            to={`/certificates/${cert._id}`}
                                                            className="cert-name-link"
                                                        >
                                                            {cert.name || 'Unnamed'}
                                                        </Link>
                                                    </td>
                                                    <td className="fs-num" data-label="Amount">
                                                        {formatCurrency(amount)}
                                                    </td>
                                                    <td className="fs-num" data-label="Interest">
                                                        {interestRate.toFixed(2)}%
                                                    </td>
                                                    <td data-label="Period">
                                                        {period}m ({cert.payoutInterval || 'monthly'})
                                                    </td>
                                                    <td data-label="Status">{renderStatusBadge(cert)}</td>
                                                    <td data-label="Days Left">{daysLeftLabel}</td>
                                                    <td data-label="Maturity Date">
                                                        {maturityDate ? formatDate(maturityDate) : '-'}
                                                    </td>
                                                    <td
                                                        className={isAccruedMuted ? 'cert-muted-note' : 'fs-num'}
                                                        data-label="Accrued Interest"
                                                    >
                                                        {accruedText}
                                                    </td>
                                                    <td className="cert-th-actions" data-label="Actions">
                                                        <div className="cert-actions">
                                                            {renderRowActions(cert, isWithdrawn, false)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* D19 Mobile Compact-Expand Cards (<= 768px) */}
                            <div className="cert-mobile-cards" data-testid="certificates-mobile-cards">
                                {filteredCertificates.map((cert) => {
                                    const {
                                        amount,
                                        interestRate,
                                        period,
                                        maturityDate,
                                        isWithdrawn,
                                        daysLeftLabel,
                                        accruedText,
                                    } = getCertificateDisplayMetrics(cert);
                                    const isExpanded = Boolean(expandedCards[cert._id]);
                                    const drawerId = `cert-drawer-${cert._id}`;
                                    const certLabel = cert.name || 'Unnamed';

                                    return (
                                        <article
                                            key={cert._id}
                                            className={`cert-mobile-card${isWithdrawn ? ' cert-mobile-card--withdrawn' : ''}`}
                                        >
                                            <div className="cert-card-compact-row">
                                                <div className="cert-card-primary">
                                                    <Link to={`/certificates/${cert._id}`} className="cert-name-link">
                                                        {certLabel}
                                                    </Link>
                                                    {renderStatusBadge(cert)}
                                                </div>
                                                <div className="cert-card-metrics">
                                                    <span className="cert-card-value fs-num">
                                                        {formatCurrency(amount)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="cert-card-expander-btn"
                                                        aria-expanded={isExpanded}
                                                        aria-controls={drawerId}
                                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${certLabel}`}
                                                        onClick={() => toggleMobileCard(cert._id)}
                                                    >
                                                        {isExpanded ? (
                                                            <FaChevronUp aria-hidden="true" />
                                                        ) : (
                                                            <FaChevronDown aria-hidden="true" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div id={drawerId} className="cert-card-expanded">
                                                    <div className="cert-card-detail-item">
                                                        <span className="cert-card-detail-label">Interest Rate</span>
                                                        <span className="cert-card-detail-val fs-num">
                                                            {interestRate.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className="cert-card-detail-item">
                                                        <span className="cert-card-detail-label">Period</span>
                                                        <span className="cert-card-detail-val">
                                                            {period}m ({cert.payoutInterval || 'monthly'})
                                                        </span>
                                                    </div>
                                                    <div className="cert-card-detail-item">
                                                        <span className="cert-card-detail-label">Days Left</span>
                                                        <span className="cert-card-detail-val">{daysLeftLabel}</span>
                                                    </div>
                                                    <div className="cert-card-detail-item">
                                                        <span className="cert-card-detail-label">Maturity Date</span>
                                                        <span className="cert-card-detail-val">
                                                            {maturityDate ? formatDate(maturityDate) : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="cert-card-detail-item">
                                                        <span className="cert-card-detail-label">Accrued Interest</span>
                                                        <span className="cert-card-detail-val fs-num">
                                                            {accruedText}
                                                        </span>
                                                    </div>
                                                    {cert.isPayoutDue && (
                                                        <div className="cert-card-detail-item">
                                                            <span className="cert-card-detail-label">Payout Status</span>
                                                            <span className="cert-card-detail-val">
                                                                Interest payout due
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="cert-card-actions">
                                                        {renderRowActions(cert, isWithdrawn, true)}
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Withdrawal Confirmation Modal */}
            {withdrawingCert && (
                <div
                    role="presentation"
                    className="cert-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isSubmittingWithdraw) {
                            handleCloseWithdrawModal();
                        }
                    }}
                >
                    <div
                        ref={withdrawDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="withdraw-modal-title"
                        tabIndex={-1}
                        className="cert-modal"
                    >
                        <div className="cert-modal-header">
                            <h2 id="withdraw-modal-title" className="cert-modal-title">
                                <FaExclamationTriangle aria-hidden="true" size={20} />
                                <span>Withdraw Certificate Early</span>
                            </h2>
                            <button
                                ref={withdrawCloseRef}
                                type="button"
                                className="cert-modal-close"
                                aria-label="Close withdrawal modal"
                                disabled={isSubmittingWithdraw}
                                onClick={handleCloseWithdrawModal}
                            >
                                <FaTimes aria-hidden="true" />
                            </button>
                        </div>

                        <p className="cert-modal-desc">
                            You are requesting to withdraw <strong>{withdrawingCert.name}</strong>. Review the
                            financial payout calculation below:
                        </p>

                        <div className="cert-modal-summary">
                            <div className="cert-modal-summary-row">
                                <span>Principal Returned:</span>
                                <strong className="fs-num">{formatCurrency(withdrawingCert.amount)}</strong>
                            </div>
                            <div className="cert-modal-summary-row">
                                <span>Live Accrued Interest (as of today):</span>
                                <strong className="fs-num">
                                    {formatCurrency(withdrawingCert.accruedInterest || 0)}
                                </strong>
                            </div>
                            <div className="cert-modal-summary-row cert-modal-summary-total">
                                <span>Estimated Total Payout:</span>
                                <strong className="fs-num">
                                    {formatCurrency((withdrawingCert.amount || 0) + (withdrawingCert.accruedInterest || 0))}
                                </strong>
                            </div>
                        </div>

                        <div className="cert-modal-field">
                            <label htmlFor="withdraw-reason-input" className="fs-label">
                                Withdrawal Reason (Optional):
                            </label>
                            <input
                                id="withdraw-reason-input"
                                type="text"
                                className="fs-input"
                                placeholder="e.g. Early liquidity, rate switch"
                                value={withdrawalReason}
                                onChange={(e) => setWithdrawalReason(e.target.value)}
                            />
                        </div>

                        <div className="cert-modal-field">
                            <label htmlFor="withdraw-confirm-checkbox" className="cert-modal-checkbox-label">
                                <input
                                    id="withdraw-confirm-checkbox"
                                    type="checkbox"
                                    className="cert-modal-checkbox"
                                    checked={confirmedCheckbox}
                                    onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                                />
                                <span>
                                    I understand this certificate will be marked as withdrawn and no further interest
                                    will accrue.
                                </span>
                            </label>
                        </div>

                        <div className="cert-modal-footer">
                            <button
                                type="button"
                                className="fs-btn fs-btn-secondary"
                                disabled={isSubmittingWithdraw}
                                onClick={handleCloseWithdrawModal}
                            >
                                Cancel
                            </button>
                            <ProtectedAction tooltip="View-only access">
                                <button
                                    type="button"
                                    className="fs-btn cert-withdraw-confirm-btn"
                                    onClick={handleConfirmWithdraw}
                                    disabled={!confirmedCheckbox || isSubmittingWithdraw}
                                >
                                    {isSubmittingWithdraw ? 'Processing...' : 'Confirm Withdrawal'}
                                </button>
                            </ProtectedAction>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Confirmation Modal */}
            {payoutCert && (
                <div
                    role="presentation"
                    className="cert-modal-backdrop"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isSubmittingPayout) {
                            handleClosePayoutModal();
                        }
                    }}
                >
                    <div
                        ref={payoutDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payout-modal-title"
                        tabIndex={-1}
                        className="cert-modal"
                    >
                        <div className="cert-modal-header">
                            <h2 id="payout-modal-title" className="cert-modal-title">
                                <FaCoins aria-hidden="true" />
                                <span>Add Interest Payout</span>
                            </h2>
                            <button
                                ref={payoutCloseRef}
                                type="button"
                                className="cert-modal-close"
                                aria-label="Close payout modal"
                                disabled={isSubmittingPayout}
                                onClick={handleClosePayoutModal}
                            >
                                <FaTimes aria-hidden="true" />
                            </button>
                        </div>

                        <p className="cert-modal-desc">
                            Disburse the scheduled periodic interest for <strong>{payoutCert.name}</strong>. A
                            Top-up deposit will be recorded in your ledger.
                        </p>

                        <div className="cert-modal-summary">
                            <span className="cert-kpi-label">Disbursement Amount</span>
                            <span className="cert-modal-summary-amount fs-num">
                                {formatCurrency(payoutCert.periodicInterest || 0)}
                            </span>
                            <span className="cert-modal-summary-meta">
                                Rate: {payoutCert.interest}% • {payoutCert.payoutInterval || 'monthly'} frequency
                            </span>
                        </div>

                        <div className="cert-modal-field">
                            <label htmlFor="payout-date-input" className="fs-label">
                                Payout Date
                            </label>
                            <input
                                id="payout-date-input"
                                type="date"
                                className="fs-input"
                                value={payoutDate}
                                onChange={(e) => setPayoutDate(e.target.value)}
                            />
                        </div>

                        <div className="cert-modal-field">
                            <label htmlFor="payout-account-select" className="fs-label">
                                Destination Account
                            </label>
                            <select
                                id="payout-account-select"
                                className="fs-select"
                                value={payoutAccount}
                                onChange={(e) => setPayoutAccount(e.target.value)}
                            >
                                <option value="Bank">Bank Account</option>
                                <option value="Cash">Cash Wallet</option>
                                <option value="Prepaid">Prepaid Card</option>
                            </select>
                        </div>

                        <div className="cert-modal-footer">
                            <button
                                type="button"
                                className="fs-btn fs-btn-secondary"
                                onClick={handleClosePayoutModal}
                                disabled={isSubmittingPayout}
                            >
                                Cancel
                            </button>
                            <ProtectedAction tooltip="View-only access">
                                <button
                                    type="button"
                                    className="fs-btn fs-btn-primary"
                                    onClick={handleConfirmPayout}
                                    disabled={isSubmittingPayout}
                                >
                                    <FaCoins aria-hidden="true" />{' '}
                                    {isSubmittingPayout ? 'Processing...' : 'Confirm Payout'}
                                </button>
                            </ProtectedAction>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={Boolean(deletingCertId)}
                title="Delete Certificate"
                message="Are you sure you want to delete this certificate? This action cannot be undone."
                confirmText="Delete Certificate"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => !isDeleting && setDeletingCertId(null)}
            />
        </div>
    );
};

export default CertificateLogPage;
