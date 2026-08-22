// backend/utils/authHelpers.js

/**
 * Resolves the effective user ID for data ownership queries.
 * Viewers inherit their parent's (Admin or Manager) dataset via managedBy.
 * Admins and Managers own and access their own datasets.
 *
 * @param {Object} user - Decoded user from auth token or user document
 * @returns {string} Effective MongoDB ObjectId string
 */
const getEffectiveUserId = (user) => {
  if (!user) return null;
  if (user.role === 'viewer' && user.managedBy) {
    return user.managedBy.toString();
  }
  return user._id ? user._id.toString() : user.id?.toString();
};

/**
 * Determines whether a user has write/mutation permissions.
 * Admins and Managers have full write access; Viewers are strictly read-only.
 *
 * @param {Object} user - Decoded user from auth token or user document
 * @returns {boolean}
 */
const canModifyData = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'manager';
};

module.exports = {
  getEffectiveUserId,
  canModifyData,
};
