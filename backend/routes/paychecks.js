// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const Paycheck = require('../models/Paycheck');
const TaxBracket = require('../models/TaxBracket');
const SocialInsurance = require('../models/SocialInsurance');
const { calculatePreview } = require('../utils/salaryCalculator');
const { defaultTaxBrackets, defaultSocialInsurance } = require('../utils/seedTaxAndInsurance');
const {
  previewSchema,
  createPaycheckSchema,
  updatePaycheckSchema,
  paramsSchema,
  querySchema,
} = require('../validationSchemas/paycheckSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');

// Helper to extract year from period or string
const extractYear = (period, fallbackYear) => {
  if (fallbackYear && !isNaN(Number(fallbackYear))) {
    return Number(fallbackYear);
  }
  if (typeof period === 'string') {
    const match = period.match(/\b(20\d{2}|19\d{2})\b/);
    if (match) return Number(match[1]);
  }
  return new Date().getFullYear();
};

// @route   POST /api/paychecks/preview
// @desc    Accepts components and period, calculates expected tax, insurance, and net pay without saving
// @access  Private
router.post('/preview', auth, validate({ body: previewSchema }), asyncHandler(async (req, res) => {
  const { period, year, components, taxConfig: customTax, insuranceConfig: customIns } = getValidated(req, 'body');

  const targetYear = extractYear(period, year);

  // Resolve Tax Bracket Config
  let resolvedTax = customTax;
  if (!resolvedTax || !resolvedTax.brackets || resolvedTax.brackets.length === 0) {
    const dbTax = await TaxBracket.findOne({ year: targetYear, isActive: true }) ||
      await TaxBracket.findOne({ isActive: true }).sort({ year: -1 });

    if (dbTax) {
      resolvedTax = {
        brackets: dbTax.brackets,
        personalExemption: dbTax.personalExemption || 0,
      };
    } else {
      const fallback = defaultTaxBrackets.find(t => t.year === targetYear) || defaultTaxBrackets[0];
      if (!fallback) {
        throw new BadRequestError(`No tax/insurance configuration found for ${targetYear}. Please contact your administrator.`);
      }
      resolvedTax = {
        brackets: fallback.brackets,
        personalExemption: fallback.personalExemption,
      };
    }
  }

  // Resolve Social Insurance Config
  let resolvedInsurance = customIns;
  if (!resolvedInsurance || !resolvedInsurance.employeeShare) {
    const dbIns = await SocialInsurance.findOne({ year: targetYear, isActive: true, user: null }) ||
      await SocialInsurance.findOne({ isActive: true, user: null }).sort({ year: -1 });

    if (dbIns) {
      resolvedInsurance = {
        employeeShare: dbIns.employeeShare,
        employerShare: dbIns.employerShare,
        minInsurableIncome: dbIns.minInsurableIncome,
        maxInsurableIncome: dbIns.maxInsurableIncome,
      };
    } else {
      const fallback = defaultSocialInsurance.find(s => s.year === targetYear) || defaultSocialInsurance[0];
      if (!fallback) {
        throw new BadRequestError(`No tax/insurance configuration found for ${targetYear}. Please contact your administrator.`);
      }
      resolvedInsurance = {
        employeeShare: fallback.employeeShare,
        employerShare: fallback.employerShare,
        minInsurableIncome: fallback.minInsurableIncome,
        maxInsurableIncome: fallback.maxInsurableIncome,
      };
    }
  }

  // Compute Prior YTD Gross for user in target year
  let priorYtdGross = req.body.priorYtdGross;
  if (priorYtdGross === undefined || priorYtdGross === 0) {
    try {
      const yearStr = String(targetYear);
      const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

      const query = {
        user: req.effectiveUserId,
        deletedAt: null,
        $or: [
          { period: { $regex: yearStr, $options: 'i' } },
          { month: { $regex: yearStr, $options: 'i' } },
          { payDate: { $gte: startOfYear, $lte: endOfYear } },
          { date: { $gte: startOfYear, $lte: endOfYear } },
        ],
      };

      if (req.body.paycheckId) {
        query._id = { $ne: req.body.paycheckId };
      }

      const userPriorPaychecks = await Paycheck.find(query);
      priorYtdGross = userPriorPaychecks.reduce((sum, p) => {
        const amt = Number(p.amount !== undefined && p.amount !== null ? p.amount : (p.netPay || 0)) || 0;
        const tax = Number(p.taxDeduction || p.taxDetails?.actualTax || p.taxDetails?.expectedTax || 0) || 0;
        const ins = Number(p.insuranceDeduction || p.insuranceDetails?.actualEmployeeShare || p.insuranceDetails?.expectedEmployeeShare || 0) || 0;
        const martyrs = Number(p.martyrsFund || 0) || 0;
        const ded = Number(p.totalDeductions || (tax + ins + martyrs)) || 0;
        const gross = Number(p.grossSalary || p.grossAmount || (amt + ded)) || 0;
        return sum + gross;
      }, 0);
    } catch (e) {
      priorYtdGross = 0;
    }
  }

  const preview = calculatePreview(components, resolvedTax, resolvedInsurance, {
    disbursementType: req.body.disbursementType || 'Regular',
    multiplier: req.body.multiplier,
    unitRate: req.body.unitRate,
    priorYtdGross,
    includeTax: req.body.includeTax,
    includeInsurance: req.body.includeInsurance !== false,
    includeMartyrsFund: req.body.includeMartyrsFund !== false,
  });

  res.json({
    success: true,
    year: targetYear,
    preview,
    appliedConfig: {
      taxYear: targetYear,
      personalExemption: resolvedTax.personalExemption,
      insuranceEmployeeShare: resolvedInsurance.employeeShare,
      insuranceEmployerShare: resolvedInsurance.employerShare,
      maxInsurableIncome: resolvedInsurance.maxInsurableIncome,
      includeTax: preview.includeTax,
      includeInsurance: preview.includeInsurance,
      includeMartyrsFund: preview.includeMartyrsFund,
    },
  });
}));

