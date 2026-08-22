// frontend/src/services/expenditureService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/expenditures`;

export const getExpenditures = (page = 1, limit = 25, type, options = {}) => {
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
  return apiClient.get(`${API_URL}?page=${page}&limit=${limit}${typeParam}`, options);
};

export const getAllExpendituresForAnalysis = (options = {}) =>
  apiClient.get(`${API_URL}/all`, options);

export const getExpenditureById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const getLatestExpenditure = (options = {}) =>
  apiClient.get(`${API_URL}/latest`, options);

export const createExpenditure = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateExpenditure = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteExpenditure = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

