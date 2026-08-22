// backend/middleware/authorize.js

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 *
 * @param {string[]|string} roles - Array of allowed role strings or single role string
 */
const authorize = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        msg: 'Unauthorized',
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        msg: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = authorize;
