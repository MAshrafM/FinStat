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

    try {
        const logs = await Gold.find().sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
        const total = await Gold.countDocuments();
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
        const logs = await Gold.find().sort({ date: -1, createdAt: -1 });
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
            // Stage 1: Group documents by the karat
            {
                $group: {
                    _id: "$karat", // The field to group by. The result will be in the _id field.
                    totalWeight: { $sum: "$weight" }, // Sum up the weight for each karat group
                    totalPaid: { $sum: "$paid" },     // Sum up the total amount paid for each group
                    itemCount: { $sum: 1 }            // Count the number of items in each group
                }
            },
            // Stage 2: Sort the results by karat in descending order (e.g., 24K, 22K, ...)
            {
                $sort: {
                    _id: -1
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
        res.status(500).send('Server Error');
    }
});

// @route   POST api/golds
// @desc    Create a new gold log
router.post('/', auth, async (req, res) => {
    try {
        const newLog = new Gold(req.body);
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
        const log = await Gold.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!log) return res.status(404).json({ msg: 'Log not found' });
        res.json(log);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

// @route   DELETE api/golds/:id
// @desc    Delete a log
router.delete('/:id', auth, async (req, res) => {
    try {
        const log = await Gold.findByIdAndDelete(req.params.id);
        if (!log) return res.status(404).json({ msg: 'Log not found' });
        res.json({ msg: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
