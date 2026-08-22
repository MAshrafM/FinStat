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
const {
  createCardSchema,
  updateCardSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createPaymentSchema,
  updatePaymentSchema,
  payInFullSchema,
  cardIdParamsSchema,
  paramsSchema,
} = require('../validationSchemas/creditCardSchemas');
const { getValidated } = require('../utils/requestHelpers');

// =============================================
// --- Credit Card Management (The Cards Themselves) ---
// =============================================
router.post('/cards', auth, validate({ body: createCardSchema }), asyncHandler(async (req, res) => { 
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newCard = new CreditCard({ ...validatedBody, user: req.effectiveUserId });
  await newCard.save();
  res.status(201).json(newCard);
}));

router.get('/cards', auth, asyncHandler(async (req, res) => { 
  const cards = await CreditCard.find({ user: req.effectiveUserId }).sort({ startDate: -1 });
  res.json(cards);
}));

router.put('/cards/:id', auth, validate({ params: paramsSchema, body: updateCardSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let card = await CreditCard.findById(id);
  if (!card) throw new NotFoundError('Card not found');
  if (card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  card = await CreditCard.findByIdAndUpdate(
    id,
    { $set: validatedBody },
    { new: true, runValidators: true }
  );
  res.json(card);
}));

router.delete('/cards/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  let card = await CreditCard.findById(id);
  if (!card) throw new NotFoundError('Credit Card not found');
  if (card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await CreditCard.findByIdAndDelete(id);
  res.json({ msg: 'Credit Card deleted successfully' });
}));

// =============================================
// --- Card Transaction Management ---
// =============================================
router.post('/transactions', auth, validate({ body: createTransactionSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  // Ensure the card being added to belongs to the effective user
  const card = await CreditCard.findById(validatedBody.card);
  if (!card || card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized for this card');
  }

  const newTransaction = new CardTransaction({
    ...validatedBody,
    user: req.effectiveUserId,
  });
  await newTransaction.save();
  res.status(201).json(newTransaction);
}));

router.get('/transactions/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');

  const card = await CreditCard.findById(cardId);
  if (!card || card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized for this card');
  }

  const transactions = await CardTransaction.find({ card: cardId }).sort({ date: -1 });
  res.json(transactions);
}));

router.put('/transactions/:id', auth, validate({ params: paramsSchema, body: updateTransactionSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let transaction = await CardTransaction.findById(id);
  if (!transaction) throw new NotFoundError('Transaction not found');

  if (transaction.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  transaction = await CardTransaction.findByIdAndUpdate(id, { $set: validatedBody }, { new: true, runValidators: true });
  res.json(transaction);
}));

router.delete('/transactions/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const transaction = await CardTransaction.findById(id);
  if (!transaction) throw new NotFoundError('Transaction not found');

  if (transaction.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  await CardTransaction.findByIdAndDelete(id);
  res.json({ msg: 'Transaction deleted successfully' });
}));

router.get('/transactions/due/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const userId = req.effectiveUserId;

  const card = await CreditCard.findById(cardId);
  if (!card || card.user.toString() !== userId.toString()) {
    throw new ForbiddenError('User not authorized for this card');
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
    date: { $gte: lastBillingDate }
  }).lean();

  const activeInstallments = await CardTransaction.find({
    card: cardId,
    user: userId,
    type: 'Installment',
    status: { $ne: 'Paid' }
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
    dueItems.push({
      _id: i._id,
      description: `${i.description} (Installment)`,
      amountDue: i.installmentDetails.monthlyPrincipal,
      type: 'Installment',
      date: i.date
    });
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

  const card = await CreditCard.findById(validatedBody.card);
  if (!card || card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized for this card');
  }

  const newPayment = new CardPayment({
    ...validatedBody,
    user: req.effectiveUserId,
  });
  await newPayment.save();
  res.status(201).json(newPayment);
}));

router.get('/payments/:cardId', auth, validate({ params: cardIdParamsSchema }), asyncHandler(async (req, res) => {
  const { cardId } = getValidated(req, 'params');
  const card = await CreditCard.findById(cardId);
  if (!card || card.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized for this card');
  }
  const payments = await CardPayment.find({ card: cardId }).sort({ date: -1 });
  res.json(payments);
}));

