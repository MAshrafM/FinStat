// backend/routes/taxBrackets.js
const express = require('express');
const router = express.Router();
const TaxBracket = require('../models/TaxBracket');
const auth = require('../middleware/auth');

// The initial set of tax brackets if none exist in the DB
const initialBrackets = [
  { level: 1, from: 0, to: 30000, rate: 0 },
  { level: 2, from: 30000, to: 45000, rate: 0.10 },
  { level: 3, from: 45000, to: 60000, rate: 0.15 },
  { level: 4, from: 60000, to: 200000, rate: 0.20 },
  { level: 5, from: 200000, to: 400000, rate: 0.225 },
  { level: 6, from: 400000, to: 600000, rate: 0.25 },
];

// @route   GET api/tax-brackets
// @desc    Get the current tax brackets. If none exist, create and return them.
router.get('/', auth, async (req, res) => {
  try {
    let taxInfo = await TaxBracket.findOne({ identifier: 'singleton' });

    if (!taxInfo) {
      // If no document exists, create one with the initial data
      taxInfo = new TaxBracket({ brackets: initialBrackets });
      await taxInfo.save();
    }
    res.json(taxInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tax-brackets
// @desc    Update the entire set of tax brackets
router.put('/', auth, async (req, res) => {
  try {
    const { brackets } = req.body; // Expecting an array of bracket objects

    const updatedTaxInfo = await TaxBracket.findOneAndUpdate(
      { identifier: 'singleton' },
      { $set: { brackets: brackets, lastUpdated: new Date() } },
      { new: true, upsert: true } // 'upsert' will create it if it doesn't exist
    );
    res.json(updatedTaxInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
