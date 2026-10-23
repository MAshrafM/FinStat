// backend/routes/creditCards.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const CardPayment = require('../models/CardPayment');
const Expenditure = require('../models/Expenditure');
const { resolveExchangeRate } = require('../utils/exchangeRateResolver');
const {
  createCardSchema,
  updateCardSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createPaymentSchema,
  updatePaymentSchema,
  payInFullSchema,
  partialPaymentSchema,
  cardIdParamsSchema,
  reconcileSchema,
  paramsSchema,
} = require('../validationSchemas/creditCardSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const {
  createExpenditureFromCardTransaction,
  createExpenditureFromCardPayment,
  unlinkExpenditure,
} = require('../utils/cardPaymentBridge');
const { getStatementPeriod, getStatementCycles } = require('../utils/statementCycle');
const { checkPortfolioUtilization, checkUtilizationAlert } = require('../utils/utilizationMonitor');
const { reconcileCycle } = require('../utils/reconciliationEngine');

// =============================================
// --- Credit Card Management (The Cards Themselves) ---
// =============================================
router.post('/cards', auth, validate({ body: createCardSchema }), asyncHandler(async (req, res) => { 
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newCard = new CreditCard({
    ...validatedBody,
    user: req.effectiveUserId,
    limitInPiastres: toPiastres(validatedBody.limit),
  });
  await newCard.save();
  res.status(201).json(newCard);
}));

router.get('/cards', auth, asyncHandler(async (req, res) => { 
  const cards = await CreditCard.find({ user: req.effectiveUserId, deletedAt: null }).sort({ createdAt: -1 });
  res.json(cards);
}));

router.put('/cards/:id', auth, validate({ params: paramsSchema, body: updateCardSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  const updateData = { ...validatedBody };
  if (validatedBody.limit !== undefined) {
    updateData.limitInPiastres = toPiastres(validatedBody.limit);
  }

  const card = await CreditCard.findOneAndUpdate(
    { _id: id, user: req.effectiveUserId, deletedAt: null },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!card) throw new NotFoundError('Card not found');
  res.json(card);
}));

router.delete('/cards/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const card = await CreditCard.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!card) throw new NotFoundError('Card not found');
  await card.softDelete();
  res.json({ msg: 'Credit Card deleted successfully' });
}));

router.post('/cards/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const card = await CreditCard.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!card) throw new NotFoundError('Soft-deleted card not found');
  await card.restore();
  res.json({ msg: 'Credit Card restored successfully', card });
}));

