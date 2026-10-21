// frontend/src/pages/admin/BackupPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { getBackupStatus, exportBackup, importBackup } from '../../services/backupService';
import { dispatchToast } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import './BackupPage.css';

const BackupPage = () => {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Export State
  const [exportFormat, setExportFormat] = useState('json');
  const [exportLoading, setExportLoading] = useState(false);

  // Import State
  const [selectedFile, setSelectedFile] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [allowUsers, setAllowUsers] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Destructive Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const fileInputRef = useRef(null);

  // Load status on mount
  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const data = await getBackupStatus();
        if (mounted) setStatus(data);
      } catch (err) {
        if (mounted) {
          dispatchToast(err.message || 'Failed to fetch backup status', 'error');
        }
      } finally {
        if (mounted) setStatusLoading(false);
      }
    };

    if (isAdmin) {
      fetchStatus();
    } else {
      setStatusLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // Export Handler
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const { filename } = await exportBackup(exportFormat);
      dispatchToast(`Backup exported successfully: ${filename}`, 'success');
    } catch (err) {
      dispatchToast(err.message || 'Export failed', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        dispatchToast('Only .json (EJSON) backup files are supported for import', 'warning');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  // Execute Import / Dry Run
  const runImportAction = async (isDryRun) => {
    if (!selectedFile) {
      dispatchToast('Please select a backup file first', 'warning');
      return;
    }

    setImportLoading(true);
    try {
      const result = await importBackup(selectedFile, {
        dryRun: isDryRun,
        allowUsers,
      });
      setImportResult(result);
      if (isDryRun) {
        dispatchToast('Dry run completed. Review collection changes below.', 'info');
      } else {
        dispatchToast('Database restored successfully from backup!', 'success');
        setConfirmModalOpen(false);
        setConfirmInput('');
      }
    } catch (err) {
      dispatchToast(err.message || 'Import failed', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Open confirmation modal if destructive, else run dry run directly
  const handleRestoreClick = () => {
    if (dryRun) {
      runImportAction(true);
    } else {
      setConfirmInput('');
      setConfirmModalOpen(true);
    }
  };

  if (!isAdmin) {
    return (
      <div className="backup-page-container">
        <div className="backup-danger-alert">
          <ShieldAlert size={20} />
          <span>Access Denied: Only users with the <strong>admin</strong> role can manage database backups.</span>
        </div>
      </div>
    );
  }

  const importAvailable = status?.importAvailable ?? false;

  return (
    <div className="backup-page-container">
      {/* Page Header */}
      <div className="backup-header">
        <div className="backup-title-group">
          <div className="backup-icon-wrapper">
            <Database size={26} />
          </div>
          <div>
            <h1 className="backup-page-title">Database Backup & Recovery</h1>
            <p className="backup-subtitle">
              Export complete database models in-memory or restore MongoDB collections in local development.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Status Banner */}
      {!statusLoading && (
        <div className={`backup-status-banner ${importAvailable ? 'dev' : 'prod'}`}>
          {importAvailable ? (
            <>
              <CheckCircle2 size={18} />
              <span>
                <strong>Development Mode Active:</strong> Full in-memory backup export and collection restoration are enabled.
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} />
              <span>
                <strong>Production / Cloud Environment:</strong> Streaming backup export is enabled.
                Database restore is disabled (501) to protect production data from accidental loss or overwrite.
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Grid: Export and Import Cards */}
      <div className="backup-grid">
        {/* CARD 1: EXPORT */}
        <div className="backup-card">
          <div className="backup-card-header">
            <Download size={20} className="text-indigo-400" />
            <h2>Export Database Backup</h2>
          </div>
          <p className="backup-card-desc">
            Download all whitelisted financial models and application collections directly from MongoDB.
            Sensitive tokens and login audit logs are automatically excluded.
          </p>

          <div className="backup-format-selector">
            <label
              className={`backup-format-option ${exportFormat === 'json' ? 'selected' : ''}`}
              onClick={() => setExportFormat('json')}
            >
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              <div className="backup-format-info">
                <span className="backup-format-title">
                  Extended JSON (EJSON)
                  <span className="badge-pill badge-recommended">Recommended</span>
                </span>
                <span className="backup-format-sub">
                  Preserves exact MongoDB BSON types (ObjectIds, Dates, nested structures). Required for restoring data.
                </span>
              </div>
            </label>

            <label
              className={`backup-format-option ${exportFormat === 'xlsx' ? 'selected' : ''}`}
              onClick={() => setExportFormat('xlsx')}
            >
              <input
                type="radio"
                name="exportFormat"
                value="xlsx"
                checked={exportFormat === 'xlsx'}
                onChange={() => setExportFormat('xlsx')}
              />
              <div className="backup-format-info">
                <span className="backup-format-title">Excel Workbook (.xlsx)</span>
                <span className="backup-format-sub">
                  Multi-sheet spreadsheet format. Best for external financial analysis, spreadsheets, and manual review.
                </span>
              </div>
            </label>
          </div>

          <div className="backup-actions-row">
            <button
              type="button"
              className="backup-btn backup-btn-primary"
              onClick={handleExport}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Streaming Backup...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Backup ({exportFormat.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 2: IMPORT (DEV ONLY) */}
        <div className="backup-card">
          <div className="backup-card-header">
            <Upload size={20} className="text-emerald-400" />
            <h2>Restore Database (Dev Only)</h2>
          </div>
          <p className="backup-card-desc">
            Restore collections from an Extended JSON (.json) backup file.
            Collections are atomic replaced via transactions or staging swap with index preservation.
          </p>

          {/* Upload Drop Box */}
          <div
            className={`backup-upload-box ${selectedFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={!importAvailable}
            />
            <div className="backup-upload-icon">
              <FileText size={32} />
            </div>
            <div className="backup-upload-text">
              {selectedFile ? (
                <>
                  <div>Selected backup file:</div>
                  <div className="backup-upload-file-name">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                </>
              ) : (
                <div>Click to select an Extended JSON (.json) backup file</div>
              )}
            </div>
          </div>

          {/* Import Flags */}
          <div className="backup-options-list">
            <label className="backup-checkbox-label">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={!importAvailable}
              />
              <span>
                <strong>Dry Run Mode (Recommended):</strong> Validate the file, verify schema constraints, and compute collection deltas without modifying the database.
              </span>
            </label>

            <label className="backup-checkbox-label">
              <input
                type="checkbox"
                checked={allowUsers}
                onChange={(e) => setAllowUsers(e.target.checked)}
                disabled={!importAvailable}
              />
              <span>
                <strong>Restore Users Collection:</strong>
                <span className="text-amber-400"> (⚠️ Danger: Replaces all local user credentials and 2FA secrets with backup snapshot).</span>
              </span>
            </label>
          </div>

          {!dryRun && importAvailable && (
            <div className="backup-danger-alert">
              <AlertTriangle size={18} />
              <span>
                <strong>Warning:</strong> Restoring without Dry Run will REPLACE existing collection data.
              </span>
            </div>
          )}

          <div className="backup-actions-row">
            <button
              type="button"
              className={`backup-btn ${dryRun ? 'backup-btn-primary' : 'backup-btn-danger'}`}
              onClick={handleRestoreClick}
              disabled={!importAvailable || !selectedFile || importLoading}
            >
              {importLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing Backup...</span>
                </>
              ) : dryRun ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Run Dry Run Validation</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Execute Full Restore</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DELTA RESULTS TABLE */}
      {importResult && (
        <div className="backup-results-card">
          <div className="backup-results-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                {importResult.dryRun ? '🔍 Dry Run Validation Report' : '✅ Restore Summary'}
              </h3>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Execution Time: {importResult.durationMs}ms | Mode: {importResult.dryRun ? 'Dry Run (No writes)' : 'Committed'}
              </p>
            </div>
          </div>

          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Current Documents (To Delete)</th>
                  <th>New Documents (To Insert)</th>
                  <th>Net Difference</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(importResult.collections || {}).map(([collName, stats]) => {
                  const net = (stats.willInsert || 0) - (stats.willDelete || 0);
                  return (
                    <tr key={collName}>
                      <td style={{ fontWeight: 600 }}>{collName}</td>
                      <td className="count-badge-delete">-{stats.willDelete ?? 0}</td>
                      <td className="count-badge-insert">+{stats.willInsert ?? 0}</td>
                      <td style={{ color: net > 0 ? '#4ade80' : net < 0 ? '#f87171' : '#94a3b8' }}>
                        {net > 0 ? `+${net}` : net}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE RESTORE */}
      {confirmModalOpen && (
        <div className="restore-modal-overlay">
          <div className="restore-modal-content">
            <h3 className="restore-modal-title">
              <AlertTriangle size={24} />
              Confirm Database Restore
            </h3>
            <p className="restore-modal-body">
              This action will overwrite data in your local MongoDB database with the contents of{' '}
              <strong>{selectedFile?.name}</strong>. Existing records in affected collections will be replaced.
              {allowUsers && (
                <span style={{ display: 'block', marginTop: '8px', color: '#fca5a5' }}>
                  ⚠️ User accounts and credentials will also be overwritten.
                </span>
              )}
            </p>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Type <strong>RESTORE</strong> below to proceed:
            </p>
            <input
              type="text"
              className="restore-modal-input"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="RESTORE"
              autoFocus
            />
            <div className="restore-modal-footer">
              <button
                type="button"
                className="backup-btn backup-btn-secondary"
                onClick={() => setConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="backup-btn backup-btn-danger"
                disabled={confirmInput !== 'RESTORE' || importLoading}
                onClick={() => runImportAction(false)}
              >
                {importLoading ? 'Restoring...' : 'Confirm & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;
