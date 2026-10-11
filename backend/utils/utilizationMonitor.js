// backend/utils/utilizationMonitor.js

/**
 * Calculates utilization percentage for a credit card.
 *
 * @param {Object} card - CreditCard instance
 * @param {number} currentBalance - outstanding balance in decimal EGP
 * @returns {number} utilization percentage rounded to 2 decimals
 */
const calculateUtilization = (card, currentBalance = 0) => {
  const limit = Number(card.limit) || (card.limitInPiastres ? card.limitInPiastres / 100 : 0);
  if (limit <= 0) return 0;

  const balance = Math.max(0, Number(currentBalance) || 0);
  const rawUtilization = (balance / limit) * 100;
  return Math.round(rawUtilization * 100) / 100;
};

/**
 * Evaluates whether a card exceeds its utilization alert threshold.
 *
 * @param {Object} card - CreditCard instance
 * @param {number} currentBalance - outstanding balance in decimal EGP
 * @returns {Object} alert summary
 */
const checkUtilizationAlert = (card, currentBalance = 0) => {
  const limit = Number(card.limit) || (card.limitInPiastres ? card.limitInPiastres / 100 : 0);
  const utilization = calculateUtilization(card, currentBalance);
  const threshold = card.utilizationAlertThreshold !== undefined ? card.utilizationAlertThreshold : 30;
  const isAlert = utilization > threshold;

  let severity = 'safe';
  if (utilization >= 50) {
    severity = 'danger';
  } else if (utilization >= 30) {
    severity = 'warning';
  }

  let message = `Utilization is at ${utilization.toFixed(1)}% (Limit: ${limit.toLocaleString()}).`;
  if (isAlert) {
    message += ` Exceeds your target threshold of ${threshold}%. Consider paying down balance before statement close.`;
  }

  return {
    cardId: card._id,
    cardName: card.name,
    limit,
    currentBalance,
    utilization,
    threshold,
    isAlert,
    severity,
    message,
  };
};

/**
 * Calculates portfolio-wide credit utilization and identifies alerted cards.
 *
 * @param {Array<{ card: Object, balance: number }>} cardData
 * @returns {Object}
 */
const checkPortfolioUtilization = (cardData = []) => {
  let totalLimit = 0;
  let totalBalance = 0;
  const cards = [];

  for (const item of cardData) {
    const card = item.card || item;
    const balance = Number(item.balance !== undefined ? item.balance : item.outstandingBalance) || 0;
    const cardLimit = Number(card.limit) || 0;

    totalLimit += cardLimit;
    totalBalance += balance;

    const alertInfo = checkUtilizationAlert(card, balance);
    cards.push(alertInfo);
  }

  const overallUtilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 10000) / 100 : 0;
  const hasAlerts = cards.some((c) => c.isAlert);

  return {
    totalLimit,
    totalBalance,
    overallUtilization,
    hasAlerts,
    cards,
  };
};

module.exports = {
  calculateUtilization,
  checkUtilizationAlert,
  checkPortfolioUtilization,
};
