// backend/routes/currency.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Currency = require('../models/Currency');
const mongoose = require('mongoose');
const axios = require('axios');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  paramsSchema,
} = require('../validationSchemas/currencySchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const marketPriceService = require('../utils/marketPriceService');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

// @route   GET api/currency
// @desc    Get all active currencies
router.get('/', auth, asyncHandler(async (req, res) => {
  const currencies = await Currency.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1 });
  res.json(currencies);
}));

// @route   POST api/currency
// @desc    Create a new currency entry
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newCurrency = new Currency({
    ...validatedBody,
    user: req.effectiveUserId,
    priceInPiastres: toPiastres(validatedBody.price),
  });
  await newCurrency.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(newCurrency);
}));

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

router.get('/price', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const result = await marketPriceService.getCurrencyRates({ forceRefresh });
  res.json(result.data);
}));

// @route   GET api/currency/:id
// @desc    Get a single Currency by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const currency = await Currency.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!currency) {
    throw new NotFoundError('Currency not found');
  }
  res.json(currency);
}));

// @route   PUT api/currency/:id
// @desc    Update a Currency
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

  currency = await Currency.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  invalidatePortfolioCache(req.effectiveUserId);
  res.json(currency);
}));

// @route   DELETE api/currency/:id
// @desc    Soft delete a Currency
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
  res.json({ msg: 'Currency restored successfully', currency });
}));

module.exports = router;
