// backend/services/lendingService.js
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const { BadRequestError } = require('../utils/errors');

/**
 * Normalizes an input date to UTC midday (12:00:00.000Z) to prevent timezone drift.
 * @param {string|Date} date
 * @returns {Date}
 */
function normalizeMiddayUTC(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestError('Invalid date provided');
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0));
}

/**
 * Computes running balances for a list of transactions in chronological sequence.
 * Augments each row with `runningBalanceInPiastres`.
 * @param {Array} transactions
 * @returns {Array}
 */
function computeRunningBalance(transactions = []) {
  if (!transactions || transactions.length === 0) return [];

  // Clone and sort chronologically (date ascending, then by _id/createdAt ascending)
  const sorted = transactions.map((t) => (t.toObject ? t.toObject() : { ...t })).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return createdA - createdB;
  });

  let runningBalance = 0;
  return sorted.map((tx) => {
    const amount = Number(tx.amountInPiastres) || 0;
    if (tx.type === 'borrow') {
      runningBalance += amount;
    } else if (tx.type === 'repay') {
      runningBalance -= amount;
    }
    return {
      ...tx,
      runningBalanceInPiastres: runningBalance,
    };
  });
}

/**
 * Validates adding a new transaction to a loan.
 * Rejects repayments that exceed the outstanding balance.
 * @param {Object} loan
 * @param {Object} newTx
 */
function validateNewTransaction(loan, newTx) {
  if (newTx.type === 'repay') {
    const currentBalance =
      loan.balanceInPiastres !== undefined
        ? loan.balanceInPiastres
        : (loan.transactions || []).reduce((acc, t) => {
            return t.type === 'borrow' ? acc + t.amountInPiastres : acc - t.amountInPiastres;
          }, 0);

    if (newTx.amountInPiastres > currentBalance) {
      throw new BadRequestError(
        `Repayment amount (${newTx.amountInPiastres} piastres) exceeds outstanding loan balance (${currentBalance} piastres)`
      );
    }
  }
}

/**
 * Validates deleting a transaction from a loan's transaction ledger.
 * Ensures no intermediate or final running balance falls below zero.
 * @param {Array} transactions
 * @param {string} txIdToRemove
 */
function validateTransactionDeletion(transactions = [], txIdToRemove) {
  const candidate = transactions.filter((t) => t._id.toString() !== txIdToRemove.toString());
  const evaluated = computeRunningBalance(candidate);

  for (const row of evaluated) {
    if (row.runningBalanceInPiastres < 0) {
      throw new BadRequestError('Cannot delete transaction: intermediate running balance would become negative');
    }
  }

  const finalBalance = evaluated.length > 0 ? evaluated[evaluated.length - 1].runningBalanceInPiastres : 0;
  if (finalBalance < 0) {
    throw new BadRequestError('Cannot delete transaction: final running balance would become negative');
  }

  return true;
}

/**
 * Recalculates loan status based on balance and current status.
 * Preserves WrittenOff status (repayments reduce balance without auto-reactivating).
 * @param {Object} loan
 * @returns {string} updated status
 */
function recalculateLoanStatus(loan) {
  if (loan.status === 'WrittenOff') {
    return 'WrittenOff';
  }

  const totalBorrowed = (loan.transactions || [])
    .filter((t) => t.type === 'borrow')
    .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
  const totalRepaid = (loan.transactions || [])
    .filter((t) => t.type === 'repay')
    .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
  const balance = totalBorrowed - totalRepaid;

  if (totalBorrowed > 0 && balance <= 0) {
    loan.status = 'Repaid';
  } else if (balance > 0) {
    loan.status = 'Active';
  }

  return loan.status;
}

/**
 * Calculates aggregate lending stats for a specific person.
 * Segregates active debt from written-off debt.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} personId
 * @returns {Promise<Object>}
 */
