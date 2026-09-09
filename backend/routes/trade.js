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
const User = require('../models/User');
const CorporateAction = require('../models/CorporateAction');
const { calculateCostBasis } = require('../utils/costBasisEngine');
const { applyCorporateActions, createSplitWizard } = require('../utils/corporateActionEngine');
const { wizardCorporateActionSchema } = require('../validationSchemas/corporateActionSchemas');
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
// @desc    Get a summary of trades grouped by broker, stock, and iteration with cost-basis and corporate actions
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const userObjectId = new mongoose.Types.ObjectId(req.effectiveUserId);
  const userDoc = await User.findById(userObjectId).select('costBasisMethod');
  const costBasisMethod = userDoc?.costBasisMethod || 'average';

  const [corporateActions, rawTrades] = await Promise.all([
    CorporateAction.find({ user: userObjectId, deletedAt: null }),
    Trade.find({ user: userObjectId, deletedAt: null }).sort({ date: 1, createdAt: 1 }),
  ]);

  const adjustedTrades = applyCorporateActions(rawTrades, corporateActions);

  // Group by broker, stockCode, iteration
  const groupMap = new Map();
  for (const t of adjustedTrades) {
    if (!t.stockCode) continue;
    const iter = t.iteration !== undefined && t.iteration !== null ? t.iteration : 0;
    const key = `${t.broker}_${t.stockCode}_${iter}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        broker: t.broker,
        stockCode: t.stockCode,
        iteration: iter,
        trades: [],
      });
    }
    groupMap.get(key).trades.push(t);
  }

  const summary = [];
  for (const group of groupMap.values()) {
    const iterTrades = group.trades;
    const costResult = calculateCostBasis(iterTrades, costBasisMethod);

    const firstTradeDate = iterTrades[0]?.date || null;
    const lastTradeDate = iterTrades[iterTrades.length - 1]?.date || null;
    const tradeCount = iterTrades.length;

    summary.push({
      _id: {
        broker: group.broker,
        stockCode: group.stockCode,
        iteration: group.iteration,
      },
      costBasisMethod,
      totalBuyValue: costResult.totalBuyValue,
      totalSellValue: costResult.totalSellValue,
      totalDividendValue: costResult.totalDividendValue,
      totalSharesBought: costResult.totalSharesBought,
      totalSharesSold: costResult.totalSharesSold,
      totalSharesDividend: costResult.totalSharesDividend,
      totalFees: costResult.totalFees,
      tradeCount,
      firstTradeDate,
      lastTradeDate,
      currentShares: costResult.currentShares,
      averageBuyPrice: costResult.averageBuyPrice,
      adjustedAvgPrice: costResult.adjustedAvgPrice,
      costOfSoldShares: costResult.costOfSoldShares,
      netBreakEvenPrice: costResult.netBreakEvenPrice,
      tradingPL: costResult.tradingPL,
      dividendIncome: costResult.totalDividendValue,
      totalRealizedReturn: costResult.totalRealizedReturn,
      totDeals: Number((costResult.totalBuyValue - (costResult.totalSellValue + costResult.totalDividendValue)).toFixed(2)),
      investedAmountRemaining: costResult.remainingCostBasis,
      status: costResult.currentShares === 0 ? 'Closed' : 'Open',
    });
  }

  // Sort summary
  summary.sort((a, b) => {
    if (a._id.stockCode < b._id.stockCode) return -1;
    if (a._id.stockCode > b._id.stockCode) return 1;
    return new Date(b.lastTradeDate) - new Date(a.lastTradeDate);
  });

  res.json(summary);
}));

// @route   POST api/trades/split
// @desc    Log a stock split trade + corporate action record
router.post('/split', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const body = getValidated(req, 'body');
  const result = await createSplitWizard(req.effectiveUserId, {
    stockCode: body.stockCode,
    broker: body.broker,
    type: 'split',
    ratio: body.splitRatio || 1,
    effectiveDate: body.date,
    notes: 'Logged via Trade Split entry',
    logTrade: true,
  });
  res.status(201).json(result);
}));

// @route   POST api/trades/corporate-action/wizard
// @desc    Wizard endpoint to apply split or bonus issue retroactively
router.post('/corporate-action/wizard', auth, validate({ body: wizardCorporateActionSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const body = getValidated(req, 'body');
  const result = await createSplitWizard(req.effectiveUserId, body);
  res.status(201).json(result);
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
