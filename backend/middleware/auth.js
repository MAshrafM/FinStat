// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { getEffectiveUserId, canModifyData } = require('../utils/authHelpers');
require('dotenv').config();

module.exports = function (req, res, next) {
  // Get token from header (support both x-auth-token and Authorization: Bearer <token>)
  let token = req.header('x-auth-token');

  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // Check if no token provided
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.user || decoded.user.temp2FA) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    req.user = decoded.user;
    req.effectiveUserId = getEffectiveUserId(req.user);
    req.canModify = canModifyData(req.user);
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
