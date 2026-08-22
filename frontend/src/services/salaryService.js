// frontend/src/services/salaryService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/salary-profile`;

// Gets the one and only profile
export const getProfile = (options = {}) =>
  apiClient.get(API_URL, options);

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