// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const payrollService = require('../services/payrollService');
const {
  previewSchema,
  createPaycheckSchema,
  updatePaycheckSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/paycheckSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   POST /api/paychecks/preview
// @desc    Accepts components and period, calculates expected tax, insurance, and net pay without saving
// @access  Private
router.post('/preview', auth, validate({ body: previewSchema }), asyncHandler(async (req, res) => {
  const body = getValidated(req, 'body');
  const { period, year, components, taxConfig: customTax, insuranceConfig: customIns } = body;

  const result = await payrollService.calculatePaycheckPreview({
    userId: req.effectiveUserId,
    period,
    year,
    components,
    customTax,
    customIns,
    priorYtdGross: body.priorYtdGross,
    options: {
      disbursementType: body.disbursementType,
      multiplier: body.multiplier,
      unitRate: body.unitRate,
      includeTax: body.includeTax,
      includeInsurance: body.includeInsurance,
      includeMartyrsFund: body.includeMartyrsFund,
    },
  });

  res.json(result);
}));

// @route   POST /api/paychecks
// @desc    Create a new paycheck
// @access  Private
router.post('/', auth, validate({ body: createPaycheckSchema }), asyncHandler(async (req, res) => {
  const paycheck = await payrollService.createPaycheck({
    userId: req.effectiveUserId,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.status(201).json(paycheck);
}));

// @route   GET /api/paychecks/all
// @desc    Get all paychecks (lean, non-paginated)
// @access  Private
router.get('/all', auth, asyncHandler(async (req, res) => {
  const paychecks = await payrollService.getAllPaychecks({
    userId: req.effectiveUserId,
  });
  res.json(paychecks);
}));

// @route   GET /api/paychecks
// @desc    Get paginated paychecks
// @access  Private
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const result = await payrollService.listPaychecks({
    userId: req.effectiveUserId,
    query: getValidated(req, 'query'),
  });
  res.json(result);
}));

// @route   GET /api/paychecks/:id
// @desc    Get single paycheck by ID
// @access  Private
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const paycheck = await payrollService.getPaycheckById({
    userId: req.effectiveUserId,
    id,
  });
  res.json(paycheck);
}));

// @route   PUT /api/paychecks/:id
// @desc    Update a paycheck
// @access  Private
router.put('/:id', auth, validate({ params: paramsSchema, body: updatePaycheckSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const paycheck = await payrollService.updatePaycheck({
    userId: req.effectiveUserId,
    id,
    data: getValidated(req, 'body'),
    canModify: req.canModify,
  });
  res.json(paycheck);
}));

// @route   DELETE /api/paychecks/:id
// @desc    Soft delete a paycheck
// @access  Private
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await payrollService.deletePaycheck({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

// @route   POST /api/paychecks/:id/restore
// @desc    Restore a soft-deleted paycheck
// @access  Private
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const result = await payrollService.restorePaycheck({
    userId: req.effectiveUserId,
    id,
    canModify: req.canModify,
  });
  res.json(result);
}));

module.exports = router;
