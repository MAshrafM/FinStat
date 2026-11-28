// frontend/src/pages/admin/BackupPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getBackupStatus, exportBackup, importBackup } from '../../services/backupService';
import { dispatchToast } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { Badge, Delta, Loading, PageHeader } from '../../components/ui';
import { useModalFocus } from './useModalFocus';
import './BackupPage.css';

const BackupPage = () => {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Guarded D19 mobile viewport state
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 768px)').matches
      : false
  );
  const [expandedColls, setExpandedColls] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

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
  const confirmModalRef = useRef(null);
  const confirmInputRef = useRef(null);

  const fileInputRef = useRef(null);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
  }, []);

  useModalFocus(confirmModalOpen, closeConfirmModal, confirmModalRef, confirmInputRef);

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

  const toggleExpandColl = (name) => {
    setExpandedColls((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (!isAdmin) {
    return (
      <div className="fs-page backup-page-container">
        <div className="fs-card backup-danger-alert" role="alert">
          <ShieldAlert size={20} aria-hidden="true" />
          <span>
            Access Denied: Only users with the <strong>admin</strong> role can manage database backups.
          </span>
        </div>
      </div>
    );
  }

  const importAvailable = status?.importAvailable ?? false;

  return (
    <div className="fs-page backup-page-container">
      <PageHeader
        title="Database Backup & Recovery"
        subtitle="Export complete database models in-memory or restore MongoDB collections in local development."
        actions={
          !statusLoading ? (
            <Badge tone={importAvailable ? 'neutral' : 'warning'}>
              {importAvailable ? 'Dev Mode — Restore Enabled' : 'Prod — Restore Disabled'}
            </Badge>
          ) : null
        }
      />

      {statusLoading ? (
        <div className="backup-loading-wrap">
          <Loading variant="card" text="Checking backup system status..." />
        </div>
      ) : (
        <div className="fs-card backup-status-banner">
          {importAvailable ? (
            <>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>
                <strong>Development Mode Active:</strong> Full in-memory backup export and collection restoration are enabled.
              </span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} aria-hidden="true" />
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
        <div className="fs-card backup-card">
          <div className="backup-card-header">
            <Download size={20} aria-hidden="true" />
            <h2>Export Database Backup</h2>
          </div>
          <p className="backup-card-desc">
            Download all whitelisted financial models and application collections directly from MongoDB.
            Sensitive tokens and login audit logs are automatically excluded.
          </p>

          <div className="backup-format-selector">
            <div className={`backup-format-option ${exportFormat === 'json' ? 'selected' : ''}`}>
              <input
                id="export-format-json"
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              <label htmlFor="export-format-json" className="backup-format-info">
                <span className="backup-format-title">
                  <span>Extended JSON (EJSON)</span>
                  <Badge>Recommended</Badge>
                </span>
                <span className="backup-format-sub">
                  Preserves exact MongoDB BSON types (ObjectIds, Dates, nested structures). Required for restoring data.
                </span>
              </label>
            </div>

            <div className={`backup-format-option ${exportFormat === 'xlsx' ? 'selected' : ''}`}>
              <input
                id="export-format-xlsx"
                type="radio"
                name="exportFormat"
                value="xlsx"
                checked={exportFormat === 'xlsx'}
                onChange={() => setExportFormat('xlsx')}
              />
              <label htmlFor="export-format-xlsx" className="backup-format-info">
                <span className="backup-format-title">Excel Workbook (.xlsx)</span>
                <span className="backup-format-sub">
                  Multi-sheet spreadsheet format. Best for external financial analysis, spreadsheets, and manual review.
                </span>
              </label>
            </div>
          </div>

          <div className="backup-actions-row">
            <button
              type="button"
              className="fs-btn fs-btn-primary"
              onClick={handleExport}
              disabled={exportLoading}
            >
              <Download size={16} aria-hidden="true" />
              <span>
                {exportLoading
                  ? 'Streaming Backup...'
                  : `Download Backup (${exportFormat.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: IMPORT (DEV ONLY) */}
        <div className="fs-card backup-card">
          <div className="backup-card-header">
            <Upload size={20} aria-hidden="true" />
            <h2>Restore Database (Dev Only)</h2>
          </div>
          <p className="backup-card-desc">
            Restore collections from an Extended JSON (.json) backup file.
            Collections are atomically replaced via transactions or staging swap with index preservation.
          </p>

          <input
            id="backup-file-input"
            type="file"
            ref={fileInputRef}
            accept=".json"
            aria-label="Select Extended JSON backup file"
            className="fs-visually-hidden"
            onChange={handleFileChange}
            disabled={!importAvailable}
          />
          <button
            type="button"
            className={`backup-upload-box ${selectedFile ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={!importAvailable}
          >
            <div className="backup-upload-icon" aria-hidden="true">
              <FileText size={28} />
            </div>
            <div className="backup-upload-text">
              {selectedFile ? (
                <>
                  <span>Selected backup file:</span>
                  <span className="backup-upload-file-name fs-mono">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </>
              ) : (
                <span>Click to select an Extended JSON (.json) backup file</span>
              )}
            </div>
          </button>

          <div className="backup-options-list">
            <label className="backup-checkbox-label" htmlFor="backup-dry-run">
              <input
                id="backup-dry-run"
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={!importAvailable}
              />
              <span>
                <strong>Dry Run Mode (Recommended):</strong> Validate the file, verify schema constraints, and compute collection deltas without modifying the database.
              </span>
            </label>

            <label className="backup-checkbox-label" htmlFor="backup-allow-users">
              <input
                id="backup-allow-users"
                type="checkbox"
                checked={allowUsers}
                onChange={(e) => setAllowUsers(e.target.checked)}
                disabled={!importAvailable}
              />
              <span>
                <strong>Restore Users Collection:</strong> Replaces all local user credentials and 2FA secrets with backup snapshot.
              </span>
            </label>
          </div>

          {!dryRun && importAvailable && (
            <div className="backup-danger-alert" role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>
                <strong>Warning:</strong> Restoring without Dry Run will replace existing collection data.
              </span>
            </div>
          )}

          <div className="backup-actions-row">
            <button
              type="button"
              className={`fs-btn ${dryRun ? 'fs-btn-primary' : 'fs-btn-secondary'}`}
              onClick={handleRestoreClick}
              disabled={!importAvailable || !selectedFile || importLoading}
            >
              {dryRun ? <CheckCircle2 size={16} aria-hidden="true" /> : <Upload size={16} aria-hidden="true" />}
              <span>
                {importLoading
                  ? 'Processing Backup...'
                  : dryRun
                    ? 'Run Dry Run Validation'
                    : 'Execute Full Restore'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* DELTA RESULTS TABLE / D19 MOBILE CARDS */}
      {importResult && (
        <div className="fs-card backup-results-card">
          <div className="backup-results-header">
            <h3 className="backup-results-title">
              {importResult.dryRun ? 'Dry Run Validation Report' : 'Restore Summary'}
            </h3>
            <p className="backup-results-meta fs-num">
              Execution Time: {importResult.durationMs}ms | Mode: {importResult.dryRun ? 'Dry Run (No writes)' : 'Committed'}
            </p>
          </div>

          {!isMobile ? (
            <div className="backup-table-wrapper" data-testid="backup-delta-table">
              <table className="fs-table backup-table">
                <thead>
                  <tr>
                    <th scope="col">Collection</th>
                    <th scope="col" className="fs-num">Current Documents (To Delete)</th>
                    <th scope="col" className="fs-num">New Documents (To Insert)</th>
                    <th scope="col" className="fs-num">Net Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(importResult.collections || {}).map(([collName, stats]) => {
                    const net = (stats.willInsert || 0) - (stats.willDelete || 0);
                    return (
                      <tr key={collName}>
                        <td className="backup-coll-name fs-mono">{collName}</td>
                        <td className="fs-num">-{stats.willDelete ?? 0}</td>
                        <td className="fs-num">+{stats.willInsert ?? 0}</td>
                        <td className="fs-num">
                          <Delta
                            value={net}
                            tone={net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'}
                            label="net"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="backup-mobile-cards" data-testid="backup-delta-mobile-cards">
              {Object.entries(importResult.collections || {}).map(([collName, stats]) => {
                const net = (stats.willInsert || 0) - (stats.willDelete || 0);
                const isExpanded = Boolean(expandedColls[collName]);
                return (
                  <div key={collName} className="backup-mobile-card">
                    <div className="backup-mobile-card-top">
                      <span className="backup-coll-name fs-mono">{collName}</span>
                      <div className="backup-mobile-card-right">
                        <Delta
                          value={net}
                          tone={net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'}
                          label="net"
                        />
                        <button
                          type="button"
                          className="fs-btn fs-btn-ghost backup-expand-btn"
                          onClick={() => toggleExpandColl(collName)}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? `Collapse ${collName}` : `Expand ${collName}`}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="backup-mobile-card-details">
                        <div className="backup-mobile-detail-row">
                          <span className="backup-mobile-detail-label">To Delete</span>
                          <span className="fs-num">-{stats.willDelete ?? 0}</span>
                        </div>
                        <div className="backup-mobile-detail-row">
                          <span className="backup-mobile-detail-label">To Insert</span>
                          <span className="fs-num">+{stats.willInsert ?? 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE RESTORE */}
      {confirmModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-modal-title"
        >
          <div className="modal-content fs-surface-solid restore-modal-card" ref={confirmModalRef}>
            <h3 id="restore-modal-title" className="restore-modal-title">
              <AlertTriangle size={20} aria-hidden="true" />
              <span>Confirm Database Restore</span>
            </h3>
            <p className="restore-modal-body">
              This action will overwrite data in your local MongoDB database with the contents of{' '}
              <strong className="fs-mono">{selectedFile?.name}</strong>. Existing records in affected collections will be replaced.
              {allowUsers && (
                <span className="restore-modal-users-warning">
                  User accounts and credentials will also be overwritten.
                </span>
              )}
            </p>
            <label htmlFor="restore-confirm-input" className="restore-modal-prompt">
              Type <strong className="fs-mono">RESTORE</strong> below to proceed:
            </label>
            <input
              id="restore-confirm-input"
              ref={confirmInputRef}
              type="text"
              className="restore-modal-input fs-mono"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="RESTORE"
            />
            <div className="restore-modal-footer">
              <button
                type="button"
                className="fs-btn fs-btn-secondary"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fs-btn fs-btn-danger"
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
