// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const Expenditure = require('../models/Expenditure');
const RecurringBill = require('../models/RecurringBill');
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
  bulkCategorySchema,
  bulkDeleteSchema,
  createRecurringBillSchema,
  updateRecurringBillSchema,
  payRecurringBillSchema,
  queryUpcomingBillsSchema,
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
const { resolveExchangeRate } = require('../utils/exchangeRateResolver');
const { isBridgeRecord } = require('../utils/incomeBridge');

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
// @desc    Get ALL non-deleted expenditure without pagination (clamped to 1000 lean docs)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const requestedLimit = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 1000) : 1000;
  const raw = await Expenditure.find({ user: req.effectiveUserId, deletedAt: null })
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const truncated = raw.length > limit;
  if (truncated) raw.pop();
  res.setHeader('X-Truncated', truncated ? 'true' : 'false');
  res.json(raw);
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
  const userRole = req.user?.role || 'viewer';
  const currency = (validatedBody.currency || 'EGP').trim().toUpperCase();
  let finalExchangeRate = 1;
  let finalForeignAmount = null;
  let finalTransactionValue;

  if (currency !== 'EGP') {
    const rateInfo = await resolveExchangeRate(
      currency,
      validatedBody.date,
      validatedBody.exchangeRateSnapshot,
      userRole
    );
    finalExchangeRate = rateInfo.rate;
    finalForeignAmount = validatedBody.foreignAmount;

    if (userRole === 'admin' && validatedBody.transactionValue !== undefined) {
      finalTransactionValue = validatedBody.transactionValue;
    } else {
      finalTransactionValue = Number((finalForeignAmount * finalExchangeRate).toFixed(2));
    }
  } else {
    finalExchangeRate = 1;
    finalForeignAmount = null;
    finalTransactionValue = validatedBody.transactionValue;
  }

  // If splits are provided, validate that sum equals finalTransactionValue
  if (validatedBody.splits && validatedBody.splits.length > 0) {
    const splitValidation = validateSplits(finalTransactionValue, validatedBody.splits);
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
      currency,
      foreignAmount: finalForeignAmount,
      exchangeRateSnapshot: finalExchangeRate,
      transactionValue: finalTransactionValue,
      transactionValueInPiastres: toPiastres(finalTransactionValue),
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

// @route   POST api/expenditures/bulk-category
// @desc    Bulk update category for selected expenditures [GAP-008]
router.post('/bulk-category', auth, validate({ body: bulkCategorySchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const { ids, category } = getValidated(req, 'body');

  const result = await Expenditure.updateMany(
    {
      _id: { $in: ids },
      user: req.effectiveUserId,
      deletedAt: null,
    },
    {
      $set: { categories: [category] },
    }
  );

  res.json({
    success: true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
}));

// @route   POST api/expenditures/bulk-delete
// @desc    Bulk soft-delete expenditures and revert balance propagation within an ACID transaction [GAP-008]
router.post('/bulk-delete', auth, validate({ body: bulkDeleteSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const { ids } = getValidated(req, 'body');

  const deletedCount = await executeInTransaction(async (session) => {
    // 1. Fetch all matching active documents belonging to this user
    const expenditures = await Expenditure.find({
      _id: { $in: ids },
      user: req.effectiveUserId,
      deletedAt: null,
    })
      .sort({ date: 1, _id: 1 })
      .session(session);

        if (expenditures.length === 0) {
      return 0;
    }

    const linkedDoc = expenditures.find(
      isBridgeRecord
    );
    if (linkedDoc) {
      throw new BadRequestError(
        'Cannot delete auto-generated settlement transactions directly. Please manage or delete the source record (paycheck, gold holding, or certificate).'
      );
    }

    // 2. Revert balances for each expenditure and soft delete
    for (const exp of expenditures) {
      const deltas = calculateSignedDeltas(exp);
      const revertedDeltas = deltas.map(({ account, delta, deltaInPiastres }) => ({
        account,
        delta: -delta,
        deltaInPiastres: -deltaInPiastres,
      }));

      // Revert balance changes on future records
      await propagateBalanceChanges(
        exp.user,
        revertedDeltas,
        exp.date,
        exp._id,
        session
      );

      await exp.softDelete(session);
    }

    return expenditures.length;
  });

  res.json({
    success: true,
    deletedCount,
  });
}));

// ==========================================
// RECURRING BILLS & SCHEDULER [FEAT-005, GAP-009]
// ==========================================

const parseToMiddayUtc = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0));
};

