// backend/routes/realEstates.js
const express = require('express');
const router = express.Router();
const RealEstate = require('../models/RealEstate');
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
} = require('../validationSchemas/realEstateSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

// @route   GET api/real-estates
// @desc    Get all active real estate properties
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { status, type, search } = getValidated(req, 'query');
  const query = { user: req.effectiveUserId, deletedAt: null };

  if (status && status !== 'all') {
    query.status = status;
  }
  if (type && type !== 'all') {
    query.type = type;
  }
  if (search && search.trim() !== '') {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  const properties = await RealEstate.find(query).sort({ purchaseDate: -1, createdAt: -1 });
  res.json(properties);
}));

// @route   GET api/real-estates/summary
// @desc    Get aggregated summary of real estate holdings
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const userObjectId = new mongoose.Types.ObjectId(req.effectiveUserId);
  const summary = await RealEstate.aggregate([
    { $match: { user: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: '$status',
        totalPaid: { $sum: '$purchasePrice' },
        totalValuation: { $sum: '$currentValuation' },
        totalSoldValue: { $sum: '$sellingPrice' },
        count: { $sum: 1 },
      },
    },
  ]);

  let ownedPaid = 0;
  let ownedValuation = 0;
  let ownedCount = 0;
  let soldPaid = 0;
  let soldValue = 0;
  let soldCount = 0;

  for (const s of summary) {
    if (s._id === 'Owned') {
      ownedPaid = s.totalPaid;
      ownedValuation = s.totalValuation;
      ownedCount = s.count;
    } else if (s._id === 'Sold') {
      soldPaid = s.totalPaid;
      soldValue = s.totalSoldValue;
      soldCount = s.count;
    }
  }

  res.json({
    owned: {
      totalPaid: ownedPaid,
      totalValuation: ownedValuation,
      unrealizedGain: ownedValuation - ownedPaid,
      gainPercentage: ownedPaid > 0 ? ((ownedValuation - ownedPaid) / ownedPaid) * 100 : 0,
      count: ownedCount,
    },
    sold: {
      totalPaid: soldPaid,
      totalSoldValue: soldValue,
      realizedGain: soldValue - soldPaid,
      count: soldCount,
    },
    totalProperties: ownedCount + soldCount,
  });
}));

// @route   POST api/real-estates
// @desc    Create a new real estate property
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newProperty = new RealEstate({
    ...validatedBody,
    user: req.effectiveUserId,
    purchasePriceInPiastres: toPiastres(validatedBody.purchasePrice),
    currentValuationInPiastres: toPiastres(validatedBody.currentValuation),
    sellingPriceInPiastres: toPiastres(validatedBody.sellingPrice || 0),
  });
  await newProperty.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(newProperty);
}));

// @route   GET api/real-estates/:id
// @desc    Get a single property by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const property = await RealEstate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!property) {
    throw new NotFoundError('Property not found');
  }
  res.json(property);
}));

// @route   PUT api/real-estates/:id
// @desc    Update a property
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let property = await RealEstate.findOne({ _id: id, deletedAt: null });
  if (!property) {
    throw new NotFoundError('Property not found');
  }
  if (property.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.purchasePrice !== undefined) {
    updateData.purchasePriceInPiastres = toPiastres(validatedBody.purchasePrice);
  }
  if (validatedBody.currentValuation !== undefined) {
    updateData.currentValuationInPiastres = toPiastres(validatedBody.currentValuation);
  }
  if (validatedBody.sellingPrice !== undefined) {
    updateData.sellingPriceInPiastres = toPiastres(validatedBody.sellingPrice);
  }

  property = await RealEstate.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  invalidatePortfolioCache(req.effectiveUserId);
  res.json(property);
}));

// @route   DELETE api/real-estates/:id
// @desc    Soft delete a property
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const property = await RealEstate.findOne({ _id: id, deletedAt: null });
  if (!property) {
    throw new NotFoundError('Property not found');
  }
  if (property.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await property.softDelete();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Property deleted successfully' });
}));

// @route   POST api/real-estates/:id/restore
// @desc    Restore a soft-deleted property
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const property = await RealEstate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!property) {
    throw new NotFoundError('Soft-deleted property not found');
  }
  await property.restore();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Property restored successfully', property });
}));

module.exports = router;
