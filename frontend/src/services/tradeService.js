// frontend/src/services/tradeService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/trades`;

/**
 * Fetches a paginated list of trades, with an optional broker filter.
 */
export const getTrades = (page = 1, broker = null, search = '', options = {}) => {
  let url = `${API_URL}?page=${page}`;
  if (broker) {
    url += `&broker=${encodeURIComponent(broker)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return apiClient.get(url, options);
};

export const getAllTrades = (options = {}) =>
  apiClient.get(`${API_URL}/all`, options);

export const getTradeSummary = (options = {}) =>
  apiClient.get(`${API_URL}/summary`, options);

export const getMarketData = (options = {}) =>
  apiClient.get(`${API_URL}/market-prices`, options);

export const getTradeById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

export const createTrade = (tradeData, options = {}) =>
  apiClient.post(API_URL, tradeData, options);

export const updateTrade = (id, tradeData, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, tradeData, options);

export const deleteTrade = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

