// backend/routes/taxBrackets.js
const express = require('express');
const router = express.Router();
const TaxBracket = require('../models/TaxBracket');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ForbiddenError } = require('../utils/errors');
const { updateSchema } = require('../validationSchemas/taxSchemas');
const { getValidated } = require('../utils/requestHelpers');
const { toPiastres } = require('../utils/currencyUtils');

// The initial set of tax brackets if none exist in the Db
const initialBrackets = [
  { level: 1, from: 0, fromInPiastres: 0, to: 30000, toInPiastres: 3000000, rate: 0 },
  { level: 2, from: 30000, fromInPiastres: 3000000, to: 45000, toInPiastres: 4500000, rate: 0.10 },
  { level: 3, from: 45000, fromInPiastres: 4500000, to: 60000, toInPiastres: 6000000, rate: 0.15 },
  { level: 4, from: 60000, fromInPiastres: 6000000, to: 200000, toInPiastres: 20000000, rate: 0.20 },
  { level: 5, from: 200000, fromInPiastres: 20000000, to: 400000, toInPiastres: 40000000, rate: 0.225 },
  { level: 6, from: 400000, fromInPiastres: 40000000, to: 600000, toInPiastres: 60000000, rate: 0.25 },
];

const mapBracketsWithPiastres = (brackets) => {
  if (!Array.isArray(brackets)) return brackets;
  return brackets.map((b) => ({
    ...b,
    fromInPiastres: toPiastres(b.from),
    toInPiastres: toPiastres(b.to),
  }));
};

// @route   GET api/tax-brackets
// @desc    Get the current active tax brackets for the given or current year, or all active if all=true.
router.get('/', auth, asyncHandler(async (req, res) => {
  if (req.query.all === 'true') {
    const allActive = await TaxBracket.find({ isActive: true }).sort({ year: -1 });
    return res.json(allActive);
  }

  const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

  let taxInfo = await TaxBracket.findOne({ year: targetYear, isActive: true });

  if (!taxInfo) {
    taxInfo = await TaxBracket.findOne({ isActive: true }).sort({ year: -1 });
  }

  if (!taxInfo) {
    taxInfo = await TaxBracket.findOne({ identifier: 'singleton' });
  }

  if (!taxInfo) {
    taxInfo = new TaxBracket({
      country: 'Egypt',
      year: targetYear,
      personalExemption: 20000,
      isActive: true,
      brackets: initialBrackets,
    });
    await taxInfo.save();
  }

  res.json(taxInfo);
}));

// @route   PUT api/tax-brackets
// @desc    Update the entire set of tax brackets
router.put('/', auth, validate({ body: updateSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }
  const { brackets } = getValidated(req, 'body');
  const processedBrackets = mapBracketsWithPiastres(brackets);

  const updatedTaxInfo = await TaxBracket.findOneAndUpdate(
    { identifier: 'singleton' },
    { $set: { brackets: processedBrackets, lastUpdated: new Date() } },
    { new: true, upsert: true }
  );
  res.json(updatedTaxInfo);
}));

module.exports = router;
