// frontend/src/services/adminService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const ADMIN_URL = `${BASE_API_URL}/admin`;

/**
 * Fetches paginated, searchable list of registered users.
 */
export const getUsers = async (page = 1, limit = 10, search = '', options = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  return apiClient.get(`${ADMIN_URL}/users?${params.toString()}`, options);
};

/**
 * Creates a new user with role assignment directly from the admin dashboard.
 */
export const createUser = async (userData, options = {}) => {
  return apiClient.post(`${ADMIN_URL}/users`, userData, options);
};

/**
 * Deletes a user account by ID.
 */
export const deleteUser = async (userId, options = {}) => {
  return apiClient.delete(`${ADMIN_URL}/users/${userId}`, options);
};

// ==========================================
// ADMIN TAX BRACKET CONFIGURATIONS
// ==========================================

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

export const getTaxBracketConfigs = async (options = {}) => {
  const response = await apiClient.get(`${ADMIN_URL}/tax-brackets`, options);
  return unwrap(response);
};

export const createTaxBracketConfig = async (data, options = {}) => {
  const response = await apiClient.post(`${ADMIN_URL}/tax-brackets`, data, options);
  return unwrap(response);
};

export const updateTaxBracketConfig = async (id, data, options = {}) => {
  const response = await apiClient.put(`${ADMIN_URL}/tax-brackets/${id}`, data, options);
  return unwrap(response);
};

export const deleteTaxBracketConfig = async (id, options = {}) => {
  const response = await apiClient.delete(`${ADMIN_URL}/tax-brackets/${id}`, options);
  return unwrap(response);
};

// ==========================================
// ADMIN SOCIAL INSURANCE CONFIGURATIONS
// ==========================================

export const getSocialInsuranceConfigs = async (options = {}) => {
  const response = await apiClient.get(`${ADMIN_URL}/social-insurance`, options);
  return unwrap(response);
};

export const createSocialInsuranceConfig = async (data, options = {}) => {
  const response = await apiClient.post(`${ADMIN_URL}/social-insurance`, data, options);
  return unwrap(response);
};

export const updateSocialInsuranceConfig = async (id, data, options = {}) => {
  const response = await apiClient.put(`${ADMIN_URL}/social-insurance/${id}`, data, options);
  return unwrap(response);
};

export const deleteSocialInsuranceConfig = async (id, options = {}) => {
  const response = await apiClient.delete(`${ADMIN_URL}/social-insurance/${id}`, options);
  return unwrap(response);
};

export const getInsuranceConfigs = getSocialInsuranceConfigs;
export const createInsuranceConfig = createSocialInsuranceConfig;
export const updateInsuranceConfig = updateSocialInsuranceConfig;
export const deleteInsuranceConfig = deleteSocialInsuranceConfig;

const adminService = {
  getUsers,
  createUser,
  deleteUser,
  getTaxBracketConfigs,
  createTaxBracketConfig,
  updateTaxBracketConfig,
  deleteTaxBracketConfig,
  getSocialInsuranceConfigs,
  createSocialInsuranceConfig,
  updateSocialInsuranceConfig,
  deleteSocialInsuranceConfig,
  getInsuranceConfigs,
  createInsuranceConfig,
  updateInsuranceConfig,
  deleteInsuranceConfig,
};

export default adminService;
