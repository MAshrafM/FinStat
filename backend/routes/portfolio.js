// backend/routes/portfolio.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const portfolioService = require('../utils/portfolioService');

// @route   GET api/portfolio/summary
// @desc    Get top-level investment portfolio summary, total valuation, ROI, and XIRR
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const summary = await portfolioService.getPortfolioSummary(req.effectiveUserId, { forceRefresh });
  res.json(summary);
}));

// @route   GET api/portfolio/holdings
// @desc    Get normalized holdings across all asset classes with prices, status badges, and P&L
router.get('/holdings', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const { assetType, category, search } = req.query;

  let holdings = await portfolioService.getAllHoldings(req.effectiveUserId, { forceRefresh });

  // Optional Filtering
  if (assetType && assetType !== 'All') {
    holdings = holdings.filter((h) => h.assetType.toLowerCase() === assetType.toLowerCase());
  }

  if (category && category !== 'All') {
    holdings = holdings.filter((h) => h.category.toLowerCase() === category.toLowerCase());
  }

  if (search && search.trim() !== '') {
    const term = search.trim().toLowerCase();
    holdings = holdings.filter(
      (h) =>
        (h.name && h.name.toLowerCase().includes(term)) ||
        (h.symbol && h.symbol.toLowerCase().includes(term)) ||
        (h.assetType && h.assetType.toLowerCase().includes(term))
    );
  }

  res.json({
    data: holdings,
    totalCount: holdings.length,
  });
}));

// @route   GET api/portfolio/allocation
// @desc    Get asset allocation breakdown (invested capital vs current market valuation)
router.get('/allocation', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const holdings = await portfolioService.getAllHoldings(req.effectiveUserId, { forceRefresh });
  const stockTopUps = await portfolioService.getStockNetTopUps(req.effectiveUserId);
  const allocationData = portfolioService.calculateAssetAllocation(holdings, { stockTopUps });
  res.json(allocationData);
}));

// @route   POST api/portfolio/clear-cache
// @desc    Clear portfolio cache for the user
router.post('/clear-cache', auth, asyncHandler(async (req, res) => {
  portfolioService.invalidatePortfolioCache(req.effectiveUserId);
  res.json({ msg: 'Portfolio cache cleared successfully' });
}));

module.exports = router;
