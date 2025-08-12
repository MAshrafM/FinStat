// frontend/src/services/currencyService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/currency`; // Use the deployed backend URL

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

export const getCurrency = () => fetch(API_URL, { headers: getAuthHeaders() }).then(res => res.json());
export const getCurrencySummary = () => fetch(`${API_URL}/summary`, { headers: getAuthHeaders() }).then(res =>res.json());
export const getCurrencyById = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }).then(res => res.json());
export const getCurrencyPrice = () => fetch(`${API_URL}/price`, { headers: getAuthHeaders() }).then(res => res.json());
export const createCurrency = (data) => fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const updateCurrency = (id, data) => fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const deleteCurrency = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders(), method: 'DELETE' }).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });