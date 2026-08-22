// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/expenditureSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/expenditures/all
// @desc    Get ALL expenditure without pagination (for analysis pages)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const expenditures = await Expenditure.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(expenditures);
}));

// @route   GET api/expenditures/latest
// @desc    Get latest expenditure record
router.get('/latest', auth, asyncHandler(async (req, res) => {
  const latestExpenditure = await Expenditure.findOne({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(latestExpenditure);
}));

// @route   GET api/expenditures
// @desc    Get all expenditure logs, sorted by date descending
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
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

  const total = await Expenditure.countDocuments(query);
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
}));

// @route   POST api/expenditures
// @desc    Create a new expenditure log
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const validatedBody = getValidated(req, 'body');
  const newExpenditure = new Expenditure({ ...validatedBody, user: req.user.id });
  const expenditure = await newExpenditure.save();
  res.status(201).json(expenditure);
}));

// @route   GET api/expenditures/:id
// @desc    Get a single expenditure log by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  res.json(expenditure);
}));

// @route   PUT api/expenditures/:id
// @desc    Update an expenditure log
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (expenditure.user.toString() !== req.user.id) {
    throw new ForbiddenError('User not authorized');
  }

  expenditure = await Expenditure.findByIdAndUpdate(id, validatedBody, { new: true, runValidators: true });
  res.json(expenditure);
}));

// @route   DELETE api/expenditures/:id
// @desc    Delete an expenditure log
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  let expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (expenditure.user.toString() !== req.user.id) {
    throw new ForbiddenError('User not authorized');
  }
  await Expenditure.findByIdAndDelete(id);
  res.json({ msg: 'Expenditure deleted' });
}));

module.exports = router;

