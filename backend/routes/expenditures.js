// backend/routes/expenditures.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ledgerService = require('../services/ledgerService');
const {
  createSchema,
  updateSchema,
  paramsSchema,
  querySchema,
  bulkCategorySchema,
  bulkDeleteSchema,
  createRecurringBillSchema,
  updateRecurringBillSchema,
  payRecurringBillSchema,
  queryUpcomingBillsSchema,
} = require('../validationSchemas/expenditureSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/expenditures/recurring
// @desc    Get all active expenditures marked as recurring
router.get('/recurring', auth, asyncHandler(async (req, res) => {
  const recurringExpenditures = await ledgerService.getRecurringTemplate({
    userId: req.effectiveUserId,
  });
  res.json(recurringExpenditures);
}));

// @route   GET api/expenditures/all
// @desc    Get ALL non-deleted expenditure without pagination (clamped to 1000 lean docs)
router.get('/all', auth, asyncHandler(async (req, res) => {
  const { expenditures, truncated } = await ledgerService.getAllExpenditures({
    userId: req.effectiveUserId,
    requestedLimit: req.query.limit,
  });
  res.setHeader('X-Truncated', truncated ? 'true' : 'false');
  res.json(expenditures);
}));

// @route   GET api/expenditures/latest
// @desc    Get chronologically latest non-deleted expenditure record
router.get('/latest', auth, asyncHandler(async (req, res) => {
  const latestExpenditure = await ledgerService.getLatestBalances({
    userId: req.effectiveUserId,
  });
  res.json(latestExpenditure);
}));

// @route   GET api/expenditures
// @desc    Get all active expenditure logs, sorted by date descending
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const result = await ledgerService.listExpenditures({
    userId: req.effectiveUserId,
    query: getValidated(req, 'query'),
  });
  res.json(result);
}));

// @route   POST api/expenditures
// @desc    Create a new expenditure log and propagate running balances
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const createdDoc = await ledgerService.createExpenditure({
    userId: req.effectiveUserId,
    data: getValidated(req, 'body'),
    userRole: req.user?.role,
    canModify: req.canModify,
  });
  res.status(201).json(createdDoc);
}));

// @route   POST api/expenditures/bulk-category
// @desc    Bulk update category for selected expenditures [GAP-008]
router.post('/bulk-category', auth, validate({ body: bulkCategorySchema }), asyncHandler(async (req, res) => {
  const { ids, category } = getValidated(req, 'body');
  const result = await ledgerService.bulkUpdateCategory({
    userId: req.effectiveUserId,
    ids,
    category,
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   POST api/expenditures/bulk-delete
// @desc    Bulk soft-delete expenditures and revert balance propagation within an ACID transaction [GAP-008]
router.post('/bulk-delete', auth, validate({ body: bulkDeleteSchema }), asyncHandler(async (req, res) => {
  const { ids } = getValidated(req, 'body');
  const result = await ledgerService.bulkDeleteExpenditures({
    userId: req.effectiveUserId,
    ids,
    canModify: req.canModify,
  });
  res.json(result);
}));

// ==========================================
// RECURRING BILLS & SCHEDULER [FEAT-005, GAP-009]
// ==========================================

// @route   GET api/expenditures/bills/upcoming
// @desc    Get upcoming bills due within N days (default: 3 days)
router.get('/bills/upcoming', auth, validate({ query: queryUpcomingBillsSchema }), asyncHandler(async (req, res) => {
  const { days } = getValidated(req, 'query');
  const result = await ledgerService.getUpcomingBills({
    userId: req.effectiveUserId,
    days,
  });
  res.json(result);
}));

// @route   GET api/expenditures/bills
// @desc    List all recurring bills for current user
router.get('/bills', auth, asyncHandler(async (req, res) => {
  const result = await ledgerService.listRecurringBills({
    userId: req.effectiveUserId,
    query: req.query,
  });
  res.json(result);
}));

// @route   POST api/expenditures/bills
// @desc    Create a new recurring bill schedule
router.post('/bills', auth, validate({ body: createRecurringBillSchema }), asyncHandler(async (req, res) => {
  const result = await ledgerService.createRecurringBill({
    userId: req.effectiveUserId,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.status(201).json(result);
}));

// @route   GET api/expenditures/bills/:id
// @desc    Get single recurring bill by ID
router.get('/bills/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.getRecurringBillById({
    userId: req.effectiveUserId,
    id,
  });
  res.json(result);
}));

// @route   PUT api/expenditures/bills/:id
// @desc    Update recurring bill configuration
router.put('/bills/:id', auth, validate({ params: paramsSchema, body: updateRecurringBillSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.updateRecurringBill({
    userId: req.effectiveUserId,
    id,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   DELETE api/expenditures/bills/:id
// @desc    Soft delete a recurring bill schedule
router.delete('/bills/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.deleteRecurringBill({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   POST api/expenditures/bills/:id/pay
// @desc    Atomically pay a recurring bill, create expenditure, propagate balance, and advance schedule
router.post('/bills/:id/pay', auth, validate({ params: paramsSchema, body: payRecurringBillSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.payRecurringBill({
    userId: req.effectiveUserId,
    id,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   GET api/expenditures/deleted
// @desc    Get soft-deleted expenditures with Option B bridge record exclusion [FEAT-006, GAP-004]
router.get('/deleted', auth, asyncHandler(async (req, res) => {
  const result = await ledgerService.getDeletedExpenditures({
    userId: req.effectiveUserId,
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json(result);
}));

// @route   GET api/expenditures/:id
// @desc    Get a single expenditure log by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const expenditure = await ledgerService.getExpenditureById({
    userId: req.effectiveUserId,
    id,
  });
  res.json(expenditure);
}));

// @route   PUT api/expenditures/:id
// @desc    Update an expenditure log and recalculate propagated balances
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const updatedDoc = await ledgerService.updateExpenditure({
    userId: req.effectiveUserId,
    id,
    data: getValidated(req, 'body'),
    userRole: req.user?.role,
    canModify: req.canModify,
  });
  res.json(updatedDoc);
}));

// @route   DELETE api/expenditures/:id
// @desc    Soft delete an expenditure log and revert propagated balances
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.deleteExpenditure({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   POST api/expenditures/:id/restore
// @desc    Restore a soft-deleted expenditure log and re-apply propagated balances
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await ledgerService.restoreExpenditure({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

module.exports = router;