// =============================================
// --- Card Transaction Management ---
// =============================================
router.post('/transactions', auth, validate({ body: createTransactionSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  const card = await CreditCard.findOne({ _id: validatedBody.card, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const userRole = req.user?.role || 'viewer';
  const currency = (validatedBody.currency || 'EGP').trim().toUpperCase();
  let finalAmount, finalCurrency, finalForeignAmount, finalRate;

  if (currency === 'EGP') {
    finalAmount = validatedBody.amount;
    finalCurrency = 'EGP';
    finalForeignAmount = null;
    finalRate = 1;
  } else if (userRole === 'admin') {
    if (validatedBody.exchangeRateSnapshot && Number(validatedBody.exchangeRateSnapshot) > 0) {
      finalRate = Number(validatedBody.exchangeRateSnapshot);
    } else {
      const rateInfo = await resolveExchangeRate(currency, validatedBody.date, null, userRole);
      finalRate = rateInfo.rate;
    }
    finalAmount = validatedBody.amount !== undefined ? validatedBody.amount : Number((validatedBody.foreignAmount * finalRate).toFixed(2));
    finalCurrency = currency;
    finalForeignAmount = validatedBody.foreignAmount;
  } else {
    const rateInfo = await resolveExchangeRate(currency, validatedBody.date, null, userRole);
    finalRate = rateInfo.rate;
    finalCurrency = currency;
    finalForeignAmount = validatedBody.foreignAmount;
    finalAmount = Number((finalForeignAmount * finalRate).toFixed(2));
  }

  const transactionData = {
    ...validatedBody,
    user: req.effectiveUserId,
    amount: finalAmount,
    amountInPiastres: toPiastres(finalAmount),
    currency: finalCurrency,
    foreignAmount: finalForeignAmount,
    exchangeRateSnapshot: finalRate,
    paidAmountInPiastres: toPiastres(validatedBody.paidAmount || 0),
  };

  if (validatedBody.installmentDetails) {
    const months = validatedBody.installmentDetails.months;
    const monthlyPrincipal = validatedBody.installmentDetails.monthlyPrincipal !== undefined
      ? validatedBody.installmentDetails.monthlyPrincipal
      : (months ? finalAmount / months : 0);
    transactionData.installmentDetails = {
      ...validatedBody.installmentDetails,
      monthlyPrincipal,
      monthlyPrincipalInPiastres: toPiastres(monthlyPrincipal),
    };
  }

  const newTransaction = new CardTransaction(transactionData);
  await newTransaction.save();
  await createExpenditureFromCardTransaction(newTransaction, card, req.effectiveUserId);
  res.status(201).json(newTransaction);
}));

router.get('/transactions/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');

  const card = await CreditCard.findOne({ _id: cardId, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const transactions = await CardTransaction.find({ card: cardId, deletedAt: null }).sort({ date: -1 });
  res.json(transactions);
}));

router.put('/transactions/:id', auth, validate({ params: paramsSchema, body: updateTransactionSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  const existingTransaction = await CardTransaction.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!existingTransaction) throw new NotFoundError('Transaction not found');

  const userRole = req.user?.role || 'viewer';
  const targetDate = validatedBody.date !== undefined ? new Date(validatedBody.date) : existingTransaction.date;
  const newCurrency = (validatedBody.currency !== undefined ? validatedBody.currency : (existingTransaction.currency || 'EGP')).trim().toUpperCase();
  const currencyChanged = newCurrency !== (existingTransaction.currency || 'EGP');
  const dateChanged = targetDate.getTime() !== new Date(existingTransaction.date).getTime();

  let finalExchangeRate = existingTransaction.exchangeRateSnapshot || 1;
  let finalForeignAmount = existingTransaction.foreignAmount;
  let finalAmount;

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

    if (userRole === 'admin' && validatedBody.amount !== undefined) {
      finalAmount = validatedBody.amount;
    } else {
      finalAmount = Number((finalForeignAmount * finalExchangeRate).toFixed(2));
    }
  } else {
    finalExchangeRate = 1;
    finalForeignAmount = null;
    finalAmount = validatedBody.amount !== undefined ? validatedBody.amount : existingTransaction.amount;
  }

  const updateData = {
    ...validatedBody,
    currency: newCurrency,
    foreignAmount: finalForeignAmount,
    exchangeRateSnapshot: finalExchangeRate,
    amount: finalAmount,
    amountInPiastres: toPiastres(finalAmount),
  };

  if (validatedBody.paidAmount !== undefined) {
    updateData.paidAmountInPiastres = toPiastres(validatedBody.paidAmount);
  }

  if (validatedBody.installmentDetails) {
    const months = validatedBody.installmentDetails.months !== undefined ? validatedBody.installmentDetails.months : existingTransaction.installmentDetails?.months;
    const monthlyPrincipal = validatedBody.installmentDetails.monthlyPrincipal !== undefined
      ? validatedBody.installmentDetails.monthlyPrincipal
      : (months ? finalAmount / months : (existingTransaction.installmentDetails?.monthlyPrincipal || 0));
    updateData.installmentDetails = {
      ...(existingTransaction.installmentDetails ? existingTransaction.installmentDetails.toObject() : {}),
      ...validatedBody.installmentDetails,
      monthlyPrincipal,
      monthlyPrincipalInPiastres: toPiastres(monthlyPrincipal),
    };
  } else if (finalAmount !== existingTransaction.amount && existingTransaction.type === 'Installment' && existingTransaction.installmentDetails?.months) {
    const months = existingTransaction.installmentDetails.months;
    const monthlyPrincipal = finalAmount / months;
    updateData['installmentDetails.monthlyPrincipal'] = monthlyPrincipal;
    updateData['installmentDetails.monthlyPrincipalInPiastres'] = toPiastres(monthlyPrincipal);
  }

  Object.assign(existingTransaction, updateData);
  await existingTransaction.save();

  // Keep linked Expenditure in sync if one exists
  if (existingTransaction.linkedExpenditureId) {
    const expUpdates = {
      currency: newCurrency,
      foreignAmount: finalForeignAmount,
      exchangeRateSnapshot: finalExchangeRate,
      transactionValue: finalAmount,
      transactionValueInPiastres: toPiastres(finalAmount),
      date: targetDate,
    };
    if (validatedBody.description !== undefined) {
      expUpdates.description = validatedBody.description;
    }
    if (validatedBody.category !== undefined) {
      expUpdates.categories = [validatedBody.category];
    }
    await Expenditure.updateOne(
      { _id: existingTransaction.linkedExpenditureId, user: req.effectiveUserId },
      { $set: expUpdates }
    );
  }

  res.json(existingTransaction);
}));

