// frontend/src/services/mutualFundService.js

const API_URL = 'http://localhost:5000/api/mutual-funds'; // Or your configured API base URL

/**
 * Fetches a paginated list of mutual fund trades.
 * @param {number} page - The page number to fetch.
 * @returns {Promise<Object>} A promise that resolves to the paginated data object.
 */
export const getMutualFundTrades = (page = 1) => {
    return fetch(`${API_URL}?page=${page}`).then(res => res.json());
};

/**
 * Get all Mutual funds trades without pagination.
 * @returns
 */
export const getAllMutualFundTrades = () => {
    return fetch(`${API_URL}/all`).then(res => res.json());
};

/**
 * Fetches a single mutual fund trade by its ID.
 * @param {string} id - The ID of the trade.
 * @returns {Promise<Object>} A promise that resolves to the trade object.
 */
export const getTradeById = (id) => {
    return fetch(`${API_URL}/${id}`).then(res => res.json());
};

/**
 * Creates a new mutual fund trade record.
 * @param {Object} tradeData - The data for the new trade.
 * @returns {Promise<Object>} A promise that resolves to the newly created trade object.
 */
export const createTrade = (tradeData) => {
    return fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
    }).then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    });
};

/**
 * Updates an existing mutual fund trade record.
 * @param {string} id - The ID of the trade to update.
 * @param {Object} tradeData - The new data for the trade.
 * @returns {Promise<Object>} A promise that resolves to the updated trade object.
 */
export const updateTrade = (id, tradeData) => {
    return fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData),
    }).then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    });
};

/**
 * Deletes a mutual fund trade record.
 * @param {string} id - The ID of the trade to delete.
 * @returns {Promise<Object>} A promise that resolves to a success message.
 */
export const deleteTrade = (id) => {
    return fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    }).then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    });
};
