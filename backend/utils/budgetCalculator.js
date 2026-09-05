// backend/utils/budgetCalculator.js
const Expenditure = require('../models/Expenditure');
const Budget = require('../models/Budget');

/**
 * Computes start and end dates for a given budget period.
 * @param {'monthly' | 'quarterly' | 'yearly'} period
 * @param {number} year
 * @param {number} [month] - 1 to 12
 * @param {number} [quarter] - 1 to 4
 * @returns {{ startDate: Date, endDate: Date }}
 */
function getDateRange(period, year, month, quarter) {
  const currentYear = year || new Date().getFullYear();

  if (period === 'monthly') {
    const targetMonth = month || new Date().getMonth() + 1; // 1-indexed
    const startDate = new Date(Date.UTC(currentYear, targetMonth - 1, 1, 0, 0, 0, 0));
    // Last day of month
    const endDate = new Date(Date.UTC(currentYear, targetMonth, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  if (period === 'quarterly') {
    const targetQuarter = quarter || Math.floor(new Date().getMonth() / 3) + 1; // 1-4
    const startMonthIndex = (targetQuarter - 1) * 3;
    const endMonthIndex = targetQuarter * 3;
    const startDate = new Date(Date.UTC(currentYear, startMonthIndex, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(currentYear, endMonthIndex, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  // Yearly
  const startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
  return { startDate, endDate };
}

/**
 * Calculates spending and progress against a specific Budget document.
 * @param {string | import('mongoose').Types.ObjectId} userId
 * @param {object} budget
 * @returns {Promise<object>}
 */
async function calculateBudgetProgress(userId, budget) {
  const { startDate, endDate } = getDateRange(
    budget.period,
    budget.year,
    budget.month,
    budget.quarter
  );

  const expenditures = await Expenditure.find({
    user: userId,
    deletedAt: null,
    transactionType: 'W', // Withdrawals/Expenses
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).lean();

  let spentAmount = 0;

  for (const exp of expenditures) {
    if (exp.splits && Array.isArray(exp.splits) && exp.splits.length > 0) {
      // Split transaction: aggregate only matching splits
      for (const split of exp.splits) {
        if (split.category === budget.category) {
          spentAmount += split.amount || 0;
        }
      }
    } else if (exp.categories && Array.isArray(exp.categories)) {
      // Single/multi category transaction without explicit splits
      if (exp.categories.includes(budget.category)) {
        // If single category, full amount; if multiple without splits, equal share
        spentAmount += exp.transactionValue / (exp.categories.length || 1);
      }
    }
  }

  spentAmount = Math.round(spentAmount * 100) / 100;
  const budgetedAmount = budget.amount;
  const remainingAmount = Math.round((budgetedAmount - spentAmount) * 100) / 100;
  const percentageUsed =
    budgetedAmount > 0 ? Math.round((spentAmount / budgetedAmount) * 1000) / 10 : 0;

  let alertStatus = 'green';
  const alertThreshold = budget.alertThreshold || 80;

  if (percentageUsed >= 90 || percentageUsed >= alertThreshold) {
    alertStatus = 'red';
  } else if (percentageUsed >= 70) {
    alertStatus = 'yellow';
  }

  return {
    budget,
    budgetId: budget._id,
    category: budget.category,
    period: budget.period,
    year: budget.year,
    month: budget.month,
    quarter: budget.quarter,
    budgetedAmount,
    spentAmount,
    remainingAmount,
    percentageUsed,
    alertThreshold,
    alertStatus,
    startDate,
    endDate,
  };
}

/**
 * Calculates budget progress for all active budgets of a user matching optional period filters.
 * @param {string | import('mongoose').Types.ObjectId} userId
 * @param {object} [filters]
 * @returns {Promise<Array<object>>}
 */
async function calculateAllBudgetsProgress(userId, filters = {}) {
  const query = { user: userId, deletedAt: null };

  if (filters.period) query.period = filters.period;
  if (filters.year) query.year = Number(filters.year);
  if (filters.month) query.month = Number(filters.month);
  if (filters.quarter) query.quarter = Number(filters.quarter);
  if (filters.category) query.category = filters.category;

  const budgets = await Budget.find(query).lean();
  const results = [];

  for (const budget of budgets) {
    const progress = await calculateBudgetProgress(userId, budget);
    results.push(progress);
  }

  return results;
}

module.exports = {
  getDateRange,
  calculateBudgetProgress,
  calculateAllBudgetsProgress,
};
