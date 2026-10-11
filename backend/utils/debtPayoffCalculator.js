// backend/utils/debtPayoffCalculator.js

const MAX_SIMULATION_MONTHS = 360; // 30 years ceiling to avoid infinite loops

/**
 * Clones cards state for simulation.
 */
const cloneCards = (cards) => {
  return cards.map((c) => ({
    cardId: c.cardId ? c.cardId.toString() : c._id.toString(),
    cardName: c.cardName || c.name || 'Card',
    balance: Math.max(0, Math.round(Number(c.balanceInPiastres) || 0)),
    minPayment: Math.max(0, Math.round(Number(c.minimumPaymentInPiastres) || 0)),
    apr: Math.max(0, Number(c.apr) || 0),
  }));
};

/**
 * Core debt simulation loop.
 *
 * @param {Array<Object>} initialCards
 * @param {number} monthlyBudgetInPiastres
 * @param {Function} sortFn - determines priority order of cards each month
 * @returns {{ schedule: Array<Object>, totalInterestPaidInPiastres: number, monthsToPayoff: number, projectedPayoffDate: Date }}
 */
const simulateDebtPayoff = (initialCards, monthlyBudgetInPiastres, sortFn) => {
  let cards = cloneCards(initialCards).filter((c) => c.balance > 0);
  const schedule = [];
  let totalInterest = 0;
  let month = 0;

  if (cards.length === 0) {
    return {
      schedule: [],
      totalInterestPaidInPiastres: 0,
      monthsToPayoff: 0,
      projectedPayoffDate: new Date(),
    };
  }

  const effectiveBudget = Math.max(
    monthlyBudgetInPiastres,
    cards.reduce((sum, c) => sum + c.minPayment, 0)
  );

  while (cards.some((c) => c.balance > 0) && month < MAX_SIMULATION_MONTHS) {
    month++;
    let budgetLeft = effectiveBudget;
    const activeCards = cards.filter((c) => c.balance > 0);

    // 1. Accrue monthly interest
    for (const card of activeCards) {
      const monthlyRate = card.apr / 100 / 12;
      const interest = Math.round(card.balance * monthlyRate);
      card.balance += interest;
      totalInterest += interest;
      card.currentMonthInterest = interest;
    }

    // 2. Pay minimums across all active cards
    for (const card of activeCards) {
      const minDue = Math.min(card.minPayment, card.balance);
      const paid = Math.min(minDue, budgetLeft);
      card.balance -= paid;
      budgetLeft -= paid;
      card.currentMonthPayment = paid;
    }

    // 3. Apply leftover budget to priority target card
    const sortedActive = [...activeCards.filter((c) => c.balance > 0)].sort(sortFn);
    for (const targetCard of sortedActive) {
      if (budgetLeft <= 0) break;
      const extraPay = Math.min(targetCard.balance, budgetLeft);
      targetCard.balance -= extraPay;
      targetCard.currentMonthPayment += extraPay;
      budgetLeft -= extraPay;
    }

    // 4. Record schedule for this month
    for (const card of activeCards) {
      schedule.push({
        month,
        cardId: card.cardId,
        cardName: card.cardName,
        paymentInPiastres: card.currentMonthPayment,
        interestChargedInPiastres: card.currentMonthInterest,
        remainingBalanceInPiastres: card.balance,
      });
    }
  }

  const projectedPayoffDate = new Date();
  projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + month);

  return {
    schedule,
    totalInterestPaidInPiastres: totalInterest,
    monthsToPayoff: month,
    projectedPayoffDate,
  };
};

/**
 * Calculates Debt Snowball schedule (lowest balance first).
 */
const calculateSnowball = (cards, monthlyBudgetInPiastres) => {
  return simulateDebtPayoff(cards, monthlyBudgetInPiastres, (a, b) => a.balance - b.balance);
};

/**
 * Calculates Debt Avalanche schedule (highest APR first).
 */
const calculateAvalanche = (cards, monthlyBudgetInPiastres) => {
  return simulateDebtPayoff(cards, monthlyBudgetInPiastres, (a, b) => b.apr - a.apr);
};

/**
 * Calculates Custom Order schedule.
 */
const calculateCustom = (cards, monthlyBudgetInPiastres, customOrder = []) => {
  const orderMap = new Map();
  customOrder.forEach((id, index) => orderMap.set(id.toString(), index));

  return simulateDebtPayoff(cards, monthlyBudgetInPiastres, (a, b) => {
    const orderA = orderMap.has(a.cardId) ? orderMap.get(a.cardId) : 999;
    const orderB = orderMap.has(b.cardId) ? orderMap.get(b.cardId) : 999;
    return orderA - orderB;
  });
};

/**
 * Baseline: Simulates paying only the minimum payment each month.
 */
const calculateMinimumOnly = (initialCards) => {
  let cards = cloneCards(initialCards).filter((c) => c.balance > 0);
  let totalInterest = 0;
  let month = 0;
  const schedule = [];

  while (cards.some((c) => c.balance > 0) && month < MAX_SIMULATION_MONTHS) {
    month++;
    const activeCards = cards.filter((c) => c.balance > 0);

    for (const card of activeCards) {
      const monthlyRate = card.apr / 100 / 12;
      const interest = Math.round(card.balance * monthlyRate);
      card.balance += interest;
      totalInterest += interest;

      // Minimum payment
      const payment = Math.min(card.minPayment, card.balance);
      card.balance -= payment;

      schedule.push({
        month,
        cardId: card.cardId,
        paymentInPiastres: payment,
        interestChargedInPiastres: interest,
        remainingBalanceInPiastres: card.balance,
      });
    }
  }

  const projectedPayoffDate = new Date();
  projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + month);

  return {
    schedule,
    totalInterestPaidInPiastres: totalInterest,
    monthsToPayoff: month,
    projectedPayoffDate,
  };
};

module.exports = {
  calculateSnowball,
  calculateAvalanche,
  calculateCustom,
  calculateMinimumOnly,
};
