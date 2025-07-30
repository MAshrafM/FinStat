// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');

// @route   GET api/expenditures
// @desc    Get all expenditure logs, sorted by date descending
router.get('/', async (req, res) => {
  try {
    const expenditures = await Expenditure.find().sort({ date: -1 });
    res.json(expenditures);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/latest', async(req, res) =>{
  try{
    // Find one record, sort by the 'createdAt' timestamp descending to get the latest.
    const latestExpenditure = await Expenditure.findOne().sort({ createdAt: -1 });
    res.json(latestExpenditure); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
  }
);

// @route   POST api/expenditures
// @desc    Create a new expenditure log
router.post('/', async (req, res) => {
  try {
    const newExpenditure = new Expenditure(req.body);
    const expenditure = await newExpenditure.save();
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenditures/:id
// @desc    Get a single expenditure log by ID
router.get('/:id', async (req, res) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/expenditures/:id
// @desc    Update an expenditure log
router.put('/:id', async (req, res) => {
  try {
    const expenditure = await Expenditure.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/expenditures/:id
// @desc    Delete an expenditure log
router.delete('/:id', async (req, res) => {
  try {
    const expenditure = await Expenditure.findByIdAndDelete(req.params.id);
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    res.json({ msg: 'Expenditure deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
