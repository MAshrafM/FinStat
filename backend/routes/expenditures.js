// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');
const CategorizationRule = require('../models/CategorizationRule');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
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
const { toPiastres } = require('../utils/currencyUtils');
const { evaluateRules } = require('../utils/ruleEngine');
const { validateSplits } = require('../utils/splitValidator');

// @route   GET api/expenditures/recurring
// @desc    Get all active expenditures marked as recurring
router.get('/recurring', auth, asyncHandler(async (req, res) => {
  const recurringExpenditures = await Expenditure.find({
    user: req.effectiveUserId,
    isRecurring: true,
    deletedAt: null,
  }).sort({ date: -1, _id: -1 });
  res.json(recurringExpenditures);
}));

// @route   GET api/expenditures/all
// @desc    Get ALL non-deleted expenditure without pagination (for analysis pages)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const expenditures = await Expenditure.find({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1, _id: -1 });
  res.json(expenditures);
}));

// @route   GET api/expenditures/latest
// @desc    Get chronologically latest non-deleted expenditure record
router.get('/latest', auth, asyncHandler(async (req, res) => {
  const latestExpenditure = await Expenditure.findOne({ user: req.effectiveUserId, deletedAt: null }).sort({ date: -1, _id: -1 });
  res.json(latestExpenditure);
}));

