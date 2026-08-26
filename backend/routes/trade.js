// backend/routes/trade.js
const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
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
} = require('../validationSchemas/tradeSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const marketPriceService = require('../utils/marketPriceService');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

// @route   GET api/trades
// @desc    Get all active trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, broker, search } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
  if (broker && broker !== 'TopUp') {
    query.broker = broker;
  } else if (broker === 'TopUp') {
    query.type = 'TopUp';
  }

  if (search) {
    query.stockCode = { $regex: search, $options: 'i' };
  }

  const trades = await Trade.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
  const total = await Trade.countDocuments(query);
  res.json({
    data: trades,
    totalPages: Math.ceil(total / limit),
    page,
  });
}));

// @route   GET api/trades/all
// @desc    Get all active trades (without pagination)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const trades = await Trade.find({ user: req.effectiveUserId, deletedAt: null }).sort({ createdAt: -1 });
  res.json(trades);
}));

// @route   GET api/trades/summary
// @desc    Get a summary of trades grouped by broker, stock, and iteration
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const summary = await Trade.aggregate([
    // --- Stage 0: Match user and active records ---
    {
      $match: { user: new mongoose.Types.ObjectId(req.effectiveUserId), deletedAt: null }
    },
    // --- Stage 1: Grouping ---
    {
      $group: {
        _id: {
          broker: "$broker",
          stockCode: "$stockCode",
          iteration: "$iteration"
        },
        totalBuyValue: {
          $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$totalValue", 0] }
        },
        totalSellValue: {
          $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$totalValue", 0] }
        },
        totalDividendValue: {
          $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$totalValue", 0] }
        },
        totalSharesBought: {
          $sum: { $cond: [{ $eq: ["$type", "Buy"] }, "$shares", 0] }
        },
        totalSharesSold: {
          $sum: { $cond: [{ $eq: ["$type", "Sell"] }, "$shares", 0] }
        },
        totalSharesDividend: {
          $sum: { $cond: [{ $eq: ["$type", "Dividend"] }, "$shares", 0] }
        },
        totalFees: { $sum: "$fees" },
        tradeCount: { $sum: 1 },
        firstTradeDate: { $min: "$date" },
        lastTradeDate: { $max: "$date" }
      }
    },
    // --- Stage 2: Calculate Averages & Current Holdings ---
    {
      $addFields: {
        currentShares: {
          $subtract: [
            { $add: ["$totalSharesBought", "$totalSharesDividend"] },
            "$totalSharesSold"
          ]
        },
        averageBuyPrice: {
          $cond: [
            { $gt: ["$totalSharesBought", 0] },
            { $divide: ["$totalBuyValue", "$totalSharesBought"] },
            0
          ]
        },
        averageSellPrice: {
          $cond: [
            { $gt: ["$totalSharesSold", 0] },
            { $divide: ["$totalSellValue", "$totalSharesSold"] },
            0
          ]
        }
      }
    },
    // --- Stage 3: Realized & Unrealized PnL & Status ---
    {
      $addFields: {
        realizedPnL: {
          $cond: [
            { $gt: ["$totalSharesSold", 0] },
            {
              $subtract: [
                "$totalSellValue",
                {
                  $add: [
                    { $multiply: ["$totalSharesSold", "$averageBuyPrice"] },
                    "$totalFees"
                  ]
                }
              ]
            },
            0
          ]
        },
        realizedPnLPercentage: {
          $cond: [
            {
              $and: [
                { $gt: ["$totalSharesSold", 0] },
                { $gt: [{ $multiply: ["$totalSharesSold", "$averageBuyPrice"] }, 0] }
              ]
            },
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $subtract: [
                        "$totalSellValue",
                        {
                          $add: [
                            { $multiply: ["$totalSharesSold", "$averageBuyPrice"] },
                            "$totalFees"
                          ]
                        }
                      ]
                    },
                    { $multiply: ["$totalSharesSold", "$averageBuyPrice"] }
                  ]
                },
                100
              ]
            },
            0
          ]
        },
        status: {
          $cond: [{ $eq: ["$currentShares", 0] }, "Closed", "Open"]
        }
      }
    },
    {
      $sort: {
        "_id.stockCode": 1,
        "_id.iteration": 1
      }
    }
  ]);
  res.json(summary);
}));

router.get('/market-prices', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const result = await marketPriceService.getStockPrices({ forceRefresh });
  res.json(result.data);
}));

// @route   POST api/trades
// @desc    Create a new trade
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newTrade = new Trade({
    ...validatedBody,
    user: req.effectiveUserId,
    priceInPiastres: toPiastres(validatedBody.price),
    feesInPiastres: toPiastres(validatedBody.fees),
    totalValueInPiastres: toPiastres(validatedBody.totalValue),
  });
  await newTrade.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(newTrade);
}));

// @route   GET api/trades/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const trade = await Trade.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  res.json(trade);
}));

// @route   PUT api/trades/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let trade = await Trade.findOne({ _id: id, deletedAt: null });
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

  trade = await Trade.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  invalidatePortfolioCache(req.effectiveUserId);
  res.json(trade);
}));

// @route   DELETE api/trades/:id
// @desc    Soft delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let trade = await Trade.findOne({ _id: id, deletedAt: null });
  if (!trade) {
    throw new NotFoundError('Trade not found');
  }
  if (trade.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await trade.softDelete();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Trade deleted successfully' });
}));

// @route   POST api/trades/:id/restore
// @desc    Restore a soft-deleted trade
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const trade = await Trade.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!trade) {
    throw new NotFoundError('Soft-deleted trade not found');
  }
  await trade.restore();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Trade restored successfully', trade });
}));

module.exports = router;
