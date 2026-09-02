// frontend/src/services/paycheckService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/paychecks`;

const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

// Calculate paycheck preview (tax, insurance, net pay) without saving
export const calculatePaycheckPreview = async (previewPayload, options = {}) => {
  const response = await apiClient.post(`${API_URL}/preview`, previewPayload, options);
  return unwrap(response);
};

// Get all paychecks (unpaginated)
export const getPaychecks = async (options = {}) => {
  const response = await apiClient.get(`${API_URL}/all`, options);
  return unwrap(response);
};

// Get paginated paychecks
export const getPaychecksLog = async (page = 1, limit = 15, year, options = {}) => {
  const yearParam = year && year !== 'all' ? `&year=${encodeURIComponent(year)}` : '';
  const response = await apiClient.get(`${API_URL}?page=${page}&limit=${limit}${yearParam}`, options);
  return unwrap(response);
};

// Get a single paycheck by its ID
export const getPaycheckById = async (id, options = {}) => {
  const response = await apiClient.get(`${API_URL}/${id}`, options);
  return unwrap(response);
};

// Create a new paycheck
export const createPaycheck = async (paycheck, options = {}) => {
  const response = await apiClient.post(API_URL, paycheck, options);
  return unwrap(response);
};

// Update an existing paycheck
export const updatePaycheck = async (id, paycheck, options = {}) => {
  const response = await apiClient.put(`${API_URL}/${id}`, paycheck, options);
  return unwrap(response);
};

// Delete a paycheck
export const deletePaycheck = async (id, options = {}) => {
  const response = await apiClient.delete(`${API_URL}/${id}`, options);
  return unwrap(response);
};

// Restore a soft-deleted paycheck
export const restorePaycheck = async (id, options = {}) => {
  const response = await apiClient.post(`${API_URL}/${id}/restore`, {}, options);
  return unwrap(response);
};