// @route   POST /api/paychecks
// @desc    Create a new paycheck
// @access  Private
router.post('/', auth, validate({ body: createPaycheckSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const body = getValidated(req, 'body');

  const period = body.period || body.month;
  if (!period) {
    throw new BadRequestError('Period or Month is required');
  }
  const targetYear = extractYear(period, null);
  const payDate = body.payDate || body.date || new Date();
  const grossSalary = body.grossSalary !== undefined ? body.grossSalary : (body.grossAmount || 0);
  const netPay = body.netPay !== undefined ? body.netPay : (body.amount || 0);
  const insuranceDeduction = body.insuranceDeduction !== undefined ? body.insuranceDeduction : (body.insuranceDetails?.actualEmployeeShare || body.insuranceDetails?.expectedEmployeeShare || 0);
  const taxDeduction = body.taxDeduction !== undefined ? body.taxDeduction : (body.taxDetails?.actualTax || body.taxDetails?.expectedTax || 0);
  const totalDeductions = body.totalDeductions !== undefined ? body.totalDeductions : (grossSalary - netPay);

  // Compute prior YTD gross if not supplied
  let priorYtdGross = body.priorYtdGross;
  if (priorYtdGross === undefined || priorYtdGross === 0) {
    const yearStr = String(targetYear);
    const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

    const existingPcs = await Paycheck.find({
      user: req.effectiveUserId,
      deletedAt: null,
      $or: [
        { period: { $regex: yearStr, $options: 'i' } },
        { month: { $regex: yearStr, $options: 'i' } },
        { payDate: { $gte: startOfYear, $lte: endOfYear } },
        { date: { $gte: startOfYear, $lte: endOfYear } },
      ],
    });
    priorYtdGross = existingPcs.reduce((sum, p) => {
      const amt = Number(p.amount !== undefined && p.amount !== null ? p.amount : (p.netPay || 0)) || 0;
      const tax = Number(p.taxDeduction || p.taxDetails?.actualTax || p.taxDetails?.expectedTax || 0) || 0;
      const ins = Number(p.insuranceDeduction || p.insuranceDetails?.actualEmployeeShare || p.insuranceDetails?.expectedEmployeeShare || 0) || 0;
      const martyrs = Number(p.martyrsFund || 0) || 0;
      const ded = Number(p.totalDeductions || (tax + ins + martyrs)) || 0;
      const gross = Number(p.grossSalary || p.grossAmount || (amt + ded)) || 0;
      return sum + gross;
    }, 0);
  }
  const cumulativeYtdGross = body.cumulativeYtdGross !== undefined ? body.cumulativeYtdGross : (priorYtdGross + grossSalary);

  const newPaycheck = new Paycheck({
    ...body,
    user: req.effectiveUserId,
    period,
    month: period,
    payDate,
    date: payDate,
    disbursementType: body.disbursementType || (body.type === 'Prepaid' ? 'Prepaid' : 'Regular'),
    multiplier: body.multiplier || 1,
    unitRate: body.unitRate || 0,
    priorYtdGross,
    cumulativeYtdGross,
    grossSalary,
    grossSalaryInPiastres: toPiastres(grossSalary),
    grossAmount: grossSalary,
    grossAmountInPiastres: toPiastres(grossSalary),
    netPay,
    netPayInPiastres: toPiastres(netPay),
    amount: netPay,
    amountInPiastres: toPiastres(netPay),
    insuranceDeduction,
    insuranceDeductionInPiastres: toPiastres(insuranceDeduction),
    taxDeduction,
    taxDeductionInPiastres: toPiastres(taxDeduction),
    martyrsFund: body.martyrsFund || 0,
    totalDeductions,
    totalDeductionsInPiastres: toPiastres(totalDeductions),
    notes: body.notes || body.note || '',
    note: body.notes || body.note || '',
  });

  const savedPaycheck = await newPaycheck.save();
  res.status(201).json(savedPaycheck);
}));

