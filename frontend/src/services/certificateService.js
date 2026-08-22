// frontend/src/services/certificateService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/certificates`;

export const getCertificates = (options = {}) =>
  apiClient.get(API_URL, options);

export const getCertificateById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createCertificate = (data, options = {}) =>
  apiClient.post(API_URL, data, options);

export const updateCertificate = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, data, options);

export const deleteCertificate = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);