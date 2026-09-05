// backend/routes/budgets.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createBudgetSchema,
  updateBudgetSchema,
  progressQuerySchema,
  queryBudgetSchema,
  paramsSchema,
} = require('../validationSchemas/budgetSchemas');
const { getValidated } = require('../utils/requestHelpers');
const {
  calculateBudgetProgress,
  calculateAllBudgetsProgress,
} = require('../utils/budgetCalculator');

// @route   GET /api/budgets/progress
// @desc    Get progress and spending analysis for active budgets
router.get(
  '/progress',
  auth,
  validate({ query: progressQuerySchema }),
  asyncHandler(async (req, res) => {
    const filters = getValidated(req, 'query');
    const progressList = await calculateAllBudgetsProgress(req.effectiveUserId, filters);
    res.json(progressList);
  })
);

// @route   GET /api/budgets
// @desc    List all budgets for effective user
router.get(
  '/',
  auth,
  validate({ query: queryBudgetSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, period, year, category } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.effectiveUserId, deletedAt: null };
    if (period) query.period = period;
    if (year) query.year = year;
    if (category) query.category = category;

    const total = await Budget.countDocuments(query);
    const budgets = await Budget.find(query)
      .sort({ year: -1, month: -1, quarter: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: budgets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// @route   POST /api/budgets
// @desc    Create a new budget
router.post(
  '/',
  auth,
  validate({ body: createBudgetSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const body = getValidated(req, 'body');

    const budget = await Budget.create({
      ...body,
      user: req.effectiveUserId,
    });

    res.status(201).json(budget);
  })
);

// @route   GET /api/budgets/:id
// @desc    Get a single budget by ID (with real-time progress)
router.get(
  '/:id',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');

    const budget = await Budget.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    const progress = await calculateBudgetProgress(req.effectiveUserId, budget);
    res.json(progress);
  })
);

// @route   PUT /api/budgets/:id
// @desc    Update an existing budget
router.put(
  '/:id',
  auth,
  validate({ params: paramsSchema, body: updateBudgetSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const budget = await Budget.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    if (budget.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    Object.assign(budget, body);
    await budget.save();

    res.json(budget);
  })
);

// @route   DELETE /api/budgets/:id
// @desc    Soft-delete a budget
router.delete(
  '/:id',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const budget = await Budget.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!budget) {
      throw new NotFoundError('Budget not found');
    }

    if (budget.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    await budget.softDelete();
    res.json({ msg: 'Budget deleted successfully' });
  })
);

module.exports = router;
