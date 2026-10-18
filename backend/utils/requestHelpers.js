/**
 * Safe accessor for validated request data with fallback to raw request properties.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {'body' | 'query' | 'params'} location - Location to retrieve ('body', 'query', or 'params')
 * @returns {*} The validated data or raw data
 */
const getValidated = (req, location = 'body') => {
  return req.validatedData?.[location] ?? req[location];
};

/**
 * Escapes special regular expression characters in a string to prevent regex injection.
 * Trims whitespace and handles non-string inputs safely.
 *
 * @param {string} str - Raw input string to escape
 * @returns {string} Escaped string safe for RegExp or MongoDB $regex queries
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { getValidated, escapeRegex };

