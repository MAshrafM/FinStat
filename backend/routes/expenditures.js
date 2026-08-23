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
const {
  calculateSignedDelta,
  calculateSignedDeltas,
  calculatePreviousBalance,
  propagateBalanceChange,
  propagateBalanceChanges,
  executeInTransaction,
} = require('../utils/ledgerHelpers');

// @route   GET api/expenditures/all
// @desc    Get ALL expenditure without pagination (for analysis pages)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const expenditures = await Expenditure.find({ user: req.effectiveUserId }).sort({ date: -1, _id: -1 });
  res.json(expenditures);
}));

// @route   GET api/expenditures/latest
// @desc    Get chronologically latest expenditure record
router.get('/latest', auth, asyncHandler(async (req, res) => {
  const latestExpenditure = await Expenditure.findOne({ user: req.effectiveUserId }).sort({ date: -1, _id: -1 });
  res.json(latestExpenditure);
}));

// @route   GET api/expenditures
// @desc    Get all expenditure logs, sorted by date descending
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, type } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId };
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
    .sort({ date: -1, _id: -1 })
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
// @desc    Create a new expenditure log and propagate running balances
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  const createdDoc = await executeInTransaction(async (session) => {
    const newExpenditure = new Expenditure({
      ...validatedBody,
      user: req.effectiveUserId,
      date: new Date(validatedBody.date),
    });

    const prevBalances = await calculatePreviousBalance(
      req.effectiveUserId,
      newExpenditure.date,
      newExpenditure._id,
      session
    );

    const deltas = calculateSignedDeltas(newExpenditure);

    const updatedRunningBalances = { ...prevBalances };
    for (const { account, delta } of deltas) {
      updatedRunningBalances[account] = (updatedRunningBalances[account] || 0) + delta;
    }

    newExpenditure.runningBalances = updatedRunningBalances;
    newExpenditure.bank = updatedRunningBalances.bank;
    newExpenditure.cash = updatedRunningBalances.cash;
    newExpenditure.prepaid = updatedRunningBalances.prepaid;

    await newExpenditure.save(session ? { session } : undefined);

    await propagateBalanceChanges(
      req.effectiveUserId,
      deltas,
      newExpenditure.date,
      newExpenditure._id,
      session
    );

    return newExpenditure;
  });

  res.status(201).json(createdDoc);
}));

// @route   GET api/expenditures/:id
// @desc    Get a single expenditure log by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const expenditure = await Expenditure.findOne({ _id: id, user: req.effectiveUserId });
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  res.json(expenditure);
}));

// @route   PUT api/expenditures/:id
// @desc    Update an expenditure log and recalculate propagated balances
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  const existingExpenditure = await Expenditure.findById(id);
  if (!existingExpenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (existingExpenditure.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updatedDoc = await executeInTransaction(async (session) => {
    // 1. Revert previous transaction deltas on future records
    const oldDeltas = calculateSignedDeltas(existingExpenditure);
    const revertedOldDeltas = oldDeltas.map(({ account, delta }) => ({ account, delta: -delta }));
    await propagateBalanceChanges(
      existingExpenditure.user,
      revertedOldDeltas,
      existingExpenditure.date,
      existingExpenditure._id,
      session
    );

    // 2. Prepare updated fields
    const targetDate = validatedBody.date !== undefined ? new Date(validatedBody.date) : existingExpenditure.date;
    const targetValue = validatedBody.transactionValue !== undefined ? validatedBody.transactionValue : existingExpenditure.transactionValue;
    const targetType = validatedBody.transactionType !== undefined ? validatedBody.transactionType : existingExpenditure.transactionType;
    const targetMethod = validatedBody.paymentMethod !== undefined ? validatedBody.paymentMethod : existingExpenditure.paymentMethod;

    if (validatedBody.categories !== undefined) existingExpenditure.categories = validatedBody.categories;
    if (validatedBody.description !== undefined) existingExpenditure.description = validatedBody.description;
    if (validatedBody.logBankOp !== undefined) existingExpenditure.logBankOp = validatedBody.logBankOp;
    if (validatedBody.logCashOp !== undefined) existingExpenditure.logCashOp = validatedBody.logCashOp;
    if (validatedBody.logPrepaidOp !== undefined) existingExpenditure.logPrepaidOp = validatedBody.logPrepaidOp;
    if (validatedBody.fromAccount !== undefined) existingExpenditure.fromAccount = validatedBody.fromAccount;
    if (validatedBody.toAccount !== undefined) existingExpenditure.toAccount = validatedBody.toAccount;

    existingExpenditure.date = targetDate;
    existingExpenditure.transactionValue = targetValue;
    existingExpenditure.transactionType = targetType;
    existingExpenditure.paymentMethod = targetMethod;

    // 3. Compute baseline balance before new target date & tiebreaker ID
    const prevBalances = await calculatePreviousBalance(
      existingExpenditure.user,
      targetDate,
      existingExpenditure._id,
      session
    );

    // 4. Calculate new deltas and update runningBalances
    const newDeltas = calculateSignedDeltas(existingExpenditure);
    const newRunningBalances = { ...prevBalances };
    for (const { account, delta } of newDeltas) {
      newRunningBalances[account] = (newRunningBalances[account] || 0) + delta;
    }

    existingExpenditure.runningBalances = newRunningBalances;
    existingExpenditure.bank = newRunningBalances.bank;
    existingExpenditure.cash = newRunningBalances.cash;
    existingExpenditure.prepaid = newRunningBalances.prepaid;

    await existingExpenditure.save(session ? { session } : undefined);

    // 5. Propagate new deltas to future records
    await propagateBalanceChanges(
      existingExpenditure.user,
      newDeltas,
      targetDate,
      existingExpenditure._id,
      session
    );

    return existingExpenditure;
  });

  res.json(updatedDoc);
}));

// @route   DELETE api/expenditures/:id
// @desc    Delete an expenditure log and revert propagated balances
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const expenditure = await Expenditure.findById(id);
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (expenditure.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  await executeInTransaction(async (session) => {
    const deltas = calculateSignedDeltas(expenditure);
    const revertedDeltas = deltas.map(({ account, delta }) => ({ account, delta: -delta }));

    // Revert balance changes on future records
    await propagateBalanceChanges(
      expenditure.user,
      revertedDeltas,
      expenditure.date,
      expenditure._id,
      session
    );

    if (session) {
      await Expenditure.findByIdAndDelete(id, { session });
    } else {
      await Expenditure.findByIdAndDelete(id);
    }
  });

  res.json({ msg: 'Expenditure deleted' });
}));

module.exports = router;