router.delete('/transactions/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const transaction = await CardTransaction.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!transaction) throw new NotFoundError('Transaction not found');

  await unlinkExpenditure(transaction, req.effectiveUserId);
  await transaction.softDelete();
  res.json({ msg: 'Transaction deleted successfully' });
}));

router.post('/transactions/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const transaction = await CardTransaction.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!transaction) throw new NotFoundError('Soft-deleted transaction not found');
  await transaction.restore();
  res.json({ msg: 'Transaction restored successfully', transaction });
}));

router.get('/transactions/due/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const userId = req.effectiveUserId;

  const card = await CreditCard.findOne({ _id: cardId, user: userId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const now = new Date();
  const billingDay = card.billingCycleDay;
  let lastBillingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
  if (now.getDate() < billingDay) {
    lastBillingDate.setMonth(lastBillingDate.getMonth() - 1);
  }
  lastBillingDate.setHours(0, 0, 0, 0);

  const duePurchases = await CardTransaction.find({
    card: cardId,
    user: userId,
    type: 'Purchase',
    status: { $in: ['Due', 'Partial'] },
    date: { $gte: lastBillingDate },
    deletedAt: null,
  }).lean();

  const activeInstallments = await CardTransaction.find({
    card: cardId,
    user: userId,
    type: 'Installment',
    status: { $ne: 'Paid' },
    deletedAt: null,
  }).lean();

  let dueItems = [];

  duePurchases.forEach(p => {
    dueItems.push({
      _id: p._id,
      description: p.description,
      amountDue: p.amount - p.paidAmount,
      type: 'Purchase',
      date: p.date
    });
  });

  activeInstallments.forEach(i => {
    const monthlyPrincipal = i.installmentDetails?.monthlyPrincipal || 0;
    const cyclePaid = i.installmentDetails?.cyclePaidInPiastres ? i.installmentDetails.cyclePaidInPiastres / 100 : 0;
    const amountDue = Math.max(0, Math.round((monthlyPrincipal - cyclePaid) * 100) / 100);
    const remainingTotal = Math.max(0, (i.amount || 0) - (i.paidAmount || 0));
    const effectiveDue = Math.min(amountDue, remainingTotal);

    if (effectiveDue > 0) {
      dueItems.push({
        _id: i._id,
        description: `${i.description} (Installment)`,
        amountDue: effectiveDue,
        monthlyPrincipal,
        cyclePaid,
        remainingTotal,
        type: 'Installment',
        date: i.date,
      });
    }
  });

  dueItems.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(dueItems);
}));

