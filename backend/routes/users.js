// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { logAudit } = require('../utils/auditLogger');
const {
  updateProfileSchema,
  userParamsSchema,
} = require('../validationSchemas/userSchemas');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const sanitizeUserProfile = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.totpSecret;
  delete obj.backupCodes;
  return obj;
};

// @route   GET /api/users/profile
// @desc    Get current user's full profile
// @access  Private
router.get('/profile', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -totpSecret -backupCodes');
  if (!user) {
    throw new NotFoundError('User profile not found');
  }
  res.json({
    success: true,
    user: sanitizeUserProfile(user),
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put(
  '/profile',
  auth,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const updateData = getValidated(req, 'body');

    // Check unique constraints for email, nationalId, employeeId if changed
    if (updateData.email) {
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: req.user.id } });
      if (existing) throw new ConflictError('Email is already in use');
    }
    if (updateData.nationalId) {
      const existing = await User.findOne({ nationalId: updateData.nationalId, _id: { $ne: req.user.id } });
      if (existing) throw new ConflictError('National ID is already registered to another user');
    }
    if (updateData.employeeId) {
      const existing = await User.findOne({ employeeId: updateData.employeeId, _id: { $ne: req.user.id } });
      if (existing) throw new ConflictError('Employee ID is already registered to another user');
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes');

    logAudit({
      userId: req.user.id,
      targetUserId: req.user.id,
      action: 'update_profile',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUserProfile(updatedUser),
    });
  })
);

// @route   GET /api/users/:id/profile
// @desc    Admin view of another user's profile
// @access  Private (Admin only)
router.get(
  '/:id/profile',
  auth,
  authorize(['admin']),
  validate({ params: userParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const user = await User.findById(id).select('-password -totpSecret -backupCodes');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    res.json({
      success: true,
      user: sanitizeUserProfile(user),
    });
  })
);

// @route   PUT /api/users/:id/profile
// @desc    Admin update of another user's profile
// @access  Private (Admin only)
router.put(
  '/:id/profile',
  auth,
  authorize(['admin']),
  validate({ params: userParamsSchema, body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const updateData = getValidated(req, 'body');

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      throw new NotFoundError('User not found');
    }

    if (updateData.email) {
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: id } });
      if (existing) throw new ConflictError('Email is already in use');
    }
    if (updateData.nationalId) {
      const existing = await User.findOne({ nationalId: updateData.nationalId, _id: { $ne: id } });
      if (existing) throw new ConflictError('National ID is already registered');
    }
    if (updateData.employeeId) {
      const existing = await User.findOne({ employeeId: updateData.employeeId, _id: { $ne: id } });
      if (existing) throw new ConflictError('Employee ID is already registered');
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes');

    logAudit({
      userId: req.user.id,
      targetUserId: id,
      action: 'admin_update_profile',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'User profile updated successfully by admin',
      user: sanitizeUserProfile(updatedUser),
    });
  })
);

module.exports = router;
