// backend/routes/golds.js
const express = require('express');
const router = express.Router();
const Gold = require('../models/Gold');
const axios = require('axios');
const auth = require('../middleware/auth');

// Standard CRUD routes, very similar to our other features

// @route   GET api/golds
// @desc    Get all gold logs (with pagination)
router.get('/', auth, async (req, res) => {
    const page = Number.isInteger(Number(req.query.page)) && Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = 25;
    const skip = (page - 1) * limit;
    const { status, sortBy, sortOrder } = req.query;
    
    try {
        const query = { user: req.user.id };
        if (status && status !== 'all') {
            query.status = status;
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions.date = -1; // Default sort
            sortOptions.createdAt = -1;
        }

        const logs = await Gold.find(query).sort(sortOptions).skip(skip).limit(limit);
        const total = await Gold.countDocuments(query);
        res.json({
            data: logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/golds
// @desc    Get all gold logs (without pagination)
router.get('/all', auth, async (req, res) => {
    try {
        const logs = await Gold.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/golds/summary
// @desc    Get summary of gold logs
router.get('/summary', auth, async (req, res) => {
    try {
        const summary = await Gold.aggregate([
            // Stage 1: Group documents by status and karat
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
                            // Only calculate for 'sold' items to avoid errors with 'hold' items
                            $cond: [
                                { $eq: ["$status", "sold"] },
                                { $multiply: [{ $ifNull: ["$sellingPrice", 0] }, "$weight"] }, // sellingPrice * weight
                                0
                            ]
                        }
                    },
                    itemCount: { $sum: 1 },
                    // Calculate the total holding period in days for sold items
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
            // Stage 2: Project the fields to a more friendly format
            {
                $project: {
                    _id: 0, // Exclude the default _id
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
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/golds/price
// @desc    Get the current gold price per gram
router.get('/price', auth, async (req, res) => {
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
        }
        res.json( pricePerGram );
    } catch (err) {
        console.error(err.message);
        try {
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
            }
            res.json( fallPricePerGram );
        } catch (innerErr) {
            res.status(500).send('Server Error Gold Price not reachable');
        }
    }
});

// @route   POST api/golds
// @desc    Create a new gold log
router.post('/', auth, async (req, res) => {
    try {
        const newLog = new Gold({...req.body, user: req.user.id});
        await newLog.save();
        res.json(newLog);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   GET api/golds/:id
// @desc    Get a single log by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const log = await Gold.findById(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Log not found' });
        res.json(log);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/golds/:id
// @desc    Update a log
router.put('/:id', auth, async (req, res) => {
    try {
        let log = await Gold.findById(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Gold not found' });
        if(log.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        log = await Gold.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(log);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/golds/:id
// @desc    Delete a log
router.delete('/:id', auth, async (req, res) => {
    try {
        let log = await Gold.findById(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Gold not found' });
        if(log.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        log = await Gold.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
