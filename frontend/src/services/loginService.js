import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/auth`;

export const login = async (username, password, options = {}) => {
  const data = await apiClient.post(`${API_URL}/login`, { username, password }, options);
  return data.token;
};