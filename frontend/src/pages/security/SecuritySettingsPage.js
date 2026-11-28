// frontend/src/pages/security/SecuritySettingsPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getCurrentUser,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getAuditLogs,
} from '../../services/authService';
import { dispatchToast } from '../../services/apiClient';
import { Badge, Loading, EmptyState } from '../../components/ui';
import './SecuritySettingsPage.css';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SecuritySettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2FA Setup State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState('');
  const [formattedSecret, setFormattedSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState('');

  // Backup codes modal
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // 2FA Disable State
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  // D19 Responsive State (<= 768px)
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  ));
  const [expandedLogIds, setExpandedLogIds] = useState(() => new Set());

  // APG Modal Focus Lifecycle Refs
  const modalContentRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const wasModalOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleMediaChange);
      return () => mql.removeEventListener('change', handleMediaChange);
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(handleMediaChange);
      return () => mql.removeListener(handleMediaChange);
    }
    return undefined;
  }, []);

  const anyModalOpen = setupModalOpen || backupCodesModalOpen || disableModalOpen;

  useEffect(() => {
    if (anyModalOpen) {
      wasModalOpenRef.current = true;
      const timer = setTimeout(() => {
        if (modalContentRef.current) {
          const focusables = modalContentRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
          if (focusables.length > 0) {
            focusables[0].focus();
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    if (wasModalOpenRef.current) {
      wasModalOpenRef.current = false;
      if (restoreFocusRef.current && typeof restoreFocusRef.current.focus === 'function') {
        restoreFocusRef.current.focus();
      }
      restoreFocusRef.current = null;
    }
    return undefined;
  }, [anyModalOpen, setupModalOpen, backupCodesModalOpen, disableModalOpen]);

  const captureTriggerFocus = () => {
    if (typeof document !== 'undefined' && document.activeElement) {
      restoreFocusRef.current = document.activeElement;
    }
  };

  const closeActiveModal = () => {
    if (setupModalOpen) setSetupModalOpen(false);
    if (backupCodesModalOpen) setBackupCodesModalOpen(false);
    if (disableModalOpen) setDisableModalOpen(false);
  };

  const handleModalKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeActiveModal();
      return;
    }
    if (e.key === 'Tab' && modalContentRef.current) {
      const focusables = Array.from(modalContentRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !modalContentRef.current.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !modalContentRef.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Fetch initial profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      dispatchToast(err.message || 'Failed to load security profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch audit logs
  const fetchLogs = useCallback(async (page = 1) => {
    setAuditLoading(true);
    try {
      const data = await getAuditLogs(page, 10);
      if (data.logs) {
        setAuditLogs(data.logs);
        setAuditPage(data.page || 1);
        setAuditTotalPages(data.pages || 1);
        setAuditTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      dispatchToast(err.message || 'Failed to load audit logs.', 'error');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchLogs(1);
  }, [fetchUserProfile, fetchLogs]);

  // Start 2FA Setup
  const handleStart2FASetup = async () => {
    captureTriggerFocus();
    setSetupError('');
    setVerifyCode('');
    setSetupSecret('');
    setFormattedSecret('');
    setSetupLoading(true);
    setSetupModalOpen(true);
    try {
      const data = await setup2FA();
      setSetupSecret(data.secret);
      setFormattedSecret(data.formattedSecret || data.secret);
    } catch (err) {
      setSetupError(err.message || 'Failed to initialize 2FA setup.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Copy secret
  const handleCopySecret = () => {
    if (setupSecret && navigator.clipboard) {
      navigator.clipboard.writeText(setupSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  // Verify and complete 2FA Setup
  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim() || verifyCode.trim().length < 6) {
      setSetupError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setSetupLoading(true);
    setSetupError('');

    try {
      const data = await verify2FASetup(setupSecret, verifyCode.trim());
      setSetupModalOpen(false);
      setBackupCodes(data.backupCodes || []);
      setBackupCodesModalOpen(true);
      setUser((prev) => ({ ...prev, totpEnabled: true }));
      dispatchToast('Two-Factor Authentication enabled successfully!', 'success');
      fetchLogs(1);
    } catch (err) {
      setSetupError(err.message || 'Verification failed. Please check your code and try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    if (navigator.clipboard) {
      const text = backupCodes.join('\n');
      navigator.clipboard.writeText(text);
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const text = `FinStat 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n` + backupCodes.join('\n');
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'finstat-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Confirm disable 2FA
  const handleConfirmDisable = async (e) => {
    e.preventDefault();
    if (!disablePassword.trim() && !disableCode.trim()) {
      setDisableError('Please enter your password or current TOTP code.');
      return;
    }

    setDisableLoading(true);
    setDisableError('');

    try {
      await disable2FA({
        password: disablePassword.trim() || undefined,
        code: disableCode.trim() || undefined,
      });
      setDisableModalOpen(false);
      setDisablePassword('');
      setDisableCode('');
      setUser((prev) => ({ ...prev, totpEnabled: false }));
      dispatchToast('Two-Factor Authentication has been disabled.', 'info');
      fetchLogs(1);
    } catch (err) {
      setDisableError(err.message || 'Failed to disable 2FA.');
    } finally {
      setDisableLoading(false);
    }
  };

  const toggleExpandLog = (key) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="security-page-container">
        <Loading variant="card" text="Loading security settings..." />
      </div>
    );
  }

  return (
    <div className="security-page-container">
      <div className="security-shell">
        {/* Header */}
        <div className="security-header">
          <div className="security-title-row">
            <Shield size={24} className="security-header-icon" aria-hidden="true" />
            <h1 className="security-page-title">Security &amp; Access Control</h1>
          </div>
          <p className="security-subtitle">
            Manage your account protection, two-factor authentication, and monitor security audit logs.
          </p>
        </div>

        <div className="security-content">
          {/* Top Cards Grid */}
          <div className="security-grid">
            {/* 2FA Card */}
            <div className="security-card">
              <div className="security-card-header">
                <div className="card-title-group">
                  <div className="card-icon-badge" aria-hidden="true">
                    <Key size={20} />
                  </div>
                  <h2>Two-Factor Authentication (TOTP)</h2>
                </div>
                {user?.totpEnabled ? (
                  <Badge className="security-status-badge">
                    <ShieldCheck size={14} aria-hidden="true" /> Enabled
                  </Badge>
                ) : (
                  <Badge tone="warning" className="security-status-badge">
                    <ShieldAlert size={14} aria-hidden="true" /> Disabled
                  </Badge>
                )}
              </div>

              <p className="card-description">
                Add a layer of security to your FinStat account. When enabled, signing in requires your
                password and a 6-digit verification code from your authenticator app (e.g., Authy, Google Authenticator).
              </p>

              <div className="security-card-actions">
                {user?.totpEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      captureTriggerFocus();
                      setDisableError('');
                      setDisablePassword('');
                      setDisableCode('');
                      setDisableModalOpen(true);
                    }}
                    className="fs-btn fs-btn-secondary security-action-btn"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStart2FASetup}
                    className="fs-btn fs-btn-primary security-action-btn"
                  >
                    <ShieldCheck size={18} aria-hidden="true" /> Enable 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Role-Based Access Control Card */}
            <div className="security-card">
              <div className="security-card-header">
                <div className="card-title-group">
                  <div className="card-icon-badge" aria-hidden="true">
                    <UserCheck size={20} />
                  </div>
                  <h2>Role &amp; Permissions</h2>
                </div>
                <Badge className="security-role-badge">
                  {user?.role || 'viewer'}
                </Badge>
              </div>

              <p className="card-description">
                Your account is assigned the <strong>{user?.role || 'viewer'}</strong> role.
                {user?.role === 'admin' && ' You have full administrative privileges to manage all financial records, audit logs, and configurations.'}
                {user?.role === 'manager' && ' You have management permissions to create and edit portfolio items.'}
                {user?.role === 'viewer' && ' You have read-only access to view financial dashboards.'}
              </p>

              <div className="security-username-row">
                <Laptop size={16} className="security-inline-icon" aria-hidden="true" />
                <span>
                  Active Username: <strong className="security-username">{user?.username}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Login Audit Log Section */}
          <div className="audit-table-card">
            <div className="audit-header">
              <div>
                <h2 className="audit-title">Login Audit Trail</h2>
                <p className="audit-subtitle">
                  Historical record of authentication events and device signatures for your account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchLogs(auditPage)}
                disabled={auditLoading}
                className="fs-btn fs-btn-secondary fs-btn-sm audit-refresh-btn"
              >
                <RefreshCw size={14} aria-hidden="true" /> Refresh
              </button>
            </div>

            <div className="audit-table-body-wrap">
              {auditLoading ? (
                <div className="audit-loading-wrap">
                  <Loading variant="table" rows={3} text="Loading audit logs..." />
                </div>
              ) : auditLogs.length === 0 ? (
                <EmptyState
                  className="audit-empty-state"
                  data-testid="security-audit-empty"
                  icon={<ShieldAlert size={28} aria-hidden="true" />}
                  title="No audit logs recorded yet."
                />
              ) : isMobile ? (
                <div className="security-mobile-cards" data-testid="security-mobile-cards">
                  {auditLogs.map((log, index) => {
                    const rowKey = log._id || `log-${index}`;
                    const isExpanded = expandedLogIds.has(rowKey);
                    const formattedTime = formatTimestamp(log.timestamp);
                    const statusText = log.success ? 'Success' : 'Failed';

                    return (
                      <div key={rowKey} className="security-mobile-card">
                        <div className="security-mobile-summary">
                          <div className="security-mobile-primary">
                            {log.success ? (
                              <Badge className="security-status-badge">
                                <CheckCircle2 size={14} aria-hidden="true" /> Success
                              </Badge>
                            ) : (
                              <Badge tone="negative" className="security-status-badge">
                                <XCircle size={14} aria-hidden="true" /> Failed
                              </Badge>
                            )}
                            <time className="security-mobile-time fs-num" data-visual-mask="true">
                              {formattedTime}
                            </time>
                          </div>
                          <button
                            type="button"
                            className="fs-btn fs-btn-secondary fs-btn-sm security-expand-btn"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Hide details for ${statusText} attempt`
                                : `Show details for ${statusText} attempt`
                            }
                            onClick={() => toggleExpandLog(rowKey)}
                          >
                            {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="security-mobile-details">
                            <div className="security-mobile-kv">
                              <span className="security-mobile-k">IP Address</span>
                              <code className="audit-ip-code fs-mono">{log.ip}</code>
                            </div>
                            <div className="security-mobile-kv security-mobile-kv--stack">
                              <span className="security-mobile-k">Device / Client</span>
                              <span className="audit-agent-cell" title={log.userAgent}>
                                {log.userAgent || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="fs-table audit-table" data-testid="security-audit-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Time</th>
                      <th>IP Address</th>
                      <th>Device / Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={log._id || index}>
                        <td>
                          {log.success ? (
                            <Badge className="security-status-badge">
                              <CheckCircle2 size={14} aria-hidden="true" /> Success
                            </Badge>
                          ) : (
                            <Badge tone="negative" className="security-status-badge">
                              <XCircle size={14} aria-hidden="true" /> Failed
                            </Badge>
                          )}
                        </td>
                        <td>
                          <div className="audit-time-cell">
                            <Clock size={14} className="security-inline-icon" aria-hidden="true" />
                            <time className="fs-num" data-visual-mask="true">
                              {formatTimestamp(log.timestamp)}
                            </time>
                          </div>
                        </td>
                        <td>
                          <code className="audit-ip-code fs-mono">{log.ip}</code>
                        </td>
                        <td className="audit-agent-cell">
                          <span title={log.userAgent}>{log.userAgent || 'Unknown'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
              <div className="fs-num">
                Showing page {auditPage} of {auditTotalPages} ({auditTotalCount} total attempts)
              </div>
              <div className="pagination-actions">
                <button
                  type="button"
                  onClick={() => fetchLogs(auditPage - 1)}
                  disabled={auditPage <= 1 || auditLoading}
                  className="fs-btn fs-btn-secondary fs-btn-sm pagination-btn"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchLogs(auditPage + 1)}
                  disabled={auditPage >= auditTotalPages || auditLoading}
                  className="fs-btn fs-btn-secondary fs-btn-sm pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {setupModalOpen && (
        <div className="modal-overlay security-modal-overlay">
          <div
            ref={modalContentRef}
            className="modal-content security-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-setup-modal-title"
            onKeyDown={handleModalKeyDown}
          >
            <div className="modal-header security-modal-header">
              <h2 id="security-setup-modal-title">Enable Two-Factor Authentication</h2>
              <button
                type="button"
                onClick={() => setSetupModalOpen(false)}
                className="fs-btn fs-btn-secondary fs-btn-sm security-modal-close"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <p className="security-modal-intro">
              1. Open your authenticator app (such as Authy or Google Authenticator).<br />
              2. Add a new account manually and enter the secret key below:
            </p>

            <div className="secret-display-box">
              {setupLoading && !formattedSecret ? (
                <Loading variant="form-field" text="Generating secret..." />
              ) : (
                <>
                  <span className="secret-code-text fs-mono">{formattedSecret || '—'}</span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="fs-btn fs-btn-secondary fs-btn-sm copy-button"
                  >
                    {copiedSecret ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copiedSecret ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
            </div>

            <form onSubmit={handleVerifySetup}>
              <div className="security-modal-field">
                <label htmlFor="security-verify-code" className="security-modal-label">
                  3. Enter the 6-digit verification code from your app:
                </label>
                <input
                  id="security-verify-code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="security-totp-input fs-mono"
                  required
                />
              </div>

              {setupError && (
                <div role="alert" className="security-modal-error">
                  {setupError}
                </div>
              )}

              <div className="security-modal-footer">
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  className="fs-btn fs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="fs-btn fs-btn-primary"
                >
                  {setupLoading ? 'Verifying...' : 'Verify & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Codes Reveal Modal */}
      {backupCodesModalOpen && (
        <div className="modal-overlay security-modal-overlay">
          <div
            ref={modalContentRef}
            className="modal-content security-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-backup-modal-title"
            onKeyDown={handleModalKeyDown}
          >
            <div className="modal-header security-modal-header">
              <div className="security-modal-title-wrap">
                <CheckCircle2 size={22} className="security-inline-icon" aria-hidden="true" />
                <h2 id="security-backup-modal-title">2FA Successfully Activated!</h2>
              </div>
            </div>

            <div className="security-backup-warning">
              <AlertTriangle size={18} className="security-inline-icon" aria-hidden="true" />
              <div className="security-backup-warning-body">
                <Badge tone="warning">Save Now</Badge>
                <p>
                  <strong>Save these 10 backup codes in a safe place.</strong> Each code can only be used once if you lose access to your authenticator app. They will not be displayed again!
                </p>
              </div>
            </div>

            <div className="backup-codes-grid">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="backup-code-pill fs-mono">
                  {code}
                </div>
              ))}
            </div>

            <div className="security-modal-footer security-modal-footer--split">
              <div className="security-modal-footer-group">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="fs-btn fs-btn-secondary fs-btn-sm copy-button"
                >
                  {copiedBackupCodes ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copiedBackupCodes ? 'Copied All' : 'Copy All'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="fs-btn fs-btn-secondary fs-btn-sm copy-button"
                >
                  <Download size={14} aria-hidden="true" /> Download .txt
                </button>
              </div>

              <button
                type="button"
                onClick={() => setBackupCodesModalOpen(false)}
                className="fs-btn fs-btn-primary"
              >
                I have saved these codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {disableModalOpen && (
        <div className="modal-overlay security-modal-overlay">
          <div
            ref={modalContentRef}
            className="modal-content security-modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="security-disable-modal-title"
            onKeyDown={handleModalKeyDown}
          >
            <div className="modal-header security-modal-header">
              <h2 id="security-disable-modal-title">Disable Two-Factor Authentication</h2>
              <button
                type="button"
                onClick={() => setDisableModalOpen(false)}
                className="fs-btn fs-btn-secondary fs-btn-sm security-modal-close"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <p className="security-modal-intro">
              To disable 2FA, please enter your password or current 6-digit TOTP code to confirm your identity.
            </p>

            <form onSubmit={handleConfirmDisable}>
              <div className="security-modal-field">
                <label htmlFor="security-disable-password" className="security-modal-label">
                  Account Password:
                </label>
                <div className="security-password-wrap">
                  <input
                    id="security-disable-password"
                    type={showDisablePassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="security-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    className="security-password-toggle"
                    aria-label={showDisablePassword ? 'Hide password' : 'Show password'}
                  >
                    {showDisablePassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="security-or-divider">&mdash; OR &mdash;</div>

              <div className="security-modal-field">
                <label htmlFor="security-disable-code" className="security-modal-label">
                  Current 6-digit TOTP Code:
                </label>
                <input
                  id="security-disable-code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="security-totp-input fs-mono"
                />
              </div>

              {disableError && (
                <div role="alert" className="security-modal-error">
                  {disableError}
                </div>
              )}

              <div className="security-modal-footer">
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  className="fs-btn fs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading}
                  className="fs-btn fs-btn-danger"
                >
                  {disableLoading ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettingsPage;
