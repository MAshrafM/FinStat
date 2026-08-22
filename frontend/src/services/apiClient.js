// frontend/src/services/apiClient.js
import { extractApiError, clearStaleToken } from '../utils/errorHelpers';

/**
 * Custom error class representing API failures.
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.response = { status, data };
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Dispatches a global toast notification event.
 *
 * @param {string} message - Toast text
 * @param {'error'|'success'|'warning'|'info'} type - Toast type
 */
export const dispatchToast = (message, type = 'error') => {
  if (typeof window !== 'undefined') {
    if (typeof window.__showToast === 'function') {
      try {
        window.__showToast(message, type);
      } catch (e) {
        // Fallback to event
      }
    }
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { message, type },
        })
      );
    }
  }
};

/**
 * Core API request handler with timeout, auth headers, error extraction,
 * and automatic toast dispatching.
 *
 * @param {string} url - API endpoint URL
 * @param {Object} [options={}] - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.headers] - Extra request headers
 * @param {any} [options.body] - Request body (will be JSON-stringified if object)
 * @param {number} [options.timeout=30000] - Request timeout in milliseconds
 * @param {boolean} [options.suppressToast=false] - If true, skips global error toast dispatch
 * @returns {Promise<any>} Resolves with response data
 */
export const apiRequest = async (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    suppressToast = false,
    ...restOptions
  } = options;

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'x-auth-token': token } : {}),
    ...headers,
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeout)
    : null;

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined && typeof body !== 'string' ? JSON.stringify(body) : body,
      signal: controller ? controller.signal : undefined,
      ...restOptions,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    let data;
    const contentType = response.headers?.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    // Check for HTTP error status or explicit success: false payload
    if (!response.ok || (data && data.success === false)) {
      const status = response.status || 400;
      let userFriendlyMessage = extractApiError({ response: { status, data } });

      if (status === 401) {
        clearStaleToken();
        userFriendlyMessage = 'Your session has expired. Please log in again.';
        if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          const currentUrl = window.location.pathname + window.location.search;
          setTimeout(() => {
            window.location.href = `/?redirect=${encodeURIComponent(currentUrl)}`;
          }, 1200);
        }
      }

      if (!suppressToast) {
        dispatchToast(userFriendlyMessage, status === 401 ? 'warning' : 'error');
      }

      throw new ApiError(userFriendlyMessage, status, data);
    }

    return data;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    // If it's already our structured ApiError, rethrow
    if (error instanceof ApiError) {
      throw error;
    }

    // Distinguish Timeout vs Network Error
    let isTimeout = error.name === 'AbortError' || error.name === 'TimeoutError';
    let errorMessage = isTimeout
      ? 'Request timed out – please try again.'
      : 'Unable to connect to the server. Please check your internet connection.';

    if (!suppressToast) {
      dispatchToast(errorMessage, 'error');
    }

    throw new ApiError(errorMessage, isTimeout ? 408 : 0, null, !isTimeout);
  }
};

export const apiClient = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
  delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

export default apiClient;
