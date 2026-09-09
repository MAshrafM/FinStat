// backend/utils/rebalancingEngine.js
const { toPiastres, fromPiastres } = require('./currencyUtils');
const portfolioService = require('./portfolioService');
const RebalancingTarget = require('../models/RebalancingTarget');

const ASSET_TYPE_CATEGORIES = ['stocks', 'mutualFunds', 'gold', 'cash', 'certificates'];

/**
 * Maps FinStat holding assetTypes to standardized rebalancing asset categories.
 */
function mapHoldingToRebalancingCategory(assetType) {
  switch ((assetType || '').toLowerCase()) {
    case 'stock':
    case 'stocks':
    case 'equities':
      return 'stocks';
    case 'mutual fund':
    case 'mutual funds':
    case 'mutualfunds':
      return 'mutualFunds';
    case 'gold':
    case 'precious metals':
      return 'gold';
    case 'currency':
    case 'cash':
    case 'foreign exchange':
      return 'cash';
    case 'certificate':
    case 'certificates':
    case 'fixed income':
      return 'certificates';
    case 'real estate':
      return 'realEstate';
    default:
      return 'other';
  }
}

/**
 * Fetches current asset allocation grouped into standard rebalancing categories.
 * 
 * @param {String} userId
 * @param {Object} target - Target settings (e.g. { excludeRealEstate: true })
 * @param {Object} options - { forceRefresh }
 * @returns {Promise<Object>} Current allocation breakdown
 */
async function getCurrentAllocation(userId, target = {}, { forceRefresh = false } = {}) {
  const excludeRealEstate = target.excludeRealEstate !== false;
  const holdings = await portfolioService.getAllHoldings(userId, { forceRefresh });

  const categoryTotals = {
    stocks: 0,
    mutualFunds: 0,
    gold: 0,
    cash: 0,
    certificates: 0,
    realEstate: 0,
  };

  for (const h of holdings) {
    const cat = mapHoldingToRebalancingCategory(h.assetType);
    const val = Number(h.currentValue || 0);

    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += val;
    }
  }

  // Also include uninvested broker wallet cash if available
  try {
    const stockTopUps = await portfolioService.getStockNetTopUps(userId);
    const stockInvested = categoryTotals.stocks;
    const uninvestedCash = Math.max(0, stockTopUps - stockInvested);
    categoryTotals.cash += uninvestedCash;
  } catch (err) {
    // Non-fatal, proceed with holdings cash
  }

  // Determine total portfolio value considering exclusion
  let totalPortfolioValue = 0;
  for (const key of ASSET_TYPE_CATEGORIES) {
    totalPortfolioValue += categoryTotals[key];
  }

  if (!excludeRealEstate) {
    totalPortfolioValue += categoryTotals.realEstate;
  }

  const allocations = ASSET_TYPE_CATEGORIES.map((cat) => {
    const currentValue = Number(categoryTotals[cat].toFixed(2));
    const currentPercentage = totalPortfolioValue > 0
      ? Number(((currentValue / totalPortfolioValue) * 100).toFixed(2))
      : 0;

    return {
      assetType: cat,
      currentValue,
      currentValueInPiastres: toPiastres(currentValue),
      currentPercentage,
    };
  });

  return {
    totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
    totalPortfolioValueInPiastres: toPiastres(totalPortfolioValue),
    excludeRealEstate,
    allocations,
    rawCategoryTotals: categoryTotals,
  };
}

/**
 * Generates rebalancing buy/sell trade suggestions based on current vs target allocations.
 * 
 * @param {Object} currentAllocationData - Result from getCurrentAllocation
 * @param {Object} target - Target document or object { targets: [{ assetType, percentage }] }
 * @returns {Object} { totalPortfolioValue, suggestions, allocations }
 */
function generateRebalancingSuggestions(currentAllocationData, target = {}) {
  const { totalPortfolioValue, allocations = [] } = currentAllocationData;
  const targetMap = new Map();

  const targetList = Array.isArray(target?.targets) ? target.targets : [];
  for (const t of targetList) {
    targetMap.set(t.assetType, Number(t.percentage || 0));
  }

  const suggestions = [];
  const enrichedAllocations = [];

  for (const item of allocations) {
    const cat = item.assetType;
    const targetPct = targetMap.has(cat) ? targetMap.get(cat) : 0;
    const targetValue = Number(((totalPortfolioValue * targetPct) / 100).toFixed(2));
    const delta = Number((targetValue - item.currentValue).toFixed(2));

    let action = 'Hold';
    let description = '';

    if (delta > 1.0) {
      action = 'Buy';
      description = `Under-allocated by ${delta.toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP. Consider buying or depositing into ${cat}.`;
    } else if (delta < -1.0) {
      action = 'Sell';
      description = `Over-allocated by ${Math.abs(delta).toLocaleString(undefined, { minimumFractionDigits: 2 })} EGP. Consider trimming or reallocating from ${cat}.`;
    } else {
      action = 'Hold';
      description = `Allocation is within target tolerance.`;
    }

    const suggestion = {
      assetType: cat,
      action,
      amount: Math.abs(delta),
      amountInPiastres: toPiastres(Math.abs(delta)),
      currentValue: item.currentValue,
      targetValue,
      currentPercentage: item.currentPercentage,
      targetPercentage: targetPct,
      description,
    };

    suggestions.push(suggestion);
    enrichedAllocations.push({
      ...item,
      targetValue,
      targetPercentage: targetPct,
      delta,
      action,
    });
  }

  // Sort suggestions: Buys first, then Sells, then Holds
  suggestions.sort((a, b) => {
    const order = { Buy: 1, Sell: 2, Hold: 3 };
    return (order[a.action] || 4) - (order[b.action] || 4);
  });

  return {
    totalPortfolioValue,
    totalPortfolioValueInPiastres: toPiastres(totalPortfolioValue),
    allocations: enrichedAllocations,
    suggestions,
  };
}

module.exports = {
  getCurrentAllocation,
  generateRebalancingSuggestions,
  mapHoldingToRebalancingCategory,
  ASSET_TYPE_CATEGORIES,
};
