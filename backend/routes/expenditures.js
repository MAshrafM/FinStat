// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');


router.post('/', async (req, res) => {
  try {
    const newPaycheck = new Paycheck({
      month: req.body.month,
      type: req.body.type,
      amount: req.body.amount,
      note: req.body.note,
    });

    const paycheck = await newPaycheck.save();
    res.json(paycheck);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenditure/all
// @desc    Get ALL expenditure without pagination (for analysis pages)
router.get('/all', async (req, res) => {
  try {
    const expenditures = await Expenditure.find().sort({ createdAt: -1 });
    res.json(expenditures); // Returns the plain array
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }});

// @route   GET api/expenditures
// @desc    Get all expenditure logs, sorted by date descending
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;
    // Get total number of documents for pagination calculation
    const total = await Expenditure.countDocuments();

    // Get the paginated data, sorted by creation date to be consistent
    const expenditures = await Expenditure.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: expenditures,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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