// =============================================
// --- Payment Logging ---
// =============================================
router.post('/payments', auth, validate({ body: createPaymentSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  const card = await CreditCard.findOne({ _id: validatedBody.card, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const session = await mongoose.startSession();
  let newPayment;
  try {
    await session.withTransaction(async () => {
      newPayment = new CardPayment({
        ...validatedBody,
        user: req.effectiveUserId,
        amountInPiastres: toPiastres(validatedBody.amount),
      });
      await newPayment.save({ session });
      await createExpenditureFromCardPayment(newPayment, card, req.effectiveUserId, session);
    });
    res.status(201).json(newPayment);
  } finally {
    await session.endSession();
  }
}));

router.get('/payments/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const card = await CreditCard.findOne({ _id: cardId, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }
  const payments = await CardPayment.find({ card: cardId, deletedAt: null }).sort({ date: -1 });
  res.json(payments);
}));

router.put('/payments/:id', auth, validate({ params: paramsSchema, body: updatePaymentSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  const updateData = { ...validatedBody };
  if (validatedBody.amount !== undefined) {
    updateData.amountInPiastres = toPiastres(validatedBody.amount);
  }

  const payment = await CardPayment.findOneAndUpdate(
    { _id: id, user: req.effectiveUserId, deletedAt: null },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  if (!payment) throw new NotFoundError('Payment log not found');
  res.json(payment);
}));

router.delete('/payments/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const payment = await CardPayment.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!payment) throw new NotFoundError('Payment log not found');

  await unlinkExpenditure(payment, req.effectiveUserId);
  await payment.softDelete();
  res.json({ msg: 'Payment log deleted successfully' });
}));

router.post('/payments/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const payment = await CardPayment.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!payment) throw new NotFoundError('Soft-deleted payment not found');
  await payment.restore();
  res.json({ msg: 'Payment restored successfully', payment });
}));

router.post('/payments/full', auth, validate({ body: payInFullSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { transactionId, paymentSource, createExpenditure } = getValidated(req, 'body');
  const session = await mongoose.startSession();
  let payment;
  try {
    await session.withTransaction(async () => {
      const transaction = await CardTransaction.findOne({ _id: transactionId, user: req.effectiveUserId, deletedAt: null }).session(session);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      const card = await CreditCard.findOne({ _id: transaction.card, user: req.effectiveUserId, deletedAt: null }).session(session);
      if (!card) throw new NotFoundError('Card not found');

      let paymentAmount = 0;
      let isFullyPaid = false;

      if (transaction.type === 'Purchase') {
        paymentAmount = transaction.amount - transaction.paidAmount;
        isFullyPaid = true;
      } else if (transaction.type === 'Installment') {
        const monthlyPrincipal = transaction.installmentDetails?.monthlyPrincipal || 0;
        const cyclePaid = transaction.installmentDetails?.cyclePaidInPiastres ? transaction.installmentDetails.cyclePaidInPiastres / 100 : 0;
        paymentAmount = Math.max(0, monthlyPrincipal - cyclePaid);
        if (transaction.paidAmount + paymentAmount >= transaction.amount) {
          isFullyPaid = true;
          paymentAmount = transaction.amount - transaction.paidAmount;
        }
      }

      if (paymentAmount <= 0) {
        throw new BadRequestError('No payment needed or transaction already paid');
      }

      payment = new CardPayment({
        user: req.effectiveUserId,
        card: transaction.card,
        amount: paymentAmount,
        amountInPiastres: toPiastres(paymentAmount),
        date: new Date(),
        paymentSource: paymentSource || 'Bank',
        createExpenditure: createExpenditure !== false,
      });
      await payment.save({ session });

      transaction.paidAmount += paymentAmount;
      transaction.paidAmountInPiastres = toPiastres(transaction.paidAmount);

      if (transaction.type === 'Installment') {
        transaction.installmentDetails = transaction.installmentDetails || {};
        transaction.installmentDetails.cyclePaidInPiastres =
          (transaction.installmentDetails.cyclePaidInPiastres || 0) + toPiastres(paymentAmount);
      }

      if (isFullyPaid || transaction.paidAmount >= transaction.amount) {
        transaction.status = 'Paid';
      } else {
        transaction.status = 'Partial';
      }
      await transaction.save({ session });

      await createExpenditureFromCardPayment(payment, card, req.effectiveUserId, session);
    });
    res.json({ msg: 'Transaction marked as paid for current cycle.', payment });
  } finally {
    await session.endSession();
  }
}));

