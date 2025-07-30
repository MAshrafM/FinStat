// frontend/src/services/expenditureService.js
const API_URL = 'http://localhost:5000/api/expenditures';

export const getExpenditures = ( ) => fetch(API_URL).then(res => res.json());
export const getExpenditureById = (id) => fetch(`${API_URL}/${id}`).then(res => res.json());
export const getLatestExpenditure = () => fetch(`${API_URL}/latest`).then(res => res.json());
export const createExpenditure = (data) => fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => res.json());
export const updateExpenditure = (id, data) => fetch(`${API_URL}/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
}).then(res => res.json());
export const deleteExpenditure = (id) => fetch(`${API_URL}/${id}`, { method: 'DELETE' });
