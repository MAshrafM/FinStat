// frontend/src/pages/certificates/CertificateDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCertificateById, getAccruedInterest, withdrawCertificate, deleteCertificate } from '../../services/certificateService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
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
} from 'react-icons/fa';
import './CertificateDetail.css';

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

const CertificateDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cert, setCert] = useState(null);
  const [liveAccrual, setLiveAccrual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAccrual, setRefreshingAccrual] = useState(false);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const fetchCertDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCertificateById(id);
      setCert(data);
      if (data.accruedInterest !== undefined) {
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
      showToast(err.response?.data?.message || 'Certificate not found', 'error');
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      try {
        await deleteCertificate(id);
        showToast('Certificate deleted successfully', 'success');
        navigate('/certificates');
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete certificate', 'error');
      }
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!confirmedCheckbox) return;

    try {
      setIsSubmittingWithdraw(true);
      await withdrawCertificate(id, {
        withdrawalDate: new Date().toISOString(),
        withdrawalReason: withdrawalReason.trim() || undefined,
        confirmWithdrawal: true,
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

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading certificate details...</p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="page-container">
        <h2>Certificate Not Found</h2>
        <Link to="/certificates" className="action-button">Return to Certificates</Link>
      </div>
    );
  }

  const isWithdrawn = cert.status === 'withdrawn';
  const displayStatus = cert.displayStatus || cert.status || 'active';

  // Status Badge Helper
  const getBadgeDetails = () => {
    switch (displayStatus) {
      case 'withdrawn':
        return { label: '⚪ Withdrawn', bg: '#64748b' };
      case 'matured':
        return { label: '🔴 Matured', bg: '#ef4444' };
      case 'maturing_soon':
        return { label: '🟡 Maturing Soon', bg: '#f59e0b' };
      case 'future':
        return { label: '⏳ Future', bg: '#8b5cf6' };
      case 'active':
      default:
        return { label: '🟢 Active', bg: '#10b981' };
    }
  };

  const badge = getBadgeDetails();

  // Dual-Series Trajectory Chart Data
  const trajectory = cert.trajectory || { labels: [], actualSeries: [], projectedSeries: [] };
  const chartData = {
    labels: trajectory.labels,
    datasets: [
      {
        label: 'Actual Accrued (Solid)',
        data: trajectory.actualSeries,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        tension: 0.2,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
      },
      {
        label: 'Projected Accrual (Dashed)',
        data: trajectory.projectedSeries,
        borderColor: '#93c5fd',
        borderDash: [6, 6],
        backgroundColor: 'rgba(147, 197, 253, 0.05)',
        borderWidth: 2,
        tension: 0.2,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: '#93c5fd',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { weight: '600', size: 12 },
          color: '#374151',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Accrued: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value} EGP`,
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="page-container">
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <Link to="/certificates" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}>
          <FaArrowLeft /> Back to Certificates
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to={`/certificates/edit/${cert._id}`}
            className="action-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}
          >
            <FaEdit /> Edit
          </Link>
          {!isWithdrawn && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f59e0b', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              <FaHandHoldingUsd /> Withdraw
            </button>
          )}
          <button
            onClick={handleDelete}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '28px', color: '#ffffff' }}>{cert.name}</h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>
              Issued on <strong>{formatDate(cert.startDate)}</strong> • Duration: <strong>{cert.period} months</strong> ({cert.payoutInterval || 'monthly'} payouts)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ backgroundColor: badge.bg, color: 'white', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
              {badge.label}
            </span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
              ⏳ {cert.daysRemaining || 0} days remaining
            </span>
          </div>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Principal */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FaCoins /></div>
          <div>
            <div className="metric-label">Principal Amount</div>
            <div className="metric-value">{formatCurrency(cert.amount)}</div>
            <div className="metric-sub">Base deposited capital</div>
          </div>
        </div>

        {/* Interest Rate */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#ecfdf5', color: '#047857' }}><FaPercent /></div>
          <div>
            <div className="metric-label">Annual Yield Rate</div>
            <div className="metric-value">{Number(cert.interest || 0).toFixed(2)}%</div>
            <div className="metric-sub">Daily: {((cert.interest / 100) / 365 * 100).toFixed(4)}%</div>
          </div>
        </div>

        {/* Live Accrued Interest */}
        <div className="metric-box" style={{ border: '2px solid #818cf8', background: '#faf5ff' }}>
          <div className="metric-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}><FaClock /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="metric-label">Live Accrued Interest</div>
              <button
                onClick={refreshAccrualOnly}
                title="Refresh Live Accrual"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 0 }}
              >
                <FaSync className={refreshingAccrual ? 'spin' : ''} size={12} />
              </button>
            </div>
            <div className="metric-value" style={{ color: '#6d28d9' }}>
              {formatCurrency(liveAccrual?.accruedInterest ?? cert.accruedInterest ?? 0)}
            </div>
            <div className="metric-sub">
              {liveAccrual?.daysElapsed ?? cert.daysElapsed ?? 0} days accrued (auto-refreshed 60s)
            </div>
          </div>
        </div>

        {/* Next Payout Date */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#b45309' }}><FaCalendarCheck /></div>
          <div>
            <div className="metric-label">Next Payout Date</div>
            <div className="metric-value" style={{ fontSize: '18px' }}>
              {liveAccrual?.nextPayoutDate ? formatDate(liveAccrual.nextPayoutDate) : (cert.nextPayoutDate ? formatDate(cert.nextPayoutDate) : 'Completed')}
            </div>
            <div className="metric-sub">Frequency: {cert.payoutInterval || 'monthly'}</div>
          </div>
        </div>

        {/* Maturity Date */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}><FaCalendarCheck /></div>
          <div>
            <div className="metric-label">Maturity Date</div>
            <div className="metric-value" style={{ fontSize: '18px' }}>
              {cert.maturityDate ? formatDate(cert.maturityDate) : '-'}
            </div>
            <div className="metric-sub">{cert.daysRemaining || 0} day(s) until maturity</div>
          </div>
        </div>

        {/* Total Interest Earned */}
        <div className="metric-box">
          <div className="metric-icon" style={{ background: '#f0fdf4', color: '#15803d' }}><FaChartLine /></div>
          <div>
            <div className="metric-label">Total Lifetime Yield</div>
            <div className="metric-value" style={{ color: '#16a34a' }}>
              {formatCurrency(liveAccrual?.totalEarned ?? cert.totalInterestEarned ?? 0)}
            </div>
            <div className="metric-sub">Paid + Live Accrued</div>
          </div>
        </div>
      </div>

      {/* Dual-Series Interest Accrual Chart */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#111827' }}>
              Interest Accrual Trajectory (Dual Series)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Solid line illustrates <strong>Actual Accrued</strong> interest up to today; dashed line projects <strong>Target Accrual</strong> to maturity.
            </p>
          </div>
        </div>

        <div style={{ height: '320px', position: 'relative' }}>
          {trajectory.labels.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              Accrual trajectory points are generating...
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Impact Preview Modal */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowWithdrawModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}
            >
              <FaTimes />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#b45309' }}>
              <FaExclamationTriangle size={24} />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Withdraw Certificate Early</h2>
            </div>

            <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '16px' }}>
              Confirm early redemption for <strong>{cert.name}</strong>. Interest accrual will cease permanently upon withdrawal.
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
                <strong>{formatCurrency(cert.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Live Accrued Interest (as of today):</span>
                <strong style={{ color: '#10b981' }}>{formatCurrency(liveAccrual?.accruedInterest ?? cert.accruedInterest ?? 0)}</strong>
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
                  {formatCurrency((cert.amount || 0) + (liveAccrual?.accruedInterest ?? cert.accruedInterest ?? 0))}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Withdrawal Reason (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Asset reallocation, cash liquidity"
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
                onClick={() => setShowWithdrawModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#374151', cursor: 'pointer', fontWeight: '500' }}
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

export default CertificateDetailPage;
