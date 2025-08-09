// frontend/src/services/socialInsuranceService.js
// Define the base URL for the backend API in one central place.
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/social-insurance`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

/**
 * Fetches all social insurance records from the backend.
 * @returns {Promise<Array>} A promise that resolves to an array of records.
 */
export const getRecords = ( ) => {
    return fetch(API_URL, { headers: getAuthHeaders() }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch social insurance records.');
    return res.json();
  });
};

/**
 * Creates or updates a social insurance record for a specific year.
 * @param {object} record - The record to save, e.g., { year: 2024, registeredIncome: 3000 }.
 * @returns {Promise<object>} A promise that resolves to the saved record.
 */
export const saveRecord = (record) => {
  return fetch(API_URL, {
    method: 'POST',
      headers: getAuthHeaders(),
    body: JSON.stringify(record),
  }).then(res => {
    if (!res.ok) throw new Error('Failed to save social insurance record.');
    return res.json();
  });
};
