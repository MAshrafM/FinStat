// frontend/src/services/socialInsuranceService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/social-insurance`;

export const getRecords = (options = {}) =>
  apiClient.get(API_URL, options);

export const saveRecord = (record, options = {}) =>
  apiClient.post(API_URL, record, options);

