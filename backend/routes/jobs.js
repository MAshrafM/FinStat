// backend/routes/jobs.js
const express = require('express');
const router = express.Router();
const cronAuth = require('../middleware/cronAuth');
const asyncHandler = require('../utils/asyncHandler');
const { runDailyForexRevaluation } = require('../jobs/forexRevaluationJob');

// @route   GET api/jobs/forex-revaluation
// @desc    Trigger automated forex revaluation for all users (Vercel Cron)
// @access  Cron Authenticated (x-cron-secret or Authorization: Bearer <secret>)
router.get('/forex-revaluation', cronAuth, asyncHandler(async (req, res) => {
  const result = await runDailyForexRevaluation();
  res.json({
    success: true,
    message: 'Forex revaluation completed successfully',
    ...result,
  });
}));

module.exports = router;
