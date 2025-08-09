// frontend/src/services/taxService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/tax-brackets`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};


/**
 * Fetches the current tax bracket information.
 * @returns {Promise<object>} A promise that resolves to the tax info object.
 */
export const getBrackets = ( ) => {
    return fetch(API_URL, { headers: getAuthHeaders() }).then(res => {
    if (!res.ok) throw new Error('Failed to fetch tax brackets.');
    return res.json();
  });
};

/**
 * Updates the entire set of tax brackets.
 * @param {Array<object>} brackets - An array of bracket objects to save.
 * @returns {Promise<object>} A promise that resolves to the updated tax info object.
 */
export const updateBrackets = (brackets) => {
  return fetch(API_URL, {
    method: 'PUT',
    headers: getAuthHeaders(),
    headers: getAuthHeaders(),
    body: JSON.stringify({ brackets }), // The API expects an object with a 'brackets' key
  }).then(res => {
    if (!res.ok) throw new Error('Failed to update tax brackets.');
    return res.json();
  });
};
