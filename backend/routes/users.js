// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AccountDelegation = require('../models/AccountDelegation');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ConflictError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { logAudit } = require('../utils/auditLogger');
const { generateAccessToken } = require('../utils/tokenUtils');
const {
  updateProfileSchema,
  userParamsSchema,
  switchAccountSchema,
  createDelegationSchema,
  updateDelegationSchema,
  delegationParamsSchema,
} = require('../validationSchemas/userSchemas');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

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

const ALLOWED_PROFILE_FIELDS = [
  'fullName',
  'dateOfBirth',
  'nationalId',
  'phone',
  'address',
  'title',
  'company',
  'department',
  'employeeId',
  'email',
  'username',
  'costBasisMethod',
];

const filterAllowedProfileFields = (data) => {
  const safe = {};
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (data[key] !== undefined) {
      safe[key] = data[key];
    }
  }
  return safe;
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

    // Check unique constraints for username, email, nationalId, employeeId if changed
    if (updateData.username) {
      const existing = await User.findOne({ username: updateData.username, _id: { $ne: req.user.id } });
      if (existing) throw new ConflictError('Username is already taken');
    }
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

    const safeUpdateData = filterAllowedProfileFields(updateData);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes');

    invalidatePortfolioCache(req.user.id);

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

    if (updateData.username) {
      const existing = await User.findOne({ username: updateData.username, _id: { $ne: id } });
      if (existing) throw new ConflictError('Username is already taken');
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

    const safeUpdateData = filterAllowedProfileFields(updateData);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    ).select('-password -totpSecret -backupCodes');

    invalidatePortfolioCache(id);

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

// @route   GET /api/users/switchable-accounts
// @desc    Get all switchable accounts (self, managed dependents, active delegations)
// @access  Private
router.get(
  '/switchable-accounts',
  auth,
  asyncHandler(async (req, res) => {
    const primaryUserId = req.user.delegatedFrom || req.user.id;
    const primaryUser = await User.findById(primaryUserId).select('-password -totpSecret -backupCodes');
    if (!primaryUser) {
      throw new NotFoundError('Primary user not found');
    }

    const accounts = [];

    // 1. Primary Self Account
    accounts.push({
      id: primaryUser._id.toString(),
      username: primaryUser.username,
      fullName: primaryUser.fullName || primaryUser.username,
      role: primaryUser.role,
      isSelf: true,
      isCurrent: req.user.id === primaryUser._id.toString(),
      relationship: 'self',
      permissions: 'full_access',
    });

    // 2. Managed Dependents (users where managedBy === primaryUserId)
    const managedUsers = await User.find({ managedBy: primaryUserId }).select(
      '_id username fullName role managedBy'
    );
    for (const m of managedUsers) {
      accounts.push({
        id: m._id.toString(),
        username: m.username,
        fullName: m.fullName || m.username,
        role: m.role,
        isManaged: true,
        relationship: 'dependent',
        permissions: 'full_access',
        isCurrent: req.user.id === m._id.toString(),
      });
    }

    // 3. Active Delegations where primary user is the delegate
    const delegations = await AccountDelegation.find({
      delegate: primaryUserId,
      status: 'active',
    }).populate('delegator', '_id username fullName role');

    for (const d of delegations) {
      if (d.delegator) {
        accounts.push({
          id: d.delegator._id.toString(),
          username: d.delegator.username,
          fullName: d.delegator.fullName || d.delegator.username,
          role: d.permissions === 'view_only' ? 'viewer' : d.delegator.role,
          isDelegated: true,
          relationship: d.relationship || 'other',
          permissions: d.permissions || 'view_only',
          delegationId: d._id.toString(),
          isCurrent: req.user.id === d.delegator._id.toString(),
        });
      }
    }

    res.json({
      success: true,
      accounts,
      isDelegatedSession: Boolean(req.user.isDelegatedSession || req.user.delegatedFrom),
      primaryUserId,
    });
  })
);