router.post('/payments/partial', auth, validate({ body: partialPaymentSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { transactionId, amount, paymentSource, createExpenditure } = getValidated(req, 'body');
  const paymentAmount = Number(amount);
  const session = await mongoose.startSession();
  let payment;
  try {
    await session.withTransaction(async () => {
      const transaction = await CardTransaction.findOne({ _id: transactionId, user: req.effectiveUserId, deletedAt: null }).session(session);
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      const card = await CreditCard.findOne({ _id: transaction.card, user: req.effectiveUserId, deletedAt: null }).session(session);
      if (!card) throw new NotFoundError('Card not found');

      payment = new CardPayment({
        user: req.effectiveUserId,
        card: transaction.card,
        amount: paymentAmount,
        amountInPiastres: toPiastres(paymentAmount),
        date: new Date(),
        paymentSource: paymentSource || 'Bank',
        createExpenditure: createExpenditure !== false,
      });
      await payment.save({ session });

      transaction.paidAmount = (transaction.paidAmount || 0) + paymentAmount;
      if (transaction.paidAmount >= transaction.amount) {
        transaction.status = 'Paid';
        transaction.paidAmount = transaction.amount;
      } else {
        transaction.status = 'Partial';
      }
      transaction.paidAmountInPiastres = toPiastres(transaction.paidAmount);

      if (transaction.type === 'Installment') {
        transaction.installmentDetails = transaction.installmentDetails || {};
        transaction.installmentDetails.cyclePaidInPiastres =
          (transaction.installmentDetails.cyclePaidInPiastres || 0) + toPiastres(paymentAmount);
      }

      await transaction.save({ session });
      await createExpenditureFromCardPayment(payment, card, req.effectiveUserId, session);
    });
    res.json({ msg: 'Partial payment logged successfully.', payment });
  } finally {
    await session.endSession();
  }
}));

