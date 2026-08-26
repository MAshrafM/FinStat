// frontend/src/services/realEstateService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/real-estates`;

export const getRealEstates = (params = {}, options = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params.type && params.type !== 'all') queryParams.append('type', params.type);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  return apiClient.get(url, options);
};

export const getRealEstateSummary = (options = {}) => {
  return apiClient.get(`${API_URL}/summary`, options);
};

export const getRealEstateById = (id, options = {}) => {
  return apiClient.get(`${API_URL}/${id}`, options);
};

export const createRealEstate = (data, options = {}) => {
  return apiClient.post(API_URL, data, options);
};

export const updateRealEstate = (id, data, options = {}) => {
  return apiClient.put(`${API_URL}/${id}`, data, options);
};

export const deleteRealEstate = (id, options = {}) => {
  return apiClient.delete(`${API_URL}/${id}`, options);
};

export const restoreRealEstate = (id, options = {}) => {
  return apiClient.post(`${API_URL}/${id}/restore`, {}, options);
};
