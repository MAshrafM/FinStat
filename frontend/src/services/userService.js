// frontend/src/services/userService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/users`;

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

/**
 * Fetch current user's full personal & professional profile
 */
export const getUserProfile = async () => {
  const response = await apiClient.get(`${API_URL}/profile`);
  return unwrap(response);
};

/**
 * Update current user's profile
 */
export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put(`${API_URL}/profile`, profileData);
  return unwrap(response);
};

/**
 * Admin: Get another user's profile
 */
export const getAdminUserProfile = async (userId) => {
  const response = await apiClient.get(`${API_URL}/${userId}/profile`);
  return unwrap(response);
};

/**
 * Admin: Update another user's profile
 */
export const updateAdminUserProfile = async (userId, profileData) => {
  const response = await apiClient.put(`${API_URL}/${userId}/profile`, profileData);
  return unwrap(response);
};

/**
 * Multi-tenant Delegated Account Switcher (FEAT-009)
 */

/**
 * Fetch switchable accounts (primary self, managed dependents, and active delegations)
 */
export const getSwitchableAccounts = async () => {
  const response = await apiClient.get(`${API_URL}/switchable-accounts`);
  return unwrap(response);
};

/**
 * Switch session context to target user account
 */
export const switchAccountApi = async (targetUserId) => {
  const response = await apiClient.post(`${API_URL}/switch-account`, { targetUserId });
  return unwrap(response);
};

/**
 * Fetch consolidated family office net worth rollup across all accessible accounts
 */
export const getFamilyRollup = async () => {
  const response = await apiClient.get(`${API_URL}/family-rollup`);
  return unwrap(response);
};

/**
 * Grant a new account delegation to an authorized delegate
 */
export const createDelegation = async (delegationData) => {
  const response = await apiClient.post(`${API_URL}/delegations`, delegationData);
  return unwrap(response);
};

/**
 * Revoke an existing account delegation
 */
export const revokeDelegation = async (delegationId) => {
  const response = await apiClient.put(`${API_URL}/delegations/${delegationId}/revoke`);
  return unwrap(response);
};

