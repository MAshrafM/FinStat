// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/expenditureSchemas');
const { getValidated } = require('../utils/requestHelpers');


// @route   GET api/expenditure/all
// @desc    Get ALL expenditure without pagination (for analysis pages)
router.get('/all', auth, async (req, res) => {
  try {
    const expenditures = await Expenditure.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(expenditures); // Returns the plain array
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenditures/latest
// @desc    Get latest expenditure record
router.get('/latest', auth, async (req, res) => {
  try {
    const latestExpenditure = await Expenditure.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(latestExpenditure);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenditures
// @desc    Get all expenditure logs, sorted by date descending
router.get('/', auth, validate({ query: querySchema }), async (req, res) => {
  try {
    const { page, limit, type } = getValidated(req, 'query');
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    if (type && type !== 'all') {
      if (['Prepaid', 'Bank', 'Cash'].includes(type)) {
        query.paymentMethod = type;
      } else if (['W', 'T', 'S', 'na'].includes(type)) {
        query.transactionType = type;
      } else {
        query.categories = type;
      }
    }
    // Get total number of documents for pagination calculation
    const total = await Expenditure.countDocuments(query);

    // Get the paginated data, sorted by creation date to be consistent
    const expenditures = await Expenditure.find(query)
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

// @route   POST api/expenditures
// @desc    Create a new expenditure log
router.post('/', auth, validate({ body: createSchema }), async (req, res) => {
  try {
    const validatedBody = getValidated(req, 'body');
    const newExpenditure = new Expenditure({ ...validatedBody, user: req.user.id });
    const expenditure = await newExpenditure.save();
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   GET api/expenditures/:id
// @desc    Get a single expenditure log by ID
router.get('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    const expenditure = await Expenditure.findById(id);
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/expenditures/:id
// @desc    Update an expenditure log
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    const validatedBody = getValidated(req, 'body');

    let expenditure = await Expenditure.findById(id);
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    if (expenditure.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    expenditure = await Expenditure.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
    res.json(expenditure);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/expenditures/:id
// @desc    Delete an expenditure log
router.delete('/:id', auth, validate({ params: paramsSchema }), async (req, res) => {
  try {
    const { id } = getValidated(req, 'params');
    let expenditure = await Expenditure.findById(id);
    if (!expenditure) return res.status(404).json({ msg: 'Expenditure not found' });
    if (expenditure.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    expenditure = await Expenditure.findByIdAndDelete(id);
    res.json({ msg: 'Expenditure deleted' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
