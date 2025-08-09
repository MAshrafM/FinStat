// frontend/src/services/certificateService.js
import { BASE_API_URL } from '../config/api';
const API_URL = `${BASE_API_URL}/certificates`; // Use the deployed backend URL

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};

export const getCertificates = () => fetch(API_URL, { headers: getAuthHeaders() }).then(res => res.json());
export const getCertificateById = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders() }).then(res => res.json());
export const createCertificate = (data) => fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const updateCertificate = (id, data) => fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const deleteCertificate = (id) => fetch(`${API_URL}/${id}`, { headers: getAuthHeaders(), method: 'DELETE' }).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });