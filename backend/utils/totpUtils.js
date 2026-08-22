// backend/utils/totpUtils.js
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Generates a new TOTP secret (base32) for manual entry.
 */
const generateSecret = () => {
  const secret = speakeasy.generateSecret({ length: 20, name: 'FinStat' });
  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
};

/**
 * Verifies a 6-digit TOTP code against a plaintext secret with 1-step window drift.
 */
const verifyCode = (secret, code) => {
  if (!secret || !code) return false;
  return speakeasy.totp.verifyDelta({
    secret,
    encoding: 'base32',
    token: String(code).trim(),
    window: 1, // allow 1 step (±30s) drift
  });
};

/**
 * Encrypts a plain TOTP secret using AES-256-CBC.
 */
const encryptSecret = (plainSecret) => {
  if (!plainSecret) return null;
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts an encrypted TOTP secret (iv:ciphertext) using AES-256-CBC.
 */
const decryptSecret = (encryptedSecret) => {
  if (!encryptedSecret || !encryptedSecret.includes(':')) return null;
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const [ivHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generates 10 single-use backup codes (8 hex chars uppercase), returns plain and bcrypt-hashed.
 */
const generateBackupCodes = async (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
    codes.push(code);
  }
  // Hash each code with bcrypt (10 rounds)
  const hashed = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  return { plain: codes, hashed };
};

module.exports = {
  generateSecret,
  verifyCode,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
};
