// frontend/src/services/portfolioService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/portfolio`;

/**
 * Fetch top-level portfolio summary metrics (Invested, Valuation, ROI, XIRR)
 */
export const getPortfolioSummary = (refresh = false, options = {}, costBasisMethod = null) => {
  const queryParams = new URLSearchParams();
  if (refresh) queryParams.append('refresh', 'true');
  if (costBasisMethod) queryParams.append('costBasisMethod', costBasisMethod);
  const qs = queryParams.toString();
  const url = qs ? `${API_URL}/summary?${qs}` : `${API_URL}/summary`;
  return apiClient.get(url, options);
};

/**
 * Fetch all holdings across asset classes with optional filtering
 */
export const getPortfolioHoldings = (params = {}, options = {}) => {
  const queryParams = new URLSearchParams();
  if (params.assetType && params.assetType !== 'All') queryParams.append('assetType', params.assetType);
  if (params.category && params.category !== 'All') queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.refresh) queryParams.append('refresh', 'true');
  if (params.costBasisMethod) queryParams.append('costBasisMethod', params.costBasisMethod);

  const queryString = queryParams.toString();
  const url = queryString ? `${API_URL}/holdings?${queryString}` : `${API_URL}/holdings`;
  return apiClient.get(url, options);
};

/**
 * Fetch asset allocation breakdown
 */
export const getPortfolioAllocation = (refresh = false, options = {}, costBasisMethod = null) => {
  const queryParams = new URLSearchParams();
  if (refresh) queryParams.append('refresh', 'true');
  if (costBasisMethod) queryParams.append('costBasisMethod', costBasisMethod);
  const qs = queryParams.toString();
  const url = qs ? `${API_URL}/allocation?${qs}` : `${API_URL}/allocation`;
  return apiClient.get(url, options);
};

/**
 * Force clear portfolio cache
 */
export const clearPortfolioCache = (options = {}) => {
  return apiClient.post(`${API_URL}/clear-cache`, {}, options);
};

/**
 * Fetch portfolio rebalancing data (current allocation vs target & suggested trades)
 */
export const getRebalancingData = (refresh = false, options = {}) => {
  const url = refresh ? `${API_URL}/rebalancing?refresh=true` : `${API_URL}/rebalancing`;
  return apiClient.get(url, options);
};

/**
 * Update user's rebalancing target allocation
 */
export const updateRebalancingTarget = (targetData, options = {}) => {
  return apiClient.put(`${API_URL}/rebalancing/target`, targetData, options);
};

