// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const TaxBracket = require('../models/TaxBracket');
const SocialInsurance = require('../models/SocialInsurance');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ConflictError, BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { logAudit } = require('../utils/auditLogger');
const { toPiastres } = require('../utils/currencyUtils');

const {
  listUsersQuerySchema,
  createUserSchema,
  deleteUserParamsSchema,
  adminIdParamsSchema,
  createTaxBracketConfigSchema,
  updateTaxBracketConfigSchema,
  createSocialInsuranceConfigSchema,
  updateSocialInsuranceConfigSchema,
} = require('../validationSchemas/adminSchemas');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// ==========================================
// USER MANAGEMENT ROUTES (Admin & Manager)
// ==========================================

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
      filter = { _id: { $ne: req.user.id } };
    } else if (req.user.role === 'manager') {
      filter = { role: 'viewer', managedBy: req.user.id };
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ username: searchRegex }, { email: searchRegex }, { fullName: searchRegex }],
      });
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('_id username email role fullName title company phone managedBy totpEnabled createdAt')
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

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new ConflictError(`Username '${username}' is already taken`);
    }

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
      finalRole = 'viewer';
      finalManagedBy = req.user.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
      managedBy: finalManagedBy,
      totpEnabled: false,
      createdAt: new Date(),
    });

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
// @desc    Delete a user account (role-aware)
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
      if (req.user.id === id) {
        throw new BadRequestError('Admins cannot delete their own account');
      }
      userToDelete = await User.findById(id);
      if (!userToDelete) {
        throw new NotFoundError('User not found');
      }
    } else if (req.user.role === 'manager') {
      userToDelete = await User.findOne({ _id: id, role: 'viewer', managedBy: req.user.id });
      if (!userToDelete) {
        const existing = await User.findById(id);
        if (!existing) {
          throw new NotFoundError('Viewer not found');
        }
        throw new ForbiddenError('You can only delete your own viewers');
      }
    }

    await User.findByIdAndDelete(id);
    await RefreshToken.deleteMany({ userId: id });

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

// ==========================================
// ADMIN TAX BRACKET CONFIGURATION ROUTES
// ==========================================

// @route   GET /api/admin/tax-brackets
// @desc    List all tax bracket configurations
// @access  Private (Admin only)
router.get(
  '/tax-brackets',
  auth,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const brackets = await TaxBracket.find().sort({ year: -1, createdAt: -1 });
    res.json({
      success: true,
      taxBrackets: brackets,
    });
  })
);

// @route   POST /api/admin/tax-brackets
// @desc    Create a new tax bracket configuration
// @access  Private (Admin only)
router.post(
  '/tax-brackets',
  auth,
  authorize(['admin']),
  validate({ body: createTaxBracketConfigSchema }),
  asyncHandler(async (req, res) => {
    const data = getValidated(req, 'body');

    const processedBrackets = (data.brackets || []).map((b, idx) => ({
      level: b.level || (idx + 1),
      from: b.from,
      fromInPiastres: toPiastres(b.from),
      to: b.to,
      toInPiastres: toPiastres(b.to),
      rate: b.rate,
    }));

    const newConfig = new TaxBracket({
      ...data,
      brackets: processedBrackets,
    });

    const saved = await newConfig.save();
    res.status(201).json({
      success: true,
      message: 'Tax bracket configuration created successfully',
      taxBracket: saved,
    });
  })
);

// @route   PUT /api/admin/tax-brackets/:id
// @desc    Update a tax bracket configuration
// @access  Private (Admin only)
router.put(
  '/tax-brackets/:id',
  auth,
  authorize(['admin']),
  validate({ params: adminIdParamsSchema, body: updateTaxBracketConfigSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const data = getValidated(req, 'body');

    const config = await TaxBracket.findById(id);
    if (!config) {
      throw new NotFoundError('Tax bracket configuration not found');
    }

    if (data.brackets) {
      data.brackets = data.brackets.map((b, idx) => ({
        level: b.level || (idx + 1),
        from: b.from,
        fromInPiastres: toPiastres(b.from),
        to: b.to,
        toInPiastres: toPiastres(b.to),
        rate: b.rate,
      }));
    }

    Object.assign(config, data);
    config.lastUpdated = new Date();
    const updated = await config.save();

    res.json({
      success: true,
      message: 'Tax bracket configuration updated successfully',
      taxBracket: updated,
    });
  })
);

// @route   DELETE /api/admin/tax-brackets/:id
// @desc    Delete a tax bracket configuration
// @access  Private (Admin only)
router.delete(
  '/tax-brackets/:id',
  auth,
  authorize(['admin']),
  validate({ params: adminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const deleted = await TaxBracket.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('Tax bracket configuration not found');
    }
    res.json({
      success: true,
      message: 'Tax bracket configuration deleted successfully',
    });
  })
);

// ==========================================
// ADMIN SOCIAL INSURANCE CONFIGURATION ROUTES
// ==========================================

// @route   GET /api/admin/social-insurance
// @desc    List all social insurance configurations
// @access  Private (Admin only)
router.get(
  '/social-insurance',
  auth,
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    const configs = await SocialInsurance.find({ user: null }).sort({ year: -1, createdAt: -1 });
    res.json({
      success: true,
      socialInsuranceConfigs: configs,
    });
  })
);

// @route   POST /api/admin/social-insurance
// @desc    Create a new social insurance configuration
// @access  Private (Admin only)
router.post(
  '/social-insurance',
  auth,
  authorize(['admin']),
  validate({ body: createSocialInsuranceConfigSchema }),
  asyncHandler(async (req, res) => {
    const data = getValidated(req, 'body');

    const newConfig = new SocialInsurance({
      ...data,
      user: null,
    });

    const saved = await newConfig.save();
    res.status(201).json({
      success: true,
      message: 'Social insurance configuration created successfully',
      socialInsuranceConfig: saved,
    });
  })
);

// @route   PUT /api/admin/social-insurance/:id
// @desc    Update a social insurance configuration
// @access  Private (Admin only)
router.put(
  '/social-insurance/:id',
  auth,
  authorize(['admin']),
  validate({ params: adminIdParamsSchema, body: updateSocialInsuranceConfigSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const data = getValidated(req, 'body');

    const config = await SocialInsurance.findOne({ _id: id, user: null });
    if (!config) {
      throw new NotFoundError('Social insurance configuration not found');
    }

    Object.assign(config, data);
    const updated = await config.save();

    res.json({
      success: true,
      message: 'Social insurance configuration updated successfully',
      socialInsuranceConfig: updated,
    });
  })
);

// @route   DELETE /api/admin/social-insurance/:id
// @desc    Delete a social insurance configuration
// @access  Private (Admin only)
router.delete(
  '/social-insurance/:id',
  auth,
  authorize(['admin']),
  validate({ params: adminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const deleted = await SocialInsurance.findOneAndDelete({ _id: id, user: null });
    if (!deleted) {
      throw new NotFoundError('Social insurance configuration not found');
    }
    res.json({
      success: true,
      message: 'Social insurance configuration deleted successfully',
    });
  })
);

module.exports = router;