async function getPersonAggregate(userId, personId) {
  const loans = await Loan.find({
    user: userId,
    person: personId,
    deletedAt: null,
  }).lean();

  let totalOutstandingInPiastres = 0;
  let activeLoanCount = 0;
  let writtenOffCount = 0;
  let totalWrittenOffInPiastres = 0;

  for (const loan of loans) {
    const txs = loan.transactions || [];
    const borrowed = txs.filter((t) => t.type === 'borrow').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
    const repaid = txs.filter((t) => t.type === 'repay').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
    const balance = Math.max(0, borrowed - repaid);

    if (loan.status === 'WrittenOff') {
      writtenOffCount += 1;
      totalWrittenOffInPiastres += balance;
    } else if (loan.status === 'Active' && balance > 0) {
      activeLoanCount += 1;
      totalOutstandingInPiastres += balance;
    }
  }

  return {
    totalOutstandingInPiastres,
    activeLoanCount,
    writtenOffCount,
    totalWrittenOffInPiastres,
  };
}

/**
 * Computes global receivables summary across loans.
 * Reused identically by GET /api/lending/summary and comprehensiveReportService.js.
 * @param {string|ObjectId} userId
 * @param {Object} [options]
 * @param {Date} [options.periodStart]
 * @param {Date} [options.periodEnd]
 * @returns {Promise<Object>}
 */
async function getSummaryAggregate(userId, { periodStart, periodEnd } = {}) {
  const isPeriodScoped = Boolean(periodStart && periodEnd);
  const loans = await Loan.find({
    user: userId,
    deletedAt: null,
  })
    .populate('person', 'name')
    .lean();

  let totalBorrowed = 0;
  let totalRepaid = 0;
  let totalOutstanding = 0;
  let activeLoansCount = 0;
  const debtorMap = new Map();

  for (const loan of loans) {
    const txs = loan.transactions || [];

    if (isPeriodScoped) {
      // Evaluate borrow and repay occurring strictly within the period
      for (const t of txs) {
        const txDate = new Date(t.date);
        if (txDate >= periodStart && txDate <= periodEnd) {
          if (t.type === 'borrow') totalBorrowed += t.amountInPiastres || 0;
          if (t.type === 'repay') totalRepaid += t.amountInPiastres || 0;
        }
      }

      // Evaluate outstanding balance as of periodEnd (strictly excluding WrittenOff)
      if (loan.status !== 'WrittenOff') {
        const txsUpToPeriodEnd = txs.filter((t) => new Date(t.date) <= periodEnd);
        const borrowedUpTo = txsUpToPeriodEnd
          .filter((t) => t.type === 'borrow')
          .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
        const repaidUpTo = txsUpToPeriodEnd
          .filter((t) => t.type === 'repay')
          .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
        const balAtPeriodEnd = borrowedUpTo - repaidUpTo;

        if (balAtPeriodEnd > 0) {
          totalOutstanding += balAtPeriodEnd;
          activeLoansCount += 1;
          const personId = loan.person?._id?.toString() || loan.person?.toString();
          const personName = loan.person?.name || 'Unknown';
          const existing = debtorMap.get(personId) || { personId, personName, balanceInPiastres: 0 };
          existing.balanceInPiastres += balAtPeriodEnd;
          debtorMap.set(personId, existing);
        }
      }
    } else {
      // Current-state evaluation (all transactions to date)
      for (const t of txs) {
        if (t.type === 'borrow') totalBorrowed += t.amountInPiastres || 0;
        if (t.type === 'repay') totalRepaid += t.amountInPiastres || 0;
      }

      const borrowed = txs.filter((t) => t.type === 'borrow').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      const repaid = txs.filter((t) => t.type === 'repay').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      const balance = borrowed - repaid;

      // WrittenOff loans are strictly excluded from totalOutstanding
      if (loan.status === 'Active' && balance > 0) {
        totalOutstanding += balance;
        activeLoansCount += 1;
        const personId = loan.person?._id?.toString() || loan.person?.toString();
        const personName = loan.person?.name || 'Unknown';
        const existing = debtorMap.get(personId) || { personId, personName, balanceInPiastres: 0 };
        existing.balanceInPiastres += balance;
        debtorMap.set(personId, existing);
      }
    }
  }

  const topDebtors = Array.from(debtorMap.values())
    .sort((a, b) => b.balanceInPiastres - a.balanceInPiastres)
    .slice(0, 5);

  return {
    totalBorrowed,
    totalRepaid,
    totalOutstanding,
    activeLoansCount,
    personsCount: debtorMap.size,
    topDebtors,
  };
}

module.exports = {
  normalizeMiddayUTC,
  computeRunningBalance,
  validateNewTransaction,
  validateTransactionDeletion,
  recalculateLoanStatus,
  getPersonAggregate,
  getSummaryAggregate,
};
