// frontend/src/services/goldService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/golds`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

export const getGoldLogs = async (page = 1, status = 'all', sortBy = 'date', sortOrder = 'desc') => {
    const params = new URLSearchParams({
        page,
        status,
        sortBy,
        sortOrder
    });
    const res = await fetch(`${API_URL}?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};
export const getAllGoldLogs = () => fetch(`${API_URL}/all`, { headers: getAuthHeaders() }).then(res => res.json());    
export const getGoldSummary = () => fetch(`${API_URL}/summary`, { headers: getAuthHeaders() }).then(res => res.json());
export const getGoldPrice = () => fetch(`${API_URL}/price`, { headers: getAuthHeaders() }).then(res => res.json());

export const getGoldLogById = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }).then(res => res.json());

export const createGoldLog = (data) => fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const updateGoldLog = (id, data) => fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const deleteGoldLog = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders(), method: 'DELETE' }).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
