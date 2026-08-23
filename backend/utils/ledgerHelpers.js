// backend/utils/ledgerHelpers.js
const mongoose = require('mongoose');
const Expenditure = require('../models/Expenditure');
const { BadRequestError } = require('./errors');
const { toPiastres } = require('./currencyUtils');

/**
 * Normalizes paymentMethod / account string to lowercase account key.
 * @param {string} paymentMethod - 'Bank', 'Cash', 'Prepaid' (or lowercase)
 * @returns {'bank' | 'cash' | 'prepaid'}
 */
const normalizeAccount = (paymentMethod) => {
  if (!paymentMethod || typeof paymentMethod !== 'string') {
    throw new BadRequestError('Payment method / account is required and must be a string');
  }
  const normalized = paymentMethod.trim().toLowerCase();
  if (['bank', 'cash', 'prepaid'].includes(normalized)) {
    return normalized;
  }
  throw new BadRequestError(`Invalid payment method / account: ${paymentMethod}. Must be Bank, Cash, or Prepaid.`);
};

/**
 * Maps payment method to standard account fields with the other two accounts zeroed out.
 * @param {string} paymentMethod
 * @param {number} transactionValue
 * @returns {{ bank: number, cash: number, prepaid: number }}
 */
const mapAccountFields = (paymentMethod, transactionValue) => {
  const account = normalizeAccount(paymentMethod);
  const val = Number(transactionValue) || 0;
  return {
    bank: account === 'bank' ? val : 0,
    cash: account === 'cash' ? val : 0,
    prepaid: account === 'prepaid' ? val : 0,
  };
};

/**
 * Calculates signed balance deltas across all accounts in both decimal EGP and integer piastres.
 * @param {Object} tx
 * @returns {Array<{ account: 'bank' | 'cash' | 'prepaid', delta: number, deltaInPiastres: number }>}
 */
const calculateSignedDeltas = (tx) => {
  const {
    transactionType,
    transactionValue,
    paymentMethod,
    logBankOp,
    logCashOp,
    logPrepaidOp,
    fromAccount,
    toAccount,
  } = tx;
  const absValue = Math.abs(Number(transactionValue) || 0);
  const absPiastres = toPiastres(absValue);
  const deltas = [];

  if (transactionType === 'T') {
    const acc = normalizeAccount(paymentMethod || 'Bank');
    deltas.push({ account: acc, delta: absValue, deltaInPiastres: absPiastres });
  } else if (transactionType === 'W') {
    const acc = normalizeAccount(paymentMethod || 'Bank');
    deltas.push({ account: acc, delta: -absValue, deltaInPiastres: -absPiastres });
  } else if (transactionType === 'S') {
    const acc = normalizeAccount(paymentMethod || 'Bank');
    deltas.push({ account: acc, delta: -absValue, deltaInPiastres: -absPiastres });
  } else if (transactionType === 'na') {
    // Log / Inter-account transfer
    if (fromAccount && toAccount && fromAccount !== toAccount) {
      deltas.push({ account: normalizeAccount(fromAccount), delta: -absValue, deltaInPiastres: -absPiastres });
      deltas.push({ account: normalizeAccount(toAccount), delta: absValue, deltaInPiastres: absPiastres });
    } else {
      let hasOp = false;

      if (logBankOp === '+') {
        deltas.push({ account: 'bank', delta: absValue, deltaInPiastres: absPiastres });
        hasOp = true;
      } else if (logBankOp === '-') {
        deltas.push({ account: 'bank', delta: -absValue, deltaInPiastres: -absPiastres });
        hasOp = true;
      }

      if (logCashOp === '+') {
        deltas.push({ account: 'cash', delta: absValue, deltaInPiastres: absPiastres });
        hasOp = true;
      } else if (logCashOp === '-') {
        deltas.push({ account: 'cash', delta: -absValue, deltaInPiastres: -absPiastres });
        hasOp = true;
      }

      if (logPrepaidOp === '+') {
        deltas.push({ account: 'prepaid', delta: absValue, deltaInPiastres: absPiastres });
        hasOp = true;
      } else if (logPrepaidOp === '-') {
        deltas.push({ account: 'prepaid', delta: -absValue, deltaInPiastres: -absPiastres });
        hasOp = true;
      }

      // Default fallback if no specific ops provided
      if (!hasOp) {
        const acc = normalizeAccount(paymentMethod || 'Bank');
        deltas.push({ account: acc, delta: absValue, deltaInPiastres: absPiastres });
      }
    }
  } else {
    const acc = normalizeAccount(paymentMethod || 'Bank');
    deltas.push({ account: acc, delta: -absValue, deltaInPiastres: -absPiastres });
  }

  return deltas;
};

/**
 * Backward compatibility wrapper for calculateSignedDeltas
 */
const calculateSignedDelta = (paymentMethod, transactionType, transactionValue) => {
  const deltas = calculateSignedDeltas({ paymentMethod, transactionType, transactionValue });
  return {
    account: deltas[0]?.account || 'bank',
    delta: deltas[0]?.delta || 0,
    value: Math.abs(Number(transactionValue) || 0),
  };
};

