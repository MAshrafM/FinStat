// backend/services/ledgerService.js
const Expenditure = require('../models/Expenditure');
const RecurringBill = require('../models/RecurringBill');
const CategorizationRule = require('../models/CategorizationRule');
const {
  calculateSignedDeltas,
  calculatePreviousBalance,
  propagateBalanceChanges,
  executeInTransaction,
} = require('../utils/ledgerHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const { evaluateRules } = require('../utils/ruleEngine');
const { validateSplits } = require('../utils/splitValidator');
const { resolveExchangeRate } = require('../utils/exchangeRateResolver');
const { isBridgeRecord } = require('../utils/incomeBridge');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../utils/errors');

/**
 * Normalizes date to 12:00:00 UTC to prevent timezone shifts.
 * @param {Date|string} dateInput
 * @returns {Date}
 */
const parseToMiddayUtc = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0));
};

/**
 * Calculates next due date for recurring bill based on frequency and target due day.
 * @param {Date|string} currentDate
 * @param {string} frequency
 * @param {number} dueDay
 * @returns {Date}
 */
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

/**
 * Retrieves recurring expenditure templates.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @returns {Promise<Array>}
 */
const getRecurringTemplate = async ({ userId }) => {
  return Expenditure.find({
    user: userId,
    isRecurring: true,
    deletedAt: null,
  }).sort({ date: -1, _id: -1 });
};

/**
 * Retrieves all non-deleted expenditures without pagination (clamped to 1000 lean docs).
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} [params.requestedLimit]
 * @returns {Promise<{ expenditures: Array, truncated: boolean }>}
 */
const getAllExpenditures = async ({ userId, requestedLimit }) => {
  const parsedLimit = parseInt(requestedLimit, 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 1000) : 1000;
  const raw = await Expenditure.find({ user: userId, deletedAt: null })
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
  const truncated = raw.length > limit;
  if (truncated) raw.pop();

  return { expenditures: raw, truncated };
};

/**
 * Retrieves chronologically latest expenditure record for balance snapshot.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @returns {Promise<Expenditure|null>}
 */
const getLatestBalances = async ({ userId }) => {
  return Expenditure.findOne({ user: userId, deletedAt: null }).sort({ date: -1, _id: -1 });
};

/**
 * Retrieves paginated list of active expenditures with filter criteria.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} [params.query]
 * @returns {Promise<{ data: Array, total: number, page: number, totalPages: number }>}
 */
