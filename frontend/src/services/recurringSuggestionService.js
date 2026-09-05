// frontend/src/services/recurringSuggestionService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/recurring-suggestions`;

export const getRecurringSuggestions = (page = 1, limit = 50, filters = {}, options = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (filters.isAccepted !== undefined) params.append('isAccepted', filters.isAccepted);
  if (filters.isRejected !== undefined) params.append('isRejected', filters.isRejected);
  return apiClient.get(`${API_URL}?${params.toString()}`, options);
};

export const triggerDetection = (options = {}) =>
  apiClient.post(`${API_URL}/detect`, {}, options);

export const acceptSuggestion = (id, data = {}, options = {}) =>
  apiClient.post(`${API_URL}/${id}/accept`, data, options);

export const rejectSuggestion = (id, options = {}) =>
  apiClient.post(`${API_URL}/${id}/reject`, {}, options);