/**
 * Finds the immediately preceding non-deleted transaction for a user relative to a given date and tie-breaker ID.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Date|string} date
 * @param {string|mongoose.Types.ObjectId|null} excludeId
 * @param {mongoose.ClientSession|null} session
 * @returns {Promise<{ bank: number, cash: number, prepaid: number, bankInPiastres: number, cashInPiastres: number, prepaidInPiastres: number }>}
 */
const calculatePreviousBalance = async (userId, date, excludeId = null, session = null) => {
  const targetDate = new Date(date);
  const query = { user: userId, deletedAt: null };

  if (excludeId) {
    query._id = { $ne: excludeId };
    query.$or = [
      { date: { $lt: targetDate } },
      { date: targetDate, _id: { $lt: excludeId } },
    ];
  } else {
    query.date = { $lte: targetDate };
  }

  const findQuery = Expenditure.findOne(query).sort({ date: -1, _id: -1 });
  if (session) {
    findQuery.session(session);
  }

  const prevDoc = await findQuery.exec();
  if (!prevDoc) {
    return {
      bank: 0,
      cash: 0,
      prepaid: 0,
      bankInPiastres: 0,
      cashInPiastres: 0,
      prepaidInPiastres: 0,
    };
  }

  const bank = prevDoc.runningBalances?.bank ?? prevDoc.bank ?? 0;
  const cash = prevDoc.runningBalances?.cash ?? prevDoc.cash ?? 0;
  const prepaid = prevDoc.runningBalances?.prepaid ?? prevDoc.prepaid ?? 0;

  return {
    bank,
    cash,
    prepaid,
    bankInPiastres: prevDoc.runningBalancesInPiastres?.bank ?? toPiastres(bank),
    cashInPiastres: prevDoc.runningBalancesInPiastres?.cash ?? toPiastres(cash),
    prepaidInPiastres: prevDoc.runningBalancesInPiastres?.prepaid ?? toPiastres(prepaid),
  };
};

/**
 * Propagates a balance delta to all subsequent non-deleted transactions for a specific account.
 * Updates both decimal EGP fields and integer piastres fields.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string} account - 'bank' | 'cash' | 'prepaid'
 * @param {Date|string} date
 * @param {number} changeAmount - signed amount to increment/decrement
 * @param {string|mongoose.Types.ObjectId|null} excludeId
 * @param {mongoose.ClientSession|null} session
 * @returns {Promise<any>}
 */
const propagateBalanceChange = async (
  userId,
  account,
  date,
  changeAmount,
  excludeId = null,
  session = null
) => {
  if (!changeAmount || changeAmount === 0) {
    return { modifiedCount: 0 };
  }

  const acc = normalizeAccount(account);
  const changePiastres = toPiastres(changeAmount);
  const targetDate = new Date(date);
  const query = { user: userId, deletedAt: null };

  if (excludeId) {
    query._id = { $ne: excludeId };
    query.$or = [
      { date: { $gt: targetDate } },
      { date: targetDate, _id: { $gt: excludeId } },
    ];
  } else {
    query.date = { $gt: targetDate };
  }

  const updateOp = {
    $inc: {
      [`runningBalances.${acc}`]: changeAmount,
      [`runningBalancesInPiastres.${acc}`]: changePiastres,
      [acc]: changeAmount,
      [`${acc}InPiastres`]: changePiastres,
    },
  };

  const updateQuery = Expenditure.updateMany(query, updateOp);
  if (session) {
    updateQuery.session(session);
  }

  return await updateQuery.exec();
};

/**
 * Propagates multiple account deltas to all subsequent transactions.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Array<{ account: string, delta: number }>} deltas
 * @param {Date|string} date
 * @param {string|mongoose.Types.ObjectId|null} excludeId
 * @param {mongoose.ClientSession|null} session
 * @returns {Promise<void>}
 */
const propagateBalanceChanges = async (userId, deltas, date, excludeId = null, session = null) => {
  if (!Array.isArray(deltas) || deltas.length === 0) return;
  for (const { account, delta } of deltas) {
    if (delta !== 0) {
      await propagateBalanceChange(userId, account, date, delta, excludeId, session);
    }
  }
};

/**
 * Executes a work function inside a MongoDB transaction when supported by the cluster,
 * or runs directly as fallback for standalone MongoDB instances.
 * @param {Function} workFn - async (session) => result
 * @returns {Promise<any>}
 */
const executeInTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    const isUnsupportedTopology =
      error.code === 20 ||
      (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member'));

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Suppress abort error
      }
    }

    if (isUnsupportedTopology) {
      return await workFn(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = {
  normalizeAccount,
  mapAccountFields,
  calculateSignedDelta,
  calculateSignedDeltas,
  calculatePreviousBalance,
  propagateBalanceChange,
  propagateBalanceChanges,
  executeInTransaction,
};
