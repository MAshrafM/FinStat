// frontend/src/services/salaryService.js
const API_URL = 'http://localhost:5000/api/salary-profile';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'x-auth-token': token || '', // Include the token in the 'x-auth-token' header
    };
};



// Gets the one and only profile
export const getProfile = () => fetch(API_URL, { headers: getAuthHeaders() }).then(res => res.json());

// Creates or updates the profile
export const saveProfile = (profileData) => {
  return fetch(API_URL, {
    method: 'POST',
      headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  }).then(res => res.json());
};

// Updates only the main profile fields (name, title, etc.)
export const updateProfileDetails = (profileDetails) => {
  return fetch(API_URL, {
    method: 'PUT',
      headers: getAuthHeaders(),
    body: JSON.stringify(profileDetails),
  }).then(res => res.json());
};

// Edit History Record
export const updateHistoryRecord = (historyId, recordData) => {
  return fetch(`${API_URL}/history/${historyId}`, {
    method: 'PUT',
      headers: getAuthHeaders(),
    body: JSON.stringify(recordData),
  }).then(res => res.json());
};

// Delete History Record
export const deleteHistoryRecord = (historyId) => {
    return fetch(`${API_URL}/history/${historyId}`, { headers: getAuthHeaders(), method: 'DELETE',
  }).then(res => res.json());
};