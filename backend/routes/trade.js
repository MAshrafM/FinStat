// backend/routes/trades.js
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

// @route   GET api/trades
// @desc    Get all trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
    const { page, limit, broker, search } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
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
// @desc    Get all trades (without pagination)
router.get('/all', auth, asyncHandler(async (req, res) => {
    const trades = await Trade.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(trades);
}));

// @route   GET api/trades/summary
// @desc    Get a summary of trades grouped by broker, stock, and iteration
router.get('/summary', auth, asyncHandler(async (req, res) => {
    const summary = await Trade.aggregate([
        // --- Stage 0: Match user ---
        {
            $match: { user: new mongoose.Types.ObjectId(req.user.id) }
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
                        { $eq: ["$totalSharesBought", 0] },
                        0,
                        { $divide: ["$totalBuyValue", "$totalSharesBought"] }
                    ]
                },
                adjustedAvgPrice: {
                    $cond: [
                        { $eq: [{ $add: ["$totalSharesBought", "$totalSharesDividend"] }, 0] },
                        0,
                        {
                            $divide: [
                                "$totalBuyValue",
                                { $add: ["$totalSharesBought", "$totalSharesDividend"] }
                            ]
                        }
                    ]
                }
            }
        },

        // --- Stage 3: Calculate Cost of Goods Sold (COGS) ---
        {
            $addFields: {
                costOfSoldShares: {
                    $multiply: ["$totalSharesSold", "$averageBuyPrice"]
                },
                netBreakEvenPrice: {
                    $cond: [
                        { $lte: [{ $subtract: [{ $add: ["$totalSharesBought", "$totalSharesDividend"] }, "$totalSharesSold"] }, 0] },
                        0,
                        {
                            $divide: [
                                {
                                    $subtract: [
                                        "$totalBuyValue",
                                        { $add: ["$totalSellValue", "$totalDividendValue"] }
                                    ]
                                },
                                { $subtract: [{ $add: ["$totalSharesBought", "$totalSharesDividend"] }, "$totalSharesSold"] }
                            ]
                        }
                    ]
                }
            }
        },

        // --- Stage 4: Final P/L Calculation ---
        {
            $addFields: {
                tradingPL: {
                    $subtract: ["$totalSellValue", "$costOfSoldShares"]
                },
                dividendIncome: "$totalDividendValue",
                totalRealizedReturn: {
                    $add: [
                        { $subtract: ["$totalSellValue", "$costOfSoldShares"] },
                        "$totalDividendValue"
                    ]
                },
                totDeals: {
                    $subtract: [
                        "$totalBuyValue",
                        { $add: ["$totalSellValue", "$totalDividendValue"] }
                    ]
                },
                investedAmountRemaining: {
                    $multiply: ["$currentShares", "$averageBuyPrice"]
                }
            }
        },

        // --- Stage 5: Sorting ---
        {
            $sort: {
                "_id.stockCode": 1,
                "lastTradeDate": -1
            }
        }
    ]);
    res.json(summary);
}));

router.get('/market-prices', auth, asyncHandler(async (req, res) => {
    const response = await axios.get('https://english.mubasher.info/api/1/stocks/prices?country=eg');
    res.json(response.data);
}));

// @route   POST api/trades
// @desc    Create a new trade
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
    const validatedBody = getValidated(req, 'body');
    const newTrade = new Trade({ ...validatedBody, user: req.user.id });
    await newTrade.save();
    res.status(201).json(newTrade);
}));

// @route   GET api/trades/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const trade = await Trade.findOne({ _id: id, user: req.user.id });
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    res.json(trade);
}));

// @route   PUT api/trades/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const validatedBody = getValidated(req, 'body');

    let trade = await Trade.findById(id);
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    if (trade.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    trade = await Trade.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
    res.json(trade);
}));

// @route   DELETE api/trades/:id
// @desc    Delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    let trade = await Trade.findById(id);
    if (!trade) {
        throw new NotFoundError('Trade not found');
    }
    if (trade.user.toString() !== req.user.id) {
        throw new ForbiddenError('User not authorized');
    }
    await Trade.findByIdAndDelete(id);
    res.json({ msg: 'Trade deleted successfully' });
}));

module.exports = router;


