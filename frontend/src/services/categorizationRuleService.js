// frontend/src/services/categorizationRuleService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/categorization-rules`;

export const getRules = (page = 1, limit = 50, isActive, options = {}) => {
  const activeParam = isActive !== undefined ? `&isActive=${isActive}` : '';
  return apiClient.get(`${API_URL}?page=${page}&limit=${limit}${activeParam}`, options);
};

export const getRuleById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createRule = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateRule = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteRule = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

export const testRule = (data, options = {}) =>
  apiClient.post(`${API_URL}/test`, data, options);
