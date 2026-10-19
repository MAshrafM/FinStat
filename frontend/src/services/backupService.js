// frontend/src/services/backupService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const BACKUP_URL = `${BASE_API_URL}/admin/backup`;

/**
 * Reads a cookie value by name.
 */
function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : '';
}

/**
 * Fetch backup system status and environment capabilities.
 */
export const getBackupStatus = async (options = {}) => {
  return apiClient.get(`${BACKUP_URL}/status`, options);
};

/**
 * Download database backup in requested format (json | xlsx).
 * Streams directly from backend to browser download.
 */
export const exportBackup = async (format = 'json') => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${BACKUP_URL}/export?format=${encodeURIComponent(format)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { 'x-auth-token': token } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    let errMsg = `Export failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {
      // ignore parse error
    }
    throw new Error(errMsg);
  }

  // Extract filename from Content-Disposition if present
  let filename = `finstat-backup-${new Date().toISOString().slice(0, 10)}.${format === 'xlsx' ? 'xlsx' : 'json'}`;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);

  return { success: true, filename };
};

/**
 * Upload and restore database backup from EJSON file.
 * Dev-only endpoint; supports dryRun and allowUsers flags.
 */
export const importBackup = async (file, { dryRun = false, allowUsers = false } = {}) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const csrfToken = getCookie('csrfToken') || getCookie('x-csrf-token');

  const queryParams = new URLSearchParams();
  if (dryRun) queryParams.set('dryRun', 'true');
  if (allowUsers) queryParams.set('allowUsers', 'true');

  const url = `${BACKUP_URL}/import${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const formData = new FormData();
  formData.append('backup', file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { 'x-auth-token': token } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      // DO NOT set 'Content-Type': browser sets multipart/form-data boundary automatically
    },
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Import failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
