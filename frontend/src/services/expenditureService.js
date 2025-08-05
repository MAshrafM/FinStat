// frontend/src/services/expenditureService.js
const API_URL = 'http://localhost:5000/api/expenditures';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

// Update the getExpenditures function
export const getExpenditures = (page = 1, limit = 25, type) => {
    return fetch(`${API_URL}?page=${page}&limit=${limit}&type=${type}`, { headers: getAuthHeaders() }).then(res => res.json());
};
export const getAllExpendituresForAnalysis = () => {
    return fetch(`${API_URL}/all`, { headers: getAuthHeaders() }).then(res => res.json());
};
export const getExpenditureById = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }).then(res => res.json());
export const getLatestExpenditure = () => fetch(`${API_URL}/latest`, { headers: getAuthHeaders() }).then(res => res.json());
export const createExpenditure = (data) => fetch(API_URL, {
  method: 'POST',
    headers: getAuthHeaders(),
  body: JSON.stringify(data),
}).then(res => res.json());
export const updateExpenditure = (id, data) => fetch(`${API_URL}/${id}`, {
  method: 'PUT',
    headers: getAuthHeaders(),
  body: JSON.stringify(data),
}).then(res => res.json());
export const deleteExpenditure = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders(), method: 'DELETE' });
