// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
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
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newPaycheck = new Paycheck({
    ...validatedBody,
    user: req.effectiveUserId,
  });

  const paycheck = await newPaycheck.save();
  res.status(201).json(paycheck);
}));

// @route   GET api/paychecks/all
// @desc    Get ALL paychecks without pagination (for analysis pages)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const paychecks = await Paycheck.find({ user: req.effectiveUserId }).sort({ month: -1 });
  res.json(paychecks);
}));

// @route   GET api/paychecks
// @desc    Get all paychecks
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, year } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId };
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
}));

// @route   GET api/paychecks/:id
// @desc    Get a single paycheck by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const paycheck = await Paycheck.findOne({ _id: id, user: req.effectiveUserId });

  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }

  res.json(paycheck);
}));

// @route   PUT api/paychecks/:id
// @desc    Update a paycheck
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let paycheck = await Paycheck.findById(id);
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  paycheck = await Paycheck.findByIdAndUpdate(
    id,
    validatedBody,
    { new: true, runValidators: true }
  );
  res.json(paycheck);
}));

// @route   DELETE api/paychecks/:id
// @desc    Delete a paycheck
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let paycheck = await Paycheck.findById(id);
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await paycheck.deleteOne();
  res.json({ msg: 'Paycheck removed' });
}));

module.exports = router;


