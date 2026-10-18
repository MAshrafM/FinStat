// backend/routes/certificates.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  withdrawSchema,
  paramsSchema,
  listQuerySchema,
} = require('../validationSchemas/certificateSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const { invalidatePortfolioCache } = require('../utils/portfolioService');
const {
  calculateAccruedInterest,
  calculateNextPayoutDate,
  calculateTotalInterestEarned,
  generateAccrualTrajectory,
  deriveCertificateStatus,
} = require('../utils/interestAccrual');

/**
 * Helper to enrich a certificate document with live on-demand accrual metrics.
 */
function enrichCertificate(certDoc) {
  const plain = certDoc.toObject ? certDoc.toObject() : { ...certDoc };
  const accrual = calculateAccruedInterest(plain);
  const nextPayout = calculateNextPayoutDate(plain);
  const totalEarned = calculateTotalInterestEarned(plain);
  const displayStatus = deriveCertificateStatus(plain);

  let maturity = plain.maturityDate ? new Date(plain.maturityDate) : null;
  if (!maturity && plain.startDate && plain.period) {
    maturity = new Date(plain.startDate);
    maturity.setMonth(maturity.getMonth() + Number(plain.period));
  }

  const now = new Date();
  const daysRemaining = maturity ? Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    ...plain,
    maturityDate: maturity,
    daysRemaining,
    displayStatus,
    accruedInterestInPiastres: accrual.accruedInterestInPiastres,
    accruedInterest: accrual.accruedInterest,
    daysElapsed: accrual.daysElapsed,
    dailyRate: accrual.dailyRate,
    nextPayoutDate: nextPayout,
    totalInterestEarnedInPiastres: totalEarned.totalEarnedInPiastres,
    totalInterestEarned: totalEarned.totalEarned,
  };
}

// @route   GET api/certificates
// @desc    Get all active certificates enriched with live accrual and status
router.get('/', auth, validate({ query: listQuerySchema }), asyncHandler(async (req, res) => {
  const query = { user: req.effectiveUserId, deletedAt: null };
  const filterStatus = req.query.status;

  if (filterStatus && ['withdrawn'].includes(filterStatus)) {
    query.status = filterStatus;
  }

  const certificates = await Certificate.find(query).sort({ startDate: -1 });
  let enrichedList = certificates.map(enrichCertificate);

  // If filtered by virtual or derived status
  if (filterStatus === 'maturing_soon') {
    enrichedList = enrichedList.filter((c) => c.displayStatus === 'maturing_soon');
  } else if (filterStatus === 'future') {
    enrichedList = enrichedList.filter((c) => c.displayStatus === 'future');
  } else if (filterStatus === 'matured') {
    enrichedList = enrichedList.filter((c) => c.displayStatus === 'matured');
  } else if (filterStatus === 'active') {
    enrichedList = enrichedList.filter((c) => c.displayStatus === 'active' || c.displayStatus === 'maturing_soon');
  }

  res.json(enrichedList);
}));

// @route   POST api/certificates
// @desc    Create a new certificate
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  let maturityDate = validatedBody.maturityDate;
  if (!maturityDate && validatedBody.startDate && validatedBody.period) {
    const mat = new Date(validatedBody.startDate);
    mat.setMonth(mat.getMonth() + Number(validatedBody.period));
    maturityDate = mat;
  }

  const newCertificate = new Certificate({
    ...validatedBody,
    maturityDate,
    user: req.effectiveUserId,
    amountInPiastres: toPiastres(validatedBody.amount),
  });
  await newCertificate.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(enrichCertificate(newCertificate));
}));

// @route   GET api/certificates/:id
// @desc    Get a single certificate by ID enriched with live accrual and trajectory
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }

  const enriched = enrichCertificate(certificate);
  const trajectory = generateAccrualTrajectory(certificate);

  res.json({
    ...enriched,
    trajectory,
  });
}));

// @route   GET api/certificates/:id/accrued-interest
// @desc    Get live accrued interest and next payout calculation
router.get('/:id/accrued-interest', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }

  const accrual = calculateAccruedInterest(certificate);
  const nextPayout = calculateNextPayoutDate(certificate);
  const totalEarned = calculateTotalInterestEarned(certificate);
  const displayStatus = deriveCertificateStatus(certificate);

  res.json({
    certificateId: certificate._id,
    principal: certificate.amount,
    annualInterestRate: certificate.interest,
    status: certificate.status,
    displayStatus,
    ...accrual,
    nextPayoutDate: nextPayout,
    ...totalEarned,
  });
}));

// @route   POST api/certificates/:id/withdraw
// @desc    Mark certificate as withdrawn with live payout impact recorded
router.post('/:id/withdraw', auth, validate({ params: paramsSchema, body: withdrawSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }

  const withdrawalDate = validatedBody.withdrawalDate ? new Date(validatedBody.withdrawalDate) : new Date();
  const accrualAtWithdrawal = calculateAccruedInterest(certificate, withdrawalDate);

  certificate.status = 'withdrawn';
  certificate.withdrawalDate = withdrawalDate;
  if (validatedBody.withdrawalReason) {
    certificate.withdrawalReason = validatedBody.withdrawalReason;
  }

  await certificate.save();
  invalidatePortfolioCache(req.effectiveUserId);

  res.json({
    msg: 'Certificate marked as withdrawn',
    certificate: enrichCertificate(certificate),
    accrualAtWithdrawal,
  });
}));

// @route   PUT api/certificates/:id
// @desc    Update a certificate
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.amount !== undefined) {
    updateData.amountInPiastres = toPiastres(validatedBody.amount);
  }

  certificate = await Certificate.findOneAndUpdate(
    { _id: id, user: req.effectiveUserId, deletedAt: null },
    updateData,
    { new: true, runValidators: true }
  );
  invalidatePortfolioCache(req.effectiveUserId);
  res.json(enrichCertificate(certificate));
}));

// @route   DELETE api/certificates/:id
// @desc    Soft delete a certificate
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  await certificate.softDelete();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Certificate deleted successfully' });
}));

// @route   POST api/certificates/:id/restore
// @desc    Restore a soft-deleted certificate
router.post('/:id/restore', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!certificate) {
    throw new NotFoundError('Soft-deleted certificate not found');
  }
  await certificate.restore();
  invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Certificate restored successfully', certificate: enrichCertificate(certificate) });
}));

module.exports = router;
