// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Bring in the Paycheck model
const Paycheck = require('../models/Paycheck');

// @route   POST api/paychecks
// @desc    Create a new paycheck
// @access  Public
router.post('/', auth, async (req, res) => {
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

// @route   GET api/paychecks/all
// @desc    Get ALL paychecks without pagination (for analysis pages)
router.get('/all', auth, async (req, res) => {
  try {
    const paychecks = await Paycheck.find().sort({ month: -1 });
    res.json(paychecks); // Returns the plain array
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/paychecks
// @desc    Get all paychecks
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    // Find all paychecks and sort them by date in descending order
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25; // Can use a different limit
      const skip = (page - 1) * limit;
      const year = parseInt(req.query.year);

      // Build query for year filter
      const query = {};
      if (!isNaN(year)) {
          query.month = query.month = { $regex: `^${year}` };
      }
    const total = await Paycheck.countDocuments(query);

    const paychecks = await Paycheck.find(query)
      .sort({ month: -1, createdAt: -1 }) // Sort by month, then creation time
      .skip(skip)
      .limit(limit);
    res.json({
      data: paychecks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/paychecks/:id
// @desc    Get a single paycheck by ID
// @access  Public
router.get('/:id', auth, async (req, res) => {
  try {
    const paycheck = await Paycheck.findById(req.params.id);

    if (!paycheck) {
      return res.status(404).json({ msg: 'Paycheck not found' });
    }

    res.json(paycheck);
  } catch (err) {
    console.error(err.message);
    // If the ID is not a valid format, it can also cause an error
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Paycheck not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/paychecks/:id
// @desc    Update a paycheck
// @access  Public
router.put('/:id', auth, async (req, res) => {
  try {
    const paycheck = await Paycheck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // This option returns the document after the update
    );
    if (!paycheck) {
      return res.status(404).json({ msg: 'Paycheck not found' });
    }
    res.json(paycheck);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/paychecks/:id
// @desc    Delete a paycheck
// @access  Public
router.delete('/:id', auth, async (req, res) => {
  try {
    const paycheck = await Paycheck.findById(req.params.id);
    if (!paycheck) {
      return res.status(404).json({ msg: 'Paycheck not found' });
    }
    await paycheck.deleteOne(); // Mongoose v6+ uses deleteOne()
    res.json({ msg: 'Paycheck removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
