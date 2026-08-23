// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '30d';
const REFRESH_TOKEN_DAYS = 90;
const TEMP_2FA_TOKEN_EXPIRY = '5m';

/**
 * Generates a short-lived (15m) JWT access token.
 */
const generateAccessToken = (user) => {
  const payload = {
    user: {
      id: user._id ? user._id.toString() : user.id,
      role: user.role || 'viewer',
      username: user.username,
      managedBy: user.managedBy ? user.managedBy.toString() : null,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

/**
 * Generates a high-entropy 64-byte random string for refresh token.
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Generates a temporary 5-minute token for pending 2FA step.
 */
const generateTemp2FAToken = (userId) => {
  const payload = {
    user: {
      id: userId.toString(),
      temp2FA: true,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TEMP_2FA_TOKEN_EXPIRY });
};

/**
 * Calculates refresh token expiration date (7 days from now).
 */
const getRefreshTokenExpiresAt = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  return expiresAt;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTemp2FAToken,
  getRefreshTokenExpiresAt,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_DAYS,
};
