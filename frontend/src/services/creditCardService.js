// frontend/src/services/creditCardService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/credit-cards`; // Use the deployed backend URL

const getAuthHeaders = ( ) => ({ 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') });

// --- Card Management ---
export const getCards = () => fetch(`${API_URL}/cards`, { headers: getAuthHeaders() }).then(res => res.json());
export const createCard = (data) => fetch(`${API_URL}/cards`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(res => res.json());

// --- Summary & Due Transactions ---
export const getCardSummary = (cardId) => fetch(`${API_URL}/summary/${cardId}`, { headers: getAuthHeaders() }).then(res => res.json());
export const getDueTransactions = (cardId) => fetch(`${API_URL}/transactions/due/${cardId}`, { headers: getAuthHeaders() }).then(res => res.json()); // We need to build this backend route

// --- Transaction & Payment Logging ---
export const createTransaction = (data) => fetch(`${API_URL}/transactions`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) }).then(res => res.json());
export const makeFullPayment = (transactionId) => fetch(`${API_URL}/payments/full`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ transactionId }) }).then(res => res.json()); // We need this backend route
export const makePartialPayment = (transactionId, amount) => fetch(`${API_URL}/payments/partial`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ transactionId, amount }) }).then(res => res.json()); // And this one
