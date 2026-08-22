// frontend/src/services/apiClient.test.js
import { apiRequest, ApiError } from './apiClient';

describe('apiClient Unit Tests', () => {
  const originalFetch = global.fetch;
  let dispatchEventSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    dispatchEventSpy.mockRestore();
  });

  it('should parse 400 validation error response and throw ApiError with user-friendly message', async () => {
    const errorPayload = {
      success: false,
      msg: 'Validation failed',
      message: 'Validation failed',
      errors: [
        { field: 'description', message: 'Description cannot be empty', location: 'body' }
      ]
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => errorPayload,
    });

    await expect(apiRequest('/api/test')).rejects.toThrow('Description cannot be empty');

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'app:toast',
        detail: {
          message: 'Description cannot be empty',
          type: 'error',
        },
      })
    );
  });

  it('should suppress toast when suppressToast is true', async () => {
    const errorPayload = {
      success: false,
      message: 'Silent background failure',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => errorPayload,
    });

    await expect(
      apiRequest('/api/test', { suppressToast: true })
    ).rejects.toThrow('Silent background failure');

    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('should handle network error (Failed to fetch) gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/api/test')).rejects.toThrow(
      'Unable to connect to the server. Please check your internet connection.'
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'app:toast',
        detail: {
          message: 'Unable to connect to the server. Please check your internet connection.',
          type: 'error',
        },
      })
    );
  });

  it('should handle request timeout', async () => {
    const abortError = new Error('The user aborted a request.');
    abortError.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(abortError);

    await expect(apiRequest('/api/test', { timeout: 100 })).rejects.toThrow(
      'Request timed out – please try again.'
    );

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'app:toast',
        detail: {
          message: 'Request timed out – please try again.',
          type: 'error',
        },
      })
    );
  });

  it('should return parsed data on 200 OK', async () => {
    const successData = { success: true, data: { id: 1, name: 'Sample' } };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => successData,
    });

    const result = await apiRequest('/api/test');
    expect(result).toEqual(successData);
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });
});