function advanceNextDueDate(currentDate, frequency, dueDay) {
  const d = new Date(currentDate);
  if (frequency === 'weekly') {
    return new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  let targetYear = d.getUTCFullYear();
  let targetMonth = d.getUTCMonth();

  if (frequency === 'monthly') targetMonth += 1;
  else if (frequency === 'quarterly') targetMonth += 3;
  else if (frequency === 'yearly') targetYear += 1;

  // Normalize month overflow
  const normalizedDate = new Date(Date.UTC(targetYear, targetMonth, 1));
  const year = normalizedDate.getUTCFullYear();
  const month = normalizedDate.getUTCMonth();

  // Days in target month: day 0 of following month
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(dueDay, daysInMonth);

  return new Date(Date.UTC(year, month, clampedDay, 12, 0, 0, 0));
}

// @route   GET api/expenditures/bills/upcoming
// @desc    Get upcoming bills due within N days (default: 3 days)
router.get('/bills/upcoming', auth, validate({ query: queryUpcomingBillsSchema }), asyncHandler(async (req, res) => {
  const { days = 3 } = getValidated(req, 'query');
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const bills = await RecurringBill.find({
    user: req.effectiveUserId,
    deletedAt: null,
    isActive: true,
    nextDueDate: { $lte: threshold },
  }).sort({ nextDueDate: 1, _id: 1 }).lean();

  const totalDue = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  res.json({
    bills,
    upcomingCount: bills.length,
    totalDue,
  });
}));

// @route   GET api/expenditures/bills
// @desc    List all recurring bills for current user
router.get('/bills', auth, asyncHandler(async (req, res) => {
  const query = { user: req.effectiveUserId, deletedAt: null };
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }
  const bills = await RecurringBill.find(query).sort({ nextDueDate: 1, _id: 1 }).lean();
  res.json({ bills });
}));

// @route   POST api/expenditures/bills
// @desc    Create a new recurring bill schedule
router.post('/bills', auth, validate({ body: createRecurringBillSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const body = getValidated(req, 'body');
  const amountInPiastres = Math.round(body.amount * 100);
  const nextDueDate = parseToMiddayUtc(body.nextDueDate);

  const bill = await RecurringBill.create({
    ...body,
    user: req.effectiveUserId,
    amountInPiastres,
    nextDueDate,
  });

  res.status(201).json({ msg: 'Recurring bill created successfully', bill });
}));

// @route   GET api/expenditures/bills/:id
// @desc    Get single recurring bill by ID
router.get('/bills/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const bill = await RecurringBill.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }
  res.json({ bill });
}));

// @route   PUT api/expenditures/bills/:id
// @desc    Update recurring bill configuration
router.put('/bills/:id', auth, validate({ params: paramsSchema, body: updateRecurringBillSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const body = getValidated(req, 'body');

  const bill = await RecurringBill.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }

  if (body.amount !== undefined) {
    body.amountInPiastres = Math.round(body.amount * 100);
  }
  if (body.nextDueDate !== undefined) {
    body.nextDueDate = parseToMiddayUtc(body.nextDueDate);
  }

  Object.assign(bill, body);
  await bill.save();

  res.json({ msg: 'Recurring bill updated successfully', bill });
}));

// @route   DELETE api/expenditures/bills/:id
// @desc    Soft delete a recurring bill schedule
router.delete('/bills/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const bill = await RecurringBill.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }
  await bill.softDelete();
  res.json({ msg: 'Recurring bill soft-deleted successfully' });
}));

