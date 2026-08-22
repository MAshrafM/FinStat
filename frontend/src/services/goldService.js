// frontend/src/services/goldService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/golds`;

export const getGoldLogs = (page = 1, status = 'all', sortBy = 'date', sortOrder = 'desc', options = {}) => {
  const params = new URLSearchParams({ page, status, sortBy, sortOrder });
  return apiClient.get(`${API_URL}?${params.toString()}`, options);
};

export const getAllGoldLogs = (page = 1, options = {}) =>
  apiClient.get(`${API_URL}?page=${page}`, options);

export const getGoldSummary = (options = {}) =>
  apiClient.get(`${API_URL}/summary`, options);

export const getGoldPrice = (options = {}) =>
  apiClient.get(`${API_URL}/price`, options);

export const getGoldLogById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createGoldLog = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateGoldLog = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteGoldLog = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

