// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Safely resolves and sanitizes JWT access token expiry.
 * Strips accidental wrapping quotes ("...", '...'), trims whitespace, parses numeric
 * seconds, and validates against jsonwebtoken's timespan parser, safely falling back to '15m'.
 */
const resolveTokenExpiry = (rawVal) => {
  const fallback = '15m';
  if (!rawVal || typeof rawVal !== 'string') return fallback;

  const cleaned = rawVal.replace(/^["']|["']$/g, '').trim();
  if (!cleaned) return fallback;

  // Pure integer in string format -> integer seconds
  if (/^\d+$/.test(cleaned)) {
    const num = parseInt(cleaned, 10);
    return !isNaN(num) && num > 0 ? num : fallback;
  }

  // Validate that jwt.sign accepts this timespan string without throwing
  try {
    jwt.sign({ test: true }, 'validation-secret-at-least-32-chars-long', { expiresIn: cleaned });
    return cleaned;
  } catch {
    return fallback;
  }
};

const ACCESS_TOKEN_EXPIRY = resolveTokenExpiry(process.env.JWT_EXPIRES_IN);
const REFRESH_TOKEN_DAYS = 7;
const TEMP_2FA_TOKEN_EXPIRY = '5m';

/**
 * Hashes a raw refresh token using SHA-256 for fast indexed O(1) lookup.
 */
const hashToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

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
  hashToken,
  resolveTokenExpiry,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_DAYS,
};