// =============================================
// --- Summary Routes ---
// =============================================
router.get('/summary/:cardId', auth, asyncHandler(async (req, res) => {
  const cardId = new mongoose.Types.ObjectId(req.params.cardId);
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);

  const card = await CreditCard.findOne({ _id: cardId, user: userId, deletedAt: null });
  if (!card) throw new NotFoundError('Card not found');

  const now = new Date();
  const billingDay = card.billingCycleDay;
  const gracePeriodDays = card.gracePeriodDays || 25;

  let cycleStart = new Date(now.getFullYear(), now.getMonth(), billingDay);
  let cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
  if (now.getDate() < billingDay) {
    cycleStart.setMonth(cycleStart.getMonth() - 1);
    cycleEnd.setMonth(cycleEnd.getMonth() - 1);
  }

  const dueDate = new Date(cycleEnd);
  dueDate.setDate(dueDate.getDate() + gracePeriodDays);

  const purchaseBalanceResult = await CardTransaction.aggregate([
    { $match: { card: card._id, user: userId, type: 'Purchase', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const purchaseBalance = purchaseBalanceResult.length > 0 ? purchaseBalanceResult[0].total : 0;

  const installmentBalanceResult = await CardTransaction.aggregate([
    { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const installmentBalance = installmentBalanceResult.length > 0 ? installmentBalanceResult[0].total : 0;

  const outstandingBalance = purchaseBalance + installmentBalance;
  const availableLimit = card.limit - outstandingBalance;

  const purchaseDues = await CardTransaction.aggregate([
    { 
      $match: { 
        card: card._id, 
        user: userId, 
        type: 'Purchase', 
        date: { $gte: cycleStart, $lt: cycleEnd },
        deletedAt: null,
      } 
    },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const totalPurchaseDue = purchaseDues.length > 0 ? purchaseDues[0].total : 0;

  const installmentDues = await CardTransaction.aggregate([
    { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
    { $group: { _id: null, total: { $sum: "$installmentDetails.monthlyPrincipal" } } }
  ]);
  const totalInstallmentDue = installmentDues.length > 0 ? installmentDues[0].total : 0;

  const previousUnpaid = await CardTransaction.aggregate([
    { 
      $match: { 
        card: card._id, 
        user: userId, 
        type: 'Purchase', 
        date: { $lt: cycleStart }, 
        status: { $in: ['Due', 'Partial'] },
        deletedAt: null,
      } 
    },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const unpaidBeforeCycle = previousUnpaid.length > 0 ? previousUnpaid[0].total : 0;
  const monthlyApr = (card.apr || 0) / 100 / 12;
  const interestOnUnpaid = unpaidBeforeCycle > 0 ? Number((unpaidBeforeCycle * monthlyApr).toFixed(2)) : 0;

  const amountDueThisMonth = Number((totalPurchaseDue + totalInstallmentDue + interestOnUnpaid).toFixed(2));

  const minPaymentPercent = 0.05;
  const minPaymentBase = Math.max(outstandingBalance * minPaymentPercent, card.minimumPaymentFixed || 0);
  const minimumPaymentDue = minPaymentBase + totalInstallmentDue;

  res.json({
    cardDetails: card,
    cycleStart,
    cycleEnd,
    dueDate,
    outstandingBalance,
    availableLimit,
    amountDueThisMonth,
    totalInstallmentDue,
    totalPurchaseDue,
    interestOnUnpaid,
    minimumPaymentDue
  });
}));

router.get('/overall-summary', auth, asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);
  const cards = await CreditCard.find({ user: userId, deletedAt: null });    
  if (cards.length === 0) {
    return res.json({
      totalLimit: 0,
      totalOutstanding: 0,
      totalAvailable: 0,
      totalDueThisMonth: 0,
    });
  }

  const cardIds = cards.map(c => new mongoose.Types.ObjectId(c._id));
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);

  const purchaseQuery = { 
    card: { $in: cardIds }, 
    user: userId, 
    type: 'Purchase', 
    status: { $in: ['Due', 'Partial'] },
    deletedAt: null,
  };

  const purchaseBalanceResult = await CardTransaction.aggregate([
    { $match: purchaseQuery },
    { $group: { 
        _id: null, 
        total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } },
        count: { $sum: 1 }
      }}
  ]);
  const totalPurchaseBalance = purchaseBalanceResult.length > 0 ? purchaseBalanceResult[0].total : 0;

  const installmentQuery = { 
    card: { $in: cardIds }, 
    user: userId, 
    type: 'Installment', 
    status: { $in: ['Due', 'Partial'] },
    deletedAt: null,
  };

  const installmentBalanceResult = await CardTransaction.aggregate([
    { $match: installmentQuery },
    { $group: { 
        _id: null, 
        total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } },
        count: { $sum: 1 }
      }}
  ]);
  const totalInstallmentBalance = installmentBalanceResult.length > 0 ? installmentBalanceResult[0].total : 0;

  const totalOutstanding = totalPurchaseBalance + totalInstallmentBalance;
  const totalAvailable = totalLimit - totalOutstanding;

  let totalDueThisMonth = 0;
  const now = new Date();
  
  for (const card of cards) {
      const billingDay = card.billingCycleDay;
      
      const currentBillingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
      const previousBillingDate = new Date(currentBillingDate);
      previousBillingDate.setMonth(previousBillingDate.getMonth() - 1);
      
      if (now.getDate() < billingDay) {
          currentBillingDate.setMonth(currentBillingDate.getMonth() - 1);
          previousBillingDate.setMonth(previousBillingDate.getMonth() - 1);
      }

      const installmentQuery2 = { 
        card: card._id, 
        user: userId, 
        type: 'Installment', 
        status: { $in: ['Due', 'Partial'] },
        deletedAt: null,
      };
      
      const installmentDues = await CardTransaction.aggregate([
          { $match: installmentQuery2 },
          { $group: { 
              _id: null, 
              total: { $sum: { $ifNull: ["$installmentDetails.monthlyPrincipal", 0] } },
              count: { $sum: 1 }
          }}
      ]);
      const cardInstallmentDue = installmentDues.length > 0 ? installmentDues[0].total : 0;

      const purchaseQuery2 = { 
        card: card._id, 
        user: userId, 
        type: 'Purchase', 
        status: { $in: ['Due', 'Partial'] },
        date: { 
            $gte: previousBillingDate, 
            $lt: currentBillingDate 
        },
        deletedAt: null,
      };
      
      const purchaseDues = await CardTransaction.aggregate([
          { $match: purchaseQuery2 },
          { $group: { 
              _id: null, 
              total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } },
              count: { $sum: 1 }
          }}
      ]);
      const cardPurchaseDue = purchaseDues.length > 0 ? purchaseDues[0].total : 0;
      
      totalDueThisMonth += cardInstallmentDue + cardPurchaseDue;
  }

  res.json({
    totalLimit,
    totalOutstanding,
    totalAvailable,
    totalDueThisMonth,
  });
}));

// =============================================
// --- Phase 8: Statement Cycle Visualization ---
// =============================================
router.get('/statement-cycles/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const card = await CreditCard.findOne({ _id: cardId, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const months = parseInt(req.query.months, 10) || 6;
  const cycles = getStatementCycles(card, { months });
  const currentPeriod = getStatementPeriod(card);

  const transactions = await CardTransaction.find({
    card: card._id,
    user: req.effectiveUserId,
    date: { $gte: currentPeriod.startDate, $lte: currentPeriod.endDate },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  const payments = await CardPayment.find({
    card: card._id,
    user: req.effectiveUserId,
    date: { $gte: currentPeriod.startDate, $lte: currentPeriod.endDate },
    deletedAt: null,
  }).sort({ date: 1 }).lean();

  const totalCharges = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  res.json({
    card,
    currentPeriod,
    cycles,
    currentCycleData: {
      totalCharges: Math.round(totalCharges * 100) / 100,
      totalPayments: Math.round(totalPayments * 100) / 100,
      netCycleChange: Math.round((totalCharges - totalPayments) * 100) / 100,
      transactions,
      payments,
    },
  });
}));

// =============================================
// --- Phase 8: Credit Utilization Alerts ---
// =============================================
router.get('/utilization', auth, asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);
  const cards = await CreditCard.find({ user: userId, deletedAt: null }).lean();

  if (cards.length === 0) {
    return res.json({
      totalLimit: 0,
      totalBalance: 0,
      overallUtilization: 0,
      hasAlerts: false,
      cards: [],
    });
  }

  const cardBalances = [];
  for (const card of cards) {
    const pRes = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Purchase', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
    ]);
    const purchaseBal = pRes.length > 0 ? pRes[0].total : 0;

    const iRes = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] }, deletedAt: null } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
    ]);
    const installBal = iRes.length > 0 ? iRes[0].total : 0;
    const outstanding = purchaseBal + installBal;

    cardBalances.push({
      card,
      balance: outstanding,
    });
  }

  const portfolio = checkPortfolioUtilization(cardBalances);
  res.json(portfolio);
}));

// =============================================
// --- Phase 8: Cycle Reconciliation ---
// =============================================
router.post('/reconcile/:cardId', auth, validate({ params: cardIdParamsSchema, body: reconcileSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const { cycleStart, cycleEnd, actualStatementBalance } = getValidated(req, 'body');

  const card = await CreditCard.findOne({ _id: cardId, user: req.effectiveUserId, deletedAt: null });
  if (!card) {
    throw new NotFoundError('Card not found');
  }

  const report = await reconcileCycle(
    card,
    cycleStart,
    cycleEnd,
    actualStatementBalance,
    req.effectiveUserId
  );

  res.json(report);
}));

module.exports = router;
