const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const DEFAULT_TEST_PASSWORD = 'TestPassword123!';
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'finstat-test-jwt-secret-key-at-least-32-chars-long!';

/**
 * Seed a test user with a given role
 * @param {Object} options
 * @param {string} [options.username]
 * @param {string} [options.password]
 * @param {string} [options.role] 'admin' | 'manager' | 'viewer'
 * @returns {Promise<User>}
 */
async function createTestUser(options = {}) {
  const role = options.role || 'manager';
  const username = options.username || `test_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const password = options.password || DEFAULT_TEST_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, 8);

  const user = await User.create({
    username,
    password: hashedPassword,
    role,
    ...options,
  });

  return user;
}

/**
 * Generate a signed JWT token for a test user
 * @param {User|Object} user
 * @param {Object} [options]
 * @returns {string} Bearer token string
 */
function generateTestToken(user, options = {}) {
  const payload = {
    userId: user._id || user.id,
    role: user.role || 'manager',
    username: user.username,
  };
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h', ...options });
}

/**
 * Generate an Authorization header value ('Bearer <token>')
 * @param {User|Object} user
 * @returns {string}
 */
function generateAuthHeader(user) {
  return `Bearer ${generateTestToken(user)}`;
}

module.exports = {
  DEFAULT_TEST_PASSWORD,
  TEST_JWT_SECRET,
  createTestUser,
  generateTestToken,
  generateAuthHeader,
};
