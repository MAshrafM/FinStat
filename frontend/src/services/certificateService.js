// frontend/src/services/certificateService.js
const API_URL = 'http://localhost:5000/api/certificates';

export const getCertificates = () => fetch(API_URL).then(res => res.json());
export const getCertificateById = (id) => fetch(`${API_URL}/${id}`).then(res => res.json());
export const createCertificate = (data) => fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const updateCertificate = (id, data) => fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
}).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });
export const deleteCertificate = (id) => fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(res => { if (!res.ok) throw new Error('Network response was not ok'); return res.json(); });