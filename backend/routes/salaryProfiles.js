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
const { toPiastres } = require('../utils/currencyUtils');

const mapSalaryDetailsWithPiastres = (details) => {
  if (!details) return details;
  return {
    ...details,
    basicSalaryInPiastres: toPiastres(details.basicSalary),
    basicProductionInPiastres: toPiastres(details.basicProduction),
    prepaidInPiastres: toPiastres(details.prepaid),
    variablesInPiastres: toPiastres(details.variables),
    environmentInPiastres: toPiastres(details.environment),
    mealInPiastres: toPiastres(details.meal),
    shiftInPiastres: toPiastres(details.shift),
    supervisingInPiastres: toPiastres(details.supervising),
    othersInPiastres: toPiastres(details.others),
    bondsInPiastres: toPiastres(details.bonds),
  };
};

// @route   GET api/salary-profile
// @desc    Get the single active salary profile
router.get('/', auth, asyncHandler(async (req, res) => {
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
  if (!profile) {
    return res.json(null);
  }

  const profileObj = profile.toObject();
  const currentSalary = profile.getCurrentSalary();
  profileObj.currentSalary = currentSalary ? (currentSalary.toObject ? currentSalary.toObject() : currentSalary) : null;

  if (profileObj.currentSalary) {
    const cs = profileObj.currentSalary;
    const gross =
      (cs.basicSalary || 0) +
      (cs.basicProduction || 0) +
      (cs.variables || 0) +
      (cs.environment || 0) +
      (cs.meal || 0) +
      (cs.shift || 0) +
      (cs.supervising || 0) +
      (cs.others || 0);
    profileObj.monthlyGrossEstimate = gross;
  }

  res.json(profileObj);
}));

// @route   PUT api/salary-profile
// @desc    Update the main details of the single salary profile
router.put('/', auth, validate({ body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  let profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
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
// @desc    Create or update the single salary profile
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { name, title, position, year, salaryDetails } = getValidated(req, 'body');

  let profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
  const processedDetails = salaryDetails ? mapSalaryDetailsWithPiastres(salaryDetails) : null;

  if (profile) {
    profile.name = name;
    profile.title = title;
    profile.position = position;
    profile.year = year;
    
    if (processedDetails) {
      profile.salaryHistory.unshift(processedDetails);
    }
  } else {
    profile = new SalaryProfile({
      name,
      title,
      position,
      year,
      salaryHistory: processedDetails ? [processedDetails] : [],
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

  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const historyRecord = profile.salaryHistory.id(historyId);
  if (!historyRecord) {
    throw new NotFoundError('History record not found');
  }

  const processedData = mapSalaryDetailsWithPiastres(updatedRecordData);
  historyRecord.set(processedData);
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

  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
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

// @route   DELETE api/salary-profile
// @desc    Soft delete salary profile
router.delete('/', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  await profile.softDelete();
  res.json({ msg: 'Salary profile deleted successfully' });
}));

// @route   POST api/salary-profile/restore
// @desc    Restore a soft-deleted salary profile
router.post('/restore', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!profile) {
    throw new NotFoundError('Soft-deleted profile not found');
  }
  await profile.restore();
  res.json({ msg: 'Salary profile restored successfully', profile });
}));

module.exports = router;