// @route   POST /api/users/switch-account
// @desc    Switch active session to managed dependent or delegated account
// @access  Private
router.post(
  '/switch-account',
  auth,
  validate({ body: switchAccountSchema }),
  asyncHandler(async (req, res) => {
    const { targetUserId } = getValidated(req, 'body');
    const primaryUserId = req.user.delegatedFrom || req.user.id;

    // A. Switching back to primary account
    if (targetUserId === primaryUserId.toString()) {
      const primaryUser = await User.findById(primaryUserId).select('-password -totpSecret -backupCodes');
      if (!primaryUser) throw new NotFoundError('Primary account not found');

      const token = generateAccessToken(primaryUser);
      return res.json({
        success: true,
        message: `Switched back to primary account @${primaryUser.username}`,
        token,
        user: {
          id: primaryUser._id.toString(),
          username: primaryUser.username,
          role: primaryUser.role,
          fullName: primaryUser.fullName,
        },
      });
    }

    // B. Switching to managed dependent
    const managedUser = await User.findOne({ _id: targetUserId, managedBy: primaryUserId }).select(
      '-password -totpSecret -backupCodes'
    );
    if (managedUser) {
      const token = generateAccessToken(managedUser, {
        delegatedFrom: primaryUserId,
        permissions: 'full_access',
      });
      return res.json({
        success: true,
        message: `Switched to managed account @${managedUser.username}`,
        token,
        user: {
          id: managedUser._id.toString(),
          username: managedUser.username,
          role: managedUser.role,
          fullName: managedUser.fullName,
          isDelegatedSession: true,
          delegatedFrom: primaryUserId.toString(),
        },
      });
    }

    // C. Switching to active delegated account
    const delegation = await AccountDelegation.findOne({
      delegator: targetUserId,
      delegate: primaryUserId,
      status: 'active',
    });

    if (delegation) {
      const targetUser = await User.findById(targetUserId).select('-password -totpSecret -backupCodes');
      if (!targetUser) throw new NotFoundError('Delegated user account not found');

      const effectiveRole = delegation.permissions === 'view_only' ? 'viewer' : targetUser.role;
      const token = generateAccessToken(targetUser, {
        delegatedFrom: primaryUserId,
        permissions: delegation.permissions,
      });

      return res.json({
        success: true,
        message: `Switched to delegated account @${targetUser.username}`,
        token,
        user: {
          id: targetUser._id.toString(),
          username: targetUser.username,
          role: effectiveRole,
          fullName: targetUser.fullName,
          isDelegatedSession: true,
          delegatedFrom: primaryUserId.toString(),
          delegationPermissions: delegation.permissions,
        },
      });
    }

    // D. Unauthorized switch attempt
    throw new ForbiddenError('You do not have delegation access to switch to this account');
  })
);

// @route   POST /api/users/delegations
// @desc    Create new account delegation
// @access  Private
router.post(
  '/delegations',
  auth,
  validate({ body: createDelegationSchema }),
  asyncHandler(async (req, res) => {
    const { targetUsername, relationship, permissions, notes } = getValidated(req, 'body');

    const delegateUser = await User.findOne({ username: targetUsername });
    if (!delegateUser) {
      throw new NotFoundError(`User @${targetUsername} not found`);
    }

    if (delegateUser._id.toString() === req.user.id.toString()) {
      throw new BadRequestError('Self-delegation is not allowed');
    }

    const existing = await AccountDelegation.findOne({
      delegator: req.user.id,
      delegate: delegateUser._id,
    });
    if (existing) {
      throw new ConflictError('Delegation already exists for this user');
    }

    const delegation = await AccountDelegation.create({
      delegator: req.user.id,
      delegate: delegateUser._id,
      relationship: relationship || 'dependent',
      permissions: permissions || 'view_only',
      notes,
      status: 'active',
    });

    logAudit({
      userId: req.user.id,
      targetUserId: delegateUser._id,
      action: 'create_delegation',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: `Delegation granted to @${delegateUser.username}`,
      delegation,
    });
  })
);

// @route   PUT /api/users/delegations/:id/revoke
// @desc    Revoke an active delegation
// @access  Private
router.put(
  '/delegations/:id/revoke',
  auth,
  validate({ params: delegationParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');

    const delegation = await AccountDelegation.findOne({
      _id: id,
      $or: [{ delegator: req.user.id }, { delegate: req.user.id }],
    });

    if (!delegation) {
      throw new NotFoundError('Delegation record not found');
    }

    delegation.status = 'revoked';
    await delegation.save();

    logAudit({
      userId: req.user.id,
      targetUserId: delegation.delegate,
      action: 'revoke_delegation',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'Delegation successfully revoked',
      delegation,
    });
  })
);

module.exports = router;
