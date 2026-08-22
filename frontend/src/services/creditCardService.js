// frontend/src/services/creditCardService.js
import { BASE_API_URL } from '../config/api';
import apiClient from './apiClient';

const API_URL = `${BASE_API_URL}/credit-cards`;

// --- Card Management ---
export const getCards = (options = {}) =>
  apiClient.get(`${API_URL}/cards`, options);

export const createCard = (data, options = {}) =>
  apiClient.post(`${API_URL}/cards`, data, options);

export const updateCard = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/cards/${id}`, data, options);

export const deleteCard = (id, options = {}) =>
  apiClient.delete(`${API_URL}/cards/${id}`, options);

// --- Summary & Due Transactions ---
export const getCardSummary = (cardId, options = {}) =>
  apiClient.get(`${API_URL}/summary/${cardId}`, options);

export const getDueTransactions = (cardId, options = {}) =>
  apiClient.get(`${API_URL}/transactions/due/${cardId}`, options);

export const getTransactions = (cardId, options = {}) =>
  apiClient.get(`${API_URL}/transactions/${cardId}`, options);

export const getOverallSummary = (options = {}) =>
  apiClient.get(`${API_URL}/overall-summary`, options);

// --- Transaction & Payment Logging ---
export const createTransaction = (data, options = {}) =>
  apiClient.post(`${API_URL}/transactions`, data, options);

export const makeFullPayment = (transactionId, options = {}) =>
  apiClient.post(`${API_URL}/payments/full`, { transactionId }, options);

export const makePartialPayment = (transactionId, amount, options = {}) =>
  apiClient.post(`${API_URL}/payments/partial`, { transactionId, amount }, options);

export const updateTransaction = (id, data, options = {}) =>
  apiClient.put(`${API_URL}/transactions/${id}`, data, options);

export const deleteTransaction = (id, options = {}) =>
  apiClient.delete(`${API_URL}/transactions/${id}`, options);