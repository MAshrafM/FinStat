// frontend/src/services/paycheckService.js
const API_URL = 'http://localhost:5000/api/paychecks';

// Get all paychecks
export const getPaychecks = async () => {
  const response = await fetch(`${API_URL}/all`);
  return await response.json();
};

export const getPaychecksLog = async (page = 1, limit = 15) => {
  const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
  return await response.json();

};

// Get a single paycheck by its ID ===
export const getPaycheckById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`);
  return await response.json();
};

// Create a new paycheck
export const createPaycheck = async (paycheck) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paycheck),
  });
  return await response.json();
};

// Update an existing paycheck ===
export const updatePaycheck = async (id, paycheck) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paycheck),
  });
  return await response.json();
};

// Delete a paycheck
export const deletePaycheck = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};

// (We will add the update function later when we implement editing)
