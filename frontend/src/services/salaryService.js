// frontend/src/services/salaryService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/salary-profile`;

// Gets the one and only profile
export const getProfile = async (options = {}) => {
  const res = await apiClient.get(API_URL, options);
  const data = res && res.data !== undefined ? res.data : res;
  if (!data) return null;
  if (data.mainProfile) {
    return { ...data.mainProfile, ...data };
  }
  if (Array.isArray(data.profiles) && data.profiles.length > 0) {
    const main = data.profiles.find((p) => p.isDefault) || data.profiles[0];
    return { ...main, ...data };
  }
  return data;
};

// Creates or updates the profile
export const saveProfile = (profileData, options = {}) =>
  apiClient.post(API_URL, profileData, options);

// Updates only the main profile fields (name, title, etc.)
export const updateProfileDetails = (profileDetails, options = {}) =>
  apiClient.put(API_URL, profileDetails, options);

// Edit History Record
export const updateHistoryRecord = (historyId, recordData, options = {}) =>
  apiClient.put(`${API_URL}/history/${historyId}`, recordData, options);

// Delete History Record
export const deleteHistoryRecord = (historyId, options = {}) =>
  apiClient.delete(`${API_URL}/history/${historyId}`, options);