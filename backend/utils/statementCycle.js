// backend/utils/statementCycle.js

/**
 * Returns safe day of month clamped to the days in the given year/month (0-indexed month).
 */
const getClampedDate = (year, month, day) => {
  const maxDays = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, day), maxDays);
  return new Date(year, month, clampedDay, 23, 59, 59, 999);
};

const getClampedStartDate = (year, month, day) => {
  const maxDays = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, day), maxDays);
  return new Date(year, month, clampedDay, 0, 0, 0, 0);
};

/**
 * Calculates current statement period boundaries and due dates for a credit card.
 *
 * @param {Object} card - CreditCard instance with statementCloseDay, paymentDueDay
 * @param {Date} [asOfDate=new Date()]
 * @returns {{ startDate: Date, endDate: Date, closeDate: Date, dueDate: Date, daysUntilClose: number, daysUntilDue: number, isOverdue: boolean }}
 */
const getStatementPeriod = (card, asOfDate = new Date()) => {
  const target = new Date(asOfDate);
  const closeDay = card.statementCloseDay || card.billingCycleDay || 25;
  const dueDay = card.paymentDueDay || 15;

  const currentYear = target.getFullYear();
  const currentMonth = target.getMonth();
  const currentDate = target.getDate();

  let closeYear = currentYear;
  let closeMonth = currentMonth;

  if (currentDate > closeDay) {
    // Current cycle closes next month
    closeMonth += 1;
    if (closeMonth > 11) {
      closeMonth = 0;
      closeYear += 1;
    }
  }

  // End/Close date of the current cycle
  const closeDate = getClampedDate(closeYear, closeMonth, closeDay);

  // Start date of current cycle: 1 day after previous month's close date
  let prevMonth = closeMonth - 1;
  let prevYear = closeYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevClose = getClampedDate(prevYear, prevMonth, closeDay);
  const startDate = new Date(prevClose.getTime() + 1); // 1 ms after prev close (beginning of next day)
  startDate.setHours(0, 0, 0, 0);

  // Due date: typically due in the month following the close date on paymentDueDay
  let dueMonth = closeMonth + 1;
  let dueYear = closeYear;
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }
  const dueDate = getClampedDate(dueYear, dueMonth, dueDay);

  const msPerDay = 1000 * 60 * 60 * 24;
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const closeMidnight = new Date(closeDate.getFullYear(), closeDate.getMonth(), closeDate.getDate());
  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const daysUntilClose = Math.max(0, Math.round((closeMidnight.getTime() - targetMidnight.getTime()) / msPerDay));
  const daysUntilDue = Math.round((dueMidnight.getTime() - targetMidnight.getTime()) / msPerDay);
  const isOverdue = daysUntilDue < 0;

  return {
    startDate,
    endDate: closeDate,
    closeDate,
    dueDate,
    daysUntilClose,
    daysUntilDue,
    isOverdue,
  };
};

/**
 * Returns an array of statement cycle windows for the last N months.
 *
 * @param {Object} card
 * @param {{ months?: number, asOfDate?: Date }} options
 * @returns {Array<Object>}
 */
const getStatementCycles = (card, options = {}) => {
  const months = options.months || 6;
  const asOf = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const cycles = [];

  for (let i = 0; i < months; i++) {
    const probeDate = new Date(asOf);
    probeDate.setMonth(probeDate.getMonth() - i);
    const period = getStatementPeriod(card, probeDate);

    // Avoid duplicates if probe dates fall in same cycle
    const alreadyExists = cycles.some(
      (c) => c.closeDate.toISOString().slice(0, 10) === period.closeDate.toISOString().slice(0, 10)
    );
    if (!alreadyExists) {
      cycles.push({
        cycleIndex: cycles.length,
        ...period,
      });
    }
  }

  return cycles.sort((a, b) => b.closeDate.getTime() - a.closeDate.getTime());
};

/**
 * Assigns a specific transaction date to its corresponding statement cycle.
 *
 * @param {Object} card
 * @param {Date|string} txDate
 * @returns {Object}
 */
const assignTransactionToCycle = (card, txDate) => {
  return getStatementPeriod(card, new Date(txDate));
};

module.exports = {
  getStatementPeriod,
  getStatementCycles,
  assignTransactionToCycle,
};
