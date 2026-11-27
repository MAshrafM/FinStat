// frontend/src/pages/certificates/CertificateDetailPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getCertificateById,
  getAccruedInterest,
  withdrawCertificate,
  deleteCertificate,
  processCertificatePayout,
} from '../../services/certificateService';
import ProtectedAction from '../../components/common/ProtectedAction';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Loading, Badge } from '../../components/ui';
import {
  getChartPalette,
  withAlpha,
  baseChartOptions,
  ariaLabel,
} from '../../styles/chartTheme';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaHandHoldingUsd,
  FaClock,
  FaCalendarCheck,
  FaPercent,
  FaCoins,
  FaChartLine,
  FaTimes,
  FaExclamationTriangle,
  FaSync,
  FaCheckCircle,
  FaBan,
  FaHourglassHalf,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import './Certificates.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getStatusBadgeMeta = (displayStatus) => {
  switch (displayStatus) {
    case 'withdrawn':
      return { label: 'Withdrawn', Icon: FaBan };
    case 'matured':
      return { label: 'Matured', Icon: FaCheckCircle };
    case 'maturing_soon':
      return { label: 'Maturing Soon', Icon: FaClock };
    case 'future':
      return { label: 'Future', Icon: FaHourglassHalf };
    case 'active':
    default:
      return { label: 'Active', Icon: FaCheckCircle };
  }
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

const CertificateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cert, setCert] = useState(null);
  const [liveAccrual, setLiveAccrual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [refreshingAccrual, setRefreshingAccrual] = useState(false);
  const [expandedTrajectoryRows, setExpandedTrajectoryRows] = useState({});

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('Bank');
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutDate, setPayoutDate] = useState('');
  const [payoutAccount, setPayoutAccount] = useState('Bank');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const withdrawDialogRef = useRef(null);
  const withdrawCloseBtnRef = useRef(null);
  const withdrawTriggerRef = useRef(null);

  const payoutDialogRef = useRef(null);
  const payoutCloseBtnRef = useRef(null);
  const payoutTriggerRef = useRef(null);

  const fetchCertDetails = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError('');
      const data = await getCertificateById(id);
      setCert(data);
      if (data && data.accruedInterest !== undefined) {
        setLiveAccrual({
          accruedInterest: data.accruedInterest,
          accruedInterestInPiastres: data.accruedInterestInPiastres,
          daysElapsed: data.daysElapsed,
          nextPayoutDate: data.nextPayoutDate,
          totalEarned: data.totalInterestEarned,
        });
      }
    } catch (err) {
      console.error('Failed to load certificate:', err);
      const message = err.response?.data?.message || err.message || 'Certificate not found';
      setFetchError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const refreshAccrualOnly = useCallback(async () => {
    try {
      setRefreshingAccrual(true);
      const accrualData = await getAccruedInterest(id);
      setLiveAccrual(accrualData);
    } catch (err) {
      console.error('Error refreshing live accrual:', err);
    } finally {
      setRefreshingAccrual(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCertDetails();
  }, [fetchCertDetails]);

  // Live auto-updating ticker every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAccrualOnly();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshAccrualOnly]);

  const handleCloseWithdrawModal = useCallback(() => {
    setShowWithdrawModal(false);
  }, []);

  const handleClosePayoutModal = useCallback(() => {
    setShowPayoutModal(false);
  }, []);

  useDialogAccessibility(
    showWithdrawModal,
    isSubmittingWithdraw,
    handleCloseWithdrawModal,
    withdrawDialogRef,
    withdrawCloseBtnRef,
    withdrawTriggerRef
  );

  useDialogAccessibility(
    showPayoutModal,
    isSubmittingPayout,
    handleClosePayoutModal,
    payoutDialogRef,
    payoutCloseBtnRef,
    payoutTriggerRef
  );

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCertificate(id);
      showToast('Certificate deleted successfully', 'success');
      setShowDeleteModal(false);
      navigate('/certificates');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete certificate', 'error');
    }
  };

  const handleOpenWithdrawModal = (e) => {
    withdrawTriggerRef.current = e?.currentTarget || document.activeElement;
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!confirmedCheckbox) return;

    try {
      setIsSubmittingWithdraw(true);
      await withdrawCertificate(id, {
        withdrawalDate: new Date().toISOString(),
        withdrawalReason: withdrawalReason.trim() || undefined,
        confirmWithdrawal: true,
        destinationAccount,
      });
      showToast('Certificate marked as withdrawn', 'success');
      setShowWithdrawModal(false);
      fetchCertDetails();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to withdraw certificate', 'error');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleOpenPayoutModal = (e) => {
    payoutTriggerRef.current = e?.currentTarget || document.activeElement;
    const defaultDate = cert?.nextDuePayoutDate
      ? new Date(cert.nextDuePayoutDate).toISOString().split('T')[0]
      : (cert?.nextPayoutDate ? new Date(cert.nextPayoutDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setPayoutDate(defaultDate);
    setPayoutAccount('Bank');
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = async () => {
    try {
      setIsSubmittingPayout(true);
      const res = await processCertificatePayout(id, {
        payoutDate: payoutDate || undefined,
        destinationAccount: payoutAccount,
      });
      showToast(res.message || 'Interest payout processed successfully!', 'success');
      setShowPayoutModal(false);
      await fetchCertDetails();
    } catch (err) {
      console.error('Failed to process payout:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to process interest payout', 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const toggleTrajectoryRow = (index) => {
    setExpandedTrajectoryRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const palette = getChartPalette();
  const trajectory = useMemo(
    () => cert?.trajectory || { labels: [], actualSeries: [], projectedSeries: [] },
    [cert]
  );

  const chartData = useMemo(() => ({
    labels: trajectory.labels || [],
    datasets: [
      {
        label: 'Actual Accrued (Solid)',
        data: trajectory.actualSeries || [],
        borderColor: palette.grey4,
        backgroundColor: withAlpha(palette.grey4, 0.12),
        borderWidth: 3,
        tension: 0.2,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: palette.grey4,
      },
      {
        label: 'Projected Accrual (Dashed)',
        data: trajectory.projectedSeries || [],
        borderColor: palette.grey1,
        borderDash: [6, 6],
        backgroundColor: withAlpha(palette.grey1, 0.06),
        borderWidth: 2,
        tension: 0.2,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: palette.grey1,
      },
    ],
  }), [trajectory, palette]);

  const chartOptions = useMemo(() => {
    const base = baseChartOptions();
    return {
      ...base,
      layout: {
        padding: { top: 24, right: 16 },
      },
      plugins: {
        ...base.plugins,
        legend: {
          ...base.plugins?.legend,
          display: true,
          position: 'top',
          labels: {
            ...base.plugins?.legend?.labels,
            color: palette.text2,
            font: {
              family: 'IBM Plex Sans, -apple-system, sans-serif',
              weight: '600',
              size: 12,
            },
          },
        },
        tooltip: {
          ...base.plugins?.tooltip,
          callbacks: {
            label: (context) => `${context.dataset?.label || 'Accrued'}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        ...base.scales,
        y: {
          ...base.scales?.y,
          beginAtZero: true,
          grace: '25%',
          ticks: {
            ...base.scales?.y?.ticks,
            callback: (value) => `${value} EGP`,
          },
        },
        x: {
          ...base.scales?.x,
          grid: { display: false },
        },
      },
    };
  }, [palette]);

  // Local last-point direct label plugin for both series (§4.12; zero shared chartTheme changes)
  const certLastPointLabelPlugin = useMemo(() => ({
    id: 'certLastPointLabelPlugin',
    afterDatasetsDraw(chart) {
      const datasets = chart?.data?.datasets || [];
      if (!datasets.length) return;

      const ctx = chart.ctx;
      const drawnYPositions = [];
      ctx.save();
      ctx.font = '600 12px "IBM Plex Sans", sans-serif';
      ctx.fillStyle = palette.text2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      datasets.forEach((dataset, datasetIndex) => {
        const seriesData = Array.isArray(dataset?.data) ? dataset.data : [];
        let lastIndex = -1;
        for (let i = seriesData.length - 1; i >= 0; i -= 1) {
          if (seriesData[i] !== null && seriesData[i] !== undefined && Number.isFinite(Number(seriesData[i]))) {
            lastIndex = i;
            break;
          }
        }
        if (lastIndex < 0) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        const point = meta?.data?.[lastIndex];
        if (!point) return;

        const shortName = datasetIndex === 0 ? 'Actual' : 'Projected';
        const nearTopEdge = chart?.chartArea ? (point.y - 22 < chart.chartArea.top) : false;
        ctx.textBaseline = nearTopEdge ? 'top' : 'bottom';
        let labelY = nearTopEdge ? point.y + 8 : point.y - 8;
        drawnYPositions.forEach((prevY) => {
          if (Math.abs(labelY - prevY) < 16) {
            labelY = nearTopEdge ? prevY + 18 : prevY - 18;
          }
        });
        drawnYPositions.push(labelY);

        ctx.fillText(
          `${shortName}: ${formatCurrency(Number(seriesData[lastIndex]))}`,
          point.x - 8,
          labelY
        );
      });

      ctx.restore();
    },
  }), [palette]);

  const trajectoryRows = useMemo(() => {
    const labels = trajectory.labels || [];
    const actuals = trajectory.actualSeries || [];
    const projected = trajectory.projectedSeries || [];
    return labels.map((label, idx) => ({
      label,
      actual: actuals[idx],
      projected: projected[idx],
    }));
  }, [trajectory]);

  const chartSummaryPoints = useMemo(
    () => trajectoryRows.map((row) => ({
      label: row.label,
      value: row.actual !== null && row.actual !== undefined
        ? formatCurrency(row.actual)
        : formatCurrency(row.projected || 0),
    })),
    [trajectoryRows]
  );

  const chartAriaLabel = useMemo(
    () => ariaLabel('Interest Accrual Trajectory (Dual Series)', chartSummaryPoints),
    [chartSummaryPoints]
  );

  if (loading) {
    return (
      <div className="page-container cert-page-container cert-detail-page">
        <Loading variant="card" text="Loading certificate details..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="page-container cert-page-container cert-detail-page">
        <div className="cert-detail-top-bar">
          <Link to="/certificates" className="cert-back-link">
            <FaArrowLeft aria-hidden="true" /> Back to Certificates
          </Link>
        </div>
        <div className="cert-error-card" role="alert">
          <h2>Failed to Load Certificate</h2>
          <p>{fetchError}</p>
          <div className="cert-error-actions">
            <button type="button" className="fs-btn fs-btn-secondary" onClick={fetchCertDetails}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="page-container cert-page-container cert-detail-page">
        <div className="cert-empty-card">
          <h2>Certificate Not Found</h2>
          <p>The requested certificate could not be found or is no longer available.</p>
          <div className="cert-error-actions">
            <Link to="/certificates" className="fs-btn fs-btn-secondary">Return to Certificates</Link>
          </div>
        </div>
      </div>
    );
  }

  const isWithdrawn = cert.status === 'withdrawn';
  const displayStatus = cert.displayStatus || cert.status || 'active';
  const statusMeta = getStatusBadgeMeta(displayStatus);
  const StatusIcon = statusMeta.Icon;
  const showPayoutDueBanner = !isWithdrawn && !cert.autoReinvest && Boolean(cert.isPayoutDue);
  const currentAccrued = liveAccrual?.accruedInterest ?? cert.accruedInterest ?? 0;
  const dailyYieldPct = (((cert.interest || 0) / 100) / 365 * 100).toFixed(4);
  const nextPayoutFormatted = liveAccrual?.nextPayoutDate
    ? formatDate(liveAccrual.nextPayoutDate)
    : (cert.nextPayoutDate ? formatDate(cert.nextPayoutDate) : 'Completed');
  const totalLifetimeYield = liveAccrual?.totalEarned ?? cert.totalInterestEarned ?? 0;

  return (
    <div className="page-container cert-page-container cert-detail-page">
      {/* Top Navigation */}
      <div className="cert-detail-top-bar">
        <Link to="/certificates" className="cert-back-link">
          <FaArrowLeft aria-hidden="true" /> Back to Certificates
        </Link>
        <div className="cert-detail-actions">
          <Link
            to={`/certificates/edit/${cert._id}`}
            className="fs-btn fs-btn-secondary"
          >
            <FaEdit aria-hidden="true" /> Edit
          </Link>
          {!isWithdrawn && !cert.autoReinvest && (
            <ProtectedAction tooltip="View-only access">
              <button
                type="button"
                onClick={handleOpenPayoutModal}
                data-testid="add-payout-btn"
                className={showPayoutDueBanner ? 'fs-btn fs-btn-secondary' : 'fs-btn fs-btn-primary'}
              >
                <FaCoins aria-hidden="true" /> Add Interest Payout
              </button>
            </ProtectedAction>
          )}
          {!isWithdrawn && (
            <button
              type="button"
              onClick={handleOpenWithdrawModal}
              className="fs-btn fs-btn-secondary"
            >
              <FaHandHoldingUsd aria-hidden="true" /> Withdraw
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="fs-btn fs-btn-secondary cert-btn-danger-outline"
          >
            <FaTrash aria-hidden="true" /> Delete
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <section className="cert-detail-hero">
        <div className="cert-detail-hero-row">
          <div>
            <h1>{cert.name}</h1>
            <p className="cert-detail-hero-meta">
              Issued on <strong>{formatDate(cert.startDate)}</strong> &bull; Duration:{' '}
              <strong className="fs-num">{cert.period} months</strong> ({cert.payoutInterval || 'monthly'} payouts)
            </p>
          </div>
          <div className="cert-detail-hero-badges">
            <Badge tone="neutral" className="cert-status-badge">
              <StatusIcon aria-hidden="true" />
              <span>{statusMeta.label}</span>
            </Badge>
            <Badge tone="neutral" className="cert-status-badge">
              <FaClock aria-hidden="true" />
              <span className="fs-num">{cert.daysRemaining || 0} days remaining</span>
            </Badge>
          </div>
        </div>
      </section>

      {/* Payout Due Notice Banner */}
      {showPayoutDueBanner && (
        <section className="cert-payout-due-banner" aria-label="Scheduled Interest Payout Due">
          <div className="cert-payout-due-info">
            <div className="cert-payout-due-icon" aria-hidden="true">
              <FaCoins />
            </div>
            <div>
              <div className="cert-payout-due-title">
                Interest Payout Due (<span className="fs-num">{formatCurrency(cert.periodicInterest || 0)}</span>)
              </div>
              <div className="cert-payout-due-sub">
                A scheduled periodic interest disbursement was due on {formatDate(cert.nextDuePayoutDate || cert.nextPayoutDate)}.
              </div>
            </div>
          </div>
          <ProtectedAction tooltip="View-only access">
            <button
              type="button"
              onClick={handleOpenPayoutModal}
              className="fs-btn fs-btn-primary"
            >
              <FaCoins aria-hidden="true" /> Disburse Payout Now
            </button>
          </ProtectedAction>
        </section>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div
          className="cert-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingPayout) {
              handleClosePayoutModal();
            }
          }}
        >
          <div
            ref={payoutDialogRef}
            className="cert-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-payout-modal-title"
            tabIndex={-1}
          >
            <div className="cert-modal-header">
              <h2 id="detail-payout-modal-title" className="cert-modal-title">
                <FaCoins aria-hidden="true" /> Add Interest Payout
              </h2>
              <button
                ref={payoutCloseBtnRef}
                type="button"
                className="cert-modal-close"
                aria-label="Close payout modal"
                onClick={handleClosePayoutModal}
                disabled={isSubmittingPayout}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <p className="cert-modal-desc">
              Disburse the scheduled periodic interest for <strong>{cert.name}</strong>. A Top-up deposit will be recorded in your ledger.
            </p>

            <div className="cert-modal-summary">
              <div className="cert-modal-summary-row">
                <span>Disbursement Amount</span>
                <span className="cert-modal-summary-amount fs-num">
                  {formatCurrency(cert.periodicInterest || 0)}
                </span>
              </div>
              <div className="cert-modal-summary-meta">
                Rate: <span className="fs-num">{cert.interest}%</span> &bull; {cert.payoutInterval || 'monthly'} frequency
              </div>
            </div>

            <div className="cert-modal-field">
              <label htmlFor="detail-payout-date-input" className="fs-label">
                Payout Date
              </label>
              <input
                id="detail-payout-date-input"
                type="date"
                className="fs-input"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
              />
            </div>

            <div className="cert-modal-field">
              <label htmlFor="detail-payout-account-select" className="fs-label">
                Destination Account
              </label>
              <select
                id="detail-payout-account-select"
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
              <button
                type="button"
                className="fs-btn fs-btn-primary"
                onClick={handleConfirmPayout}
                disabled={isSubmittingPayout}
              >
                <FaCoins aria-hidden="true" /> {isSubmittingPayout ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metric Cards (Reference Frame 03 Variant B) */}
      <section className="cert-metrics-grid" aria-label="Certificate Key Metrics">
        {/* Principal */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaCoins /></div>
          <div className="cert-metric-body">
            <div className="cert-kpi-label">Principal Amount</div>
            <div className="cert-kpi-value fs-num">{formatCurrency(cert.amount)}</div>
            <div className="cert-kpi-sub">Base deposited capital</div>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaPercent /></div>
          <div className="cert-metric-body">
            <div className="cert-kpi-label">Annual Yield Rate</div>
            <div className="cert-kpi-value fs-num">{Number(cert.interest || 0).toFixed(2)}%</div>
            <div className="cert-kpi-sub">Daily: <span className="fs-num">{dailyYieldPct}%</span></div>
          </div>
        </div>

        {/* Live Accrued Interest */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaClock /></div>
          <div className="cert-metric-body">
            <div className="cert-metric-head-row">
              <div className="cert-kpi-label">Live Accrued Interest</div>
              <button
                type="button"
                className="cert-icon-btn"
                onClick={refreshAccrualOnly}
                disabled={refreshingAccrual}
                aria-label="Refresh live accrued interest"
                title="Refresh Live Accrual"
              >
                <FaSync aria-hidden="true" className={refreshingAccrual ? 'cert-spin' : ''} size={12} />
              </button>
            </div>
            <div className="cert-kpi-value fs-num">
              {formatCurrency(currentAccrued)}
            </div>
            <div className="cert-kpi-sub">
              <span className="fs-num">{liveAccrual?.daysElapsed ?? cert.daysElapsed ?? 0}</span> days accrued (auto-refreshed 60s)
            </div>
          </div>
        </div>

        {/* Next Payout Date */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaCalendarCheck /></div>
          <div className="cert-metric-body">
            <div className="cert-kpi-label">Next Payout Date</div>
            <div className="cert-kpi-value fs-num">{nextPayoutFormatted}</div>
            <div className="cert-kpi-sub">Frequency: {cert.payoutInterval || 'monthly'}</div>
          </div>
        </div>

        {/* Maturity Date */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaCalendarCheck /></div>
          <div className="cert-metric-body">
            <div className="cert-kpi-label">Maturity Date</div>
            <div className="cert-kpi-value fs-num">
              {cert.maturityDate ? formatDate(cert.maturityDate) : '-'}
            </div>
            <div className="cert-kpi-sub">
              <span className="fs-num">{cert.daysRemaining || 0}</span> day(s) until maturity
            </div>
          </div>
        </div>

        {/* Total Interest Earned */}
        <div className="cert-kpi-tile cert-metric-tile">
          <div className="cert-metric-icon" aria-hidden="true"><FaChartLine /></div>
          <div className="cert-metric-body">
            <div className="cert-kpi-label">Total Lifetime Yield</div>
            <div className="cert-kpi-value fs-num">
              {formatCurrency(totalLifetimeYield)}
            </div>
            <div className="cert-kpi-sub">Paid + Live Accrued</div>
          </div>
        </div>
      </section>

      {/* Dual-Series Interest Accrual Chart & Schedule Table */}
      <section className="cert-chart-card">
        <div className="cert-chart-header">
          <h2 className="cert-chart-title">
            Interest Accrual Trajectory (Dual Series)
          </h2>
          <p className="cert-chart-subtitle">
            Solid line illustrates <strong>Actual Accrued</strong> interest up to today; dashed line projects <strong>Target Accrual</strong> to maturity.
          </p>
        </div>

        <div
          className="cert-chart-canvas-wrap"
          role="img"
          aria-label={chartAriaLabel}
          data-testid="cert-chart-canvas-wrapper"
          data-plugin-ids="certLastPointLabelPlugin"
        >
          {trajectory.labels.length > 0 ? (
            <Line
              data={chartData}
              options={chartOptions}
              plugins={[certLastPointLabelPlugin]}
              aria-label={chartAriaLabel}
            />
          ) : (
            <div className="cert-chart-empty">
              Accrual trajectory points are generating...
            </div>
          )}
        </div>

        <p className="cert-chart-summary" data-testid="cert-chart-summary">
          {chartAriaLabel}
        </p>

        {trajectoryRows.length > 0 && (
          <>
            <details className="cert-trajectory-details">
              <summary>View interest accrual schedule table</summary>
              <table className="cert-trajectory-table" data-testid="cert-trajectory-table">
                <caption>Actual vs. Projected Interest Accrual Trajectory</caption>
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    <th scope="col" className="cert-th-num">Actual Accrued</th>
                    <th scope="col" className="cert-th-num">Projected Accrual</th>
                  </tr>
                </thead>
                <tbody>
                  {trajectoryRows.map((row) => (
                    <tr key={row.label}>
                      <td data-label="Period">{row.label}</td>
                      <td data-label="Actual Accrued" className="fs-num">
                        {row.actual !== null && row.actual !== undefined ? formatCurrency(row.actual) : '—'}
                      </td>
                      <td data-label="Projected Accrual" className="fs-num">
                        {row.projected !== null && row.projected !== undefined ? formatCurrency(row.projected) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <div className="cert-trajectory-mobile-cards" data-testid="cert-trajectory-mobile-cards">
              {trajectoryRows.map((row, idx) => {
                const isExpanded = Boolean(expandedTrajectoryRows[idx]);
                const panelId = `cert-trajectory-panel-${idx}`;
                const actualFormatted = row.actual !== null && row.actual !== undefined
                  ? formatCurrency(row.actual)
                  : '—';
                const projectedFormatted = row.projected !== null && row.projected !== undefined
                  ? formatCurrency(row.projected)
                  : '—';

                return (
                  <div key={row.label} className="cert-mobile-card">
                    <div className="cert-card-compact-row">
                      <div className="cert-card-primary">
                        <strong>{row.label}</strong>
                        <span className="cert-kpi-sub">Actual Accrued</span>
                      </div>
                      <div className="cert-card-metrics">
                        <span className="cert-card-value fs-num">{actualFormatted}</span>
                        <button
                          type="button"
                          className="cert-card-expander-btn"
                          aria-expanded={isExpanded}
                          aria-controls={panelId}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${row.label} projection`}
                          onClick={() => toggleTrajectoryRow(idx)}
                        >
                          {isExpanded ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div id={panelId} className="cert-card-expanded">
                        <div className="cert-card-detail-item">
                          <span className="cert-card-detail-label">Projected Accrual</span>
                          <span className="cert-card-detail-val fs-num">{projectedFormatted}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Certificate"
        message="Are you sure you want to delete this certificate?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Withdrawal Impact Preview Modal */}
      {showWithdrawModal && (
        <div
          className="cert-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingWithdraw) {
              handleCloseWithdrawModal();
            }
          }}
        >
          <div
            ref={withdrawDialogRef}
            className="cert-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-withdraw-modal-title"
            tabIndex={-1}
          >
            <div className="cert-modal-header">
              <h2 id="detail-withdraw-modal-title" className="cert-modal-title">
                <FaExclamationTriangle aria-hidden="true" /> Withdraw Certificate Early
              </h2>
              <button
                ref={withdrawCloseBtnRef}
                type="button"
                className="cert-modal-close"
                aria-label="Close withdrawal modal"
                onClick={handleCloseWithdrawModal}
                disabled={isSubmittingWithdraw}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <p className="cert-modal-desc">
              Confirm early redemption for <strong>{cert.name}</strong>. Interest accrual will cease permanently upon withdrawal.
            </p>

            <div className="cert-modal-summary">
              <div className="cert-modal-summary-row">
                <span>Principal Returned:</span>
                <strong className="fs-num">{formatCurrency(cert.amount)}</strong>
              </div>
              <div className="cert-modal-summary-row">
                <span>Live Accrued Interest (as of today):</span>
                <strong className="fs-num">{formatCurrency(currentAccrued)}</strong>
              </div>
              <div className="cert-modal-summary-row cert-modal-summary-total">
                <span>Estimated Total Payout:</span>
                <strong className="fs-num">
                  {formatCurrency((cert.amount || 0) + currentAccrued)}
                </strong>
              </div>
            </div>

            <div className="cert-modal-field">
              <label htmlFor="detail-withdraw-destination-account" className="fs-label">
                Deposit Proceeds To:
              </label>
              <select
                id="detail-withdraw-destination-account"
                className="fs-select"
                value={destinationAccount}
                onChange={(e) => setDestinationAccount(e.target.value)}
              >
                <option value="Bank">Bank Account</option>
                <option value="Cash">Cash Ledger</option>
                <option value="Prepaid">Prepaid Card</option>
              </select>
            </div>

            <div className="cert-modal-field">
              <label htmlFor="detail-withdraw-reason-input" className="fs-label">
                Withdrawal Reason (Optional):
              </label>
              <input
                id="detail-withdraw-reason-input"
                type="text"
                className="fs-input"
                placeholder="e.g. Asset reallocation, cash liquidity"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
              />
            </div>

            <div className="cert-modal-field">
              <label htmlFor="detail-withdraw-confirm-checkbox" className="cert-modal-checkbox-label">
                <input
                  id="detail-withdraw-confirm-checkbox"
                  type="checkbox"
                  className="cert-modal-checkbox"
                  checked={confirmedCheckbox}
                  onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                />
                <span>I understand this certificate will be marked as withdrawn and no further interest will accrue.</span>
              </label>
            </div>

            <div className="cert-modal-footer">
              <button
                type="button"
                className="fs-btn fs-btn-secondary"
                onClick={handleCloseWithdrawModal}
                disabled={isSubmittingWithdraw}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fs-btn cert-withdraw-confirm-btn"
                onClick={handleConfirmWithdraw}
                disabled={!confirmedCheckbox || isSubmittingWithdraw}
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

export default CertificateDetailPage;
