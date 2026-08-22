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

// @route   GET api/mutual-funds
// @desc    Get all mutual fund trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
    const { page, limit, type } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
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
    const trade = await MutualFundTrade.find({ code: req.params.code, user: req.user.id });
    if (!trade || trade.length === 0) {
        throw new NotFoundError('Trade not found');
    }
    res.json(trade);
}));

router.get('/all', auth, asyncHandler(async (req, res) => {
    const trades = await MutualFundTrade.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
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
    const validatedBody = getValidated(req, 'body');
    const newTrade = new MutualFundTrade({ ...validatedBody, user: req.user.id });
    await newTrade.save();
    res.status(201).json(newTrade);
}));

// @route   GET api/mutual-funds/summary
// @desc    Get a summary of mutual funds grouped by fund code
router.get('/summary', auth, asyncHandler(async (req, res) => {
    const summary = await MutualFundTrade.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user.id) }
        },
        // Stage 1: Group documents by the fund code
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
        // Stage 2: Add new fields for final calculations
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
        // Stage 3: Add total value
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
    const trade = await MutualFundTrade.findById(id);
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    res.json(trade);
}));

// @route   PUT api/mutual-funds/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const validatedBody = getValidated(req, 'body');

    let trade = await MutualFundTrade.findById(id);
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    if (trade.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    trade = await MutualFundTrade.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
    res.json(trade);
}));

// @route   DELETE api/mutual-funds/:id
// @desc    Delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    let trade = await MutualFundTrade.findById(id);
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    if (trade.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    await MutualFundTrade.findByIdAndDelete(id);
    res.json({ msg: 'Trade deleted successfully' });
}));

module.exports = router;


