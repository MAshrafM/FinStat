// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for sensitive authentication endpoints (login, 2FA verify).
 */
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again in a minute.',
    msg: 'Too many authentication attempts. Please try again in a minute.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip during test execution
});

module.exports = { authRateLimiter };
