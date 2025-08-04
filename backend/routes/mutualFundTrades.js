// backend/routes/mutualFundTrades.js
const express = require('express');
const router = express.Router();
const MutualFundTrade = require('../models/MutualFundTrade');

// @route   GET api/mutual-funds
// @desc    Get all mutual fund trades (with pagination)
router.get('/', async (req, res) => {
    const page = Number.isInteger(Number(req.query.page)) && Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    const type = req.query.type; // Optional filter by type

    const query = {};

    if (type && type !== 'all') {
        query.type = type; // Filter by type if provided
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

router.get('/code/:code', async (req, res) => {
    try {
        const trade = await MutualFundTrade.find({ code: req.params.code });
        if (!trade || trade.length === 0) return res.status(404).json({ msg: 'Trade not found' });
        res.json(trade);
        } catch (err) {
            res.status(500).send('Server Error');
        }
});

router.get('/all', async (req, res) => {
    try {
        const trades = await MutualFundTrade.find().sort({ date: -1, createdAt: -1 });
        res.json(trades);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/mutual-funds
// @desc    Create a new trade
router.post('/', async (req, res) => {
    try {
        const newTrade = new MutualFundTrade(req.body);
        await newTrade.save();
        res.json(newTrade);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   GET api/mutual-funds/summary
// @desc    Get a summary of mutual funds grouped by fund code
// @access  Public
router.get('/summary', async (req, res) => {
    try {
        const summary = await MutualFundTrade.aggregate([
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
router.get('/:id', async (req, res) => {
    try {
        const trade = await MutualFundTrade.findById(req.params.id);
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        res.json(trade);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/mutual-funds/:id
// @desc    Update a trade
router.put('/:id', async (req, res) => {
    try {
        const trade = await MutualFundTrade.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        res.json(trade);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/mutual-funds/:id
// @desc    Delete a trade
router.delete('/:id', async (req, res) => {
    try {
        const trade = await MutualFundTrade.findByIdAndDelete(req.params.id);
        if (!trade) return res.status(404).json({ msg: 'Trade not found' });
        res.json({ msg: 'Trade deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