// @route   GET /api/paychecks/all
// @desc    Get ALL non-deleted paychecks without pagination
// @access  Private
router.get('/all', auth, asyncHandler(async (req, res) => {
  const paychecks = await Paycheck.find({
    user: req.effectiveUserId,
    deletedAt: null,
  }).sort({ period: -1, month: -1, payDate: -1, createdAt: -1 });

  res.json(paychecks);
}));

// @route   GET /api/paychecks
// @desc    Get paginated paychecks
// @access  Private
router.get('/', auth, validate({ query: querySchema }), asyncHandler(async (req, res) => {
  const { page, limit, year, period } = getValidated(req, 'query');
  const skip = (page - 1) * limit;

  const query = { user: req.effectiveUserId, deletedAt: null };
  if (year) {
    query.$or = [
      { period: { $regex: `${year}` } },
      { month: { $regex: `^${year}` } },
    ];
  }
  if (period) {
    query.$or = [
      { period },
      { month: period },
    ];
  }

  const total = await Paycheck.countDocuments(query);
  const paychecks = await Paycheck.find(query)
    .sort({ period: -1, month: -1, payDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    data: paychecks,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}));

// @route   GET /api/paychecks/:id
// @desc    Get single paycheck by ID
// @access  Private
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const paycheck = await Paycheck.findOne({
    _id: id,
    user: req.effectiveUserId,
    deletedAt: null,
  }).populate('salaryProfile', 'name components');

  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }

  res.json(paycheck);
}));

// @route   PUT /api/paychecks/:id
// @desc    Update a paycheck
// @access  Private
router.put('/:id', auth, validate({ params: paramsSchema, body: updatePaycheckSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const body = getValidated(req, 'body');

  const paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...body };
  if (body.grossSalary !== undefined || body.grossAmount !== undefined) {
    const gross = body.grossSalary !== undefined ? body.grossSalary : body.grossAmount;
    updateData.grossSalary = gross;
    updateData.grossAmount = gross;
    updateData.grossSalaryInPiastres = toPiastres(gross);
    updateData.grossAmountInPiastres = toPiastres(gross);
  }
  if (body.netPay !== undefined || body.amount !== undefined) {
    const net = body.netPay !== undefined ? body.netPay : body.amount;
    updateData.netPay = net;
    updateData.amount = net;
    updateData.netPayInPiastres = toPiastres(net);
    updateData.amountInPiastres = toPiastres(net);
  }
  if (body.totalDeductions !== undefined) {
    updateData.totalDeductions = body.totalDeductions;
    updateData.totalDeductionsInPiastres = toPiastres(body.totalDeductions);
  }
  if (body.period || body.month) {
    const p = body.period || body.month;
    updateData.period = p;
    updateData.month = p;
  }
  if (body.payDate || body.date) {
    const d = body.payDate || body.date;
    updateData.payDate = d;
    updateData.date = d;
  }
  if (body.notes || body.note) {
    const n = body.notes || body.note;
    updateData.notes = n;
    updateData.note = n;
  }

  const updated = await Paycheck.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  res.json(updated);
}));

// @route   DELETE /api/paychecks/:id
// @desc    Soft delete a paycheck
// @access  Private
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }
  await paycheck.softDelete();
  res.json({ msg: 'Paycheck removed' });
}));

// @route   POST /api/paychecks/:id/restore
// @desc    Restore a soft-deleted paycheck
// @access  Private
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const paycheck = await Paycheck.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!paycheck) {
    throw new NotFoundError('Soft-deleted paycheck not found');
  }
  await paycheck.restore();
  res.json({ msg: 'Paycheck restored successfully', paycheck });
}));

module.exports = router;