router.put('/payments/:id', auth, validate({ params: paramsSchema, body: updatePaymentSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let payment = await CardPayment.findById(id);
  if (!payment) throw new NotFoundError('Payment log not found');

  if (payment.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  payment = await CardPayment.findByIdAndUpdate(id, { $set: validatedBody }, { new: true, runValidators: true });
  res.json(payment);
}));

router.delete('/payments/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const payment = await CardPayment.findById(id);
  if (!payment) throw new NotFoundError('Payment log not found');

  if (payment.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  await CardPayment.findByIdAndDelete(id);
  res.json({ msg: 'Payment log deleted successfully' });
}));

router.post('/payments/full', auth, validate({ body: payInFullSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { transactionId } = getValidated(req, 'body');
  const transaction = await CardTransaction.findById(transactionId);

  if (!transaction || transaction.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  let paymentAmount = 0;
  let isFullyPaid = false;

  if (transaction.type === 'Purchase') {
    paymentAmount = transaction.amount - transaction.paidAmount;
    isFullyPaid = true;
  } else if (transaction.type === 'Installment') {
    paymentAmount = transaction.installmentDetails.monthlyPrincipal;
    if (transaction.paidAmount + paymentAmount >= transaction.amount) {
      isFullyPaid = true;
      paymentAmount = transaction.amount - transaction.paidAmount;
    }
  }

  if (paymentAmount <= 0) {
    throw new BadRequestError('No payment needed or transaction already paid');
  }

  const payment = new CardPayment({
    user: req.effectiveUserId,
    card: transaction.card,
    amount: paymentAmount,
    date: new Date(),
  });
  await payment.save();

  transaction.paidAmount += paymentAmount;
  if (isFullyPaid) {
    transaction.status = 'Paid';
  } else {
    transaction.status = 'Partial';
  }
  await transaction.save();
  res.json({ msg: 'Transaction marked as fully paid.' });
}));

router.post('/payments/partial', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { transactionId, amount } = req.body;
  const paymentAmount = parseFloat(amount);
  const transaction = await CardTransaction.findById(transactionId);

  if (!transaction || transaction.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const payment = new CardPayment({
    user: req.effectiveUserId,
    card: transaction.card,
    amount: paymentAmount,
    date: new Date(),
  });
  await payment.save();

  if (transaction.paidAmount >= transaction.amount) {
    transaction.status = 'Paid';
    transaction.paidAmount = transaction.amount;
  }
  
  await transaction.save();
  res.json({ msg: 'Partial payment logged successfully.' });
}));

// =============================================
// --- Summary Routes ---
// =============================================
router.get('/summary/:cardId', auth, asyncHandler(async (req, res) => {
  const cardId = new mongoose.Types.ObjectId(req.params.cardId);
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);

  const card = await CreditCard.findOne({ _id: cardId, user: userId });
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
    { $match: { card: card._id, user: userId, type: 'Purchase', status: { $in: ['Due', 'Partial'] } } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const purchaseBalance = purchaseBalanceResult.length > 0 ? purchaseBalanceResult[0].total : 0;

  const installmentBalanceResult = await CardTransaction.aggregate([
    { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] } } },
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
        date: { $gte: cycleStart, $lt: cycleEnd } 
      } 
    },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const totalPurchaseDue = purchaseDues.length > 0 ? purchaseDues[0].total : 0;

  const installmentDues = await CardTransaction.aggregate([
    { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] } } },
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
        status: { $in: ['Due', 'Partial'] } 
      } 
    },
    { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } }
  ]);
  const unpaidBeforeCycle = previousUnpaid.length > 0 ? previousUnpaid[0].total : 0;
  const interestOnUnpaid = unpaidBeforeCycle > 0 ? (unpaidBeforeCycle * (card.interestRate / 100)) : 0;

  const amountDueThisMonth = totalPurchaseDue + totalInstallmentDue + interestOnUnpaid;

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

// @route   GET api/credit-cards/overall-summary
// @desc    Get a summary of all credit cards for the logged-in user
// @access  Private
router.get('/overall-summary', auth, asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.effectiveUserId);
  const cards = await CreditCard.find({ user: userId });    
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
    status: { $in: ['Due', 'Partial'] } 
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
    status: { $in: ['Due', 'Partial'] } 
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
        status: { $in: ['Due', 'Partial'] } 
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
        }
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

module.exports = router;
