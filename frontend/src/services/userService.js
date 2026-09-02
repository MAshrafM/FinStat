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
