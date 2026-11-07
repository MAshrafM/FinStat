// backend/services/payrollService.js
const mongoose = require('mongoose');
const Paycheck = require('../models/Paycheck');
const SalaryProfile = require('../models/SalaryProfile');
const TaxBracket = require('../models/TaxBracket');
const SocialInsurance = require('../models/SocialInsurance');
const { calculatePreview } = require('../utils/salaryCalculator');
const { defaultTaxBrackets, defaultSocialInsurance } = require('../utils/seedTaxAndInsurance');
const { toPiastres } = require('../utils/currencyUtils');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../utils/errors');
const { executeInTransaction } = require('../utils/ledgerHelpers');
const {
  createExpenditureFromPaycheck,
  reverseIncomeExpenditure,
  syncPaycheckExpenditure,
} = require('../utils/incomeBridge');

/**
 * Extracts numeric 4-digit year from period string or fallbackYear.
 * @param {string} period
 * @param {number|string} fallbackYear
 * @returns {number}
 */
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
 * @param {string|Date} dateInput
 * @returns {Date}
 */
const normalizeToUtcMidday = (dateInput) => {
  if (!dateInput) return new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00.000Z`);
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return new Date(`${dateInput.slice(0, 10)}T12:00:00.000Z`);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new BadRequestError('Invalid payDate format. Expected YYYY-MM-DD string');
  }
  return new Date(`${d.toISOString().slice(0, 10)}T12:00:00.000Z`);
};

/**
 * Resolves tax bracket configuration for a target year from DB or statutory fallback.
 * @param {number} targetYear
 * @param {Object} [customTax]
 * @returns {Promise<Object>}
 */
const resolveTaxConfig = async (targetYear, customTax = null) => {
  if (customTax && customTax.brackets && customTax.brackets.length > 0) {
    return customTax;
  }
  const dbTax =
    (await TaxBracket.findOne({ year: targetYear, isActive: true })) ||
    (await TaxBracket.findOne({ isActive: true }).sort({ year: -1 }));

  if (dbTax) {
    return {
      brackets: dbTax.brackets,
      personalExemption: dbTax.personalExemption || 0,
    };
  }
  const fallback = defaultTaxBrackets.find((t) => t.year === targetYear) || defaultTaxBrackets[0];
  if (!fallback) {
    throw new BadRequestError(`No tax configuration found for ${targetYear}.`);
  }
  return {
    brackets: fallback.brackets,
    personalExemption: fallback.personalExemption,
  };
};

/**
 * Resolves social insurance configuration for a target year from DB or statutory fallback.
 * @param {number} targetYear
 * @param {Object} [customIns]
 * @returns {Promise<Object>}
 */
const resolveInsuranceConfig = async (targetYear, customIns = null) => {
  if (customIns && customIns.employeeShare) {
    return customIns;
  }
  const dbIns =
    (await SocialInsurance.findOne({ year: targetYear, isActive: true, user: null })) ||
    (await SocialInsurance.findOne({ isActive: true, user: null }).sort({ year: -1 }));

  if (dbIns) {
    return {
      employeeShare: dbIns.employeeShare,
      employerShare: dbIns.employerShare,
      minInsurableIncome: dbIns.minInsurableIncome,
      maxInsurableIncome: dbIns.maxInsurableIncome,
    };
  }
  const fallback = defaultSocialInsurance.find((s) => s.year === targetYear) || defaultSocialInsurance[0];
  if (!fallback) {
    throw new BadRequestError(`No insurance configuration found for ${targetYear}.`);
  }
  return {
    employeeShare: fallback.employeeShare,
    employerShare: fallback.employerShare,
    minInsurableIncome: fallback.minInsurableIncome,
    maxInsurableIncome: fallback.maxInsurableIncome,
  };
};

/**
 * Computes prior YTD gross earnings for a user in a target year.
 * @param {ObjectId|string} userId
 * @param {number} targetYear
 * @param {ObjectId|string} [excludePaycheckId]
 * @returns {Promise<number>}
 */
const calculatePriorYtdGross = async (userId, targetYear, excludePaycheckId = null) => {
  try {
    const yearStr = String(targetYear);
    const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

    const query = {
      user: userId,
      deletedAt: null,
      $or: [
        { period: { $regex: yearStr, $options: 'i' } },
        { month: { $regex: yearStr, $options: 'i' } },
        { payDate: { $gte: startOfYear, $lte: endOfYear } },
        { date: { $gte: startOfYear, $lte: endOfYear } },
      ],
    };

    if (excludePaycheckId) {
      query._id = { $ne: excludePaycheckId };
    }

    const paychecks = await Paycheck.find(query);
    return paychecks.reduce((sum, p) => {
      const amt = Number(p.amount !== undefined && p.amount !== null ? p.amount : (p.netPay || 0)) || 0;
      const tax = Number(p.taxDeduction || p.taxDetails?.actualTax || p.taxDetails?.expectedTax || 0) || 0;
      const ins = Number(p.insuranceDeduction || p.insuranceDetails?.actualEmployeeShare || p.insuranceDetails?.expectedEmployeeShare || 0) || 0;
      const martyrs = Number(p.martyrsFund || 0) || 0;
      const ded = Number(p.totalDeductions || (tax + ins + martyrs)) || 0;
      const gross = Number(p.grossSalary || p.grossAmount || (amt + ded)) || 0;
      return sum + gross;
    }, 0);
  } catch (err) {
    return 0;
  }
};

/**
 * Recalculates priorYtdGross and cumulativeYtdGross chronologically for all active paychecks in a year.
 * @param {ObjectId|string} userId
 * @param {number} year
 * @param {ClientSession} [session]
 * @returns {Promise<void>}
 */
const recalculateYearlyPaychecksChain = async (userId, year, session = null) => {
  const yearStr = String(year);
  const startOfYear = new Date(`${yearStr}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${yearStr}-12-31T23:59:59.999Z`);

  const q = Paycheck.find({
    user: userId,
    deletedAt: null,
    $or: [
      { period: { $regex: `^${yearStr}`, $options: 'i' } },
      { month: { $regex: `^${yearStr}`, $options: 'i' } },
      { payDate: { $gte: startOfYear, $lte: endOfYear } },
      { date: { $gte: startOfYear, $lte: endOfYear } },
    ],
  }).sort({ payDate: 1, createdAt: 1 });

  if (session) {
    q.session(session);
  }

  const paychecks = await q;

  let runningYtd = 0;
  for (const pc of paychecks) {
    const gross = Number(pc.grossSalary !== undefined && pc.grossSalary !== null ? pc.grossSalary : (pc.grossAmount || 0));
    const priorYtdGross = runningYtd;
    const cumulativeYtdGross = priorYtdGross + gross;
    runningYtd = cumulativeYtdGross;

    if (pc.priorYtdGross !== priorYtdGross || pc.cumulativeYtdGross !== cumulativeYtdGross) {
      pc.priorYtdGross = priorYtdGross;
      pc.cumulativeYtdGross = cumulativeYtdGross;
      await pc.save(session ? { session } : undefined);
    }
  }
};

/**
 * Calculates paycheck statutory preview without saving to database.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const calculatePaycheckPreview = async ({
  userId,
  period,
  year,
  components,
  customTax = null,
  customIns = null,
  priorYtdGross = undefined,
  options = {},
}) => {
  const targetYear = extractYear(period, year);

  const resolvedTax = await resolveTaxConfig(targetYear, customTax);
  const resolvedInsurance = await resolveInsuranceConfig(targetYear, customIns);

  let effectivePriorYtd = priorYtdGross;
  if (effectivePriorYtd === undefined || effectivePriorYtd === 0) {
    effectivePriorYtd = await calculatePriorYtdGross(userId, targetYear, options.paycheckId);
  }

  const preview = calculatePreview(components, resolvedTax, resolvedInsurance, {
    disbursementType: options.disbursementType || 'Regular',
    multiplier: options.multiplier,
    unitRate: options.unitRate,
    priorYtdGross: effectivePriorYtd,
    includeTax: options.includeTax,
    includeInsurance: options.includeInsurance !== false,
    includeMartyrsFund: options.includeMartyrsFund !== false,
  });

  return {
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
  };
};

/**
 * Creates a new paycheck within a transaction, generates bridge settlement, and recalculates year chain.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const createPaycheck = async ({ userId, data, canModify = true }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const normalizedPayDate = normalizeToUtcMidday(data.payDate || data.date);
  const period = data.period || data.month || normalizedPayDate.toISOString().slice(0, 7);
  if (!period) {
    throw new BadRequestError('Period or Month is required');
  }
  const targetYear = extractYear(period, normalizedPayDate.getUTCFullYear());
  const payDate = normalizedPayDate;
  const grossSalary = data.grossSalary !== undefined ? data.grossSalary : (data.grossAmount || 0);
  const netPay = data.netPay !== undefined ? data.netPay : (data.amount || 0);
  const insuranceDeduction = data.insuranceDeduction !== undefined ? data.insuranceDeduction : (data.insuranceDetails?.actualEmployeeShare || data.insuranceDetails?.expectedEmployeeShare || 0);
  const taxDeduction = data.taxDeduction !== undefined ? data.taxDeduction : (data.taxDetails?.actualTax || data.taxDetails?.expectedTax || 0);
  const totalDeductions = data.totalDeductions !== undefined ? data.totalDeductions : (grossSalary - netPay);

  let savedId;
  try {
    await executeInTransaction(async (session) => {
      const newPaycheck = new Paycheck({
        ...data,
        user: userId,
        period,
        payDate,
        disbursementType: data.disbursementType || (data.type === 'Prepaid' ? 'Prepaid' : 'Regular'),
        multiplier: data.multiplier || 1,
        unitRate: data.unitRate || 0,
        priorYtdGross: 0,
        cumulativeYtdGross: grossSalary,
        grossSalary,
        grossSalaryInPiastres: toPiastres(grossSalary),
        netPay,
        netPayInPiastres: toPiastres(netPay),
        taxDetails: data.taxDetails || {
          actualTax: taxDeduction,
          expectedTax: taxDeduction,
        },
        insuranceDetails: data.insuranceDetails || {
          actualEmployeeShare: insuranceDeduction,
          expectedEmployeeShare: insuranceDeduction,
        },
        martyrsFund: data.martyrsFund || 0,
        totalDeductions,
        totalDeductionsInPiastres: toPiastres(totalDeductions),
        notes: data.notes || data.note || '',
      });

      const saved = await newPaycheck.save(session ? { session } : undefined);
      savedId = saved._id;

      const targetAccount = data.destinationAccount || (data.type === 'Cash' ? 'Cash' : (data.type === 'Prepaid' ? 'Prepaid' : undefined));
      await createExpenditureFromPaycheck(saved, targetAccount, userId, session);

      await recalculateYearlyPaychecksChain(userId, targetYear, session);
    });
  } catch (err) {
    if (
      err.code === 11000 ||
      err.codeName === 'DuplicateKey' ||
      (err.message && err.message.includes('E11000'))
    ) {
      throw new ConflictError('A paycheck already exists for this period and disbursement type');
    }
    throw err;
  }

  return await Paycheck.findById(savedId);
};

/**
 * Returns paginated paychecks with filtering.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const listPaychecks = async ({ userId, query = {} }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: userId, deletedAt: null };
  if (query.year) {
    filter.$or = [
      { period: { $regex: `${query.year}` } },
      { month: { $regex: `^${query.year}` } },
    ];
  }
  if (query.period) {
    filter.$or = [
      { period: query.period },
      { month: query.period },
    ];
  }

  const total = await Paycheck.countDocuments(filter);
  const paychecks = await Paycheck.find(filter)
    .sort({ period: -1, month: -1, payDate: -1, date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data: paychecks,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Returns non-paginated lean paychecks capped at 1,000 records.
 * @param {Object} params
 * @returns {Promise<Array>}
 */
const getAllPaychecks = async ({ userId }) => {
  return await Paycheck.find({
    user: userId,
    deletedAt: null,
  })
    .sort({ period: -1, month: -1, payDate: -1, date: -1, createdAt: -1 })
    .limit(1000)
    .lean();
};

/**
 * Returns single paycheck by ID with populated profile.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const getPaycheckById = async ({ userId, id }) => {
  const paycheck = await Paycheck.findOne({
    _id: id,
    user: userId,
    deletedAt: null,
  }).populate('salaryProfile', 'name components');

  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  return paycheck;
};

/**
 * Updates an existing paycheck within a transaction, syncs bridge expenditure, and recalculates affected chains.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const updatePaycheck = async ({ userId, id, data, canModify = true }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== userId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const sourceYear = extractYear(
    paycheck.period || paycheck.month,
    paycheck.payDate ? new Date(paycheck.payDate).getUTCFullYear() : null
  );

  let normalizedTargetDate;
  if (data.payDate || data.date) {
    normalizedTargetDate = normalizeToUtcMidday(data.payDate || data.date);
  }
  const effectiveDate = normalizedTargetDate || paycheck.payDate;
  const targetPeriod = data.period || data.month || (normalizedTargetDate ? normalizedTargetDate.toISOString().slice(0, 7) : paycheck.period);
  const targetYear = extractYear(targetPeriod, effectiveDate ? new Date(effectiveDate).getUTCFullYear() : null);

  const updateData = { ...data };
  // Purge legacy physical keys from update payload
  delete updateData.grossAmount;
  delete updateData.grossAmountInPiastres;
  delete updateData.amount;
  delete updateData.amountInPiastres;
  delete updateData.month;
  delete updateData.date;
  delete updateData.note;

  if (data.grossSalary !== undefined || data.grossAmount !== undefined) {
    const gross = data.grossSalary !== undefined ? data.grossSalary : data.grossAmount;
    updateData.grossSalary = gross;
    updateData.grossSalaryInPiastres = toPiastres(gross);
  }
  if (data.netPay !== undefined || data.amount !== undefined) {
    const net = data.netPay !== undefined ? data.netPay : data.amount;
    updateData.netPay = net;
    updateData.netPayInPiastres = toPiastres(net);
  }
  if (data.totalDeductions !== undefined) {
    updateData.totalDeductions = data.totalDeductions;
    updateData.totalDeductionsInPiastres = toPiastres(data.totalDeductions);
  }
  if (data.period || data.month) {
    updateData.period = data.period || data.month;
  }
  if (normalizedTargetDate) {
    updateData.payDate = normalizedTargetDate;
  }
  if (data.notes || data.note) {
    updateData.notes = data.notes || data.note;
  }

  try {
    await executeInTransaction(async (session) => {
      await Paycheck.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true, session: session || undefined }
      );

      if (paycheck.linkedExpenditureId) {
        await syncPaycheckExpenditure(paycheck, updateData, userId, session);
      }

      const yearsToRecalc = [...new Set([sourceYear, targetYear])];
      for (const y of yearsToRecalc) {
        await recalculateYearlyPaychecksChain(userId, y, session);
      }
    });
  } catch (err) {
    if (
      err.code === 11000 ||
      err.codeName === 'DuplicateKey' ||
      (err.message && err.message.includes('E11000'))
    ) {
      throw new ConflictError('A paycheck already exists for this period and disbursement type');
    }
    throw err;
  }

  return await Paycheck.findById(id);
};

/**
 * Soft deletes a paycheck, reverses linked bridge expenditure, and recalculates year chain.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const deletePaycheck = async ({ userId, id, canModify = true }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const paycheck = await Paycheck.findOne({ _id: id, deletedAt: null });
  if (!paycheck) {
    throw new NotFoundError('Paycheck not found');
  }
  if (paycheck.user.toString() !== userId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const targetYear = extractYear(
    paycheck.period || paycheck.month,
    paycheck.payDate ? new Date(paycheck.payDate).getFullYear() : null
  );

  await executeInTransaction(async (session) => {
    if (paycheck.linkedExpenditureId) {
      await reverseIncomeExpenditure(paycheck.linkedExpenditureId, userId, session);
    }
    await paycheck.softDelete(session);
    await recalculateYearlyPaychecksChain(userId, targetYear, session);
  });

  return { msg: 'Paycheck removed' };
};

/**
 * Restores a soft-deleted paycheck.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
const restorePaycheck = async ({ userId, id, canModify = true }) => {
  if (!canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const paycheck = await Paycheck.findOne({
    _id: id,
    user: userId,
    deletedAt: { $ne: null },
  });

  if (!paycheck) {
    throw new NotFoundError('Soft-deleted paycheck not found');
  }

  await paycheck.restore();
  return { msg: 'Paycheck restored successfully', paycheck };
};

module.exports = {
  extractYear,
  normalizeToUtcMidday,
  resolveTaxConfig,
  resolveInsuranceConfig,
  calculatePriorYtdGross,
  recalculateYearlyPaychecksChain,
  calculatePaycheckPreview,
  createPaycheck,
  listPaychecks,
  getAllPaychecks,
  getPaycheckById,
  updatePaycheck,
  deletePaycheck,
  restorePaycheck,
};

