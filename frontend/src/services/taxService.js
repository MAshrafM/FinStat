// frontend/src/services/taxService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/tax-brackets`;

export const getBrackets = (yearOrOptions = {}, options = {}) => {
  let url = API_URL;
  let opts = options;
  if (typeof yearOrOptions === 'number' || typeof yearOrOptions === 'string') {
    url = `${API_URL}?year=${yearOrOptions}`;
  } else if (yearOrOptions && yearOrOptions.year) {
    url = `${API_URL}?year=${yearOrOptions.year}`;
  } else if (yearOrOptions && typeof yearOrOptions === 'object') {
    opts = yearOrOptions;
  }
  return apiClient.get(url, opts);
};

export const updateBrackets = (brackets, options = {}) =>
  apiClient.put(API_URL, { brackets }, options);

