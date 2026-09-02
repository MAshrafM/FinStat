// backend/routes/salaryProfiles.js
const express = require('express');
const router = express.Router();
const SalaryProfile = require('../models/SalaryProfile');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const {
  createSalaryProfileSchema,
  updateSalaryProfileSchema,
  profileParamsSchema,
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

const enrichProfile = (profile) => {
  if (!profile) return null;
  const pObj = profile.toObject ? profile.toObject() : { ...profile };
  pObj.currentSalary = profile.getCurrentSalary
    ? profile.getCurrentSalary()
    : (pObj.salaryHistory && pObj.salaryHistory.length > 0 ? pObj.salaryHistory[0] : null);
  pObj.monthlyGrossEstimate = profile.getMonthlyGrossEstimate ? profile.getMonthlyGrossEstimate() : 0;
  return pObj;
};

// @route   GET /api/salary-profiles (or /api/salary-profile)
// @desc    Get salary profile(s) for the current user
router.get('/', auth, asyncHandler(async (req, res) => {
  const profiles = await SalaryProfile.find({
    user: req.effectiveUserId,
    deletedAt: null,
  }).sort({ isDefault: -1, createdAt: -1 });

  if (profiles.length === 0) {
    if (req.baseUrl === '/api/salary-profile') {
      return res.json(null);
    }
    return res.json({
      success: true,
      profiles: [],
      mainProfile: null,
    });
  }

  const enrichedProfiles = profiles.map(enrichProfile);
  const mainProfile = enrichedProfiles.find(p => p.isDefault) || enrichedProfiles[0];

  // If accessed from single-profile endpoint /api/salary-profile, return the main profile object directly
  // while also attaching profiles list for backward compatibility
  if (req.baseUrl === '/api/salary-profile') {
    return res.json({
      ...mainProfile,
      profiles: enrichedProfiles,
      mainProfile,
      success: true,
    });
  }

  res.json({
    success: true,
    profiles: enrichedProfiles,
    mainProfile,
  });
}));

// @route   POST /api/salary-profiles (or /api/salary-profile)
// @desc    Create new profile or update salary profile with history
router.post(
  '/',
  auth,
  validate({ body: createSalaryProfileSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const data = getValidated(req, 'body');

    // Check if this is a legacy salary update (contains salaryDetails)
    if (data.salaryDetails) {
      const processedDetails = mapSalaryDetailsWithPiastres(data.salaryDetails);
      let profile = await SalaryProfile.findOne({
        user: req.effectiveUserId,
        deletedAt: null,
      }).sort({ isDefault: -1, createdAt: -1 });

      if (profile) {
        if (data.name) profile.name = data.name;
        if (data.title) profile.title = data.title;
        if (data.position) profile.position = data.position;
        if (data.year) profile.year = data.year;
        if (data.components) profile.components = data.components;
        profile.salaryHistory.unshift(processedDetails);
        const saved = await profile.save();
        return res.json(enrichProfile(saved));
      }
    }

    // Standard profile creation
    if (data.isDefault) {
      await SalaryProfile.updateMany(
        { user: req.effectiveUserId },
        { $set: { isDefault: false } }
      );
    } else {
      const count = await SalaryProfile.countDocuments({
        user: req.effectiveUserId,
        deletedAt: null,
      });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    const processedDetails = data.salaryDetails ? mapSalaryDetailsWithPiastres(data.salaryDetails) : null;
    const newProfile = new SalaryProfile({
      ...data,
      salaryHistory: processedDetails ? [processedDetails] : [],
      user: req.effectiveUserId,
    });

    const savedProfile = await newProfile.save();
    const enriched = enrichProfile(savedProfile);

    if (req.baseUrl === '/api/salary-profile') {
      return res.status(200).json(enriched);
    }

    res.status(201).json({
      success: true,
      message: 'Salary profile created successfully',
      profile: enriched,
    });
  })
);

// @route   PUT /api/salary-profile
// @desc    Update main details of the user's primary salary profile (legacy support)
router.put('/', auth, validate({ body: updateSalaryProfileSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const validatedBody = getValidated(req, 'body');

  let profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null }).sort({ isDefault: -1, createdAt: -1 });
  if (!profile) {
    throw new NotFoundError('Profile not found. Cannot update.');
  }

  if (validatedBody.name !== undefined) profile.name = validatedBody.name;
  if (validatedBody.title !== undefined) profile.title = validatedBody.title;
  if (validatedBody.position !== undefined) profile.position = validatedBody.position;
  if (validatedBody.year !== undefined) profile.year = validatedBody.year;
  if (validatedBody.components !== undefined) profile.components = validatedBody.components;

  const savedProfile = await profile.save();
  res.json(enrichProfile(savedProfile));
}));

