// frontend/src/services/certificateService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/certificates`;

export const getCertificates = (params = {}, options = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL;
  return apiClient.get(url, options);
};

export const getCertificateById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const getAccruedInterest = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}/accrued-interest`, options);

export const withdrawCertificate = (id, data = {}, options = {}) =>
  apiClient.post(`${API_URL}/${id}/withdraw`, data, options);

export const createCertificate = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateCertificate = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteCertificate = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);