// backend/routes/corporateActions.js
const express = require('express');
const router = express.Router();
const CorporateAction = require('../models/CorporateAction');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { invalidatePortfolioCache } = require('../utils/portfolioService');
const {
  createCorporateActionSchema,
  queryCorporateActionSchema,
  paramsSchema,
} = require('../validationSchemas/corporateActionSchemas');

// @route   GET /api/corporate-actions
// @desc    List all corporate actions for current user
router.get(
  '/',
  auth,
  validate({ query: queryCorporateActionSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, stockCode, broker, type } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.effectiveUserId, deletedAt: null };
    if (stockCode) query.stockCode = stockCode.toUpperCase().trim();
    if (broker) query.broker = broker;
    if (type) query.type = type;

    const [actions, total] = await Promise.all([
      CorporateAction.find(query)
        .sort({ effectiveDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CorporateAction.countDocuments(query),
    ]);

    res.json({
      data: actions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total,
    });
  })
);

// @route   POST /api/corporate-actions
// @desc    Create a new corporate action
router.post(
  '/',
  auth,
  validate({ body: createCorporateActionSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const validatedBody = getValidated(req, 'body');

    const corporateAction = new CorporateAction({
      user: req.effectiveUserId,
      stockCode: validatedBody.stockCode.toUpperCase().trim(),
      broker: validatedBody.broker,
      type: validatedBody.type,
      ratio: validatedBody.ratio,
      effectiveDate: new Date(validatedBody.effectiveDate),
      notes: validatedBody.notes || '',
    });

    await corporateAction.save();
    invalidatePortfolioCache(req.effectiveUserId);

    res.status(201).json(corporateAction);
  })
);

// @route   DELETE /api/corporate-actions/:id
// @desc    Soft delete a corporate action and invalidate cache
router.delete(
  '/:id',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const action = await CorporateAction.findOne({ _id: id, deletedAt: null });
    if (!action) {
      throw new NotFoundError('Corporate action not found');
    }
    if (action.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized to delete this corporate action');
    }

    await action.softDelete();
    invalidatePortfolioCache(req.effectiveUserId);

    res.json({ msg: 'Corporate action deleted successfully' });
  })
);

module.exports = router;
