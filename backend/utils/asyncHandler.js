/**
 * Higher-order async route wrapper that catches unhandled promise rejections
 * and forwards them to Express next(err).
 *
 * @param {Function} fn - Async Express route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
