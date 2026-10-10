// backend/routes/currency.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Currency = require('../models/Currency');
const ForexRateHistory = require('../models/ForexRateHistory');
const mongoose = require('mongoose');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  revalueSchema,
  paramsSchema,
} = require('../validationSchemas/currencySchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const marketPriceService = require('../utils/marketPriceService');
const { invalidatePortfolioCache } = require('../utils/portfolioService');
const {
  normalizeCurrencyCode,
  fetchLatestRates,
  revalueCurrencyHolding,
  revalueAllCurrencyHoldings,
} = require('../utils/forexRevaluation');

/**
 * Helper to compute derived valuation metrics for a currency holding.
 */
function enrichCurrencyHolding(currencyDoc) {
  const plain = currencyDoc.toObject ? currencyDoc.toObject() : { ...currencyDoc };
  const amount = Number(plain.amount || 0);
  const purchaseRate = Number(plain.purchaseRate || (amount > 0 && plain.price ? plain.price / amount : 0));
  const currentRate = Number(plain.currentRate || purchaseRate);

  const costBasisInPiastres = plain.priceInPiastres || Math.round(amount * purchaseRate * 100);
  const currentValueInPiastres = plain.currentValueInPiastres || Math.round(amount * currentRate * 100);
  const unrealizedGainLossInPiastres = currentValueInPiastres - costBasisInPiastres;

  const costBasis = Number((costBasisInPiastres / 100).toFixed(2));
  const currentValue = Number((currentValueInPiastres / 100).toFixed(2));
  const unrealizedGainLoss = Number((unrealizedGainLossInPiastres / 100).toFixed(2));
  const gainLossPercentage = costBasis > 0 ? Number(((unrealizedGainLoss / costBasis) * 100).toFixed(2)) : 0;

  return {
    ...plain,
    currencyCode: plain.currencyCode || normalizeCurrencyCode(plain.name),
    purchaseRate,
    currentRate,
    costBasisInPiastres,
    costBasis,
    currentValueInPiastres,
    currentValue,
    unrealizedForexGainLossInPiastres: unrealizedGainLossInPiastres,
    unrealizedGainLoss,
    gainLossPercentage,
  };
}

// @route   GET api/currency
// @desc    Get all active currencies with valuations and health indicators
router.get('/', auth, asyncHandler(async (req, res) => {
  const currencies = await Currency.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1 });
  const enriched = currencies.map(enrichCurrencyHolding);
  res.json(enriched);
}));

// @route   POST api/currency
// @desc    Create a new currency entry and initialize valuation
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const code = validatedBody.currencyCode || normalizeCurrencyCode(validatedBody.name);
  const purchaseRate = validatedBody.purchaseRate || (validatedBody.amount > 0 ? Number((validatedBody.price / validatedBody.amount).toFixed(4)) : 0);

  const newCurrency = new Currency({
    ...validatedBody,
    currencyCode: code,
    purchaseRate,
    user: req.effectiveUserId,
    priceInPiastres: toPiastres(validatedBody.price),
  });

  // Attempt initial valuation against cached rates
  try {
    const { rates, rateSource, isStale } = await fetchLatestRates();
    revalueCurrencyHolding(newCurrency, rates, {
      rateSource: validatedBody.rateSource || rateSource,
      isStale,
      manualRate: validatedBody.currentRate || null,
    });
  } catch (err) {
    // If live rates cannot be reached, fallback gracefully
    newCurrency.currentRate = purchaseRate;
    newCurrency.currentValueInPiastres = newCurrency.priceInPiastres;
    newCurrency.unrealizedForexGainLossInPiastres = 0;
    newCurrency.rateSource = 'fallback';
    newCurrency.isStale = true;
  }

  await newCurrency.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(enrichCurrencyHolding(newCurrency));
}));

// @route   POST api/currency/revalue
// @desc    Manually trigger revaluation for all user holdings synchronously
router.post('/revalue', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const result = await revalueAllCurrencyHoldings(req.effectiveUserId, { saveSnapshot: true });
  const updatedHoldings = await Currency.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1 });

  res.json({
    success: true,
    message: `Successfully revalued ${result.updated} currency holding(s)`,
    ...result,
    holdings: updatedHoldings.map(enrichCurrencyHolding),
  });
}));

// @route   GET api/currency/rate-history
// @desc    Get historical exchange rate snapshots (paginated/filtered)
router.get('/rate-history', auth, asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const currencyCode = req.query.currencyCode ? req.query.currencyCode.toUpperCase() : null;

  const snapshots = await ForexRateHistory.find().sort({ date: -1 }).limit(limit);

  const formatted = snapshots.map((s) => {
    const ratesMap = s.rates instanceof Map ? Object.fromEntries(s.rates) : s.rates;
    return {
      _id: s._id,
      date: s.date,
      baseCurrency: s.baseCurrency || 'EGP',
      source: s.source,
      rate: currencyCode ? ratesMap[currencyCode] || null : null,
      rates: ratesMap,
    };
  });

  res.json(formatted);
}));

// @route   GET api/currency/summary
// @desc    Aggregated currency holdings by name/code
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const summary = await Currency.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(req.effectiveUserId), deletedAt: null }
    },
    {
      $group: {
        _id: "$name",
        totalAmount: { $sum: "$amount" },
        totalPrice: { $sum: "$price" },
      }
    }
  ]);
  res.json(summary);
}));

// @route   GET api/currency/price
// @desc    Get live CIB currency price feed
router.get('/price', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const result = await marketPriceService.getCurrencyRates({ forceRefresh });
  res.json(result.data);
}));

// @route   GET api/currency/:id
// @desc    Get a single Currency by ID with enriched valuation metrics
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const currency = await Currency.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!currency) {
    throw new NotFoundError('Currency not found');
  }
  res.json(enrichCurrencyHolding(currency));
}));

// @route   PUT api/currency/:id
// @desc    Update a Currency holding
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let currency = await Currency.findOne({ _id: id, deletedAt: null });
  if (!currency) {
    throw new NotFoundError('Currency not found');
  }
  if (currency.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.price !== undefined) {
    updateData.priceInPiastres = toPiastres(validatedBody.price);
  }

  // Recalculate purchaseRate if amount or price changed
  const newAmount = validatedBody.amount ?? currency.amount;
  const newPrice = validatedBody.price ?? currency.price;
  if (!validatedBody.purchaseRate && newAmount > 0 && newPrice > 0) {
    updateData.purchaseRate = Number((newPrice / newAmount).toFixed(4));
  }

  currency = await Currency.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  // Revalue holding with new params
  try {
    const { rates, rateSource, isStale } = await fetchLatestRates();
    revalueCurrencyHolding(currency, rates, {
      rateSource: validatedBody.rateSource || rateSource,
      isStale,
      manualRate: validatedBody.currentRate || null,
    });
    await currency.save();
  } catch (err) {
    // Keep existing valuation
  }

  invalidatePortfolioCache(req.effectiveUserId);
  res.json(enrichCurrencyHolding(currency));
}));

// @route   DELETE api/currency/:id
// @desc    Soft delete a Currency holding
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let currency = await Currency.findOne({ _id: id, deletedAt: null });
  if (!currency) {
    throw new NotFoundError('Currency not found');
  }
  if (currency.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await currency.softDelete();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Currency deleted successfully' });
}));

// @route   POST api/currency/:id/restore
// @desc    Restore a soft-deleted currency
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const currency = await Currency.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!currency) {
    throw new NotFoundError('Soft-deleted currency not found');
  }
  await currency.restore();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Currency restored successfully', currency: enrichCurrencyHolding(currency) });
}));

module.exports = router;
