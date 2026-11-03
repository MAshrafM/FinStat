// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateComprehensiveReport } = require('../services/comprehensiveReportService');
const { generateTaxSummaryReport } = require('../services/taxSummaryReportService');

// @route   GET /api/reports/comprehensive
// @desc    Generate consolidated multi-module financial report for date range
// @access  Private
router.get('/comprehensive', auth, async (req, res) => {
  try {
    const userId = req.effectiveUserId || req.user.id;
    const { startYear, endYear } = req.query;

    const report = await generateComprehensiveReport(userId, {
      startYear,
      endYear,
    });

    res.json(report);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error generating comprehensive financial report:', err);
    res.status(500).json({ error: 'Server error generating comprehensive report' });
  }
});

// @route   GET /api/reports/tax-summary
// @desc    Generate annual statutory Egyptian tax summary report
// @access  Private
router.get('/tax-summary', auth, async (req, res) => {
  try {
    const userId = req.effectiveUserId || req.user.id;
    const { year } = req.query;

    const taxReport = await generateTaxSummaryReport(userId, year);

    res.json(taxReport);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error generating statutory tax summary report:', err);
    res.status(500).json({ error: 'Server error generating statutory tax report' });
  }
});

module.exports = router;
