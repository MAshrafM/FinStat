/**
 * Utility helper to extract human-readable error messages from API responses,
 * validation errors, or network exceptions.
 *
 * @param {Error|Object|string} error - The caught error or Axios error response
 * @returns {string} Human-friendly error message
 */
export const extractApiError = (error) => {
  if (!error) return 'An unexpected error occurred';

  if (typeof error === 'string') return error;

  // 1. Check response body from Axios or Fetch
  const data = error.response?.data || error.data || (typeof error === 'object' && error);

  if (data) {
    // Check validation errors array: [{ field, message }]
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const messages = data.errors
        .map((e) => (typeof e === 'string' ? e : e.message))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join(' • ');
      }
    }

    // Check message or msg property
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }
    if (data.msg && typeof data.msg === 'string') {
      return data.msg;
    }
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }
  }

  // 2. HTTP Status Code Fallbacks
  const status = error.response?.status || error.status;
  if (status === 400) return 'Invalid request data. Please check your inputs.';
  if (status === 401) return 'Session expired or unauthorized. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return 'A conflict occurred with existing records.';
  if (status >= 500) return 'Server error. Please try again later.';

  // 3. Native Error object message
  if (error.name === 'TimeoutError' || error.message?.includes('timed out')) {
    return 'Request timed out – please try again.';
  }

  if (error.name === 'TypeError' && error.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error.message && typeof error.message === 'string') {
    if (error.message === 'Network Error') {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Clears stale JWT authentication token from storage.
 */
export const clearStaleToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

/**
 * Handles 401 Unauthorized errors by clearing tokens and safely redirecting
 * without entering infinite retry loops.
 *
 * @param {Error|Object} error - Caught error
 * @param {Function} [showToast] - Optional toast function
 */
export const handleAuthError = (error, showToast) => {
  const status = error.response?.status || error.status;
  const msg = error.response?.data?.msg || error.response?.data?.message || '';

  const is401 = status === 401 || /token|authorization/i.test(msg);

  if (is401) {
    // 1. Clear stale JWT token from storage
    clearStaleToken();

    // 2. Notify user
    if (typeof showToast === 'function') {
      showToast('Your session has expired. Please log in again.', 'warning');
    }

    // 3. Redirect to login if not already on landing/login page
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    }

    return true;
  }

  return false;
};
