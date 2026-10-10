// backend/middleware/cronAuth.js
const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware to authenticate cron job execution requests via x-cron-secret header.
 */
const cronAuth = (req, res, next) => {
  const secret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET || 'finstat-cron-default-secret-2026';

  if (!secret || secret !== expectedSecret) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Invalid or missing cron secret',
    });
  }

  next();
};

module.exports = cronAuth;
