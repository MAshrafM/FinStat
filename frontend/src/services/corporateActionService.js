// frontend/src/services/corporateActionService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/corporate-actions`;

/**
 * Fetch list of corporate actions with pagination and filters
 */
export const getCorporateActions = (params = {}, options = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.stockCode) queryParams.append('stockCode', params.stockCode);
  if (params.broker) queryParams.append('broker', params.broker);
  if (params.type) queryParams.append('type', params.type);

  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  return apiClient.get(url, options);
};

/**
 * Create a new corporate action
 */
export const createCorporateAction = (data, options = {}) => {
  return apiClient.post(API_URL, data, options);
};

/**
 * Delete a corporate action
 */
export const deleteCorporateAction = (id, options = {}) => {
  return apiClient.delete(`${API_URL}/${id}`, options);
};

/**
 * Execute Corporate Action Wizard (splits or bonus issues)
 */
export const executeCorporateActionWizard = (data, options = {}) => {
  return apiClient.post(`${BASE_API_URL}/trades/corporate-action/wizard`, data, options);
};
