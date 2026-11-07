// backend/routes/trade.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const tradeExecutionService = require('../services/tradeExecutionService');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/tradeSchemas');
const { wizardCorporateActionSchema } = require('../validationSchemas/corporateActionSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/trades
// @desc    Get all active trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const result = await tradeExecutionService.listTrades({
    userId: req.effectiveUserId,
    query: getValidated(req, 'query'),
  });
  res.json(result);
}));

// @route   GET api/trades/all
// @desc    Get all active trades without pagination (clamped to 1000 lean docs)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const { trades, truncated } = await tradeExecutionService.getAllTrades({
    userId: req.effectiveUserId,
    requestedLimit: req.query.limit,
  });
  res.setHeader('X-Truncated', truncated ? 'true' : 'false');
  res.json(trades);
}));

// @route   GET api/trades/summary
// @desc    Get a summary of trades grouped by broker, stock, and iteration with cost-basis and corporate actions
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const summary = await tradeExecutionService.getPortfolioSummary({
    userId: req.effectiveUserId,
  });
  res.json(summary);
}));

// @route   POST api/trades/split
// @desc    Log a stock split trade + corporate action record
router.post('/split', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const body = getValidated(req, 'body');
  const result = await tradeExecutionService.executeStockSplit({
    userId: req.effectiveUserId,
    ticker: body.stockCode,
    broker: body.broker,
    splitRatio: body.splitRatio,
    splitDate: body.date,
    canModify: req.canModify,
  });
  res.status(201).json(result);
}));

// @route   POST api/trades/corporate-action/wizard
// @desc    Wizard endpoint to apply split or bonus issue retroactively
router.post('/corporate-action/wizard', auth, validate({ body: wizardCorporateActionSchema }), asyncHandler(async (req, res) => {
  const body = getValidated(req, 'body');
  const result = await tradeExecutionService.executeCorporateAction({
    userId: req.effectiveUserId,
    data: body,
    canModify: req.canModify,
  });
  res.status(201).json(result);
}));

// @route   GET api/trades/market-prices
// @desc    Get stock market prices
router.get('/market-prices', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const data = await tradeExecutionService.getMarketPrices({ forceRefresh });
  res.json(data);
}));

// @route   POST api/trades
// @desc    Create a new trade
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const newTrade = await tradeExecutionService.createTrade({
    userId: req.effectiveUserId,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.status(201).json(newTrade);
}));

// @route   GET api/trades/deleted
// @desc    Get soft-deleted trades [FEAT-006, GAP-004]
router.get('/deleted', auth, asyncHandler(async (req, res) => {
  const result = await tradeExecutionService.getDeletedTrades({
    userId: req.effectiveUserId,
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json(result);
}));

// @route   GET api/trades/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const trade = await tradeExecutionService.getTradeById({
    userId: req.effectiveUserId,
    id,
  });
  res.json(trade);
}));

// @route   PUT api/trades/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const trade = await tradeExecutionService.updateTrade({
    userId: req.effectiveUserId,
    id,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.json(trade);
}));

// @route   DELETE api/trades/:id
// @desc    Soft delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await tradeExecutionService.deleteTrade({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   POST api/trades/:id/restore
// @desc    Restore a soft-deleted trade
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await tradeExecutionService.restoreTrade({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

module.exports = router;
