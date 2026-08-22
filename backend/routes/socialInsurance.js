// backend/routes/socialInsurance.js
const express = require('express');
const router = express.Router();
const SocialInsurance = require('../models/SocialInsurance');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { createSchema } = require('../validationSchemas/insuranceSchemas');
const { getValidated } = require('../utils/requestHelpers');

// @route   GET api/social-insurance
// @desc    Get all social insurance records
router.get('/', auth, asyncHandler(async (req, res) => {
  const records = await SocialInsurance.find({ user: req.user.id }).sort({ year: -1 });
  res.json(records);
}));

// @route   POST api/social-insurance
// @desc    Create or update a social insurance record for a year
router.post('/', auth, validate({ body: createSchema }), asyncHandler(async (req, res) => {
  const { year, registeredIncome } = getValidated(req, 'body');
  const record = await SocialInsurance.findOneAndUpdate(
    { year: year, user: req.user.id },
    { $set: { registeredIncome: registeredIncome, user: req.user.id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(record);
}));

module.exports = router;


