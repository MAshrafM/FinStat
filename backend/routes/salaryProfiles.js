// backend/routes/salaryProfiles.js
const express = require('express');
const router = express.Router();
const SalaryProfile = require('../models/SalaryProfile');
const auth = require('../middleware/auth');

// @route   GET api/salary-profile
// @desc    Get the single salary profile. If it doesn't exist, it can be created by the client.
router.get('/', auth, async (req, res) => {
  try {
    // Find the one and only profile.
    const profile = await SalaryProfile.findOne({ user: req.user.id });
    res.json(profile); // Will return the profile or null if it doesn't exist
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/salary-profile
// @desc    Update the main details of the single salary profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, title, position, year } = req.body;

    let profile = await SalaryProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found. Cannot update.' });
    }

    // Update the fields from the request body
    profile.name = name || profile.name;
    profile.title = title || profile.title;
    profile.position = position || profile.position;
    profile.year = year || profile.year;
    const savedProfile = await profile.save();
    res.json(savedProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/salary-profile
// @desc    Create or update the single salary profile.
router.post('/', auth, async (req, res) => {
  try {
    const { name, title, position, year, salaryDetails } = req.body;

    // Try to find the existing profile.
    let profile = await SalaryProfile.findOne({ user: req.user.id });

    if (profile) {
      // --- UPDATE EXISTING PROFILE ---
      // Update main details
      profile.name = name;
      profile.title = title;
      profile.position = position;
      profile.year = year;
      
      // Add new salary details to the history
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
      });
    }

    const savedProfile = await profile.save();
    res.json(savedProfile);
  } catch (err)
  {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/salary-profile/history/:historyId
// @desc    Update a specific record in the salary history
router.put('/history/:historyId', auth, async (req, res) => {
  try {
    const { historyId } = req.params;
    const updatedRecordData = req.body;

    const profile = await SalaryProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Find the specific history record by its _id
    const historyRecord = profile.salaryHistory.id(historyId);
    if (!historyRecord) {
      return res.status(404).json({ msg: 'History record not found' });
    }

    // Update the fields of the found sub-document
    historyRecord.set(updatedRecordData);

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
     }
});


// @route   DELETE /api/salary-profile/history/:historyId
// @desc    Delete a specific record from the salary history
router.delete('/history/:historyId', auth, async (req, res) => {
  try {
    const { historyId } = req.params;

    const profile = await SalaryProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    // Find the index of the history record to remove
    const removeIndex = profile.salaryHistory.map(item => item.id).indexOf(historyId);
    if (removeIndex === -1) {
      return res.status(404).json({ msg: 'History record not found' });
    }

    // Pull the item from the array
    profile.salaryHistory.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;