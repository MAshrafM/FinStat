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
  paramsSchema,
} = require('../validationSchemas/certificateSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');
const { invalidatePortfolioCache } = require('../utils/portfolioService');

// @route   GET api/certificates
// @desc    Get all active certificates
router.get('/', auth, asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ user: req.effectiveUserId, deletedAt: null }).sort({ startDate: -1 });
  res.json(certificates);
}));

// @route   POST api/certificates
// @desc    Create a new certificate
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');
  const newCertificate = new Certificate({
    ...validatedBody,
    user: req.effectiveUserId,
    amountInPiastres: toPiastres(validatedBody.amount),
  });
  await newCertificate.save();
  invalidatePortfolioCache(req.effectiveUserId);
  res.status(201).json(newCertificate);
}));

// @route   GET api/certificates/:id
// @desc    Get a single certificate by ID
router.get('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, user: req.effectiveUserId, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  res.json(certificate);
}));

// @route   PUT api/certificates/:id
// @desc    Update a certificate
router.put('/:id', auth, validate({ params: paramsSchema, body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const validatedBody = getValidated(req, 'body');

  let certificate = await Certificate.findOne({ _id: id, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  if (certificate.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
  }

  const updateData = { ...validatedBody };
  if (validatedBody.amount !== undefined) {
    updateData.amountInPiastres = toPiastres(validatedBody.amount);
  }

  certificate = await Certificate.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  invalidatePortfolioCache(req.effectiveUserId);
  res.json(certificate);
}));

// @route   DELETE api/certificates/:id
// @desc    Soft delete a certificate
router.delete('/:id', auth, validate({ params: paramsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { id } = getValidated(req, 'params');
  const certificate = await Certificate.findOne({ _id: id, deletedAt: null });
  if (!certificate) {
    throw new NotFoundError('Certificate not found');
  }
  if (certificate.user.toString() !== req.effectiveUserId.toString()) {
    throw new ForbiddenError('User not authorized');
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
  res.json({ msg: 'Certificate restored successfully', certificate });
}));

module.exports = router;
