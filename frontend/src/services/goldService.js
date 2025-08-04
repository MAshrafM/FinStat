// frontend/src/services/goldService.js
const API_URL = 'http://localhost:5000/api/golds';

export const getGoldLogs = (page = 1) => fetch(`${API_URL}?page=${page}`).then(res => res.json());
export const getAllGoldLogs = () => fetch(`${API_URL}/all`).then(res => res.json());    
export const getGoldSummary = () => fetch(`${API_URL}/summary`).then(res => res.json());
export const getGoldPrice = () => fetch(`${API_URL}/price`).then(res => res.json());

export const getGoldLogById = (id) => fetch(`${API_URL}/${id}`).then(res => res.json());

export const createGoldLog = (data) => fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const updateGoldLog = (id, data) => fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const deleteGoldLog = (id) => fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
