// frontend/src/services/lendingService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/lending`;

export const getLendingSummary = (options = {}) =>
  apiClient.get(`${API_URL}/summary`, options);

export const getPersons = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters.search) params.append('search', filters.search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get(`${API_URL}/persons${q}`, options);
};

export const getPersonById = (id, options = {}) =>
  apiClient.get(`${API_URL}/persons/${id}`, options);

export const createPerson = (data, options = {}) =>
  apiClient.post(`${API_URL}/persons`, data, options);

export const updatePerson = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/persons/${id}`, data, options);

export const deletePerson = (id, options = {}) =>
  apiClient.delete(`${API_URL}/persons/${id}`, options);

export const getLoans = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.person) params.append('person', filters.person);
  if (filters.status) params.append('status', filters.status);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
  const q = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get(`${API_URL}/loans${q}`, options);
};

export const getLoanById = (id, options = {}) =>
  apiClient.get(`${API_URL}/loans/${id}`, options);

export const createLoan = (data, options = {}) =>
  apiClient.post(`${API_URL}/loans`, data, options);

export const updateLoan = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/loans/${id}`, data, options);

export const deleteLoan = (id, options = {}) =>
  apiClient.delete(`${API_URL}/loans/${id}`, options);

export const addTransaction = (loanId, data, options = {}) =>
  apiClient.post(`${API_URL}/loans/${loanId}/transactions`, data, options);

export const deleteTransaction = (loanId, txId, options = {}) =>
  apiClient.delete(`${API_URL}/loans/${loanId}/transactions/${txId}`, options);
