// frontend/src/services/debtPayoffService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/debt-payoff`;

export const calculatePayoff = (data, options = {}) =>
  apiClient.post(`${API_URL}/calculate`, data, options);

export const getSavedPlans = (options = {}) =>
  apiClient.get(`${API_URL}/plans`, options);

export const savePlan = (data, options = {}) =>
  apiClient.post(`${API_URL}/plans`, data, options);

export const deletePlan = (id, options = {}) =>
  apiClient.delete(`${API_URL}/plans/${id}`, options);
