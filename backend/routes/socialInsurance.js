// backend/routes/socialInsurance.js
const express = require('express');
const router = express.Router();
const SocialInsurance = require('../models/SocialInsurance');
const auth = require('../middleware/auth');

// @route   GET api/social-insurance
// @desc    Get all social insurance records
router.get('/', auth, async (req, res) => {
  try {
    // Sort by year descending
    const records = await SocialInsurance.find({ user: req.user.id }).sort({ year: -1 });
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/social-insurance
// @desc    Create or update a social insurance record for a year
router.post('/', auth, async (req, res) => {
  const { year, registeredIncome } = req.body;
  try {
    // Use findOneAndUpdate with 'upsert: true' to either update an existing year or create a new one.
    const record = await SocialInsurance.findOneAndUpdate(
      { year: year },
      { $set: { registeredIncome: registeredIncome } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(record);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