const listExpenditures = async ({ userId, query = {} }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 25;
  const skip = (page - 1) * limit;

  const mongoQuery = { user: userId, deletedAt: null };
  if (query.isRecurring !== undefined) {
    mongoQuery.isRecurring = query.isRecurring;
  }
  if (query.type && query.type !== 'all') {
    if (['Prepaid', 'Bank', 'Cash'].includes(query.type)) {
      mongoQuery.paymentMethod = query.type;
    } else if (['W', 'T', 'S', 'na'].includes(query.type)) {
      mongoQuery.transactionType = query.type;
    } else {
      mongoQuery.categories = query.type;
    }
  }

  const total = await Expenditure.countDocuments(mongoQuery);
  const expenditures = await Expenditure.find(mongoQuery)
    .sort({ date: -1, _id: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data: expenditures,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Creates expenditure record and propagates running balance changes across ledger.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} params.data
 * @param {string} [params.userRole='viewer']
 * @param {boolean} params.canModify
 * @returns {Promise<Expenditure>}
 */
const createExpenditure = async ({ userId, data, userRole = 'viewer', canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const currency = (data.currency || 'EGP').trim().toUpperCase();
  let finalExchangeRate = 1;
  let finalForeignAmount = null;
  let finalTransactionValue;

  if (currency !== 'EGP') {
    const rateInfo = await resolveExchangeRate(
      currency,
      data.date,
      data.exchangeRateSnapshot,
      userRole
    );
    finalExchangeRate = rateInfo.rate;
    finalForeignAmount = data.foreignAmount;

    if (userRole === 'admin' && data.transactionValue !== undefined) {
      finalTransactionValue = data.transactionValue;
    } else {
      finalTransactionValue = Number((finalForeignAmount * finalExchangeRate).toFixed(2));
    }
  } else {
    finalExchangeRate = 1;
    finalForeignAmount = null;
    finalTransactionValue = data.transactionValue;
  }

  // If splits are provided, validate that sum equals finalTransactionValue
  if (data.splits && data.splits.length > 0) {
    const splitValidation = validateSplits(finalTransactionValue, data.splits);
    if (!splitValidation.isValid) {
      throw new BadRequestError(splitValidation.error);
    }
    // Synchronize categories from splits if not explicitly specified
    if (
      !data.categories ||
      data.categories.length === 0 ||
      (data.categories.length === 1 && data.categories[0] === 'Other')
    ) {
      data.categories = Array.from(new Set(data.splits.map((s) => s.category)));
    }
  } else {
    // Auto-categorize via active rules if category was left as default 'Other'
    if (
      !data.categories ||
      data.categories.length === 0 ||
      (data.categories.length === 1 && data.categories[0] === 'Other')
    ) {
      const activeRules = await CategorizationRule.find({
        user: userId,
        isActive: true,
        deletedAt: null,
      }).sort({ priority: -1, createdAt: -1 });

      const match = evaluateRules(data, activeRules);
      if (match) {
        data.categories = [match.category];
      }
    }
  }

  return executeInTransaction(async (session) => {
    const newExpenditure = new Expenditure({
      ...data,
      user: userId,
      date: new Date(data.date),
      currency,
      foreignAmount: finalForeignAmount,
      exchangeRateSnapshot: finalExchangeRate,
      transactionValue: finalTransactionValue,
      transactionValueInPiastres: toPiastres(finalTransactionValue),
    });

    const prevBalances = await calculatePreviousBalance(
      userId,
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
      userId,
      deltas,
      newExpenditure.date,
      newExpenditure._id,
      session
    );

    return newExpenditure;
  });
};

/**
 * Bulk updates categories for selected expenditures.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Array<string>} params.ids
 * @param {string} params.category
 * @param {boolean} params.canModify
 * @returns {Promise<{ success: boolean, matchedCount: number, modifiedCount: number }>}
 */
const bulkUpdateCategory = async ({ userId, ids, category, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const result = await Expenditure.updateMany(
    {
      _id: { $in: ids },
      user: userId,
      deletedAt: null,
    },
    {
      $set: { categories: [category] },
    }
  );

  return {
    success: true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

/**
 * Bulk soft-deletes expenditures and reverts balance propagation within transaction.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Array<string>} params.ids
 * @param {boolean} params.canModify
 * @returns {Promise<{ success: boolean, deletedCount: number }>}
 */
const bulkDeleteExpenditures = async ({ userId, ids, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const deletedCount = await executeInTransaction(async (session) => {
    const expenditures = await Expenditure.find({
      _id: { $in: ids },
      user: userId,
      deletedAt: null,
    })
      .sort({ date: 1, _id: 1 })
      .session(session);

    if (expenditures.length === 0) {
      return 0;
    }

    const linkedDoc = expenditures.find(isBridgeRecord);
    if (linkedDoc) {
      throw new BadRequestError(
        'Cannot delete auto-generated settlement transactions directly. Please manage or delete the source record (paycheck, gold holding, or certificate).'
      );
    }

    for (const exp of expenditures) {
      const deltas = calculateSignedDeltas(exp);
      const revertedDeltas = deltas.map(({ account, delta, deltaInPiastres }) => ({
        account,
        delta: -delta,
        deltaInPiastres: -deltaInPiastres,
      }));

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

  return {
    success: true,
    deletedCount,
  };
};

/**
 * Retrieves upcoming recurring bills due within specified days.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} [params.days=3]
 * @returns {Promise<{ bills: Array, upcomingCount: number, totalDue: number }>}
 */
const getUpcomingBills = async ({ userId, days = 3 }) => {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const bills = await RecurringBill.find({
    user: userId,
    deletedAt: null,
    isActive: true,
    nextDueDate: { $lte: threshold },
  }).sort({ nextDueDate: 1, _id: 1 }).lean();

  const totalDue = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  return {
    bills,
    upcomingCount: bills.length,
    totalDue,
  };
};

/**
 * Lists recurring bills for user with optional isActive filter.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} [params.query]
 * @returns {Promise<{ bills: Array }>}
 */
const listRecurringBills = async ({ userId, query = {} }) => {
  const mongoQuery = { user: userId, deletedAt: null };
  if (query.isActive !== undefined) {
    mongoQuery.isActive = query.isActive === 'true';
  }
  const bills = await RecurringBill.find(mongoQuery).sort({ nextDueDate: 1, _id: 1 }).lean();
  return { bills };
};

/**
 * Creates new recurring bill schedule.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string, bill: RecurringBill }>}
 */
const createRecurringBill = async ({ userId, data, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const amountInPiastres = Math.round(data.amount * 100);
  const nextDueDate = parseToMiddayUtc(data.nextDueDate);

  const bill = await RecurringBill.create({
    ...data,
    user: userId,
    amountInPiastres,
    nextDueDate,
  });

  return { msg: 'Recurring bill created successfully', bill };
};

/**
 * Retrieves single recurring bill by ID.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @returns {Promise<{ bill: RecurringBill }>}
 */
const getRecurringBillById = async ({ userId, id }) => {
  const bill = await RecurringBill.findOne({ _id: id, user: userId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }
  return { bill };
};

/**
 * Updates recurring bill schedule.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string, bill: RecurringBill }>}
 */
const updateRecurringBill = async ({ userId, id, data, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const bill = await RecurringBill.findOne({ _id: id, user: userId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }

  const updatePayload = { ...data };
  if (updatePayload.amount !== undefined) {
    updatePayload.amountInPiastres = Math.round(updatePayload.amount * 100);
  }
  if (updatePayload.nextDueDate !== undefined) {
    updatePayload.nextDueDate = parseToMiddayUtc(updatePayload.nextDueDate);
  }

  Object.assign(bill, updatePayload);
  await bill.save();

  return { msg: 'Recurring bill updated successfully', bill };
};

/**
 * Soft deletes recurring bill.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string }>}
 */
const deleteRecurringBill = async ({ userId, id, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const bill = await RecurringBill.findOne({ _id: id, user: userId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }

  await bill.softDelete();
  return { msg: 'Recurring bill soft-deleted successfully' };
};

/**
 * Atomically pays recurring bill, creates expenditure, propagates balances, and advances schedule.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {Object} params.data
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string, expenditure: Expenditure, bill: RecurringBill }>}
 */
const payRecurringBill = async ({ userId, id, data = {}, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const bill = await RecurringBill.findOne({ _id: id, user: userId, deletedAt: null });
  if (!bill) {
    throw new NotFoundError('Recurring bill not found');
  }

  const paymentDate = data.paymentDate ? parseToMiddayUtc(data.paymentDate) : parseToMiddayUtc(new Date());
  const paymentMethod = data.paymentMethod || bill.paymentMethod || 'Bank';
  const opKey = `log${paymentMethod}Op`;

  const result = await executeInTransaction(async (session) => {
    const expenditure = new Expenditure({
      user: userId,
      date: paymentDate,
      transactionValue: bill.amount,
      transactionValueInPiastres: bill.amountInPiastres,
      transactionType: 'W',
      autoGenerated: false,
      bridgeDirection: null,
      linkedRecurringBillId: bill._id,
      categories: [bill.category],
      description: `Bill Payment: ${bill.name}`,
      paymentMethod,
      [opKey]: '-',
      isRecurring: true,
    });

    const prevBalances = await calculatePreviousBalance(userId, expenditure.date, null, session);
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
    await propagateBalanceChanges(userId, deltas, expenditure.date, expenditure._id, session);

    bill.lastPaidDate = expenditure.date;
    bill.lastExpenditureId = expenditure._id;
    bill.nextDueDate = advanceNextDueDate(bill.nextDueDate, bill.frequency, bill.dueDay);
    await bill.save({ session });

    return { expenditure, bill };
  });

  return { msg: 'Bill paid successfully', expenditure: result.expenditure, bill: result.bill };
};

/**
 * Retrieves soft-deleted expenditures excluding bridge records.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {number} [params.page=1]
 * @param {number} [params.limit=25]
 * @returns {Promise<{ data: Array, total: number, page: number, totalPages: number }>}
 */
const getDeletedExpenditures = async ({ userId, page = 1, limit = 25 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
  const skip = (parsedPage - 1) * parsedLimit;

  const query = {
    user: userId,
    deletedAt: { $ne: null },
    autoGenerated: { $ne: true },
    bridgeDirection: null,
    linkedPaycheckId: null,
    linkedTradeId: null,
    linkedGoldId: null,
    linkedCertificateId: null,
    linkedCurrencyId: null,
    linkedMfTradeId: null,
  };

  const total = await Expenditure.countDocuments(query);
  const expenditures = await Expenditure.find(query)
    .sort({ deletedAt: -1, _id: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return {
    data: expenditures,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };
};

/**
 * Retrieves single expenditure by ID.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @returns {Promise<Expenditure>}
 */
const getExpenditureById = async ({ userId, id }) => {
  const expenditure = await Expenditure.findOne({ _id: id, user: userId, deletedAt: null });
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  return expenditure;
};

/**
 * Updates expenditure log and recalculates propagated balances.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {Object} params.data
 * @param {string} [params.userRole='viewer']
 * @param {boolean} params.canModify
 * @returns {Promise<Expenditure>}
 */
const updateExpenditure = async ({ userId, id, data, userRole = 'viewer', canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const existingExpenditure = await Expenditure.findOne({ _id: id, deletedAt: null });
  if (!existingExpenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (existingExpenditure.user.toString() !== userId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  return executeInTransaction(async (session) => {
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
    const targetDate = data.date !== undefined ? new Date(data.date) : existingExpenditure.date;
    const newCurrency = (data.currency !== undefined ? data.currency : (existingExpenditure.currency || 'EGP')).trim().toUpperCase();
    const currencyChanged = newCurrency !== (existingExpenditure.currency || 'EGP');
    const dateChanged = targetDate.getTime() !== existingExpenditure.date.getTime();

    let finalExchangeRate = existingExpenditure.exchangeRateSnapshot || 1;
    let finalForeignAmount = existingExpenditure.foreignAmount;
    let targetValue;

    if (newCurrency !== 'EGP') {
      const mustReResolve = currencyChanged || dateChanged || (userRole === 'admin' && data.exchangeRateSnapshot !== undefined);
      if (mustReResolve) {
        const rateInfo = await resolveExchangeRate(
          newCurrency,
          targetDate,
          data.exchangeRateSnapshot,
          userRole
        );
        finalExchangeRate = rateInfo.rate;
      }
      if (data.foreignAmount !== undefined) {
        finalForeignAmount = data.foreignAmount;
      }

      if (userRole === 'admin' && data.transactionValue !== undefined) {
        targetValue = data.transactionValue;
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
      targetValue = data.transactionValue !== undefined ? data.transactionValue : existingExpenditure.transactionValue;
    }

    const targetType = data.transactionType !== undefined ? data.transactionType : existingExpenditure.transactionType;
    const targetMethod = data.paymentMethod !== undefined ? data.paymentMethod : existingExpenditure.paymentMethod;

    if (data.categories !== undefined) existingExpenditure.categories = data.categories;
    if (data.description !== undefined) existingExpenditure.description = data.description;
    if (data.logBankOp !== undefined) existingExpenditure.logBankOp = data.logBankOp;
    if (data.logCashOp !== undefined) existingExpenditure.logCashOp = data.logCashOp;
    if (data.logPrepaidOp !== undefined) existingExpenditure.logPrepaidOp = data.logPrepaidOp;
    if (data.fromAccount !== undefined) existingExpenditure.fromAccount = data.fromAccount;
    if (data.toAccount !== undefined) existingExpenditure.toAccount = data.toAccount;
    if (data.isRecurring !== undefined) existingExpenditure.isRecurring = data.isRecurring;
    if (data.recurringId !== undefined) existingExpenditure.recurringId = data.recurringId;

    if (data.splits !== undefined) {
      if (data.splits && data.splits.length > 0) {
        const splitValidation = validateSplits(targetValue, data.splits);
        if (!splitValidation.isValid) {
          throw new BadRequestError(splitValidation.error);
        }
        existingExpenditure.splits = data.splits;
        if (data.categories === undefined) {
          existingExpenditure.categories = Array.from(new Set(data.splits.map((s) => s.category)));
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
};

/**
 * Soft deletes an expenditure and reverts propagated balances.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string }>}
 */
const deleteExpenditure = async ({ userId, id, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const expenditure = await Expenditure.findOne({ _id: id, deletedAt: null });
  if (!expenditure) {
    throw new NotFoundError('Expenditure not found');
  }
  if (expenditure.user.toString() !== userId.toString()) {
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

    await propagateBalanceChanges(
      expenditure.user,
      revertedDeltas,
      expenditure.date,
      expenditure._id,
      session
    );

    await expenditure.softDelete(session);
  });

  return { msg: 'Expenditure deleted' };
};

/**
 * Restores a soft-deleted expenditure and re-applies balances.
 * @param {Object} params
 * @param {ObjectId|string} params.userId
 * @param {ObjectId|string} params.id
 * @param {boolean} params.canModify
 * @returns {Promise<{ msg: string, expenditure: Expenditure }>}
 */
const restoreExpenditure = async ({ userId, id, canModify }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const expenditure = await Expenditure.findOne({ _id: id, user: userId, deletedAt: { $ne: null } });
  if (!expenditure) {
    throw new NotFoundError('Soft-deleted expenditure not found');
  }

  if (isBridgeRecord(expenditure)) {
    throw new BadRequestError(
      'Cannot restore auto-generated bridge transactions directly. Please restore or manage the source record (paycheck, gold holding, certificate, or trade).'
    );
  }

  await executeInTransaction(async (session) => {
    const deltas = calculateSignedDeltas(expenditure);

    await propagateBalanceChanges(
      expenditure.user,
      deltas,
      expenditure.date,
      expenditure._id,
      session
    );

    await expenditure.restore(session);
  });

  return { msg: 'Expenditure restored successfully', expenditure };
};

module.exports = {
  getRecurringTemplate,
  getAllExpenditures,
  getLatestBalances,
  listExpenditures,
  createExpenditure,
  bulkUpdateCategory,
  bulkDeleteExpenditures,
  getUpcomingBills,
  listRecurringBills,
  createRecurringBill,
  getRecurringBillById,
  updateRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  getDeletedExpenditures,
  getExpenditureById,
  updateExpenditure,
  deleteExpenditure,
  restoreExpenditure,
};

