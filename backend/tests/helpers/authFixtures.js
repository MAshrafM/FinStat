require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const DEFAULT_TEST_PASSWORD = 'TestPassword123!';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'Finstatsonic';
}

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
    user: {
      id: user._id ? user._id.toString() : (user.id || user.userId),
      role: user.role || 'manager',
      username: user.username,
      managedBy: user.managedBy ? user.managedBy.toString() : null,
    },
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1h', ...options });
}

/**
 * Generate an Authorization header value ('Bearer <token>')
 * @param {User|Object} user
 * @returns {string}
 */
function generateAuthHeader(user) {
  return `Bearer ${generateTestToken(user)}`;
}

/**
 * Create a test user and generate their signed token and Authorization header
 * @param {Object} options
 * @returns {Promise<{ user: User, token: string, authHeader: string }>}
 */
async function createUserWithToken(options = {}) {
  const user = await createTestUser(options);
  const token = generateTestToken(user);
  const authHeader = `Bearer ${token}`;
  return { user, token, authHeader };
}

module.exports = {
  DEFAULT_TEST_PASSWORD,
  TEST_JWT_SECRET: getJwtSecret(),
  createTestUser,
  generateTestToken,
  generateAuthHeader,
  createUserWithToken,
};
