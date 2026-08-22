// backend/routes/salaryProfiles.js
const express = require('express');
const router = express.Router();
const SalaryProfile = require('../models/SalaryProfile');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const {
  createSchema,
  updateSchema,
  historyParamsSchema,
  updateHistorySchema,
} = require('../validationSchemas/salaryProfileSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/salary-profile
// @desc    Get the single salary profile. If it doesn't exist, it can be created by the client.
router.get('/', auth, asyncHandler(async (req, res) => {
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId });
  res.json(profile);
}));

// @route   PUT api/salary-profile
// @desc    Update the main details of the single salary profile
router.put('/', auth, validate({ body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  let profile = await SalaryProfile.findOne({ user: req.effectiveUserId });
  if (!profile) {
    throw new NotFoundError('Profile not found. Cannot update.');
  }

  if (validatedBody.name !== undefined) profile.name = validatedBody.name;
  if (validatedBody.title !== undefined) profile.title = validatedBody.title;
  if (validatedBody.position !== undefined) profile.position = validatedBody.position;
  if (validatedBody.year !== undefined) profile.year = validatedBody.year;

  const savedProfile = await profile.save();
  res.json(savedProfile);
}));

// @route   POST api/salary-profile
// @desc    Create or update the single salary profile.
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { name, title, position, year, salaryDetails } = getValidated(req, 'body');

  let profile = await SalaryProfile.findOne({ user: req.effectiveUserId });

  if (profile) {
    // --- UPDATE EXISTING PROFILE ---
    profile.name = name;
    profile.title = title;
    profile.position = position;
    profile.year = year;
    
    if (salaryDetails) {
      profile.salaryHistory.unshift(salaryDetails);
    }
  } else {
    // --- CREATE NEW PROFILE ---
    profile = new SalaryProfile({
      name,
      title,
      position,
      year,
      salaryHistory: salaryDetails ? [salaryDetails] : [],
      user: req.effectiveUserId,
    });
  }

  const savedProfile = await profile.save();
  res.json(savedProfile);
}));

// @route   PUT /api/salary-profile/history/:historyId
// @desc    Update a specific record in the salary history
router.put('/history/:historyId', auth, validate({ params: historyParamsSchema, body: updateHistorySchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { historyId } = getValidated(req, 'params');
  const updatedRecordData = getValidated(req, 'body');

  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const historyRecord = profile.salaryHistory.id(historyId);
  if (!historyRecord) {
    throw new NotFoundError('History record not found');
  }

  historyRecord.set(updatedRecordData);
  await profile.save();
  res.json(profile);
}));

// @route   DELETE /api/salary-profile/history/:historyId
// @desc    Delete a specific record from the salary history
router.delete('/history/:historyId', auth, validate({ params: historyParamsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { historyId } = getValidated(req, 'params');

  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const removeIndex = profile.salaryHistory.map(item => item.id).indexOf(historyId);
  if (removeIndex === -1) {
    throw new NotFoundError('History record not found');
  }

  profile.salaryHistory.splice(removeIndex, 1);
  await profile.save();
  res.json(profile);
}));

module.exports = router;
