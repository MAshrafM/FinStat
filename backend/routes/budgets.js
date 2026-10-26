// backend/routes/budgets.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');
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

    // Duplicate guard for active budgets
    const existingBudget = await Budget.findOne({
      user: req.effectiveUserId,
      category: body.category,
      period: body.period,
      year: body.year,
      month: body.period === 'monthly' ? body.month : null,
      quarter: body.period === 'quarterly' ? body.quarter : null,
      deletedAt: null,
    });
    if (existingBudget) {
      throw new ConflictError('A budget for this category and period already exists');
    }

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

    // Cross-field update enforcement against existing budget period
    if (body.month !== undefined && budget.period !== 'monthly') {
      throw new BadRequestError('Month can only be updated on monthly budgets');
    }
    if (body.quarter !== undefined && budget.period !== 'quarterly') {
      throw new BadRequestError('Quarter can only be updated on quarterly budgets');
    }

    // Duplicate collision check against other active budgets
    const collisionQuery = {
      _id: { $ne: id },
      user: req.effectiveUserId,
      category: body.category || budget.category,
      period: budget.period,
      year: budget.year,
      month: budget.period === 'monthly' ? (body.month !== undefined ? body.month : budget.month) : null,
      quarter: budget.period === 'quarterly' ? (body.quarter !== undefined ? body.quarter : budget.quarter) : null,
      deletedAt: null,
    };
    const duplicate = await Budget.findOne(collisionQuery);
    if (duplicate) {
      throw new ConflictError('A budget for this category and period already exists');
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
