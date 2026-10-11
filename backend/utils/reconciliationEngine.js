// backend/utils/reconciliationEngine.js
const CardTransaction = require('../models/CardTransaction');
const CardPayment = require('../models/CardPayment');
const { toPiastres } = require('./currencyUtils');

/**
 * Reconciles a card statement cycle against logged transactions, payments, and actual statement balance.
 *
 * @param {Object} card - CreditCard instance
 * @param {Date|string} cycleStart
 * @param {Date|string} cycleEnd
 * @param {number} actualStatementBalance
 * @param {String|ObjectId} userId
 * @returns {Promise<Object>}
 */
const reconcileCycle = async (card, cycleStart, cycleEnd, actualStatementBalance, userId) => {
  const start = new Date(cycleStart);
  const end = new Date(cycleEnd);
  const actualBal = Number(actualStatementBalance) || 0;

  // 1. Transactions prior to cycle start (Opening Balance component)
  const prevPurchases = await CardTransaction.find({
    card: card._id,
    user: userId,
    date: { $lt: start },
    deletedAt: null,
  }).lean();

  const prevPayments = await CardPayment.find({
    card: card._id,
    user: userId,
    date: { $lt: start },
    deletedAt: null,
  }).lean();

  const prevPurchasesTotal = prevPurchases.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const prevPaymentsTotal = prevPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const openingBalance = Math.max(0, Math.round((prevPurchasesTotal - prevPaymentsTotal) * 100) / 100);

  // 2. Transactions during current cycle
  const cycleTransactions = await CardTransaction.find({
    card: card._id,
    user: userId,
    date: { $gte: start, $lte: end },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  // 3. Payments during current cycle
  const cyclePayments = await CardPayment.find({
    card: card._id,
    user: userId,
    date: { $gte: start, $lte: end },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  const totalCycleTransactions = cycleTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalCyclePayments = cyclePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // 4. Expected Balance calculation
  const expectedBalance = Math.round((openingBalance + totalCycleTransactions - totalCyclePayments) * 100) / 100;
  const discrepancy = Math.round((actualBal - expectedBalance) * 100) / 100;
  const isReconciled = Math.abs(discrepancy) < 0.01;

  let discrepancyAnalysis = '';
  if (!isReconciled) {
    if (discrepancy > 0) {
      discrepancyAnalysis = `Actual statement balance is higher by ${discrepancy.toFixed(2)} EGP. Possible causes: unlogged interest fees, late fees, annual card charges, or missing purchase receipts.`;
    } else {
      discrepancyAnalysis = `Actual statement balance is lower by ${Math.abs(discrepancy).toFixed(2)} EGP. Possible causes: unlogged payments, cashbacks, refunds, or duplicate transactions logged in FinStat.`;
    }
  } else {
    discrepancyAnalysis = 'Statement perfectly reconciled! All logged charges and payments match the bank statement.';
  }

  return {
    cardId: card._id,
    cardName: card.name,
    cycleStart: start,
    cycleEnd: end,
    openingBalance,
    totalTransactions: Math.round(totalCycleTransactions * 100) / 100,
    totalPayments: Math.round(totalCyclePayments * 100) / 100,
    expectedBalance,
    actualStatementBalance: actualBal,
    discrepancy,
    discrepancyInPiastres: toPiastres(discrepancy),
    isReconciled,
    analysis: discrepancyAnalysis,
    transactionCount: cycleTransactions.length,
    paymentCount: cyclePayments.length,
    transactions: cycleTransactions.map((tx) => ({
      _id: tx._id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
    })),
    payments: cyclePayments.map((p) => ({
      _id: p._id,
      date: p.date,
      amount: p.amount,
      paymentSource: p.paymentSource,
    })),
  };
};

module.exports = {
  reconcileCycle,
};
