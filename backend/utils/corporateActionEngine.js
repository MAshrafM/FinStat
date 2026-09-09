// backend/utils/corporateActionEngine.js
const CorporateAction = require('../models/CorporateAction');
const Trade = require('../models/Trade');
const { toPiastres } = require('./currencyUtils');

/**
 * Clones a trade object and preserves all necessary properties without mutating the original.
 */
function cloneTrade(trade) {
  const obj = trade.toObject ? trade.toObject() : { ...trade };
  return {
    ...obj,
    date: new Date(obj.date),
    shares: Number(obj.shares || 0),
    price: Number(obj.price || 0),
    fees: Number(obj.fees || 0),
    totalValue: Number(obj.totalValue || 0),
    priceInPiastres: Number(obj.priceInPiastres || 0),
    feesInPiastres: Number(obj.feesInPiastres || 0),
    totalValueInPiastres: Number(obj.totalValueInPiastres || 0),
    iteration: obj.iteration,
  };
}

/**
 * Applies corporate actions (splits and bonus issues) to a list of trades on-the-fly.
 * 
 * Order of operations:
 * 1. Sorts trades chronologically by date.
 * 2. Applies relevant corporate actions that took effect AFTER each trade occurred.
 * 3. Returns the adjusted list of trades ready for downstream aggregation & iteration grouping.
 * 
 * @param {Array} trades - Raw trades from DB
 * @param {Array} corporateActions - Array of CorporateAction records
 * @returns {Array} Adjusted trade records (clones)
 */
function applyCorporateActions(trades = [], corporateActions = []) {
  if (!Array.isArray(trades) || trades.length === 0) return [];
  if (!Array.isArray(corporateActions) || corporateActions.length === 0) {
    return trades.map(cloneTrade);
  }

  // Sort trades chronologically
  const sortedTrades = trades.map(cloneTrade).sort((a, b) => a.date - b.date);

  // Sort corporate actions chronologically by effective date
  const sortedActions = [...corporateActions].sort(
    (a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate)
  );

  for (const action of sortedActions) {
    const actionStock = (action.stockCode || '').toUpperCase().trim();
    const actionBroker = action.broker;
    const actionEffectiveDate = new Date(action.effectiveDate);
    const type = action.type; // 'split' or 'bonus'
    const ratio = Number(action.ratio || 1);

    if (ratio <= 0) continue;

    for (const trade of sortedTrades) {
      const tradeStock = (trade.stockCode || '').toUpperCase().trim();
      const tradeBroker = trade.broker;
      const tradeDate = new Date(trade.date);

      // Match stock, broker, and verify that the trade occurred BEFORE the corporate action effective date
      if (
        tradeStock === actionStock &&
        tradeBroker === actionBroker &&
        tradeDate < actionEffectiveDate &&
        ['Buy', 'Sell', 'Dividend'].includes(trade.type)
      ) {
        if (type === 'split') {
          // In a 2:1 split (ratio = 2), shares are multiplied by 2, price is divided by 2
          trade.shares = Number((trade.shares * ratio).toFixed(4));
          if (trade.price > 0) {
            trade.price = Number((trade.price / ratio).toFixed(4));
            trade.priceInPiastres = toPiastres(trade.price);
          }
        } else if (type === 'bonus') {
          // In a 10% bonus issue (ratio = 0.10), shares multiply by (1 + 0.10) = 1.10
          const multiplier = 1 + ratio;
          trade.shares = Number((trade.shares * multiplier).toFixed(4));
          if (trade.price > 0) {
            trade.price = Number((trade.price / multiplier).toFixed(4));
            trade.priceInPiastres = toPiastres(trade.price);
          }
        }
        // Total cash values (totalValue, fees) remain unchanged as no cash changed hands
      }
    }
  }

  return sortedTrades;
}

/**
 * Creates a corporate action and optionally logs an audit Split trade.
 * Invalidates portfolio cache immediately.
 * 
 * @param {String} userId
 * @param {Object} payload - { stockCode, broker, type, ratio, effectiveDate, notes, logTrade }
 * @returns {Promise<Object>} { corporateAction, trade }
 */
async function createSplitWizard(userId, {
  stockCode,
  broker,
  type = 'split',
  ratio,
  effectiveDate,
  notes = '',
  logTrade = true,
}) {
  const normStockCode = (stockCode || '').toUpperCase().trim();
  const effDate = new Date(effectiveDate);

  // 1. Create CorporateAction
  const corporateAction = new CorporateAction({
    user: userId,
    stockCode: normStockCode,
    broker,
    type,
    ratio: Number(ratio),
    effectiveDate: effDate,
    notes,
  });

  await corporateAction.save();

  let loggedTrade = null;
  if (logTrade) {
    // Determine active iteration for this stock & broker
    const recentTrade = await Trade.findOne({
      user: userId,
      stockCode: normStockCode,
      broker,
      deletedAt: null,
    }).sort({ date: -1, createdAt: -1 });

    const iteration = recentTrade?.iteration || 1;

    loggedTrade = new Trade({
      user: userId,
      date: effDate,
      broker,
      stockCode: normStockCode,
      type: 'Split',
      price: 0,
      priceInPiastres: 0,
      shares: 0,
      fees: 0,
      feesInPiastres: 0,
      totalValue: 0,
      totalValueInPiastres: 0,
      splitRatio: Number(ratio),
      iteration,
    });

    await loggedTrade.save();
  }

  // Invalidate user's portfolio cache without top-level circular dependency
  try {
    const { invalidatePortfolioCache } = require('./portfolioService');
    if (typeof invalidatePortfolioCache === 'function') {
      invalidatePortfolioCache(userId);
    }
  } catch (err) {
    // ignore
  }

  return {
    corporateAction,
    trade: loggedTrade,
  };
}

module.exports = {
  applyCorporateActions,
  createSplitWizard,
  cloneTrade,
};
