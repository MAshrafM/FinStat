// frontend/src/services/salaryProfileService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/salary-profiles`;

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

/**
 * Get all salary profiles for current user
 */
export const getSalaryProfiles = async (options = {}) => {
  const response = await apiClient.get(API_URL, options);
  return unwrap(response);
};

/**
 * Get the current/default salary profile
 */
export const getProfile = async (options = {}) => {
  const data = await getSalaryProfiles(options);
  if (data && data.profiles && data.profiles.length > 0) {
    return data.profiles.find(p => p.isDefault) || data.profiles[0];
  }
  if (data && data.mainProfile) {
    return data.mainProfile;
  }
  return data || null;
};

/**
 * Get single salary profile by ID
 */
export const getSalaryProfileById = async (id, options = {}) => {
  const response = await apiClient.get(`${API_URL}/${id}`, options);
  return unwrap(response);
};

/**
 * Create a new salary profile
 */
export const createSalaryProfile = async (profileData, options = {}) => {
  const response = await apiClient.post(API_URL, profileData, options);
  return unwrap(response);
};

/**
 * Update an existing salary profile
 */
export const updateSalaryProfile = async (id, profileData, options = {}) => {
  const response = await apiClient.put(`${API_URL}/${id}`, profileData, options);
  return unwrap(response);
};

/**
 * Delete a salary profile
 */
export const deleteSalaryProfile = async (id, options = {}) => {
  const response = await apiClient.delete(`${API_URL}/${id}`, options);
  return unwrap(response);
};

/**
 * Set a salary profile as the user's default
 */
export const setDefaultSalaryProfile = async (id, options = {}) => {
  const response = await apiClient.post(`${API_URL}/${id}/set-default`, {}, options);
  return unwrap(response);
};