// @route   PUT /api/salary-profile/history/:historyId (or /api/salary-profiles/history/:historyId)
// @desc    Update a specific record in the salary history
router.put('/history/:historyId', auth, validate({ params: historyParamsSchema, body: updateHistorySchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { historyId } = getValidated(req, 'params');
  const updatedRecordData = getValidated(req, 'body');

  const profile = await SalaryProfile.findOne({
    user: req.effectiveUserId,
    'salaryHistory._id': historyId,
    deletedAt: null,
  }) || await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });

  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const historyRecord = profile.salaryHistory.id(historyId);
  if (!historyRecord) {
    throw new NotFoundError('History record not found');
  }

  const processedData = mapSalaryDetailsWithPiastres(updatedRecordData);
  historyRecord.set(processedData);
  const saved = await profile.save();
  res.json(enrichProfile(saved));
}));

// @route   DELETE /api/salary-profile/history/:historyId (or /api/salary-profiles/history/:historyId)
// @desc    Delete a specific record from the salary history
router.delete('/history/:historyId', auth, validate({ params: historyParamsSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { historyId } = getValidated(req, 'params');

  const profile = await SalaryProfile.findOne({
    user: req.effectiveUserId,
    'salaryHistory._id': historyId,
    deletedAt: null,
  }) || await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });

  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  const removeIndex = profile.salaryHistory.map(item => item.id).indexOf(historyId);
  if (removeIndex === -1) {
    throw new NotFoundError('History record not found');
  }

  profile.salaryHistory.splice(removeIndex, 1);
  const saved = await profile.save();
  res.json(enrichProfile(saved));
}));

// @route   DELETE /api/salary-profile (Legacy delete)
router.delete('/', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: null });
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }
  await profile.softDelete();
  res.json({ msg: 'Salary profile deleted successfully', success: true });
}));

// @route   POST /api/salary-profile/restore (Legacy restore)
router.post('/restore', auth, asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const profile = await SalaryProfile.findOne({ user: req.effectiveUserId, deletedAt: { $ne: null } });
  if (!profile) {
    throw new NotFoundError('Soft-deleted profile not found');
  }
  await profile.restore();
  res.json({ msg: 'Salary profile restored successfully', profile: enrichProfile(profile), success: true });
}));

// @route   GET /api/salary-profiles/:id
// @desc    Get a specific salary profile by ID
router.get(
  '/:id',
  auth,
  validate({ params: profileParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params');
    const profile = await SalaryProfile.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!profile) {
      throw new NotFoundError('Salary profile not found');
    }

    res.json({
      success: true,
      profile: enrichProfile(profile),
    });
  })
);

// @route   PUT /api/salary-profiles/:id
// @desc    Update a salary profile by ID
router.put(
  '/:id',
  auth,
  validate({ params: profileParamsSchema, body: updateSalaryProfileSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');
    const updateData = getValidated(req, 'body');

    const profile = await SalaryProfile.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!profile) {
      throw new NotFoundError('Salary profile not found');
    }

    if (updateData.isDefault) {
      await SalaryProfile.updateMany(
        { user: req.effectiveUserId, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    Object.assign(profile, updateData);
    const updatedProfile = await profile.save();

    res.json({
      success: true,
      message: 'Salary profile updated successfully',
      profile: enrichProfile(updatedProfile),
    });
  })
);

// @route   DELETE /api/salary-profiles/:id
// @desc    Soft delete a salary profile by ID
router.delete(
  '/:id',
  auth,
  validate({ params: profileParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const profile = await SalaryProfile.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!profile) {
      throw new NotFoundError('Salary profile not found');
    }

    await profile.softDelete();

    if (profile.isDefault) {
      const nextProfile = await SalaryProfile.findOne({
        user: req.effectiveUserId,
        deletedAt: null,
      }).sort({ createdAt: -1 });
      if (nextProfile) {
        nextProfile.isDefault = true;
        await nextProfile.save();
      }
    }

    res.json({
      success: true,
      message: 'Salary profile deleted successfully',
    });
  })
);

// @route   POST /api/salary-profiles/:id/set-default
// @desc    Set a profile as the default profile
router.post(
  '/:id/set-default',
  auth,
  validate({ params: profileParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const profile = await SalaryProfile.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: null,
    });

    if (!profile) {
      throw new NotFoundError('Salary profile not found');
    }

    await SalaryProfile.updateMany(
      { user: req.effectiveUserId },
      { $set: { isDefault: false } }
    );

    profile.isDefault = true;
    await profile.save();

    res.json({
      success: true,
      message: 'Default salary profile updated',
      profile: enrichProfile(profile),
    });
  })
);

// @route   POST /api/salary-profiles/:id/restore
// @desc    Restore a soft-deleted salary profile
router.post(
  '/:id/restore',
  auth,
  validate({ params: profileParamsSchema }),
  asyncHandler(async (req, res) => {
    if (!req.canModify) {
      throw new ForbiddenError('Viewers have read-only access');
    }
    const { id } = getValidated(req, 'params');

    const profile = await SalaryProfile.findOne({
      _id: id,
      user: req.effectiveUserId,
      deletedAt: { $ne: null },
    });

    if (!profile) {
      throw new NotFoundError('Soft-deleted salary profile not found');
    }

    await profile.restore();
    res.json({
      success: true,
      message: 'Salary profile restored successfully',
      profile: enrichProfile(profile),
    });
  })
);

module.exports = router;