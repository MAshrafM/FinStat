// frontend/src/services/budgetService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/budgets`;

export const getBudgets = (page = 1, limit = 50, filters = {}, options = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (filters.period) params.append('period', filters.period);
  if (filters.year) params.append('year', filters.year);
  if (filters.category) params.append('category', filters.category);
  return apiClient.get(`${API_URL}?${params.toString()}`, options);
};

export const getBudgetById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createBudget = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateBudget = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteBudget = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

export const getBudgetProgress = (filters = {}, options = {}) => {
  const params = new URLSearchParams();
  if (filters.period) params.append('period', filters.period);
  if (filters.year) params.append('year', filters.year);
  if (filters.month) params.append('month', filters.month);
  if (filters.quarter) params.append('quarter', filters.quarter);
  if (filters.category) params.append('category', filters.category);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get(`${API_URL}/progress${queryStr}`, options);
};