// @route   GET api/expenditures
// @desc    Get all active expenditure logs, sorted by date descending
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, type, isRecurring } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
  if (isRecurring !== undefined) {
    query.isRecurring = isRecurring;
  }
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

  // If splits are provided, validate that sum equals transactionValue
  if (validatedBody.splits && validatedBody.splits.length > 0) {
    const splitValidation = validateSplits(validatedBody.transactionValue, validatedBody.splits);
    if (!splitValidation.isValid) {
      throw new BadRequestError(splitValidation.error);
    }
    // Synchronize categories from splits if not explicitly specified
    if (
      !validatedBody.categories ||
      validatedBody.categories.length === 0 ||
      (validatedBody.categories.length === 1 && validatedBody.categories[0] === 'Other')
    ) {
      validatedBody.categories = Array.from(new Set(validatedBody.splits.map((s) => s.category)));
    }
  } else {
    // Auto-categorize via active rules if category was left as default 'Other'
    if (
      !validatedBody.categories ||
      validatedBody.categories.length === 0 ||
      (validatedBody.categories.length === 1 && validatedBody.categories[0] === 'Other')
    ) {
      const activeRules = await CategorizationRule.find({
        user: req.effectiveUserId,
        isActive: true,
        deletedAt: null,
      }).sort({ priority: -1, createdAt: -1 });

      const match = evaluateRules(validatedBody, activeRules);
      if (match) {
        validatedBody.categories = [match.category];
      }
    }
  }

  const createdDoc = await executeInTransaction(async (session) => {
    const newExpenditure = new Expenditure({
      ...validatedBody,
      user: req.effectiveUserId,
      date: new Date(validatedBody.date),
      transactionValueInPiastres: toPiastres(validatedBody.transactionValue),
    });

    const prevBalances = await calculatePreviousBalance(
      req.effectiveUserId,
      newExpenditure.date,
      newExpenditure._id,
      session
    );

    const deltas = calculateSignedDeltas(newExpenditure);

    const updatedRunningBalances = {
      bank: prevBalances.bank,
      cash: prevBalances.cash,
      prepaid: prevBalances.prepaid,
    };
    const updatedRunningBalancesInPiastres = {
      bank: prevBalances.bankInPiastres,
      cash: prevBalances.cashInPiastres,
      prepaid: prevBalances.prepaidInPiastres,
    };

    for (const { account, delta, deltaInPiastres } of deltas) {
      updatedRunningBalances[account] = (updatedRunningBalances[account] || 0) + delta;
      updatedRunningBalancesInPiastres[account] = (updatedRunningBalancesInPiastres[account] || 0) + deltaInPiastres;
    }

    newExpenditure.runningBalances = updatedRunningBalances;
    newExpenditure.runningBalancesInPiastres = updatedRunningBalancesInPiastres;
    newExpenditure.bank = updatedRunningBalances.bank;
    newExpenditure.bankInPiastres = updatedRunningBalancesInPiastres.bank;
    newExpenditure.cash = updatedRunningBalances.cash;
    newExpenditure.cashInPiastres = updatedRunningBalancesInPiastres.cash;
    newExpenditure.prepaid = updatedRunningBalances.prepaid;
    newExpenditure.prepaidInPiastres = updatedRunningBalancesInPiastres.prepaid;

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
  const expenditure = await Expenditure.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
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

  const existingExpenditure = await Expenditure.findOne({ _id: id, deletedAt: null });
  if (!existingExpenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (existingExpenditure.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updatedDoc = await executeInTransaction(async (session) => {
    // 1. Revert previous transaction deltas on future records
    const oldDeltas = calculateSignedDeltas(existingExpenditure);
    const revertedOldDeltas = oldDeltas.map(({ account, delta, deltaInPiastres }) => ({
      account,
      delta: -delta,
      deltaInPiastres: -deltaInPiastres,
    }));
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
    if (validatedBody.isRecurring !== undefined) existingExpenditure.isRecurring = validatedBody.isRecurring;
    if (validatedBody.recurringId !== undefined) existingExpenditure.recurringId = validatedBody.recurringId;

    if (validatedBody.splits !== undefined) {
      if (validatedBody.splits && validatedBody.splits.length > 0) {
        const splitValidation = validateSplits(targetValue, validatedBody.splits);
        if (!splitValidation.isValid) {
          throw new BadRequestError(splitValidation.error);
        }
        existingExpenditure.splits = validatedBody.splits;
        if (validatedBody.categories === undefined) {
          existingExpenditure.categories = Array.from(new Set(validatedBody.splits.map((s) => s.category)));
        }
      } else {
        existingExpenditure.splits = [];
      }
    }

    existingExpenditure.date = targetDate;
    existingExpenditure.transactionValue = targetValue;
    existingExpenditure.transactionValueInPiastres = toPiastres(targetValue);
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
    const newRunningBalances = {
      bank: prevBalances.bank,
      cash: prevBalances.cash,
      prepaid: prevBalances.prepaid,
    };
    const newRunningBalancesInPiastres = {
      bank: prevBalances.bankInPiastres,
      cash: prevBalances.cashInPiastres,
      prepaid: prevBalances.prepaidInPiastres,
    };

    for (const { account, delta, deltaInPiastres } of newDeltas) {
      newRunningBalances[account] = (newRunningBalances[account] || 0) + delta;
      newRunningBalancesInPiastres[account] = (newRunningBalancesInPiastres[account] || 0) + deltaInPiastres;
    }

    existingExpenditure.runningBalances = newRunningBalances;
    existingExpenditure.runningBalancesInPiastres = newRunningBalancesInPiastres;
    existingExpenditure.bank = newRunningBalances.bank;
    existingExpenditure.bankInPiastres = newRunningBalancesInPiastres.bank;
    existingExpenditure.cash = newRunningBalances.cash;
    existingExpenditure.cashInPiastres = newRunningBalancesInPiastres.cash;
    existingExpenditure.prepaid = newRunningBalances.prepaid;
    existingExpenditure.prepaidInPiastres = newRunningBalancesInPiastres.prepaid;

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
// @desc    Soft delete an expenditure log and revert propagated balances
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const expenditure = await Expenditure.findOne({ _id: id, deletedAt: null });
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (expenditure.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  await executeInTransaction(async (session) => {
    const deltas = calculateSignedDeltas(expenditure);
    const revertedDeltas = deltas.map(({ account, delta, deltaInPiastres }) => ({
      account,
      delta: -delta,
      deltaInPiastres: -deltaInPiastres,
    }));

    // Revert balance changes on future records
    await propagateBalanceChanges(
      expenditure.user,
      revertedDeltas,
      expenditure.date,
      expenditure._id,
      session
    );

    await expenditure.softDelete(session);
  });

  res.json({ msg: 'Expenditure deleted' });
}));

// @route   POST api/expenditures/:id/restore
// @desc    Restore a soft-deleted expenditure log and re-apply propagated balances
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const expenditure = await Expenditure.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!expenditure) {
    throw new NotFoundError('Soft-deleted expenditure not found');
  }

  await executeInTransaction(async (session) => {
    const deltas = calculateSignedDeltas(expenditure);

    // Re-apply balance changes on future records
    await propagateBalanceChanges(
      expenditure.user,
      deltas,
      expenditure.date,
      expenditure._id,
      session
    );

    await expenditure.restore(session);
  });

  res.json({ msg: 'Expenditure restored successfully', expenditure });
}));

module.exports = router;
