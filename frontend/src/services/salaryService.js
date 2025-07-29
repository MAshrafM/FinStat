// frontend/src/services/salaryService.js
const API_URL = 'http://localhost:5000/api/salary-profile';

// Gets the one and only profile
export const getProfile = ( ) => fetch(API_URL).then(res => res.json());

// Creates or updates the profile
export const saveProfile = (profileData) => {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  }).then(res => res.json());
};

// Updates only the main profile fields (name, title, etc.)
export const updateProfileDetails = (profileDetails) => {
  return fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileDetails),
  }).then(res => res.json());
};