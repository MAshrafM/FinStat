// frontend/src/services/currencyService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/currency`;

export const getCurrency = (options = {}) =>
  apiClient.get(API_URL, options);

export const getCurrencySummary = (options = {}) =>
  apiClient.get(`${API_URL}/summary`, options);

export const getCurrencyById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const getCurrencyPrice = (options = {}) =>
  apiClient.get(`${API_URL}/price`, options);

export const createCurrency = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateCurrency = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteCurrency = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);