// frontend/src/services/taxService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/tax-brackets`;

export const getBrackets = (options = {}) =>
  apiClient.get(API_URL, options);

export const updateBrackets = (brackets, options = {}) =>
  apiClient.put(API_URL, { brackets }, options);

