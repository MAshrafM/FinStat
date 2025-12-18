// frontend/src/services/tradeService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/trades`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
  };
};
/**
 * Fetches a paginated list of trades, with an optional broker filter.
 * @param {number} page - The page number to fetch.
 * @param {string|null} broker - The broker to filter by ('Thndr', 'EFG', or null for all ).
 * @returns {Promise<Object>} A promise that resolves to the paginated data object.
 */
export const getTrades = (page = 1, broker = null, search = '') => {
  let url = `${API_URL}?page=${page}`;
  if (broker) {
    url += `&broker=${broker}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return fetch(url, { headers: getAuthHeaders() }).then(res => res.json());
};

/**
 * Fetches ALL trades without pagination, for future analysis.
 * @returns {Promise<Array>} A promise that resolves to an array of all trade objects.
 */
export const getAllTrades = () => {
  return fetch(`${API_URL}/all`, { headers: getAuthHeaders() }).then(res => res.json());
};
// Note: We need to add the /all route to the backend for this to work.
/** 
 * Fetches an aggregated summary of all trades.
 * @returns { Promise < Array >} A promise that resolves to the summary data array.
 */
export const getTradeSummary = () => {
  return fetch(`${API_URL}/summary`, { headers: getAuthHeaders() }).then(res => res.json());
};

export const getMarketData = () => {
  return fetch(`${API_URL}/market-prices`, { headers: getAuthHeaders() }).then(res => res.json());
};
/**
 * Fetches a single trade by its ID.
 * @param {string} id - The ID of the trade.
 * @returns {Promise<Object>} A promise that resolves to the trade object.
 */
export const getTradeById = (id) => {
  return fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }).then(res => res.json());
};

/**
 * Creates a new trade record.
 * @param {Object} tradeData - The data for the new trade.
 * @returns {Promise<Object>} A promise that resolves to the newly created trade object.
 */
export const createTrade = (tradeData) => {
  return fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tradeData),
  }).then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  });
};

/**
 * Updates an existing trade record.
 * @param {string} id - The ID of the trade to update.
 * @param {Object} tradeData - The new data for the trade.
 * @returns {Promise<Object>} A promise that resolves to the updated trade object.
 */
export const updateTrade = (id, tradeData) => {
  return fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(tradeData),
  }).then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  });
};

/**
 * Deletes a trade record.
 * @param {string} id - The ID of the trade to delete.
 * @returns {Promise<Object>} A promise that resolves to a success message.
 */
export const deleteTrade = (id) => {
  return fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(), method: 'DELETE',
  }).then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  });
};
