// backend/routes/portfolio.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { ForbiddenError } = require('../utils/errors');
const { getValidated } = require('../utils/requestHelpers');
const portfolioService = require('../utils/portfolioService');
const RebalancingTarget = require('../models/RebalancingTarget');
const rebalancingEngine = require('../utils/rebalancingEngine');
const { updateTargetSchema } = require('../validationSchemas/rebalancingSchemas');

// @route   GET api/portfolio/summary
// @desc    Get top-level investment portfolio summary, total valuation, ROI, and XIRR
router.get('/summary', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const summaryOptions = { forceRefresh };
  if (req.query.costBasisMethod) {
    summaryOptions.costBasisMethod = req.query.costBasisMethod;
  }
  const summary = await portfolioService.getPortfolioSummary(req.effectiveUserId, summaryOptions);
  res.json(summary);
}));

// @route   GET api/portfolio/holdings
// @desc    Get normalized holdings across all asset classes with prices, status badges, and P&L
router.get('/holdings', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const { assetType, category, search, costBasisMethod } = req.query;
  const holdingsOptions = { forceRefresh };
  if (costBasisMethod) {
    holdingsOptions.costBasisMethod = costBasisMethod;
  }

  let holdings = await portfolioService.getAllHoldings(req.effectiveUserId, holdingsOptions);

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
  const allocOptions = { forceRefresh };
  if (req.query.costBasisMethod) {
    allocOptions.costBasisMethod = req.query.costBasisMethod;
  }
  const holdings = await portfolioService.getAllHoldings(req.effectiveUserId, allocOptions);
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

// @route   GET api/portfolio/rebalancing
// @desc    Get current allocation against user target and rebalancing trade suggestions
router.get('/rebalancing', auth, asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';

  let target = await RebalancingTarget.findOne({
    user: req.effectiveUserId,
    isActive: true,
  });

  // Default target if none set
  if (!target) {
    target = {
      name: 'Default Target',
      targets: [
        { assetType: 'stocks', percentage: 40 },
        { assetType: 'gold', percentage: 20 },
        { assetType: 'mutualFunds', percentage: 20 },
        { assetType: 'cash', percentage: 10 },
        { assetType: 'certificates', percentage: 10 },
      ],
      excludeRealEstate: true,
      isActive: true,
    };
  }

  const currentAllocation = await rebalancingEngine.getCurrentAllocation(
    req.effectiveUserId,
    target,
    { forceRefresh }
  );

  const suggestionResult = rebalancingEngine.generateRebalancingSuggestions(
    currentAllocation,
    target
  );

  res.json({
    totalPortfolioValue: suggestionResult.totalPortfolioValue,
    totalPortfolioValueInPiastres: suggestionResult.totalPortfolioValueInPiastres,
    excludeRealEstate: currentAllocation.excludeRealEstate,
    target,
    allocations: suggestionResult.allocations,
    suggestions: suggestionResult.suggestions,
  });
}));

// @route   PUT api/portfolio/rebalancing/target
// @desc    Create or update user's rebalancing target allocation
router.put('/rebalancing/target', auth, validate({ body: updateTargetSchema }), asyncHandler(async (req, res) => {
  if (!req.canModify) {
    throw new ForbiddenError('Viewers have read-only access');
  }

  const validatedBody = getValidated(req, 'body');

  let target = await RebalancingTarget.findOne({
    user: req.effectiveUserId,
    isActive: true,
  });

  if (!target) {
    target = new RebalancingTarget({
      user: req.effectiveUserId,
      ...validatedBody,
    });
  } else {
    target.name = validatedBody.name || target.name;
    target.targets = validatedBody.targets;
    if (validatedBody.excludeRealEstate !== undefined) {
      target.excludeRealEstate = validatedBody.excludeRealEstate;
    }
    if (validatedBody.isActive !== undefined) {
      target.isActive = validatedBody.isActive;
    }
  }

  await target.save();
  portfolioService.invalidatePortfolioCache(req.effectiveUserId);

  res.json({
    success: true,
    message: 'Rebalancing target updated successfully',
    target,
  });
}));

module.exports = router;
