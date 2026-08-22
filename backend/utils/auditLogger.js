// backend/utils/auditLogger.js
const LoginAudit = require('../models/LoginAudit');

/**
 * Logs a login attempt asynchronously without blocking the response.
 *
 * @param {Object} data
 * @param {string|null} data.userId
 * @param {string|null} [data.attemptedUsername]
 * @param {boolean} data.success
 * @param {string} data.ip
 * @param {string} data.userAgent
 * @param {string} [data.deviceFingerprint]
 */
const logAudit = (data) => {
  // Execute non-blocking promise
  Promise.resolve().then(async () => {
    try {
      await LoginAudit.create({
        userId: data.userId || null,
        targetUserId: data.targetUserId || null,
        action: data.action || 'login',
        attemptedUsername: data.attemptedUsername || null,
        success: !!data.success,
        ip: data.ip || 'unknown',
        userAgent: data.userAgent || 'unknown',
        deviceFingerprint: data.deviceFingerprint || null,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Audit log error:', err.message);
    }
  });
};

module.exports = { logAudit };
