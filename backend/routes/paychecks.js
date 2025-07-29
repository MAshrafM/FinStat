// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();

// Bring in the Paycheck model
const Paycheck = require('../models/Paycheck');

// @route   POST api/paychecks
// @desc    Create a new paycheck
// @access  Public
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

// @route   GET api/paychecks
// @desc    Get all paychecks
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find all paychecks and sort them by date in descending order
    const paychecks = await Paycheck.find().sort({ date: -1 });
    res.json(paychecks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/paychecks/:id
// @desc    Update a paycheck
// @access  Public
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
