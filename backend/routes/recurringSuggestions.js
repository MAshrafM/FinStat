// backend/routes/recurringSuggestions.js
const express = require('express');
const router = express.Router();
const RecurringSuggestion = require('../models/RecurringSuggestion');
const Expenditure = require('../models/Expenditure');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  acceptSuggestionSchema,
  querySuggestionSchema,
  paramsSchema,
} = require('../validationSchemas/recurringSuggestionSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { detectRecurring } = require('../utils/recurringDetector');

// @route   GET /api/recurring-suggestions
// @desc    List recurring suggestions for effective user
router.get(
  '/',
  auth,
  validate({ query: querySuggestionSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, isAccepted, isRejected } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.effectiveUserId, deletedAt: null };
    if (isAccepted !== undefined) query.isAccepted = isAccepted;
    if (isRejected !== undefined) query.isRejected = isRejected;

    const total = await RecurringSuggestion.countDocuments(query);
    const suggestions = await RecurringSuggestion.find(query)
      .sort({ confidenceScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: suggestions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

// @route   POST /api/recurring-suggestions/detect
// @desc    Manually scan and generate recurring suggestions
router.post(
  '/detect',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const suggestions = await detectRecurring(req.effectiveUserId);
    res.json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  })
);

// @route   POST /api/recurring-suggestions/:id/accept
// @desc    Accept a recurring suggestion and flag matching expenditures
router.post(
  '/:id/accept',
  auth,
  validate({ params: paramsSchema, body: acceptSuggestionSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const suggestion = await RecurringSuggestion.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!suggestion) {
      throw new NotFoundError('Recurring suggestion not found');
    }

    if (suggestion.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    suggestion.isAccepted = true;
    suggestion.isRejected = false;
    if (body.category) suggestion.category = body.category;
    if (body.amount) suggestion.amount = body.amount;
    if (body.frequency) suggestion.frequency = body.frequency;
    await suggestion.save();

    // Flag past matching expenditures for this user as recurring
    const updateResult = await Expenditure.updateMany(
      {
        user: req.effectiveUserId,
        deletedAt: null,
        description: new RegExp(`^${suggestion.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
      {
        $set: {
          isRecurring: true,
          recurringId: suggestion._id,
        },
      }
    );

    res.json({
      msg: 'Recurring suggestion accepted',
      suggestion,
      flaggedExpendituresCount: updateResult.modifiedCount,
    });
  })
);

// @route   POST /api/recurring-suggestions/:id/reject
// @desc    Reject a recurring suggestion
router.post(
  '/:id/reject',
  auth,
  validate({ params: paramsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const suggestion = await RecurringSuggestion.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!suggestion) {
      throw new NotFoundError('Recurring suggestion not found');
    }

    if (suggestion.user.toString() !== req.effectiveUserId.toString()) {
      throw new ForbiddenError('User not authorized');
    }

    suggestion.isRejected = true;
    suggestion.isAccepted = false;
    await suggestion.save();

    res.json({
      msg: 'Recurring suggestion rejected',
      suggestion,
    });
  })
);

module.exports = router;
