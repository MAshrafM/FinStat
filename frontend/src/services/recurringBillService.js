// frontend/src/services/recurringBillService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/expenditures/bills`;

/**
 * List all recurring bills for the current user
 * @param {Object} [params] - Optional query filters (e.g. { isActive: true })
 * @param {Object} [options]
 */
export const getRecurringBills = (params = {}, options = {}) => {
  const queryParams = new URLSearchParams();
  if (params.isActive !== undefined) {
    queryParams.append('isActive', params.isActive);
  }
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiClient.get(`${API_URL}${queryStr}`, options);
};

/**
 * Get upcoming bills due within the specified window
 * @param {Object} [params] - Query params (e.g. { days: 3 })
 * @param {Object} [options]
 */
export const getUpcomingBills = (params = { days: 3 }, options = {}) => {
  const days = params.days !== undefined ? params.days : 3;
  return apiClient.get(`${API_URL}/upcoming?days=${days}`, options);
};

/**
 * Get single recurring bill by ID
 * @param {string} id
 * @param {Object} [options]
 */
export const getRecurringBillById = (id, options = {}) =>
  apiClient.get(`${API_URL}/${id}`, options);

/**
 * Create a new recurring bill schedule
 * @param {Object} billData
 * @param {Object} [options]
 */
export const createRecurringBill = (billData, options = {}) =>
  apiClient.post(API_URL, billData, options);

/**
 * Update an existing recurring bill
 * @param {string} id
 * @param {Object} updateData
 * @param {Object} [options]
 */
export const updateRecurringBill = (id, updateData, options = {}) =>
  apiClient.put(`${API_URL}/${id}`, updateData, options);

/**
 * Soft-delete a recurring bill schedule
 * @param {string} id
 * @param {Object} [options]
 */
export const deleteRecurringBill = (id, options = {}) =>
  apiClient.delete(`${API_URL}/${id}`, options);

/**
 * Atomically pay a recurring bill, create expenditure record, and advance due date
 * @param {string} id
 * @param {Object} [paymentData] - { paymentDate, paymentMethod }
 * @param {Object} [options]
 */
export const payRecurringBill = (id, paymentData = {}, options = {}) =>
  apiClient.post(`${API_URL}/${id}/pay`, paymentData, options);

