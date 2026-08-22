// frontend/src/services/authService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const AUTH_URL = `${BASE_API_URL}/auth`;

/**
 * Step 1 Login: Authenticate with username and password.
 * Returns either { token, user } or { require2FA: true, tempToken }.
 */
export const loginUser = async (username, password, options = {}) => {
  return apiClient.post(`${AUTH_URL}/login`, { username, password }, options);
};

/**
 * Step 2 Login: Verify TOTP 6-digit code or 8-character backup code.
 */
export const login2FA = async ({ tempToken, code, backupCode }, options = {}) => {
  return apiClient.post(`${AUTH_URL}/login/2fa`, { tempToken, code, backupCode }, options);
};

/**
 * Initiates 2FA setup by requesting a secret string.
 */
export const setup2FA = async (options = {}) => {
  return apiClient.post(`${AUTH_URL}/2fa/setup`, {}, options);
};

/**
 * Verifies code from authenticator app, enables 2FA, and receives backup codes.
 */
export const verify2FASetup = async (secret, code, options = {}) => {
  return apiClient.post(`${AUTH_URL}/2fa/verify-setup`, { secret, code }, options);
};

/**
 * Disables 2FA using password or current TOTP code.
 */
export const disable2FA = async ({ password, code }, options = {}) => {
  return apiClient.post(`${AUTH_URL}/2fa/disable`, { password, code }, options);
};

/**
 * Fetches current authenticated user details.
 */
export const getCurrentUser = async (options = {}) => {
  return apiClient.get(`${AUTH_URL}/me`, options);
};

/**
 * Fetches paginated login audit logs for the current user.
 */
export const getAuditLogs = async (page = 1, limit = 10, options = {}) => {
  return apiClient.get(`${AUTH_URL}/audit-logs?page=${page}&limit=${limit}`, options);
};

/**
 * Logs out user: revokes refresh token on backend and clears client token.
 */
export const logoutUser = async (options = {}) => {
  try {
    await apiClient.post(`${AUTH_URL}/logout`, {}, { ...options, suppressToast: true });
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
