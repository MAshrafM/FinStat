// backend/middleware/cronAuth.js
const crypto = require('crypto');

/**
 * Middleware to authenticate cron job execution requests.
 * Supports both custom x-cron-secret header and Vercel Cron Authorization Bearer token.
 * Enforces constant-time buffer comparison to prevent timing attacks and eliminates fallback defaults.
 */
const cronAuth = (req, res, next) => {
  const headerSecret = req.headers['x-cron-secret'];
  const authHeader = req.headers['authorization'];
  let incomingSecret = headerSecret;

  if (!incomingSecret && authHeader && authHeader.startsWith('Bearer ')) {
    incomingSecret = authHeader.substring(7);
  }

  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      message: 'CRON_SECRET is not configured on server',
    });
  }

  if (!incomingSecret) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing cron secret header',
    });
  }

  const inBuf = Buffer.from(incomingSecret);
  const expBuf = Buffer.from(expectedSecret);

  if (inBuf.length !== expBuf.length || !crypto.timingSafeEqual(inBuf, expBuf)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid cron secret',
    });
  }

  next();
};

module.exports = cronAuth;
