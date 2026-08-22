// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Paycheck = require('../models/Paycheck');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/paycheckSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   POST api/paychecks
// @desc    Create a new paycheck
router.post('/', auth, validate({ body: createSchema }), async (req, res) => {
  try {
    const validatedBody = getValidated(req, 'body');
    const newPaycheck = new Paycheck({
      ...validatedBody,
      user: req.user.id,
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
    const paychecks = await Paycheck.find({ user: req.user.id }).sort({ month: -1 });
    res.json(paychecks); // Returns the plain array
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/paychecks
// @desc    Get all paychecks
router.get('/', auth, validate({ query: querySchema }), async (req, res) => {
  try {
    const { page, limit, year } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    if (year) {
      query.month = { $regex: `^${year}` };
    }

    const total = await Paycheck.countDocuments(query);
    const paychecks = await Paycheck.find(query)
      .sort({ month: -1, createdAt: -1 })
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
router.get('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    const paycheck = await Paycheck.findById(id);

    if (!paycheck) {
      return res.status(404).json({ msg: 'Paycheck not found' });
    }

    res.json(paycheck);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/paychecks/:id
// @desc    Update a paycheck
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    const validatedBody = getValidated(req, 'body');

    let paycheck = await Paycheck.findById(id);
    if (!paycheck) return res.status(404).json({ msg: 'Paycheck not found' });
    if (paycheck.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    paycheck = await Paycheck.findByIdAndUpdate(
      id,
      validatedBody,
      { new: true, runValidators: true }
    );
    res.json(paycheck);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/paychecks/:id
// @desc    Delete a paycheck
router.delete('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    let paycheck = await Paycheck.findById(id);
    if (!paycheck) return res.status(404).json({ msg: 'Paycheck not found' });
    if (paycheck.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await paycheck.deleteOne();
    res.json({ msg: 'Paycheck removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

