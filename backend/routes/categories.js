// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Category = require('../models/Category');
const { EXPENDITURE_CATEGORIES } = require('../constants/categories');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { getValidated } = require('../utils/requestHelpers');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100, 'Category name cannot exceed 100 characters'),
  color: z.string().trim().optional().nullable(),
});

/**
 * Seed system default expenditure categories at server boot or migration.
 */
async function seedSystemCategories() {
  for (const cat of EXPENDITURE_CATEGORIES) {
    await Category.updateOne(
      { name: cat.name, isSystem: true },
      {
        $set: {
          name: cat.name,
          color: cat.color || null,
          isSystem: true,
          user: null,
          deletedAt: null,
        },
      },
      { upsert: true }
    );
  }
}

// @route   GET /api/categories
// @desc    Get all active categories (system default + user custom)
// @access  Private (All authenticated users: viewer, manager, admin)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const categories = await Category.find({
      deletedAt: null,
      $or: [
        { isSystem: true },
        { user: req.effectiveUserId },
      ],
    }).sort({ isSystem: -1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  })
);

// @route   POST /api/categories
// @desc    Create a custom category for the authenticated user
// @access  Private (admin, manager only)
router.post(
  '/',
  auth,
  authorize(['admin', 'manager']),
  validate({ body: createCategorySchema }),
  asyncHandler(async (req, res) => {
    const { name, color } = getValidated(req, 'body');
    const trimmedName = name.trim();

    // Check if active category with same name already exists for this user or as a system category
    const existing = await Category.findOne({
      deletedAt: null,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      $or: [
        { isSystem: true },
        { user: req.effectiveUserId },
      ],
    });

    if (existing) {
      throw new ConflictError(`Category '${trimmedName}' already exists`);
    }

    const category = await Category.create({
      name: trimmedName,
      color: color || null,
      isSystem: false,
      user: req.effectiveUserId,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  })
);

// @route   DELETE /api/categories/:id
// @desc    Soft-delete a custom category (system categories are protected)
// @access  Private (admin, manager only)
router.delete(
  '/:id',
  auth,
  authorize(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.isSystem) {
      throw new BadRequestError('System categories cannot be deleted');
    }

    if (req.user.role !== 'admin' && category.user?.toString() !== req.effectiveUserId) {
      throw new NotFoundError('Category not found');
    }

    await category.softDelete();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

router.seedSystemCategories = seedSystemCategories;
module.exports = router;
