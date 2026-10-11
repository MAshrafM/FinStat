// backend/routes/debtPayoff.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const DebtPayoffPlan = require('../models/DebtPayoffPlan');
const {
  calculatePayoffSchema,
  savePlanSchema,
  paramsSchema,
} = require('../validationSchemas/debtPayoffSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const {
  calculateSnowball,
  calculateAvalanche,
  calculateCustom,
  calculateMinimumOnly,
} = require('../utils/debtPayoffCalculator');

/**
 * Calculates a debt payoff schedule for Snowball, Avalanche, or Custom strategy.
 * Compares against Minimum-only baseline to compute interest savings.
 */
router.post('/calculate', auth, validate({ body: calculatePayoffSchema }), asyncHandler(async (req, res) => {
  const { strategy, monthlyBudget, cardIds, customOrder } = getValidated(req, 'body');
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);

  let cardQuery = { user: userId, deletedAt: null };
  if (cardIds && cardIds.length > 0) {
    cardQuery._id = { $in: cardIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const userCards = await CreditCard.find(cardQuery).lean();
  if (userCards.length === 0) {
    return res.json({
      strategy,
      monthlyBudget,
      schedule: [],
      projectedPayoffDate: new Date(),
      totalInterestPaidInPiastres: 0,
      totalInterestSavedInPiastres: 0,
      monthsToPayoff: 0,
      comparison: {
        snowball: { totalInterest: 0, months: 0 },
        avalanche: { totalInterest: 0, months: 0 },
        minimumOnly: { totalInterest: 0, months: 0 },
      },
    });
  }

  // Calculate current outstanding balance and minimum payment for each card
  const cardsPayload = [];
  for (const card of userCards) {
    const pRes = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Purchase', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } },
    ]);
    const purchaseBal = pRes.length > 0 ? pRes[0].total : 0;

    const iRes = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } },
    ]);
    const installBal = iRes.length > 0 ? iRes[0].total : 0;
    const balance = purchaseBal + installBal;

    if (balance > 0) {
      const minPercent = (card.minimumPaymentPercent || 5) / 100;
      const minPayment = Math.max(balance * minPercent, 50); // min 50 EGP floor

      cardsPayload.push({
        cardId: card._id,
        name: card.name,
        balanceInPiastres: toPiastres(balance),
        minimumPaymentInPiastres: toPiastres(minPayment),
        apr: card.apr || 0,
      });
    }
  }

  const budgetInPiastres = toPiastres(monthlyBudget);

  // Compute all 3 for comparison
  const snowballResult = calculateSnowball(cardsPayload, budgetInPiastres);
  const avalancheResult = calculateAvalanche(cardsPayload, budgetInPiastres);
  const minOnlyResult = calculateMinimumOnly(cardsPayload);

  let selectedResult;
  if (strategy === 'snowball') {
    selectedResult = snowballResult;
  } else if (strategy === 'avalanche') {
    selectedResult = avalancheResult;
  } else {
    selectedResult = calculateCustom(cardsPayload, budgetInPiastres, customOrder || []);
  }

  const interestSaved = Math.max(0, minOnlyResult.totalInterestPaidInPiastres - selectedResult.totalInterestPaidInPiastres);

  res.json({
    strategy,
    monthlyBudget,
    monthlyBudgetInPiastres: budgetInPiastres,
    cards: cardsPayload,
    schedule: selectedResult.schedule,
    monthsToPayoff: selectedResult.monthsToPayoff,
    projectedPayoffDate: selectedResult.projectedPayoffDate,
    totalInterestPaidInPiastres: selectedResult.totalInterestPaidInPiastres,
    totalInterestSavedInPiastres: interestSaved,
    comparison: {
      snowball: {
        totalInterestPaidInPiastres: snowballResult.totalInterestPaidInPiastres,
        monthsToPayoff: snowballResult.monthsToPayoff,
        projectedPayoffDate: snowballResult.projectedPayoffDate,
      },
      avalanche: {
        totalInterestPaidInPiastres: avalancheResult.totalInterestPaidInPiastres,
        monthsToPayoff: avalancheResult.monthsToPayoff,
        projectedPayoffDate: avalancheResult.projectedPayoffDate,
      },
      minimumOnly: {
        totalInterestPaidInPiastres: minOnlyResult.totalInterestPaidInPiastres,
        monthsToPayoff: minOnlyResult.monthsToPayoff,
        projectedPayoffDate: minOnlyResult.projectedPayoffDate,
      },
    },
  });
}));

/**
 * Lists user's saved debt payoff plans.
 */
router.get('/plans', auth, asyncHandler(async (req, res) => {
  const plans = await DebtPayoffPlan.find({ user: req.effectiveUserId, deletedAt: null })
    .populate('cards.cardId', 'name bank limit')
    .sort({ createdAt: -1 });
  res.json(plans);
}));

/**
 * Saves a debt payoff plan.
 */
router.post('/plans', auth, validate({ body: savePlanSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  // Deactivate any previously active plan
  await DebtPayoffPlan.updateMany(
    { user: req.effectiveUserId, isActive: true, deletedAt: null },
    { $set: { isActive: false } }
  );

  const newPlan = new DebtPayoffPlan({
    ...validatedBody,
    user: req.effectiveUserId,
    monthlyBudgetInPiastres: toPiastres(validatedBody.monthlyBudget),
    isActive: true,
  });
  await newPlan.save();
  res.status(201).json(newPlan);
}));

/**
 * Soft deletes a debt payoff plan.
 */
router.delete('/plans/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const plan = await DebtPayoffPlan.findOne({ _id: id, deletedAt: null });
  if (!plan) throw new NotFoundError('Plan not found');
  if (plan.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  await plan.softDelete();
  res.json({ msg: 'Debt payoff plan deleted successfully' });
}));

module.exports = router;
