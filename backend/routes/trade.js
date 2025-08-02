// backend/routes/trades.js
const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');

// @route   GET api/trades
// @desc    Get all trades (with pagination)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const skip = (page - 1) * limit;
  const broker = req.query.broker; // Get the broker from the query string

  // 1. Build a dynamic query object
  const query = {};
  if (broker) {
    query.broker = broker; // If a broker is provided, add it to the query
  }

  try {
    const trades = await Trade.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit);
    const total = await Trade.countDocuments(query);
    res.json({
      data: trades,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/trades
// @desc    Get all trades (with pagination)
router.get('/all', async (req, res) => {
  try {
    const trades = await Trade.find().sort({createdAt:-1});
    res.json(trades);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/trades
// @desc    Create a new trade
router.post('/', async (req, res) => {
  try {
    const newTrade = new Trade(req.body);
    await newTrade.save();
    res.json(newTrade);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   GET api/trades/:id
// @desc    Get a single trade by ID
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/trades/:id
// @desc    Update a trade
router.put('/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// @route   DELETE api/trades/:id
// @desc    Delete a trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndDelete(req.params.id);
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });
    res.json({ msg: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
