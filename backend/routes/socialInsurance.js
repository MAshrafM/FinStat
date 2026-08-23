// backend/routes/socialInsurance.js
const express = require('express');
const router = express.Router();
const SocialInsurance = require('../models/SocialInsurance');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { createSchema } = require('../validationSchemas/insuranceSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');

// @route   GET api/social-insurance
// @desc    Get all active social insurance records
router.get('/', auth, asyncHandler(async (req, res) => {
  const records = await SocialInsurance.find({ user: req.effectiveUserId, deletedAt: null }).sort({ year: -1 });
  res.json(records);
}));

// @route   POST api/social-insurance
// @desc    Create or update a social insurance record for a year
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { year, registeredIncome } = getValidated(req, 'body');
  const record = await SocialInsurance.findOneAndUpdate(
    { year: year, user: req.effectiveUserId },
    {
      $set: {
        registeredIncome: registeredIncome,
        registeredIncomeInPiastres: toPiastres(registeredIncome),
        user: req.effectiveUserId,
        deletedAt: null,
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(record);
}));

// @route   DELETE api/social-insurance/:year
// @desc    Soft delete a social insurance record by year
router.delete('/:year', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const record = await SocialInsurance.findOne({ year: Number(req.params.year), user: req.effectiveUserId, deletedAt: null });
  if (!record) {
    throw new NotFoundError('Social insurance record not found');
  }
  await record.softDelete();
  res.json({ msg: 'Social insurance record deleted successfully' });
}));

// @route   POST api/social-insurance/:year/restore
// @desc    Restore a soft-deleted social insurance record
router.post('/:year/restore', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const record = await SocialInsurance.findOne({ year: Number(req.params.year), user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!record) {
    throw new NotFoundError('Soft-deleted social insurance record not found');
  }
  await record.restore();
  res.json({ msg: 'Social insurance record restored successfully', record });
}));

module.exports = router;
