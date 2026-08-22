// frontend/src/pages/security/SecuritySettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  getCurrentUser,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getAuditLogs,
} from '../../services/authService';
import { dispatchToast } from '../../services/apiClient';
import './SecuritySettingsPage.css';

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

  // Fetch initial profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
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
    setSetupError('');
    setVerifyCode('');
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
    if (setupSecret) {
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
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
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
    return <div className="loading-spinner" style={{ margin: '40px auto' }}>Loading...</div>;
  }

  return (
    <div className="security-page-container">
      {/* Header */}
      <div className="security-header">
        <div className="security-title-row">
          <Shield size={32} color="#c084fc" />
          <h1 className="security-page-title">Security &amp; Access Control</h1>
        </div>
        <p className="security-subtitle">
          Manage your account protection, two-factor authentication, and monitor security audit logs.
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="security-grid">
        {/* 2FA Card */}
        <div className="security-card">
          <div className="security-card-header">
            <div className="card-title-group">
              <div className="card-icon-badge">
                <Key size={22} />
              </div>
              <div>
                <h3>Two-Factor Authentication (TOTP)</h3>
              </div>
            </div>
            {user?.totpEnabled ? (
              <span className="badge badge-success">
                <ShieldCheck size={14} /> Enabled
              </span>
            ) : (
              <span className="badge badge-warning">
                <ShieldAlert size={14} /> Disabled
              </span>
            )}
          </div>

          <p className="card-description">
            Add a layer of security to your FinStat account. When enabled, signing in requires your
            password and a 6-digit verification code from your authenticator app (e.g., Authy, Google Authenticator).
          </p>

          {user?.totpEnabled ? (
            <button
              onClick={() => {
                setDisableError('');
                setDisablePassword('');
                setDisableCode('');
                setDisableModalOpen(true);
              }}
              className="action-btn-danger"
            >
              Disable 2FA
            </button>
          ) : (
            <button onClick={handleStart2FASetup} className="action-btn-primary">
              <ShieldCheck size={18} /> Enable 2FA
            </button>
          )}
        </div>

        {/* Role-Based Access Control Card */}
        <div className="security-card">
          <div className="security-card-header">
            <div className="card-title-group">
              <div className="card-icon-badge">
                <UserCheck size={22} />
              </div>
              <div>
                <h3>Role &amp; Permissions</h3>
              </div>
            </div>
            <span className="badge badge-admin">
              {user?.role || 'viewer'}
            </span>
          </div>

          <p className="card-description">
            Your account is assigned the <strong>{user?.role || 'viewer'}</strong> role.
            {user?.role === 'admin' && ' You have full administrative privileges to manage all financial records, audit logs, and configurations.'}
            {user?.role === 'manager' && ' You have management permissions to create and edit portfolio items.'}
            {user?.role === 'viewer' && ' You have read-only access to view financial dashboards.'}
          </p>

          <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={16} color="#c084fc" />
            <span>Active Username: <strong>{user?.username}</strong></span>
          </div>
        </div>
      </div>

      {/* Login Audit Log Section */}
      <div className="audit-table-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Login Audit Trail</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Historical record of authentication events and device signatures for your account.
            </p>
          </div>
          <button
            onClick={() => fetchLogs(auditPage)}
            disabled={auditLoading}
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={auditLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Time</th>
                <th>IP Address</th>
                <th>Device / Client</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? (
                auditLogs.map((log, index) => (
                  <tr key={log._id || index}>
                    <td>
                      {log.success ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontWeight: '600' }}>
                          <CheckCircle2 size={16} /> Success
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f87171', fontWeight: '600' }}>
                          <XCircle size={16} /> Failed
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#94a3b8" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td>
                      <code style={{ background: '#0f172a', padding: '2px 8px', borderRadius: '4px', color: '#38bdf8' }}>
                        {log.ip}
                      </code>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span title={log.userAgent}>{log.userAgent || 'Unknown'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-bar">
          <div>
            Showing page {auditPage} of {auditTotalPages} ({auditTotalCount} total attempts)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fetchLogs(auditPage - 1)}
              disabled={auditPage <= 1 || auditLoading}
              className="pagination-btn"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(auditPage + 1)}
              disabled={auditPage >= auditTotalPages || auditLoading}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {setupModalOpen && (
        <div className="security-modal-overlay">
          <div className="security-modal-content">
            <div className="modal-header">
              <h3>Enable Two-Factor Authentication</h3>
              <button onClick={() => setSetupModalOpen(false)} className="close-btn">&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
              1. Open your authenticator app (such as Authy or Google Authenticator).<br />
              2. Add a new account manually and enter the secret key below:
            </p>

            <div className="secret-display-box">
              <span className="secret-code-text">{formattedSecret || 'LOADING...'}</span>
              <button onClick={handleCopySecret} className="copy-button">
                {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                {copiedSecret ? 'Copied' : 'Copy'}
              </button>
            </div>

            <form onSubmit={handleVerifySetup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  3. Enter the 6-digit verification code from your app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: 'white',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    letterSpacing: '4px',
                    fontWeight: '600',
                  }}
                  autoFocus
                  required
                />
              </div>

              {setupError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {setupError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSetupModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setupLoading}
                  className="action-btn-primary"
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
        <div className="security-modal-overlay">
          <div className="security-modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={24} color="#4ade80" />
                <h3 style={{ margin: 0 }}>2FA Successfully Activated!</h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '12px', borderRadius: '10px', margin: '14px 0' }}>
              <AlertTriangle size={20} color="#facc15" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fef08a', lineHeight: '1.4' }}>
                <strong>Save these 10 backup codes in a safe place.</strong> Each code can only be used once if you lose access to your authenticator app. They will not be displayed again!
              </p>
            </div>

            <div className="backup-codes-grid">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="backup-code-pill">
                  {code}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCopyBackupCodes} className="copy-button">
                  {copiedBackupCodes ? <Check size={14} /> : <Copy size={14} />}
                  {copiedBackupCodes ? 'Copied All' : 'Copy All'}
                </button>
                <button onClick={handleDownloadBackupCodes} className="copy-button">
                  <Download size={14} /> Download .txt
                </button>
              </div>

              <button
                onClick={() => setBackupCodesModalOpen(false)}
                className="action-btn-primary"
              >
                I have saved these codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {disableModalOpen && (
        <div className="security-modal-overlay">
          <div className="security-modal-content">
            <div className="modal-header">
              <h3 style={{ color: '#f87171' }}>Disable Two-Factor Authentication</h3>
              <button onClick={() => setDisableModalOpen(false)} className="close-btn">&times;</button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
              To disable 2FA, please enter your password or current 6-digit TOTP code to confirm your identity.
            </p>

            <form onSubmit={handleConfirmDisable}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Account Password:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showDisablePassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      color: 'white',
                      fontSize: '0.95rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {showDisablePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '8px 0', color: '#64748b', fontSize: '0.8rem' }}>
                &mdash; OR &mdash;
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '6px' }}>
                  Current 6-digit TOTP Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: 'white',
                    fontSize: '1rem',
                    textAlign: 'center',
                    letterSpacing: '3px',
                  }}
                />
              </div>

              {disableError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {disableError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDisableModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    color: '#cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading}
                  className="action-btn-danger"
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
