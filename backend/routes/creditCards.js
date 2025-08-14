// backend/routes/creditCards.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const CreditCard = require('../models/CreditCard');
const CardTransaction = require('../models/CardTransaction');
const CardPayment = require('../models/CardPayment');

// =============================================
// --- Credit Card Management (The Cards Themselves) ---
// =============================================
router.post('/cards', auth, async (req, res) => { 
  try {
          const newCard = new CreditCard({...req.body, user: req.user.id});
          await newCard.save();
          res.json(newCard);
      } catch (err) {
          res.status(400).json({ msg: err.message });
      }
});
router.get('/cards', auth, async (req, res) => { 
  try {
          // No pagination needed for this feature as the list is usually short
          const cards = await CreditCard.find({ user: req.user.id }).sort({ startDate: -1 });
          res.json(cards);
      } catch (err) {
          res.status(500).send('Server Error');
      }
 });
// ... PUT and DELETE for cards ...
router.put('/cards/:id', auth, async (req, res) => {
    try {
        let card = await CreditCard.findById(req.params.id);
        if (!card) return res.status(404).json({ msg: 'Card not found' });
        if(card.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        card = await CreditCard.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(card);
    } catch (err) {
        res.status(400).json({ msg: err.message });
    }
});

router.delete('/cards/:id', auth, async (req, res) => {
    try {
        let card = await CreditCard.findById(req.params.id);
        if (!card) return res.status(404).json({ msg: 'Credit Card not found' });
        if(card.user.toString() != req.user.id) {return res.status(401).json({ msg: 'User not authorized' });}
        card = await CreditCard.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Credit Card deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// =============================================
// --- Card Transaction Management ---
// =============================================
router.post('/transactions', auth, async (req, res) => {
  try {
    // Ensure the card being added to belongs to the user
    const card = await CreditCard.findById(req.body.card);
    if (!card || card.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized for this card' });
    }

    const newTransaction = new CardTransaction({
      ...req.body,
      user: req.user.id,
    });
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Failed to create transaction', error: err.message });
  }
});

router.get('/transactions/:cardId', auth, async (req, res) => {
  try {
    // Ensure the user owns the card they are querying
    const card = await CreditCard.findById(req.params.cardId);
    if (!card || card.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized for this card' });
    }

    const transactions = await CardTransaction.find({ card: req.params.cardId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/transactions/:id', auth, async (req, res) => {
  try {
    let transaction = await CardTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

    // Security Check: Ensure the transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    transaction = await CardTransaction.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await CardTransaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ msg: 'Transaction not found' });

    // Security Check: Ensure the transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await CardTransaction.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Transaction deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/transactions/due/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;

    // 1. Security Check: Ensure the user owns the card
    const card = await CreditCard.findById(cardId);
    if (!card || card.user.toString() !== userId) {
      return res.status(401).json({ msg: 'User not authorized for this card' });
    }

    // 2. Determine the start of the current billing cycle
    const now = new Date();
    const billingDay = card.billingCycleDay;
    // The last billing date is the billing day of this month or last month.
    let lastBillingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
    if (now.getDate() < billingDay) {
      // If we haven't reached this month's billing day yet, the cycle started last month.
      lastBillingDate.setMonth(lastBillingDate.getMonth() - 1);
    }
    // To be safe, set the time to the beginning of that day.
    lastBillingDate.setHours(0, 0, 0, 0);


    // 3. Find all standard 'Purchase' transactions within this cycle
    const duePurchases = await CardTransaction.find({
      card: cardId,
      user: userId,
      type: 'Purchase',
      status: { $in: ['Due', 'Partial'] },
      date: { $gte: lastBillingDate } // Find purchases on or after the last billing date
    }).lean(); // .lean() makes the query faster and returns plain JS objects

    // 4. Find all active 'Installment' plans
    const activeInstallments = await CardTransaction.find({
      card: cardId,
      user: userId,
      type: 'Installment',
      status: { $ne: 'Paid' }
      // A more advanced query could also check if the installment period is over
    }).lean();

    // 5. Format the data into a consistent "due items" list
    let dueItems = [];

    // Add the purchases to the list
    duePurchases.forEach(p => {
      dueItems.push({
        _id: p._id, // The original transaction ID
        description: p.description,
        // The amount due is the remaining balance
        amountDue: p.amount - p.paidAmount,
        type: 'Purchase',
        date: p.date
      });
    });

    // Add the monthly portion of each installment to the list
    activeInstallments.forEach(i => {
      dueItems.push({
        _id: i._id, // The original transaction ID
        description: `${i.description} (Installment)`,
        amountDue: i.installmentDetails.monthlyPrincipal, // Only the monthly portion is due
        type: 'Installment',
        date: i.date
      });
    });

    // 6. Sort the final list by date for a clean display
    dueItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(dueItems);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// =============================================
// --- Payment Logging ---
// =============================================
router.post('/payments', auth, async (req, res) => {
  try {
    // Ensure the card being paid belongs to the user
    const card = await CreditCard.findById(req.body.card);
    if (!card || card.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized for this card' });
    }

    const newPayment = new CardPayment({
      ...req.body,
      user: req.user.id,
    });
    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ msg: 'Failed to log payment', error: err.message });
  }
});

router.get('/payments/:cardId', auth, async (req, res) => {
    try {
        const card = await CreditCard.findById(req.params.cardId);
        if (!card || card.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized for this card' });
        }
        const payments = await CardPayment.find({ card: req.params.cardId }).sort({ date: -1 });
        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/payments/:id', auth, async (req, res) => {
  try {
    let payment = await CardPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: 'Payment log not found' });

    // Security Check: Ensure the payment belongs to the logged-in user
    if (payment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    payment = await CardPayment.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/payments/:id', auth, async (req, res) => {
  try {
    const payment = await CardPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: 'Payment log not found' });

    // Security Check: Ensure the payment belongs to the logged-in user
    if (payment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await CardPayment.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Payment log deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/payments/full', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await CardTransaction.findById(transactionId);

    // Security check
    if (!transaction || transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    let paymentAmount = 0;
    let isFullyPaid = false;

    // --- BRANCHING LOGIC BASED ON TRANSACTION TYPE ---
    if (transaction.type === 'Purchase') {
      // For a purchase, "Pay in Full" means paying the entire remaining balance.
      paymentAmount = transaction.amount - transaction.paidAmount;
      isFullyPaid = true; // The entire transaction is now considered paid.

    } else if (transaction.type === 'Installment') {
      // For an installment, "Pay in Full" means paying this month's principal.
      paymentAmount = transaction.installmentDetails.monthlyPrincipal;
      
      // We only mark the entire installment as 'Paid' if the total paid amount
      // now meets or exceeds the total original amount.
      if (transaction.paidAmount + paymentAmount >= transaction.amount) {
        isFullyPaid = true;
        // Adjust payment amount to not overpay
        paymentAmount = transaction.amount - transaction.paidAmount;
      }
    }
    // ----------------------------------------------------

    if (paymentAmount <= 0) {
        return res.status(400).json({ msg: 'No payment needed or transaction already paid.' });
    }

    // Log a corresponding payment record
    const payment = new CardPayment({
        user: req.user.id,
        card: transaction.card,
        amount: paymentAmount, // Pay the remaining balance
        date: new Date(),
    });
    await payment.save();

    // Update the transaction status
    transaction.paidAmount += paymentAmount;
    if (isFullyPaid) {
      transaction.status = 'Paid';
    } else {
      // If it's an installment that isn't finished, it's still 'Partial'
      transaction.status = 'Partial';
    }
    await transaction.save();
    res.json({ msg: 'Transaction marked as fully paid.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/payments/partial', auth, async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const paymentAmount = parseFloat(amount);
    const transaction = await CardTransaction.findById(transactionId);

    // Security check
    if (!transaction || transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Log the payment
    const payment = new CardPayment({
        user: req.user.id,
        card: transaction.card,
        amount: paymentAmount,
        date: new Date(),
    });
    await payment.save();
    // This is a simplified model. A real-world scenario would be much more complex,
    // involving creating a new transaction for the remaining balance with interest.
    // For now, we will just mark it as 'Partial'.
    if (transaction.paidAmount >= transaction.amount) {
        transaction.status = 'Paid';
        transaction.paidAmount = transaction.amount;
    }
    
    await transaction.save();

    res.json({ msg: 'Partial payment logged successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// =============================================
// --- Summary and Due Routes (Keep these as they were) ---
// =============================================
/*router.get('/summary/:cardId', auth, async (req, res) => {
  try {
    const cardId = new mongoose.Types.ObjectId(req.params.cardId);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Get the card details
    const card = await CreditCard.findOne({ _id: cardId, user: userId });
    if (!card) return res.status(404).json({ msg: 'Card not found' });

    // 2. Calculate total spending (all transactions)
    const purchaseBalanceResult = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Purchase', status: { $in: ['Due', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } } } // Sum of remaining balances
    ]);
    const purchaseBalance = purchaseBalanceResult.length > 0 ? purchaseBalanceResult[0].total : 0;

    // 2. Get the total original amount of all active (unpaid) installment plans.
    const installmentBalanceResult = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }] } } } } // Sum of the FULL original amounts
    ]);
    const installmentBalance = installmentBalanceResult.length > 0 ? installmentBalanceResult[0].total : 0;

    // 3. The true outstanding balance is the sum of these two.
    const outstandingBalance = purchaseBalance + installmentBalance;
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
*/

router.get('/summary/:cardId', auth, async (req, res) => {
  try {
    const cardId = new mongoose.Types.ObjectId(req.params.cardId);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Get the card details
    const card = await CreditCard.findOne({ _id: cardId, user: userId });
    if (!card) return res.status(404).json({ msg: 'Card not found' });

    const now = new Date();
    const billingDay = card.billingCycleDay;
    const gracePeriodDays = card.gracePeriodDays || 25; // fallback default

    // 2. Billing cycle start & end
    let cycleStart = new Date(now.getFullYear(), now.getMonth(), billingDay);
    let cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
    if (now.getDate() < billingDay) {
      cycleStart.setMonth(cycleStart.getMonth() - 1);
      cycleEnd.setMonth(cycleEnd.getMonth() - 1);
    }

    // 3. Due date = cycleEnd + gracePeriodDays
    const dueDate = new Date(cycleEnd);
    dueDate.setDate(dueDate.getDate() + gracePeriodDays);

    // 4. Outstanding balances
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

    // 5. Purchases in current billing cycle
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

    // 6. Installment dues (monthly principal only)
    const installmentDues = await CardTransaction.aggregate([
      { $match: { card: card._id, user: userId, type: 'Installment', status: { $in: ['Due', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: "$installmentDetails.monthlyPrincipal" } } }
    ]);
    const totalInstallmentDue = installmentDues.length > 0 ? installmentDues[0].total : 0;

    // 7. Interest calculation for unpaid balances before cycle
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

    // 8. Amount due this month
    const amountDueThisMonth = totalPurchaseDue + totalInstallmentDue + interestOnUnpaid;

    // 9. Minimum payment logic
    const minPaymentPercent = 0.05;
    const minPaymentBase = Math.max(outstandingBalance * minPaymentPercent, card.minimumPaymentFixed || 0);
    const minimumPaymentDue = minPaymentBase + totalInstallmentDue;

    // 10. Response
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

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   GET api/credit-cards/overall-summary
// @desc    Get a summary of all credit cards for the logged-in user
// @access  Private
router.get('/overall-summary', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    // 1. Get all cards for the user
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

    // 2. Calculate total limit
    const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);

    const purchaseQuery = { 
      card: { $in: cardIds }, 
      user: userId, 
      type: 'Purchase', 
      status: { $in: ['Due', 'Partial'] } 
    };

    // 3. Calculate total outstanding balance
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

    // 4. Calculate total amount due this month - with debugging
    let totalDueThisMonth = 0;
    const now = new Date();
    
    for (const card of cards) {
       
        const billingDay = card.billingCycleDay;
        
        // Calculate current billing cycle dates
        const currentBillingDate = new Date(now.getFullYear(), now.getMonth(), billingDay);
        const previousBillingDate = new Date(currentBillingDate);
        previousBillingDate.setMonth(previousBillingDate.getMonth() - 1);
        
        // Adjust if current date hasn't reached billing day yet
        if (now.getDate() < billingDay) {
            currentBillingDate.setMonth(currentBillingDate.getMonth() - 1);
            previousBillingDate.setMonth(previousBillingDate.getMonth() - 1);
        }

        // Check what transactions exist for this card
        const cardTransactions = await CardTransaction.find({ 
          card: card._id, 
          user: userId 
        }).select('type amount paidAmount status date installmentDetails');

        // Get installment payments due this month
        const installmentQuery2 = { 
          card: card._id, 
          user: userId, 
          type: 'Installment',
          status: { $in: ['Due', 'Partial'] }
        };
        
        const cardInstallments = await CardTransaction.find(installmentQuery2);
        
        const installmentDues = await CardTransaction.aggregate([
            { $match: installmentQuery2 },
            { $group: { 
                _id: null, 
                total: { $sum: { $ifNull: ["$installmentDetails.monthlyPrincipal", 0] } },
                count: { $sum: 1 }
            }}
        ]);
        const cardInstallmentDue = installmentDues.length > 0 ? installmentDues[0].total : 0;

        // Get purchases from previous billing cycle
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
        
        const cardPurchasesInRange = await CardTransaction.find(purchaseQuery2);
        
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

  } catch (err) {
    console.error('Error in overall-summary:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
