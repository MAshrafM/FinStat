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

module.exports = { getValidated };
