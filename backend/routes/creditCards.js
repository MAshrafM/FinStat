// backend/routes/creditCards.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const CardPayment = require('../models/CardPayment');

// --- Credit Card CRUD ---
router.post('/cards', auth, async (req, res) => { /* ... create card ... */ });
router.get('/cards', auth, async (req, res) => { /* ... get all user's cards ... */ });
// ... PUT and DELETE for cards ...

// --- Transaction CRUD ---
router.post('/transactions', auth, async (req, res) => { /* ... create transaction ... */ });
router.get('/transactions/:cardId', auth, async (req, res) => { /* ... get transactions for a specific card ... */ });
// ... PUT and DELETE for transactions ...

// --- Payment Logging ---
router.post('/payments', auth, async (req, res) => { /* ... create payment ... */ });

// --- THE MOST IMPORTANT ROUTE: The Summary/Dashboard ---
router.get('/summary/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;

    // 1. Get the card details
    const card = await CreditCard.findOne({ _id: cardId, user: userId });
    if (!card) return res.status(404).json({ msg: 'Card not found' });

    // 2. Calculate total spending (all transactions)
    const totalSpendingResult = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalSpending = totalSpendingResult.length > 0 ? totalSpendingResult[0].total : 0;

    // 3. Calculate total payments
    const totalPaymentsResult = await CardPayment.aggregate([
      { $match: { card: card._id, user: userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalPayments = totalPaymentsResult.length > 0 ? totalPaymentsResult[0].total : 0;

    // 4. Calculate outstanding balance
    const outstandingBalance = totalSpending - totalPayments;
    const availableLimit = card.limit - outstandingBalance;

    // 5. Calculate amount due this month (this is complex)
    // For simplicity here, we'll calculate total for all installments + purchases in the last cycle.
    // A real implementation would be more nuanced.
    const now = new Date();
    const billingDay = card.billingCycleDay;
    const lastBillingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
    if (now.getDate() < billingDay) {
        lastBillingDate.setMonth(lastBillingDate.getMonth() - 1);
    }
    
    const installmentDues = await CardTransaction.aggregate([
        { $match: { card: card._id, user: userId, type: 'Installment' } },
        { $group: { _id: null, total: { $sum: "$installmentDetails.monthlyPrincipal" } } }
    ]);
    const totalInstallmentDue = installmentDues.length > 0 ? installmentDues[0].total : 0;

    const purchaseDues = await CardTransaction.aggregate([
        { $match: { card: card._id, user: userId, type: 'Purchase', date: { $gte: lastBillingDate } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalPurchaseDue = purchaseDues.length > 0 ? purchaseDues[0].total : 0;
    
    const amountDueThisMonth = totalInstallmentDue + totalPurchaseDue;

    res.json({
      cardDetails: card,
      outstandingBalance,
      availableLimit,
      amountDueThisMonth,
      totalInstallmentDue,
      totalPurchaseDue
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