// @route   POST api/expenditures/bills/:id/pay
// @desc    Atomically pay a recurring bill, create expenditure, propagate balance, and advance schedule
router.post('/bills/:id/pay', auth, validate({ params: paramsSchema, body: payRecurringBillSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const body = getValidated(req, 'body') || {};

  const bill = await RecurringBill.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }

  const paymentDate = body.paymentDate ? parseToMiddayUtc(body.paymentDate) : parseToMiddayUtc(new Date());
  const paymentMethod = body.paymentMethod || bill.paymentMethod || 'Bank';
  const opKey = `log${paymentMethod}Op`;

  const result = await executeInTransaction(async (session) => {
    const expenditure = new Expenditure({
      user: req.effectiveUserId,
      date: paymentDate,
      transactionValue: bill.amount,
      transactionValueInPiastres: bill.amountInPiastres,
      transactionType: 'W', // Explicit 'W' (living expense) (🔴-2)
      autoGenerated: false, // User-confirmed, NOT a bridge record (🔴-2)
      bridgeDirection: null,
      linkedRecurringBillId: bill._id,
      categories: [bill.category], // Array matching Expenditure schema (🟢-4)
      description: `Bill Payment: ${bill.name}`,
      paymentMethod,
      [opKey]: '-',
      isRecurring: true,
    });

    const prevBalances = await calculatePreviousBalance(req.effectiveUserId, expenditure.date, null, session);
    const deltas = calculateSignedDeltas(expenditure);

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

    expenditure.runningBalances = updatedRunningBalances;
    expenditure.runningBalancesInPiastres = updatedRunningBalancesInPiastres;
    expenditure.bank = updatedRunningBalances.bank;
    expenditure.bankInPiastres = updatedRunningBalancesInPiastres.bank;
    expenditure.cash = updatedRunningBalances.cash;
    expenditure.cashInPiastres = updatedRunningBalancesInPiastres.cash;
    expenditure.prepaid = updatedRunningBalances.prepaid;
    expenditure.prepaidInPiastres = updatedRunningBalancesInPiastres.prepaid;

    await expenditure.save({ session });
    await propagateBalanceChanges(req.effectiveUserId, deltas, expenditure.date, expenditure._id, session);

    bill.lastPaidDate = expenditure.date;
    bill.lastExpenditureId = expenditure._id;
    bill.nextDueDate = advanceNextDueDate(bill.nextDueDate, bill.frequency, bill.dueDay);
    await bill.save({ session });

    return { expenditure, bill };
  });

  res.json({ msg: 'Bill paid successfully', expenditure: result.expenditure, bill: result.bill });
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
    const userRole = req.user?.role || 'viewer';
    const targetDate = validatedBody.date !== undefined ? new Date(validatedBody.date) : existingExpenditure.date;
    const newCurrency = (validatedBody.currency !== undefined ? validatedBody.currency : (existingExpenditure.currency || 'EGP')).trim().toUpperCase();
    const currencyChanged = newCurrency !== (existingExpenditure.currency || 'EGP');
    const dateChanged = targetDate.getTime() !== existingExpenditure.date.getTime();

    let finalExchangeRate = existingExpenditure.exchangeRateSnapshot || 1;
    let finalForeignAmount = existingExpenditure.foreignAmount;
    let targetValue;

    if (newCurrency !== 'EGP') {
      const mustReResolve = currencyChanged || dateChanged || (userRole === 'admin' && validatedBody.exchangeRateSnapshot !== undefined);
      if (mustReResolve) {
        const rateInfo = await resolveExchangeRate(
          newCurrency,
          targetDate,
          validatedBody.exchangeRateSnapshot,
          userRole
        );
        finalExchangeRate = rateInfo.rate;
      }
      if (validatedBody.foreignAmount !== undefined) {
        finalForeignAmount = validatedBody.foreignAmount;
      }

      if (userRole === 'admin' && validatedBody.transactionValue !== undefined) {
        targetValue = validatedBody.transactionValue;
      } else {
        targetValue = Number((finalForeignAmount * finalExchangeRate).toFixed(2));
      }
      existingExpenditure.currency = newCurrency;
      existingExpenditure.foreignAmount = finalForeignAmount;
      existingExpenditure.exchangeRateSnapshot = finalExchangeRate;
    } else {
      existingExpenditure.currency = 'EGP';
      existingExpenditure.foreignAmount = null;
      existingExpenditure.exchangeRateSnapshot = 1;
      targetValue = validatedBody.transactionValue !== undefined ? validatedBody.transactionValue : existingExpenditure.transactionValue;
    }

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

  if (isBridgeRecord(expenditure)) {
    throw new BadRequestError(
      'Cannot delete auto-generated settlement transactions directly. Please manage or delete the source record (paycheck, gold holding, or certificate).'
    );
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
