// backend/routes/mutualFundTrades.js
const express = require('express');
const router = express.Router();
const MutualFundTrade = require('../models/MutualFundTrade');
const axios = require('axios');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/mutualFundSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');

// @route   GET api/mutual-funds
// @desc    Get all active mutual fund trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, type } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
  if (type && type !== 'all') {
    query.type = type;
  }

  const trades = await MutualFundTrade.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
  const total = await MutualFundTrade.countDocuments(query);
  res.json({
    data: trades,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
}));

router.get('/code/:code', auth, asyncHandler(async (req, res) => {
  const trade = await MutualFundTrade.find({ code: req.params.code, user: req.effectiveUserId, deletedAt: null });
  if (!trade || trade.length === 0) {
    throw new NotFoundError('Trade not found');
  }
  res.json(trade);
}));

router.get('/all', auth, asyncHandler(async (req, res) => {
  const trades = await MutualFundTrade.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1, createdAt: -1 });
  res.json(trades);
}));

// @route   GET api/mutual-funds/last-price
// @desc    Get the last price of a mutual fund
router.get('/last-price', auth, asyncHandler(async (req, res) => {
  const fundName = req.query.name;
  const response = await axios.get(`https://english.mubasher.info/api/1/funds?country=eg&name=${fundName}`);
  res.json(response.data);
}));

// @route   POST api/mutual-funds
// @desc    Create a new trade
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newTrade = new MutualFundTrade({
    ...validatedBody,
    user: req.effectiveUserId,
    priceInPiastres: toPiastres(validatedBody.price),
    feesInPiastres: toPiastres(validatedBody.fees),
    totalValueInPiastres: toPiastres(validatedBody.totalValue),
  });
  await newTrade.save();
  res.status(201).json(newTrade);
}));

// @route   GET api/mutual-funds/summary
// @desc    Get a summary of mutual funds grouped by fund code
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const summary = await MutualFundTrade.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(req.effectiveUserId), deletedAt: null }
    },
    {
      $group: {
        _id: {
          code: "$code",
          name: "$name"
        },
        totalBuyValue: {
          $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$totalValue", 0] }
        },
        totalSellValue: {
          $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$totalValue", 0] }
        },
        totalUnitsBought: {
          $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$units", 0] }
        },
        totalUnitsSold: {
          $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$units", 0] }
        },
        totalCouponValue: {
          $sum: { $cond: [{ $eq: ["$type", "Coupon"] }, "$totalValue", 0] }
        }
      }
    },
    {
      $addFields: {
        currentUnits: {
          $subtract: ["$totalUnitsBought", "$totalUnitsSold"]
        },
        averagePrice: {
          $cond: [
            { $gt: ["$totalUnitsBought", 0] },
            { $divide: ["$totalBuyValue", "$totalUnitsBought"] },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        totalValue: {
          $subtract: ["$totalBuyValue", "$totalSellValue"]
        }
      }
    },
    {
      $sort: {
        "_id.name": 1
      }
    }
  ]);
  res.json(summary);
}));

// @route   GET api/mutual-funds/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const trade = await MutualFundTrade.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  res.json(trade);
}));

// @route   PUT api/mutual-funds/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let trade = await MutualFundTrade.findOne({ _id: id, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  if (trade.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.price !== undefined) {
    updateData.priceInPiastres = toPiastres(validatedBody.price);
  }
  if (validatedBody.fees !== undefined) {
    updateData.feesInPiastres = toPiastres(validatedBody.fees);
  }
  if (validatedBody.totalValue !== undefined) {
    updateData.totalValueInPiastres = toPiastres(validatedBody.totalValue);
  }

  trade = await MutualFundTrade.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  res.json(trade);
}));

// @route   DELETE api/mutual-funds/:id
// @desc    Soft delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let trade = await MutualFundTrade.findOne({ _id: id, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  if (trade.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await trade.softDelete();
  res.json({ msg: 'Trade deleted successfully' });
}));

// @route   POST api/mutual-funds/:id/restore
// @desc    Restore a soft-deleted trade
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const trade = await MutualFundTrade.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!trade) {
    throw new NotFoundError('Soft-deleted trade not found');
  }
  await trade.restore();
  res.json({ msg: 'Trade restored successfully', trade });
}));

module.exports = router;
