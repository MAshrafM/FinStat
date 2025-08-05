const API_URL = 'http://localhost:5000/api/auth';

export const login = async (username, password) => { 
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
    }
    const data = await response.json();
    return data.token; // Return the JWT token
}