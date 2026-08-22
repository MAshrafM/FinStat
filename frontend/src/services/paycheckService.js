// frontend/src/services/paycheckService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/paychecks`;

// Get all paychecks
export const getPaychecks = (options = {}) =>
  apiClient.get(`${API_URL}/all`, options);

export const getPaychecksLog = (page = 1, limit = 15, year, options = {}) => {
  const yearParam = year ? `&year=${encodeURIComponent(year)}` : '';
  return apiClient.get(`${API_URL}?page=${page}&limit=${limit}${yearParam}`, options);
};

// Get a single paycheck by its ID
export const getPaycheckById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

// Create a new paycheck
export const createPaycheck = (paycheck, options = {}) =>
  apiClient.post(API_URL, paycheck, options);

// Update an existing paycheck
export const updatePaycheck = (id, paycheck, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, paycheck, options);

// Delete a paycheck
export const deletePaycheck = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

