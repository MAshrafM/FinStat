// frontend/src/services/adminService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const ADMIN_URL = `${BASE_API_URL}/admin`;

/**
 * Fetches paginated, searchable list of registered users.
 *
 * @param {number} page
 * @param {number} limit
 * @param {string} search
 * @returns {Promise<{ success: boolean, users: Array, totalUsers: number, totalPages: number, currentPage: number }>}
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
 *
 * @param {Object} userData
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {'admin'|'manager'|'viewer'} userData.role
 * @returns {Promise<{ success: boolean, message: string, user: Object }>}
 */
export const createUser = async (userData, options = {}) => {
  return apiClient.post(`${ADMIN_URL}/users`, userData, options);
};

/**
 * Deletes a user account by ID.
 *
 * @param {string} userId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteUser = async (userId, options = {}) => {
  return apiClient.delete(`${ADMIN_URL}/users/${userId}`, options);
};

const adminService = {
  getUsers,
  createUser,
  deleteUser,
};

export default adminService;
