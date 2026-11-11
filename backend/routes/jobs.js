// backend/routes/jobs.js
const express = require('express');
const router = express.Router();
const cronAuth = require('../middleware/cronAuth');
const asyncHandler = require('../utils/asyncHandler');
const { runDailyForexRevaluation } = require('../jobs/forexRevaluationJob');
const { runDailyMaintenance } = require('../jobs/dailyMaintenanceJob');

// @route   GET api/jobs/daily-maintenance
// @desc    Trigger combined 02:00 AM daily maintenance (recurring detection + certificate payouts) (Vercel Cron)
// @access  Cron Authenticated (x-cron-secret or Authorization: Bearer <secret>)
router.get('/daily-maintenance', cronAuth, asyncHandler(async (req, res) => {
  const result = await runDailyMaintenance();
  res.json({
    success: true,
    message: 'Daily maintenance completed successfully',
    ...result,
  });
}));

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
