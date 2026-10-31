// backend/routes/paychecks.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../utils/errors');
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

/**
 * Normalizes a date input to UTC midday (12:00:00.000Z) to prevent timezone drift.
 */
function normalizeToUtcMidday(dateInput) {
  if (!dateInput) return new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`);
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return new Date(`${dateInput.slice(0, 10)}T12:00:00.000Z`);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new BadRequestError('Invalid payDate format. Expected YYYY-MM-DD string');
  }
  return new Date(`${d.toISOString().slice(0, 10)}T12:00:00.000Z`);
}

/**
 * Recalculates priorYtdGross and cumulativeYtdGross chronologically for all active paychecks in a year.
 */
async function recalculateYearlyPaychecksChain(userId, year, session) {
  const yearStr = String(year);
  const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

  const paychecks = await Paycheck.find({
    user: userId,
    deletedAt: null,
    $or: [
      { period: { $regex: `^${yearStr}`, $options: 'i' } },
      { month: { $regex: `^${yearStr}`, $options: 'i' } },
      { payDate: { $gte: startOfYear, $lte: endOfYear } },
      { date: { $gte: startOfYear, $lte: endOfYear } },
    ],
  }).sort({ payDate: 1, createdAt: 1 }).session(session);

  let runningYtd = 0;
  for (const pc of paychecks) {
    const gross = Number(pc.grossSalary !== undefined && pc.grossSalary !== null ? pc.grossSalary : (pc.grossAmount || 0));
    const priorYtdGross = runningYtd;
    const cumulativeYtdGross = priorYtdGross + gross;
    runningYtd = cumulativeYtdGross;

    if (pc.priorYtdGross !== priorYtdGross || pc.cumulativeYtdGross !== cumulativeYtdGross) {
      pc.priorYtdGross = priorYtdGross;
      pc.cumulativeYtdGross = cumulativeYtdGross;
      await pc.save({ session });
    }
  }
}

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
      minInsurableIncome: resolvedInsurance.minInsurableIncome,
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

  const normalizedPayDate = normalizeToUtcMidday(body.payDate || body.date);
  const period = body.period || body.month || normalizedPayDate.toISOString().slice(0, 7);
  if (!period) {
    throw new BadRequestError('Period or Month is required');
  }
  const targetYear = extractYear(period, normalizedPayDate.getUTCFullYear());
  const payDate = normalizedPayDate;
  const grossSalary = body.grossSalary !== undefined ? body.grossSalary : (body.grossAmount || 0);
  const netPay = body.netPay !== undefined ? body.netPay : (body.amount || 0);
  const insuranceDeduction = body.insuranceDeduction !== undefined ? body.insuranceDeduction : (body.insuranceDetails?.actualEmployeeShare || body.insuranceDetails?.expectedEmployeeShare || 0);
  const taxDeduction = body.taxDeduction !== undefined ? body.taxDeduction : (body.taxDetails?.actualTax || body.taxDetails?.expectedTax || 0);
  const totalDeductions = body.totalDeductions !== undefined ? body.totalDeductions : (grossSalary - netPay);

  const session = await mongoose.startSession();
  try {
    let savedId;
    await session.withTransaction(async () => {
      const newPaycheck = new Paycheck({
        ...body,
        user: req.effectiveUserId,
        period,
        payDate,
        disbursementType: body.disbursementType || (body.type === 'Prepaid' ? 'Prepaid' : 'Regular'),
        multiplier: body.multiplier || 1,
        unitRate: body.unitRate || 0,
        priorYtdGross: 0,
        cumulativeYtdGross: grossSalary,
        grossSalary,
        grossSalaryInPiastres: toPiastres(grossSalary),
        netPay,
        netPayInPiastres: toPiastres(netPay),
        taxDetails: body.taxDetails || {
          actualTax: taxDeduction,
          expectedTax: taxDeduction,
        },
        insuranceDetails: body.insuranceDetails || {
          actualEmployeeShare: insuranceDeduction,
          expectedEmployeeShare: insuranceDeduction,
        },
        martyrsFund: body.martyrsFund || 0,
        totalDeductions,
        totalDeductionsInPiastres: toPiastres(totalDeductions),
        notes: body.notes || body.note || '',
      });

      const saved = await newPaycheck.save({ session });
      savedId = saved._id;

      // Recalculate year chain so all prior/cumulative YTDs are in strict chronological order
      await recalculateYearlyPaychecksChain(req.effectiveUserId, targetYear, session);
    });

    const refreshed = await Paycheck.findById(savedId);
    res.status(201).json(refreshed);
  } catch (err) {
    if (
      err.code === 11000 ||
      err.codeName === 'DuplicateKey' ||
      (err.message && err.message.includes('E11000'))
    ) {
      throw new ConflictError('A paycheck already exists for this period and disbursement type');
    }
    throw err;
  } finally {
    await session.endSession();
  }
}));

// @route   GET /api/paychecks/all
// @desc    Get ALL non-deleted paychecks without pagination
// @access  Private
router.get('/all', auth, asyncHandler(async (req, res) => {
  const paychecks = await Paycheck.find({
    user: req.effectiveUserId,
    deletedAt: null,
  }).sort({ period: -1, payDate: -1, createdAt: -1 });

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
    .sort({ period: -1, payDate: -1, createdAt: -1 })
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

  const sourceYear = extractYear(paycheck.period || paycheck.month, paycheck.payDate ? new Date(paycheck.payDate).getUTCFullYear() : null);
  let normalizedTargetDate;
  if (body.payDate || body.date) {
    normalizedTargetDate = normalizeToUtcMidday(body.payDate || body.date);
  }
  const effectiveDate = normalizedTargetDate || paycheck.payDate;
  const targetPeriod = body.period || body.month || (normalizedTargetDate ? normalizedTargetDate.toISOString().slice(0, 7) : paycheck.period);
  const targetYear = extractYear(targetPeriod, effectiveDate ? new Date(effectiveDate).getUTCFullYear() : null);

  const updateData = { ...body };
  // Purge legacy physical keys from update payload so only canonical fields are stored
  delete updateData.grossAmount;
  delete updateData.grossAmountInPiastres;
  delete updateData.amount;
  delete updateData.amountInPiastres;
  delete updateData.month;
  delete updateData.date;
  delete updateData.note;

  if (body.grossSalary !== undefined || body.grossAmount !== undefined) {
    const gross = body.grossSalary !== undefined ? body.grossSalary : body.grossAmount;
    updateData.grossSalary = gross;
    updateData.grossSalaryInPiastres = toPiastres(gross);
  }
  if (body.netPay !== undefined || body.amount !== undefined) {
    const net = body.netPay !== undefined ? body.netPay : body.amount;
    updateData.netPay = net;
    updateData.netPayInPiastres = toPiastres(net);
  }
  if (body.totalDeductions !== undefined) {
    updateData.totalDeductions = body.totalDeductions;
    updateData.totalDeductionsInPiastres = toPiastres(body.totalDeductions);
  }
  if (body.period || body.month) {
    const p = body.period || body.month;
    updateData.period = p;
  }
  if (normalizedTargetDate) {
    updateData.payDate = normalizedTargetDate;
  }
  if (body.notes || body.note) {
    updateData.notes = body.notes || body.note;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Paycheck.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true, session }
      );

      const yearsToRecalc = [...new Set([sourceYear, targetYear])];
      for (const year of yearsToRecalc) {
        await recalculateYearlyPaychecksChain(req.effectiveUserId, year, session);
      }
    });

    const refreshed = await Paycheck.findById(id);
    res.json(refreshed);
  } catch (err) {
    if (
      err.code === 11000 ||
      err.codeName === 'DuplicateKey' ||
      (err.message && err.message.includes('E11000'))
    ) {
      throw new ConflictError('A paycheck already exists for this period and disbursement type');
    }
    throw err;
  } finally {
    await session.endSession();
  }
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

  const targetYear = extractYear(paycheck.period || paycheck.month, paycheck.payDate ? new Date(paycheck.payDate).getFullYear() : null);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await paycheck.softDelete(session);
      await recalculateYearlyPaychecksChain(req.effectiveUserId, targetYear, session);
    });
    res.json({ msg: 'Paycheck removed' });
  } finally {
    await session.endSession();
  }
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
