// frontend/src/services/paycheckService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/paychecks`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

// Get all paychecks
export const getPaychecks = async () => {
    const response = await fetch(`${API_URL}/all`, { headers: getAuthHeaders() });
  return await response.json();
};

export const getPaychecksLog = async (page = 1, limit = 15, year) => {
    const response = await fetch(`${API_URL}?page=${page}&limit=${limit}&year=${year}`, { headers: getAuthHeaders() });
  return await response.json();

};

// Get a single paycheck by its ID ===
export const getPaycheckById = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() });
  return await response.json();
};

// Create a new paycheck
export const createPaycheck = async (paycheck) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers:  getAuthHeaders(),
    body: JSON.stringify(paycheck),
  });
  return await response.json();
};

// Update an existing paycheck ===
export const updatePaycheck = async (id, paycheck) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
      headers:  getAuthHeaders(),
    body: JSON.stringify(paycheck),
  });
  return await response.json();
};

// Delete a paycheck
export const deletePaycheck = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { headers: getAuthHeaders(), method: 'DELETE',
  });
  return await response.json();
};

// (We will add the update function later when we implement editing)
