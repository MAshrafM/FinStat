// backend/routes/mutualFundTrades.js
const express = require('express');
const router = express.Router();
 const MutualFundTrade = require('../models/MutualFundTrade');
const axios = require('axios');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    createSchema,
    updateSchema,
    paramsSchema,
    querySchema,
} = require('../validationSchemas/mutualFundSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/mutual-funds
// @desc    Get all mutual fund trades (with pagination)
router.get('/', auth, validate({ query: querySchema }), async (req, res) => {
    const { page, limit, type } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = {};

    if (type && type !== 'all') {
        query.type = type; // Filter by type if provided
        query.user = req.user.id;
    } else {
        query.user = req.user.id;
    }

    try {
        const trades = await MutualFundTrade.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
        const total = await MutualFundTrade.countDocuments(query);
        res.json({
            data: trades,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/code/:code', auth, async (req, res) => {
    try {
        const trade = await MutualFundTrade.find({ code: req.params.code, user: req.user.id });
        if (!trade || trade.length === 0) return res.status(404).json({ msg: 'Trade not found' });
        res.json(trade);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/all', auth, async (req, res) => {
    try {
        const trades = await MutualFundTrade.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
        res.json(trades);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @ route   GET api/mutual-funds/last-price
// @desc    Get the last price of a mutual fund
router.get('/last-price', auth, async (req, res) => {
    try {
        const fundName = req.query.name; // Get the fund name from query parameters
        const response = await axios.get(`https://english.mubasher.info/api/1/funds?country=eg&name=${fundName}`);
        res.json(response.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/mutual-funds
// @desc    Create a new trade
router.post('/', auth, validate({ body: createSchema }), async (req, res) => {
    try {
        const validatedBody = getValidated(req, 'body');
        const newTrade = new MutualFundTrade({ ...validatedBody, user: req.user.id });
        await newTrade.save();
        res.json(newTrade);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   GET api/mutual-funds/summary
// @desc    Get a summary of mutual funds grouped by fund code
// @access  Public
router.get('/summary', auth, async (req, res) => {
    try {
        const summary = await MutualFundTrade.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(req.user.id) }
            },
            // Stage 1: Group documents by the fund code
            {
                $group: {
                    _id: {
                        code: "$code",
                        name: "$name" // Also group by name to have it available
                    },
                    // Stage 2: Use conditional aggregation to calculate totals
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
            // Stage 3: Add new fields for final calculations
            {
                $addFields: {
                    currentUnits: {
                        $subtract: ["$totalUnitsBought", "$totalUnitsSold"]
                    },
                    // Calculate average price: total spent / total units bought
                    // Add a check to prevent division by zero
                    averagePrice: {
                        $cond: [
                            { $gt: ["$totalUnitsBought", 0] },
                            { $divide: ["$totalBuyValue", "$totalUnitsBought"] },
                            0
                        ]
                    }
                }
            },
            // Stage 4: Add another fields stage for calculations that depend on the previous one
            {
                $addFields: {
                    totalValue: {
                        $subtract: ["$totalBuyValue", "$totalSellValue"]
                    }
                }
            },
            {
                $sort: {
                    "_id.name": 1 // Sort by fund name
                }
            }
        ]);
        res.json(summary);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/mutual-funds/:id
// @desc    Get a single trade by ID
router.get('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        const trade = await MutualFundTrade.findById(id);
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        res.json(trade);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/mutual-funds/:id
// @desc    Update a trade
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        const validatedBody = getValidated(req, 'body');

        let trade = await MutualFundTrade.findById(id);
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        if (trade.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
        trade = await MutualFundTrade.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
        res.json(trade);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/mutual-funds/:id
// @desc    Delete a trade
router.delete('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
    try {
        const { id } = getValidated(req, 'params');
        let trade = await MutualFundTrade.findById(id);
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        if (trade.user.toString() !== req.user.id) { return res.status(401).json({ msg: 'User not authorized' }); }
        trade = await MutualFundTrade.findByIdAndDelete(id);
        res.json({ msg: 'Trade deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

