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
const { toPiastres } = require('../utils/currencyUtils');

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
    amountInPiastres: toPiastres(validatedBody.amount),
    grossAmountInPiastres: toPiastres(validatedBody.grossAmount),
    insuranceDeductionInPiastres: toPiastres(validatedBody.insuranceDeduction),
    taxDeductionInPiastres: toPiastres(validatedBody.taxDeduction),
  });

  const paycheck = await newPaycheck.save();
  res.status(201).json(paycheck);
}));

// @route   GET api/paychecks/all
// @desc    Get ALL non-deleted paychecks without pagination (for analysis pages)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const paychecks = await Paycheck.find({ user: req.effectiveUserId, deletedAt: null }).sort({ month: -1 });
  res.json(paychecks);
}));

// @route   GET api/paychecks
// @desc    Get all active paychecks
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, year } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
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
  const paycheck = await Paycheck.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });

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

  let paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.amount !== undefined) {
    updateData.amountInPiastres = toPiastres(validatedBody.amount);
  }
  if (validatedBody.grossAmount !== undefined) {
    updateData.grossAmountInPiastres = toPiastres(validatedBody.grossAmount);
  }
  if (validatedBody.insuranceDeduction !== undefined) {
    updateData.insuranceDeductionInPiastres = toPiastres(validatedBody.insuranceDeduction);
  }
  if (validatedBody.taxDeduction !== undefined) {
    updateData.taxDeductionInPiastres = toPiastres(validatedBody.taxDeduction);
  }

  paycheck = await Paycheck.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );
  res.json(paycheck);
}));

// @route   DELETE api/paychecks/:id
// @desc    Soft delete a paycheck
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await paycheck.softDelete();
  res.json({ msg: 'Paycheck removed' });
}));

// @route   POST api/paychecks/:id/restore
// @desc    Restore a soft-deleted paycheck
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const paycheck = await Paycheck.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!paycheck) {
    throw new NotFoundError('Soft-deleted paycheck not found');
  }
  await paycheck.restore();
  res.json({ msg: 'Paycheck restored successfully', paycheck });
}));

module.exports = router;
