// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ConflictError, BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { logAudit } = require('../utils/auditLogger');

const {
  listUsersQuerySchema,
  createUserSchema,
  deleteUserParamsSchema,
} = require('../validationSchemas/adminSchemas');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// @route   GET /api/admin/users
// @desc    Get paginated, searchable list of registered users (role-aware: Admin gets all, Manager gets attached viewers)
// @access  Private (Admin & Manager)
router.get(
  '/users',
  auth,
  authorize(['admin', 'manager']),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, search } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.user.role === 'admin') {
      // Exclude the currently logged-in admin
      filter = { _id: { $ne: req.user.id } };
    } else if (req.user.role === 'manager') {
      // Managers can only list viewers assigned to them
      filter = { role: 'viewer', managedBy: req.user.id };
    }

    // Apply regex search on username or email if specified
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ username: searchRegex }, { email: searchRegex }],
      });
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('_id username email role managedBy totpEnabled createdAt')
        .populate('managedBy', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit) || 1,
      currentPage: page,
      users,
    });
  })
);

// @route   POST /api/admin/users
// @desc    Register a new user directly from admin dashboard (role-aware)
// @access  Private (Admin & Manager)
router.post(
  '/users',
  auth,
  authorize(['admin', 'manager']),
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => {
    const { username, email, password, role, parentId } = getValidated(req, 'body');

    // 1. Check for duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new ConflictError(`Username '${username}' is already taken`);
    }

    // 2. Check for duplicate email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new ConflictError(`Email '${email}' is already in use`);
    }

    let finalRole = role;
    let finalManagedBy = null;

    if (req.user.role === 'admin') {
      if (finalRole === 'viewer') {
        const targetParentId = parentId || req.user.id;
        const parentUser = await User.findById(targetParentId);
        if (!parentUser || (parentUser.role !== 'admin' && parentUser.role !== 'manager')) {
          throw new BadRequestError('Parent must be an Admin or Manager');
        }
        finalManagedBy = parentUser._id;
      } else {
        finalManagedBy = null;
      }
    } else if (req.user.role === 'manager') {
      // Manager can only create Viewers managed by themselves
      finalRole = 'viewer';
      finalManagedBy = req.user.id;
    }

    // 3. Hash password with bcrypt (salt rounds 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create new user record
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
      managedBy: finalManagedBy,
      totpEnabled: false,
      createdAt: new Date(),
    });

    // 5. Record audit log
    logAudit({
      userId: req.user.id,
      targetUserId: newUser._id,
      action: 'create_user',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        managedBy: newUser.managedBy,
        totpEnabled: newUser.totpEnabled,
        createdAt: newUser.createdAt,
      },
    });
  })
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user account (role-aware: Manager can only delete their own viewers)
// @access  Private (Admin & Manager)
router.delete(
  '/users/:id',
  auth,
  authorize(['admin', 'manager']),
  validate({ params: deleteUserParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');

    let userToDelete = null;

    if (req.user.role === 'admin') {
      // 1. Prevent self-deletion
      if (req.user.id === id) {
        throw new BadRequestError('Admins cannot delete their own account');
      }

      userToDelete = await User.findById(id);
      if (!userToDelete) {
        throw new NotFoundError('User not found');
      }
    } else if (req.user.role === 'manager') {
      // 2. Managers can only delete viewers that they manage
      userToDelete = await User.findOne({ _id: id, role: 'viewer', managedBy: req.user.id });
      if (!userToDelete) {
        const existing = await User.findById(id);
        if (!existing) {
          throw new NotFoundError('Viewer not found');
        }
        throw new ForbiddenError('You can only delete your own viewers');
      }
    }

    // 3. Delete user and revoke all refresh tokens
    await User.findByIdAndDelete(id);
    await RefreshToken.deleteMany({ userId: id });

    // 4. Record audit log
    logAudit({
      userId: req.user.id,
      targetUserId: id,
      action: 'delete_user',
      success: true,
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `User ${userToDelete.username} deleted successfully`,
    });
  })
);

module.exports = router;
