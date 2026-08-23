// backend/routes/golds.js
const express = require('express');
const router = express.Router();
const Gold = require('../models/Gold');
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
} = require('../validationSchemas/goldSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');

// @route   GET api/golds
// @desc    Get all gold logs (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, status, sortBy, sortOrder } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
  if (status && status !== 'all') {
    query.status = status;
  }

  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sortOptions.date = -1;
    sortOptions.createdAt = -1;
  }

  const logs = await Gold.find(query).sort(sortOptions).skip(skip).limit(limit);
  const total = await Gold.countDocuments(query);
  res.json({
    data: logs,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
}));

// @route   GET api/golds/all
// @desc    Get all gold logs (without pagination)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const logs = await Gold.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1, createdAt: -1 });
  res.json(logs);
}));

// @route   GET api/golds/summary
// @desc    Get summary of gold logs
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const summary = await Gold.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(req.effectiveUserId), deletedAt: null }
    },
    {
      $group: {
        _id: {
          status: "$status",
          karat: "$karat"
        },
        totalWeight: { $sum: "$weight" },
        totalPaid: { $sum: "$paid" },
        totalSellingPrice: {
          $sum: {
            $cond: [
              { $eq: ["$status", "sold"] },
              { $multiply: [{ $ifNull: ["$sellingPrice", 0] }, "$weight"] },
              0
            ]
          }
        },
        itemCount: { $sum: 1 },
        totalHoldingDays: {
          $sum: {
            $cond: [
              { $eq: ["$status", "sold"] },
              { $divide: [{ $subtract: ["$sellingDate", "$date"] }, 1000 * 60 * 60 * 24] },
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        status: "$_id.status",
        karat: "$_id.karat",
        totalWeight: 1,
        totalPaid: 1,
        totalSellingPrice: 1,
        itemCount: 1,
        avgHoldingDays: { $cond: [{ $gt: ["$itemCount", 0] }, { $divide: ["$totalHoldingDays", "$itemCount"] }, 0] }
      }
    }
  ]);
  res.json(summary);
}));

// @route   GET api/golds/price
// @desc    Get the current gold price per gram
router.get('/price', auth, asyncHandler(async (req, res) => {
  try {
    const response = await axios.get('https://dahabmasr.com/api/price/fetch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://dahabmasr.com/',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });

    const data = response.data[0];
    const pricePerGram = {
      '24': data.LocalSellPrice24,
      '21': data.Sell,
      '18': data.LocalSellPrice18,
    };
    res.json(pricePerGram);
  } catch (err) {
    const fallResponse = await axios.get('https://dahabzaman.eg/en/GoldPrice/GetcurrentPriceList', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://dahabzaman.eg',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin'
      }
    });
    const fallData = fallResponse.data;
    const fallPricePerGram = {
      '24': fallData["1"].SellPrice,
      '21': fallData["2"].SellPrice,
      '18': fallData["3"].SellPrice,
    };
    res.json(fallPricePerGram);
  }
}));

// @route   POST api/golds
// @desc    Create a new gold log
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newLog = new Gold({
    ...validatedBody,
    user: req.effectiveUserId,
    priceInPiastres: toPiastres(validatedBody.price),
    paidInPiastres: toPiastres(validatedBody.paid),
    sellingPriceInPiastres: toPiastres(validatedBody.sellingPrice),
  });
  await newLog.save();
  res.status(201).json(newLog);
}));

// @route   GET api/golds/:id
// @desc    Get a single log by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const log = await Gold.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!log) {
    throw new NotFoundError('Gold log not found');
  }
  res.json(log);
}));

// @route   PUT api/golds/:id
// @desc    Update a log
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let log = await Gold.findOne({ _id: id, deletedAt: null });
  if (!log) {
    throw new NotFoundError('Gold log not found');
  }
  if (log.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.price !== undefined) {
    updateData.priceInPiastres = toPiastres(validatedBody.price);
  }
  if (validatedBody.paid !== undefined) {
    updateData.paidInPiastres = toPiastres(validatedBody.paid);
  }
  if (validatedBody.sellingPrice !== undefined) {
    updateData.sellingPriceInPiastres = toPiastres(validatedBody.sellingPrice);
  }

  log = await Gold.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  res.json(log);
}));

// @route   DELETE api/golds/:id
// @desc    Soft delete a log
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let log = await Gold.findOne({ _id: id, deletedAt: null });
  if (!log) {
    throw new NotFoundError('Gold log not found');
  }
  if (log.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await log.softDelete();
  res.json({ msg: 'Log deleted successfully' });
}));

// @route   POST api/golds/:id/restore
// @desc    Restore a soft-deleted gold log
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const log = await Gold.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!log) {
    throw new NotFoundError('Soft-deleted gold log not found');
  }
  await log.restore();
  res.json({ msg: 'Gold log restored successfully', log });
}));

module.exports = router;
