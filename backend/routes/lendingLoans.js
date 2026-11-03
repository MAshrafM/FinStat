// backend/routes/lendingLoans.js
const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const Person = require('../models/Person');
const {
  normalizeMiddayUTC,
  computeRunningBalance,
  validateNewTransaction,
  validateTransactionDeletion,
  recalculateLoanStatus,
  getSummaryAggregate,
} = require('../services/lendingService');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const { paramsIdSchema } = require('../validationSchemas/commonSchemas');
const {
  createLoanSchema,
  updateLoanSchema,
  addTransactionSchema,
  queryLoanSchema,
} = require('../validationSchemas/lendingSchemas');

// Helper to check write permissions
const checkCanModify = (req) => {
  const role = req.user?.role || 'viewer';
  if (role === 'viewer') {
    throw new ForbiddenError('Viewers are not permitted to modify lending records');
  }
};

// @route   GET /api/lending/summary
// @desc    Get global receivables summary for active user
router.get(
  '/summary',
  auth,
  asyncHandler(async (req, res) => {
    const summary = await getSummaryAggregate(req.effectiveUserId);
    res.status(200).json({
      success: true,
      data: summary,
    });
  })
);

// @route   POST /api/lending/loans
// @desc    Create a new loan with initial borrow transaction
router.post(
  '/loans',
  auth,
  validate({ body: createLoanSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const body = getValidated(req, 'body');

    // Verify Person exists and belongs to user
    const person = await Person.findOne({
      _id: body.person,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!person) {
      throw new NotFoundError('Person not found');
    }

    const normalizedDate = normalizeMiddayUTC(body.date);

    const initialTx = {
      type: 'borrow',
      amountInPiastres: body.initialAmountInPiastres,
      date: normalizedDate,
      note: body.note || 'Initial loan disbursement',
    };

    const loan = await Loan.create({
      user: req.effectiveUserId,
      person: body.person,
      notes: body.note || '',
      status: 'Active',
      transactions: [initialTx],
    });

    res.status(201).json({
      success: true,
      data: loan,
    });
  })
);

// @route   GET /api/lending/loans
// @desc    List loans with filtering by status and person
router.get(
  '/loans',
  auth,
  validate({ query: queryLoanSchema }),
  asyncHandler(async (req, res) => {
    const { page, limit, person, status, sortBy, sortOrder } = getValidated(req, 'query');
    const filter = { user: req.effectiveUserId, deletedAt: null };

    if (person) {
      filter.person = person;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    const total = await Loan.countDocuments(filter);
    const skip = (page - 1) * limit;

    const sortOptions = {};
    sortOptions[sortBy === 'date' ? 'createdAt' : sortBy] = sortOrder === 'asc' ? 1 : -1;

    const loans = await Loan.find(filter)
      .populate('person', 'name note')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Augment with derived balance metrics
    const augmented = loans.map((loan) => {
      const txs = loan.transactions || [];
      const borrowed = txs.filter((t) => t.type === 'borrow').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      const repaid = txs.filter((t) => t.type === 'repay').reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
      return {
        ...loan,
        totalBorrowedInPiastres: borrowed,
        totalRepaidInPiastres: repaid,
        balanceInPiastres: borrowed - repaid,
        isFullyRepaid: loan.status !== 'WrittenOff' && borrowed > 0 && borrowed - repaid <= 0,
      };
    });

    res.status(200).json({
      success: true,
      data: augmented,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  })
);

// @route   GET /api/lending/loans/:id
// @desc    Get loan detail with full transaction ledger & running balances
router.get(
  '/loans/:id',
  auth,
  validate({ params: paramsIdSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const loan = await Loan.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    })
      .populate('person', 'name note')
      .lean();

    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    const augmentedTransactions = computeRunningBalance(loan.transactions || []);
    const borrowed = (loan.transactions || [])
      .filter((t) => t.type === 'borrow')
      .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);
    const repaid = (loan.transactions || [])
      .filter((t) => t.type === 'repay')
      .reduce((sum, t) => sum + (t.amountInPiastres || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...loan,
        transactions: augmentedTransactions,
        totalBorrowedInPiastres: borrowed,
        totalRepaidInPiastres: repaid,
        balanceInPiastres: borrowed - repaid,
        isFullyRepaid: loan.status !== 'WrittenOff' && borrowed > 0 && borrowed - repaid <= 0,
      },
    });
  })
);

// @route   PUT /api/lending/loans/:id
// @desc    Update loan notes or status with transition guards
router.put(
  '/loans/:id',
  auth,
  validate({ params: paramsIdSchema, body: updateLoanSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const loan = await Loan.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    if (body.notes !== undefined) {
      loan.notes = body.notes;
    }

    if (body.status !== undefined) {
      if (body.status === 'WrittenOff') {
        if (loan.balanceInPiastres <= 0) {
          throw new BadRequestError('Cannot write off a loan with zero balance');
        }
        loan.status = 'WrittenOff';
      } else if (body.status === 'Active') {
        loan.status = 'Active';
        recalculateLoanStatus(loan);
      }
    }

    await loan.save();

    res.status(200).json({
      success: true,
      data: loan,
    });
  })
);

// @route   DELETE /api/lending/loans/:id
// @desc    Soft delete loan
router.delete(
  '/loans/:id',
  auth,
  validate({ params: paramsIdSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id } = getValidated(req, 'params');

    const loan = await Loan.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    await loan.softDelete();

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully',
    });
  })
);

// @route   POST /api/lending/loans/:id/transactions
// @desc    Append borrow or repay transaction to loan
router.post(
  '/loans/:id/transactions',
  auth,
  validate({ params: paramsIdSchema, body: addTransactionSchema }),
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id } = getValidated(req, 'params');
    const body = getValidated(req, 'body');

    const loan = await Loan.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    validateNewTransaction(loan, body);

    const normalizedDate = normalizeMiddayUTC(body.date);
    loan.transactions.push({
      type: body.type,
      amountInPiastres: body.amountInPiastres,
      date: normalizedDate,
      note: body.note || '',
    });

    recalculateLoanStatus(loan);
    await loan.save();

    res.status(201).json({
      success: true,
      data: loan,
    });
  })
);

// @route   DELETE /api/lending/loans/:id/transactions/:txId
// @desc    Remove transaction with intermediate running balance validation
router.delete(
  '/loans/:id/transactions/:txId',
  auth,
  asyncHandler(async (req, res) => {
    checkCanModify(req);
    const { id, txId } = req.params;

    const loan = await Loan.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    const txExists = (loan.transactions || []).some((t) => t._id.toString() === txId.toString());
    if (!txExists) {
      throw new NotFoundError('Transaction not found on loan');
    }

    validateTransactionDeletion(loan.transactions, txId);

    loan.transactions = loan.transactions.filter((t) => t._id.toString() !== txId.toString());
    recalculateLoanStatus(loan);
    await loan.save();

    res.status(200).json({
      success: true,
      data: loan,
    });
  })
);

module.exports = router;
