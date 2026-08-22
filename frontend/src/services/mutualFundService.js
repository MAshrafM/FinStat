// frontend/src/services/mutualFundService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/mutual-funds`;

export const getMutualFundTrades = (page = 1, type, options = {}) => {
  const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
  return apiClient.get(`${API_URL}?page=${page}${typeParam}`, options);
};

export const getMutualFundByCode = (code, options = {}) =>
  apiClient.get(`${API_URL}/code/${code}`, options);

export const getAllMutualFundTrades = (options = {}) =>
  apiClient.get(`${API_URL}/all`, options);

export const getMutualFundSummary = (options = {}) =>
  apiClient.get(`${API_URL}/summary`, options);

export const getLastPrice = (fundName, options = {}) =>
  apiClient.get(`${API_URL}/last-price?name=${encodeURIComponent(fundName)}`, options);

export const getTradeById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createTrade = (tradeData, options = {}) =>
  apiClient.post(API_URL, tradeData, options);

export const updateTrade = (id, tradeData, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, tradeData, options);

export const deleteTrade = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

