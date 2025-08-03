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

    try {
        const trades = await MutualFundTrade.find().sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
        const total = await MutualFundTrade.countDocuments();
        res.json({
            data: trades,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
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
