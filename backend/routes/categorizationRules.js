// backend/routes/categorizationRules.js
const express = require('express');
const router = express.Router();
const CategorizationRule = require('../models/CategorizationRule');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createRuleSchema,
  updateRuleSchema,
  testRuleSchema,
  paramsSchema,
  queryRuleSchema,
} = require('../validationSchemas/categorizationRuleSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { testRule } = require('../utils/ruleEngine');

// @route   GET /api/categorization-rules
// @desc    List all categorization rules for the effective user
router.get(
  '/',
  auth,
  validate({ query: queryRuleSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, isActive } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.effectiveUserId, deletedAt: null };
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const total = await CategorizationRule.countDocuments(query);
    const rules = await CategorizationRule.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: rules,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// @route   POST /api/categorization-rules/test
// @desc    Test a rule definition against sample text
router.post(
  '/test',
  auth,
  validate({ body: testRuleSchema }),
  asyncHandler(async (req, res) => {
    const { operator, value, category, sampleText } = getValidated(req, 'body');
    const result = testRule({ operator, value, category }, sampleText);
    res.json(result);
  })
);

// @route   POST /api/categorization-rules
// @desc    Create a new categorization rule
router.post(
  '/',
  auth,
  validate({ body: createRuleSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const body = getValidated(req, 'body');

    const rule = await CategorizationRule.create({
      ...body,
      user: req.effectiveUserId,
    });

    res.status(201).json(rule);
  })
);

// @route   GET /api/categorization-rules/:id
// @desc    Get a single rule by ID
router.get(
  '/:id',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const rule = await CategorizationRule.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!rule) {
      throw new NotFoundError('Categorization rule not found');
    }

    res.json(rule);
  })
);

// @route   PUT /api/categorization-rules/:id
// @desc    Update a categorization rule
router.put(
  '/:id',
  auth,
  validate({ params: paramsSchema, body: updateRuleSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const rule = await CategorizationRule.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!rule) {
      throw new NotFoundError('Categorization rule not found');
    }

    if (rule.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    Object.assign(rule, body);
    await rule.save();

    res.json(rule);
  })
);

// @route   DELETE /api/categorization-rules/:id
// @desc    Soft-delete a categorization rule
router.delete(
  '/:id',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const rule = await CategorizationRule.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!rule) {
      throw new NotFoundError('Categorization rule not found');
    }

    if (rule.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    await rule.softDelete();
    res.json({ msg: 'Categorization rule deleted successfully' });
  })
);

module.exports = router;
